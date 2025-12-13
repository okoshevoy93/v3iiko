from flask import Flask, request, jsonify, send_file, abort, Response, render_template, redirect, send_from_directory
from flask_cors import CORS
import requests
from requests.auth import HTTPBasicAuth
from requests import exceptions as req_exc
from typing import Any
import logging
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, Alignment
import os
import time
from pathlib import Path
import re
import shutil
from functools import wraps
from types import SimpleNamespace
import bcrypt
import json
from uuid import uuid4
import urllib.parse
from urllib.parse import urlparse
import io
from string import Template

app = Flask(__name__, template_folder=str(Path(__file__).resolve().parent))
CORS(app)
app.secret_key = "iiko-menu-secret-2025"
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
app.config["JSON_AS_ASCII"] = False

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
IMAGE_CACHE_DIR = BASE_DIR / "image_cache"
EXPORTS_DIR = BASE_DIR / "exports"
USERS_FILE = BASE_DIR / "users.json"
WEBHOOKS_FILE = BASE_DIR / "webhooks.json"

IIKO_V1 = "https://api-ru.iiko.services/api/1"
IIKO_V2 = "https://api-ru.iiko.services/api/2"

TOKENS = {}
YANDEX_TOKENS = {}  # {f"{client_id}:{secret}:{base}": {"token": ..., "time": ..., "base": base}}
YANDEX_COLLECTION_FILE = BASE_DIR / "API_для_интеграции_сервиса_Яндекс_Еда_для_статьи_БЗ_postman_collection.json"
YANDEX_COLLECTION_DEFAULT = [
    {
        "name": "Получить токен",
        "method": "POST",
        "path_template": "/oauth2/token",
        "body_raw": '{"grant_type":"client_credentials","client_id":"{{client_id}}","client_secret":"{{client_secret}}"}',
        "description": "Официальный запрос на выдачу OAuth2 token для интеграции Яндекс.Еды.",
    },
    {
        "name": "Список ресторанов",
        "method": "GET",
        "path_template": "/restaurants",
        "description": "Получить все доступные рестораны/заведения партнера.",
    },
    {
        "name": "Меню ресторана",
        "method": "GET",
        "path_template": "/menu/{{restaurant_id}}",
        "description": "Получить актуальное меню выбранного ресторана.",
    },
    {
        "name": "Стоп-лист",
        "method": "GET",
        "path_template": "/menu/{{restaurant_id}}/availability",
        "description": "Получить позиции, недоступные к заказу (стоп-лист).",
    },
    {
        "name": "Промо",
        "method": "GET",
        "path_template": "/partner/promos",
        "description": "Промоакции ресторана (передавайте place_id как restaurant_id).",
    },
    {
        "name": "Зоны доставки",
        "method": "GET",
        "path_template": "/partner/delivery/zones",
        "description": "Зоны доставки ресторана (place_id=restaurant_id).",
    },
    {
        "name": "График работы",
        "method": "GET",
        "path_template": "/partner/schedule",
        "description": "График работы точки (place_id=restaurant_id).",
    },
    {
        "name": "Заказы",
        "method": "GET",
        "path_template": "/partner/orders",
        "description": "Получить список заказов, можно передать статус.",
    },
    {
        "name": "История заказов",
        "method": "POST",
        "path_template": "/partner/orders/history",
        "body_raw": '{"from":"{{from}}","to":"{{to}}","limit":{{limit}}}',
        "description": "История заказов за период.",
    },
    {
        "name": "Детали заказов",
        "method": "POST",
        "path_template": "/partner/integration/v1/orders/details",
        "body_raw": '{"orders": ["{{order_id}}"]}',
        "description": "Детализация списка заказов по ID.",
    },
    {
        "name": "Список городов",
        "method": "GET",
        "path_template": "/v2/cities",
        "description": "Города, где доступны рестораны.",
    },
    {
        "name": "Точки города",
        "method": "GET",
        "path_template": "/v2/places",
        "description": "Список точек (place_id) по выбранному городу.",
    },
]
YANDEX_COLLECTION = {}

for d in (IMAGE_CACHE_DIR, EXPORTS_DIR):
    d.mkdir(exist_ok=True)
    if d == IMAGE_CACHE_DIR and list(d.iterdir()):
        shutil.rmtree(d)
        d.mkdir()

# ==================== АВТОРИЗАЦИЯ ====================
USERS_DB = {}
ACTIVE_SESSIONS: dict[str, str] = {}

def load_users():
    global USERS_DB
    try:
        if USERS_FILE.exists():
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for login, info in data.items():
                    default_tabs = ["index", "yandex", "users"] if info.get("role") == "admin" else ["index", "yandex"]
                    USERS_DB[login] = {
                        "hash": info["hash"].encode(),
                        "role": info.get("role", "user"),
                        "tabs": info.get("tabs") or default_tabs,
                    }
    except Exception as e:
        logger.error(f"Ошибка загрузки users.json: {e}")

def save_users():
    try:
        data = {}
        for login, info in USERS_DB.items():
            default_tabs = ["index", "yandex", "users"] if info.get("role") == "admin" else ["index", "yandex"]
            data[login] = {
                "hash": info["hash"].decode(),
                "role": info.get("role", "user"),
                "tabs": info.get("tabs") or default_tabs,
            }
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Не удалось сохранить users.json: {e}")

load_users()

WEBHOOKS_DB: dict[str, dict] = {}
AUTH_REALM_VERSION = int(time.time())


def load_webhooks():
    global WEBHOOKS_DB
    try:
        if not WEBHOOKS_FILE.exists():
            WEBHOOKS_FILE.write_text("{}", encoding="utf-8")
        with open(WEBHOOKS_FILE, "r", encoding="utf-8") as f:
            content = f.read().strip() or "{}"
            raw = json.loads(content)
            # Поддержка старого формата {"name": {...}}
            if raw and all(isinstance(v, dict) and "webhook_url" in v for v in raw.values()):
                WEBHOOKS_DB = {"_legacy": raw}
            else:
                WEBHOOKS_DB = raw
    except Exception as e:
        logger.error(f"Ошибка загрузки webhooks.json: {e}")


def save_webhooks():
    try:
        with open(WEBHOOKS_FILE, "w", encoding="utf-8") as f:
            json.dump(WEBHOOKS_DB, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Не удалось сохранить webhooks.json: {e}")


load_webhooks()


def load_yandex_collection():
    """Загрузить Postman-коллекцию Yandex Еда, встроенную или из файла."""
    global YANDEX_COLLECTION
    try:
        parsed: dict[str, dict] = {}

        def add_items(items):
            for item in items:
                name = item.get("name", "").strip()
                if not name:
                    continue
                parsed[name.lower()] = {
                    "name": name,
                    "method": (item.get("method") or "GET").upper(),
                    "path_template": item.get("path_template") or "/",
                    "body_raw": item.get("body_raw"),
                    "description": item.get("description", ""),
                }

        # Добавляем встроенный список, чтобы коллекция работала даже без файла
        add_items(YANDEX_COLLECTION_DEFAULT)

        # Если файл присутствует, дополняем/перекрываем его значениями
        if YANDEX_COLLECTION_FILE.exists():
            with open(YANDEX_COLLECTION_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            items = data.get("item", [])

            def normalize_url(raw_url: str) -> str:
                """Очистить url в коллекции до относительного пути без {{baseUrl}}."""
                cleaned = raw_url or ""
                cleaned = cleaned.replace("{{baseUrl}}", "").strip()
                # Если передан абсолютный URL, оставить только путь
                try:
                    parsed_url = urllib.parse.urlparse(cleaned)
                    if parsed_url.scheme and parsed_url.netloc:
                        cleaned = parsed_url.path or "/"
                except Exception:
                    pass
                if not cleaned.startswith("/"):
                    cleaned = "/" + cleaned
                return cleaned

            for item in items:
                name = item.get("name", "").strip()
                request_data = item.get("request", {})
                method = (request_data.get("method") or "GET").upper()
                url_info = request_data.get("url", {})
                raw_url = url_info if isinstance(url_info, str) else url_info.get("raw") or ""
                path_template = normalize_url(raw_url)
                body_raw = None
                if isinstance(request_data.get("body"), dict):
                    if request_data["body"].get("mode") == "raw":
                        body_raw = request_data["body"].get("raw") or None
                parsed[name.lower()] = {
                    "name": name,
                    "method": method,
                    "path_template": path_template,
                    "body_raw": body_raw,
                    "description": request_data.get("description", "").strip(),
                }
        YANDEX_COLLECTION = parsed
    except Exception as e:
        logger.error(f"Не удалось загрузить Postman-коллекцию Yandex: {e}")
        YANDEX_COLLECTION = {}


load_yandex_collection()


def check_auth(username, password):
    user = USERS_DB.get(username)
    return user and bcrypt.checkpw(password.encode("utf-8"), user["hash"])


def current_username() -> str:
    return ACTIVE_SESSIONS.get(request.cookies.get("session_token"), "")


def current_user_record() -> dict:
    uname = current_username()
    return USERS_DB.get(uname) or {}


def is_admin():
    user = current_user_record()
    return user.get("role") == "admin"


def has_tab_access(tab: str) -> bool:
    user = current_user_record()
    if not user:
        return False
    tabs = user.get("tabs") or []
    return tab in tabs or user.get("role") == "admin"


def required_tab_from_path(path: str) -> str:
    if path.startswith("/yandex") or path.startswith("/api/yandex"):
        return "yandex"
    if path.startswith("/users"):
        return "users"
    return "index"

def current_realm() -> str:
    return f"iiko-menu v2 session-{AUTH_REALM_VERSION}"


LOGIN_TEMPLATE = Template(
    """
    <html lang="ru" class="h-full">
    <head>
      <meta charset="UTF-8" />
      <title>Авторизация</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          color-scheme: light;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: radial-gradient(circle at 20% 20%, rgba(99,102,241,0.26) 0, transparent 28%),
                      radial-gradient(circle at 80% 0%, rgba(16,185,129,0.22) 0, transparent 32%),
                      linear-gradient(145deg, #0f172a 0%, #0b1224 45%, #0f172a 100%);
          color: #e2e8f0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
          overflow: hidden;
        }
        .grid-bg {
          position: absolute; inset: 0;
          background: linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 46px 46px;
          mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.6), transparent 60%);
          pointer-events: none;
        }
        .card {
          position: relative;
          width: min(440px, 100%);
          border-radius: 22px;
          padding: 24px;
          background: linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04));
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(18px) saturate(140%);
          box-shadow: 0 24px 80px rgba(0,0,0,0.45);
          overflow: hidden;
        }
        .card::before {
          content: '';
          position: absolute; inset: -40% 30% auto auto;
          width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(52,211,153,0.25), rgba(52,211,153,0));
          filter: blur(10px);
        }
        .card::after {
          content: '';
          position: absolute; inset: auto auto -35% -20%;
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(99,102,241,0.28), rgba(99,102,241,0));
          filter: blur(12px);
        }
        .title { display:flex; align-items:center; gap:12px; font-weight:800; font-size:20px; letter-spacing: 0.2px; color:#e2e8f0; position: relative; z-index:2; }
        .title .logo {
          width: 52px; height: 52px; border-radius: 18px;
          display: grid; place-items: center;
          background: conic-gradient(from 45deg, #22d3ee, #6366f1, #22c55e, #22d3ee);
          color: #0b1224; font-weight: 900; font-size: 22px;
          box-shadow: 0 16px 40px rgba(34,211,238,0.35);
          border: 1px solid rgba(255,255,255,0.25);
        }
        .message { margin: 10px 0 20px; font-size: 14px; color: #cbd5e1; position: relative; z-index:2; }
        .message.error { color: #fecdd3; }
        .field { display:flex; flex-direction: column; gap:8px; position: relative; z-index:2; }
        .field label { font-size: 12px; color: #cbd5e1; font-weight:600; letter-spacing: 0.3px; }
        .field input {
          border: 1px solid rgba(255,255,255,0.14); border-radius: 14px; padding: 12px 14px; font-size: 14px;
          transition: border-color .15s, box-shadow .15s, background .15s; background: rgba(15,23,42,0.55); color:#f8fafc;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .field input:focus { outline: none; border-color: #38bdf8; box-shadow: 0 0 0 4px rgba(56,189,248,.18); background: rgba(255,255,255,0.08); }
        .actions { display:flex; align-items:center; gap:10px; justify-content: space-between; margin-top: 18px; position: relative; z-index:2; }
        button {
          border: none; border-radius: 14px; padding: 13px 18px; font-weight: 800; font-size: 14px; cursor: pointer;
          background: linear-gradient(135deg, #34d399, #22c55e); color: #052e16;
          transition: transform .16s ease, box-shadow .16s ease;
          width: 100%;
          display:flex; align-items:center; justify-content:center; gap:9px;
          box-shadow: 0 16px 40px rgba(34,197,94,.36), 0 0 0 1px rgba(255,255,255,0.05) inset;
        }
        button:hover { transform: translateY(-1px) scale(1.01); box-shadow: 0 20px 46px rgba(34,197,94,.42); }
        button:active { transform: translateY(0); }
        .status-icon { width: 16px; height: 16px; border-radius: 50%; border:2px solid transparent; display:none; position: relative; }
        .status-icon.ok { border-color:#bbf7d0; color:#16a34a; }
        .status-icon.fail { border-color:#fecdd3; color:#dc2626; }
        .status-icon.pulse { animation: pulse 0.9s ease-in-out infinite; }
        .status-icon::after { content:''; display:block; width:6px; height:10px; border:2px solid currentColor; border-left:0; border-top:0; transform: translate(3px,-2px) rotate(45deg); }
        .status-icon.fail::after { width:10px;height:10px;border:0;border-top:2px solid currentColor;border-right:2px solid currentColor;transform: translate(3px,3px) rotate(45deg); box-sizing:border-box; }
        .divider { height:1px; background: linear-gradient(90deg, rgba(255,255,255,.05), rgba(99,102,241,.45), rgba(255,255,255,.05)); margin: 18px 0 12px; position: relative; z-index:2; }
        .badge { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; background: rgba(255,255,255,0.08); border-radius: 999px; border:1px solid rgba(255,255,255,0.12); color:#e2e8f0; font-size:12px; }
        .loader {
          width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.45); border-top-color: rgba(255,255,255,0.9); animation: spin 0.8s linear infinite;
        }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1;} 50% { transform: scale(1.08); opacity: .75;} 100% { transform: scale(1); opacity:1;} }
        @keyframes spin { to { transform: rotate(360deg);} }
        @media (max-width: 640px) {
          body { padding: 14px; }
          .card { width: 100%; padding: 16px; border-radius: 18px; }
          .title { flex-direction: column; align-items: flex-start; gap: 6px; font-size: 18px; }
          .actions { flex-direction: column; align-items: stretch; }
          button { width: 100%; }
        }
      </style>
      <script src="/assets/login.js" defer></script>
    </head>
    <body class="h-full" data-state="$state" data-error="$error_flag">
      <div class="grid-bg"></div>
      <div class="card">
        <div class="title">
          <div class="logo">⦿</div>
          <div>Вход в панель iiko</div>
          <span class="badge"><span class="loader"></span> защищённый доступ</span>
        </div>
        <p class="message $error_class">$message</p>
        <form method="POST" action="/login" class="space-y-4" id="loginForm">
          <input type="hidden" name="next" value="$next_url" />
          <div class="field">
            <label>Логин</label>
            <input name="username" placeholder="username" autocomplete="username" required autofocus />
          </div>
          <div class="field">
            <label>Пароль</label>
            <input type="password" name="password" placeholder="••••••••" autocomplete="current-password" required />
          </div>
          <div class="divider"></div>
          <div class="actions">
            <button type="submit" id="loginBtn"><span class="status-icon" id="loginStatus"></span><span id="loginLabel">Войти</span></button>
          </div>
        </form>
      </div>
    </body>
    </html>
    """
)


LOGOUT_TEMPLATE = Template(
    """
    <html lang=\"ru\" class=\"h-full\">
    <head>
      <meta charset=\"UTF-8\" />
      <title>Вы вышли</title>
      <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">
      <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>
      <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap\" rel=\"stylesheet\">
      <style>
        :root { color-scheme: dark; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: radial-gradient(circle at 15% 20%, rgba(52,211,153,0.15) 0, transparent 28%),
                      radial-gradient(circle at 80% 0%, rgba(59,130,246,0.22) 0, transparent 34%),
                      linear-gradient(145deg, #0b1224 0%, #0f172a 35%, #0b1224 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          color: #e2e8f0;
          position: relative;
          overflow: hidden;
        }
        .grid-bg { position: absolute; inset: 0; background: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 52px 52px; mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.55), transparent 60%); pointer-events: none; }
        .glow { position:absolute; width:340px; height:340px; filter: blur(80px); opacity:0.4; }
        .glow.green { background: #22c55e; top: -80px; left: -60px; }
        .glow.blue { background: #6366f1; bottom: -80px; right: -60px; }
        .card {
          position: relative;
          width: min(420px, 100%);
          padding: 22px;
          border-radius: 20px;
          background: linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          backdrop-filter: blur(14px);
          overflow: hidden;
        }
        .card::before { content:''; position:absolute; inset:0; background: linear-gradient(120deg, rgba(34,197,94,0.14), rgba(59,130,246,0.12)); opacity:0.8; pointer-events:none; }
        .card-content { position:relative; z-index:1; }
        .title { display:flex; align-items:center; gap:10px; font-weight:800; font-size:20px; letter-spacing:0.2px; }
        .badge { width:38px; height:38px; border-radius:14px; display:grid; place-items:center; background: linear-gradient(135deg, #22c55e, #16a34a); color:#0b2e13; font-size:18px; font-weight:800; box-shadow:0 8px 22px rgba(34,197,94,0.3); }
        p { margin:14px 0 22px; font-size:14px; line-height:1.7; color:#cbd5e1; }
        .actions { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
        .btn { display:inline-flex; align-items:center; gap:8px; padding:12px 16px; border-radius:14px; border:1px solid rgba(255,255,255,0.16); color:#e2e8f0; text-decoration:none; font-weight:700; transition: transform .12s, box-shadow .12s, border-color .12s; backdrop-filter: blur(6px); }
        .btn.primary { background: linear-gradient(135deg, #22c55e, #16a34a); color:#0b2e13; border-color: #16a34a; box-shadow:0 12px 28px rgba(34,197,94,0.28); }
        .btn.secondary { background: rgba(15,23,42,0.6); }
        .btn:hover { transform: translateY(-2px); box-shadow:0 14px 32px rgba(99,102,241,0.35); }
        @media (max-width: 640px) {
          body { padding: 16px; }
          .card { width: 100%; padding: 16px; border-radius: 16px; }
          .title { font-size: 18px; }
          p { font-size: 13px; }
          .actions { width: 100%; }
          .btn { width: 100%; justify-content: center; }
        }
      </style>
    </head>
    <body>
      <div class=\"grid-bg\"></div>
      <div class=\"glow green\"></div>
      <div class=\"glow blue\"></div>
      <div class=\"card\">
        <div class=\"card-content\">
          <div class=\"title\"><span class=\"badge\">⇦</span>Вы вышли из аккаунта</div>
          <p>Сессия завершена. Чтобы вернуться к работе, снова авторизуйтесь на сайте и введите свои данные.</p>
          <div class=\"actions\">
            <a class=\"btn primary\" href=\"/\">Вернуться к авторизации</a>
          </div>
        </div>
      </div>
    </body>
    </html>
    """
)


@app.after_request
def apply_security_headers(response: Response):
    """Добавляем строгие заголовки безопасности ко всем ответам."""
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' blob: https://cdn.tailwindcss.com; "
        "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com https://cdn.jsdelivr.net; "
        "img-src 'self' data: blob: https:; "
        "font-src 'self' data: https://fonts.gstatic.com; "
        "connect-src 'self' https://cdn.tailwindcss.com https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.jsdelivr.net; "
        "object-src 'none'; frame-ancestors 'none'"
    )
    response.headers.setdefault("Content-Security-Policy", csp)
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=(), fullscreen=()")
    response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
    response.headers.setdefault("X-Robots-Tag", "noindex, nofollow, noarchive")
    if "Cache-Control" not in response.headers:
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    response.headers.setdefault("Pragma", "no-cache")
    response.headers.setdefault("Expires", "0")
    return response


def login_markup(error: str = "", next_url: str = "/"):
    message = "Введите логин и пароль, чтобы продолжить." if not error else error
    state_class = "error" if error else "idle"
    error_class = "error" if error else ""
    return LOGIN_TEMPLATE.substitute(
        message=message,
        next_url=next_url,
        state=state_class,
        error_class=error_class,
        error_flag=1 if error else 0,
    )


@app.route("/login", methods=["GET", "POST"])
def login_page():
    global AUTH_REALM_VERSION
    next_url = request.args.get("next") or request.form.get("next") or "/"
    if request.method == "POST":
        data = request.form or request.get_json() or {}
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""
        if check_auth(username, password):
            AUTH_REALM_VERSION = int(time.time())
            token = f"{uuid4().hex}::{AUTH_REALM_VERSION}"
            ACTIVE_SESSIONS[token] = username
            resp = redirect(next_url or "/")
            resp.set_cookie('session_token', token, httponly=True, samesite='Lax', path='/')
            resp.set_cookie('session_user', username, httponly=True, samesite='Lax', path='/')
            return resp
        resp = Response(login_markup("Неверный логин или пароль", next_url), 401)
        resp.headers['Content-Type'] = 'text/html; charset=utf-8'
        resp.headers['Cache-Control'] = 'no-store'
        return resp

    resp = Response(login_markup("", next_url), 401)
    resp.headers['Cache-Control'] = 'no-store'
    resp.headers['Content-Type'] = 'text/html; charset=utf-8'
    resp.set_cookie('session_token', '', expires=0, path='/', samesite='Lax')
    resp.set_cookie('session_user', '', expires=0, path='/', samesite='Lax')
    return resp


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        session_token = request.cookies.get('session_token')
        username = ACTIVE_SESSIONS.get(session_token, '')
        realm_ok = False
        if session_token and '::' in session_token:
            try:
                _, realm = session_token.rsplit('::', 1)
                realm_ok = str(realm) == str(AUTH_REALM_VERSION)
            except ValueError:
                realm_ok = False
        if session_token and not realm_ok:
            ACTIVE_SESSIONS.pop(session_token, None)
            username = ''
        if not username:
            next_url = urllib.parse.quote(request.path or '/')
            return redirect(f"/login?next={next_url}")

        request.authorization = SimpleNamespace(username=username, password='')
        required_tab = required_tab_from_path(request.path)
        if required_tab and not has_tab_access(required_tab):
            resp = Response('Доступ запрещён', 403)
            resp.headers['Content-Type'] = 'text/plain; charset=utf-8'
            return resp

        resp = f(*args, **kwargs)
        if isinstance(resp, Response):
            resp.set_cookie('session_token', session_token, httponly=True, samesite='Lax', path='/')
            resp.set_cookie('session_user', username, httponly=True, samesite='Lax', path='/')
            return resp
        wrapped = Response(resp)
        wrapped.set_cookie('session_token', session_token, httponly=True, samesite='Lax', path='/')
        wrapped.set_cookie('session_user', username, httponly=True, samesite='Lax', path='/')
        return wrapped
    return decorated

# ==================== iiko ЛОГИКА ====================
def get_token(api_key: str) -> str | None:
    if not api_key:
        return None
    cached = TOKENS.get(api_key)
    if cached and time.time() - cached["time"] < 3500:
        return cached["token"]
    url = f"{IIKO_V1}/access_token"
    try:
        resp = requests.post(url, json={"apiLogin": api_key}, timeout=15)
        if resp.status_code == 200:
            token = resp.json().get("token")
            if token:
                TOKENS[api_key] = {"token": token, "time": time.time()}
                return token
    except Exception as e:
        logger.error(f"Ошибка токена iiko: {e}")
    return None

def iiko_request(api_key: str, endpoint: str, payload: dict | None = None, version: int = 2):
    token = get_token(api_key)
    if not token:
        return {"error": "Не удалось получить токен"}
    base = IIKO_V1 if version == 1 else IIKO_V2
    url = f"{base}/{endpoint.lstrip('/')}"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = payload or {}
    for _ in range(4):
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=40)
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code == 429:
                time.sleep(3)
                continue
            if resp.status_code == 401:
                TOKENS.pop(api_key, None)
            return {"error": f"iiko {resp.status_code}"}
        except:
            time.sleep(1)
    return {"error": "Превышено попыток"}

# ==================== YANDEX EDA ЛОГИКА ====================
def _normalize_base(webhook_url: str, *, keep_path: bool = True) -> str:
    """Нормализовать base: по умолчанию scheme://host + path (без query/fragment)."""
    parsed = urlparse(webhook_url or "")
    if parsed.scheme and parsed.netloc:
        base_path = parsed.path.rstrip("/") if keep_path else ""
        return f"{parsed.scheme}://{parsed.netloc}{base_path}".rstrip("/")
    return (webhook_url or "").rstrip("/")


def get_yandex_token(
    client_id: str,
    client_secret: str,
    base: str,
    token_path: str | list[str] = "/oauth2/token",
) -> tuple[str | None, str | None]:
    """Получить и кешировать токен Яндекс.Еды у хоста интеграции (webhook base).

    Учитываем разные token_path из Postman/доков и пробуем по два запроса на каждый путь.
    """
    if not (client_id and client_secret and base):
        return None, "client_id, client_secret и webhook_url обязательны"

    paths = token_path if isinstance(token_path, (list, tuple)) else [token_path]
    paths = [p if p.startswith("/") else f"/{p}" for p in paths]
    if "/security/oauth/token" not in paths:
        paths.append("/security/oauth/token")

    norm_base = _normalize_base(base)
    cache_key = f"{client_id}:{client_secret}:{norm_base}:{'|'.join(paths)}"
    cached = YANDEX_TOKENS.get(cache_key)
    if cached and time.time() - cached["time"] < 3500:
        return cached["token"], None

    token_errors: list[str] = []
    last_err: str | None = None

    def request_token(path: str, attempt: int):
        url = f"{norm_base}{path}"
        logger.debug(f"Attempt {attempt}: base={norm_base}, token_path={path}, url={url}")
        payload = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": "read write",
        }
        try:
            resp_main = requests.post(url, data=payload, timeout=(30, 60))
            if resp_main.status_code == 200:
                return resp_main.json().get("access_token") or resp_main.json().get("token"), None

            resp_basic = requests.post(
                url,
                data={"grant_type": "client_credentials", "scope": "read write"},
                auth=HTTPBasicAuth(client_id, client_secret),
                timeout=(30, 60),
            )
            if resp_basic.status_code == 200:
                return resp_basic.json().get("access_token") or resp_basic.json().get("token"), None

            token_errors.append(f"{path}:{resp_main.status_code}/{resp_basic.status_code}")
            if resp_main.status_code == 401:
                return None, "API логины заблокированы. Из PDF: разблокируйте учётные данные в транспорте iiko и повторите."
            if resp_main.status_code == 404:
                return None, "Endpoint не найден. Попробуйте указать manual token_path."
            return None, resp_main.text or resp_basic.text
        except req_exc.ConnectionError:
            return None, "Connection refused. Проверьте host (возможно, firewall или неверный URL). Из PDF: проверьте транспорт iiko и заблокированные логины."
        except req_exc.Timeout:
            return None, "timeout"
        except req_exc.RequestException as ex:
            logger.error(f"Yandex token request failed for {url}: {ex}")
            return None, "timeout"

    for path in paths:
        for attempt in range(1, 3):
            token, err = request_token(path, attempt)
            if token:
                YANDEX_TOKENS[cache_key] = {"token": token, "time": time.time(), "base": norm_base}
                return token, None
            if err == "timeout":
                continue
            if err:
                # если endpoint не найден, пробуем следующий path
                if "Endpoint" in err:
                    break
                last_err = err
        else:
            continue
        # перешли на следующий path
        last_err = err if 'err' in locals() else last_err

    return None, last_err or "; ".join(token_errors) or "Токен не получен"
# ==================== РОУТЫ ====================
@app.route("/")
@require_auth
def index():
    resp = send_file(BASE_DIR / "index.html")
    resp.headers["Content-Type"] = "text/html; charset=utf-8"
    resp.headers.setdefault("Cache-Control", "no-store")
    return resp

@app.route("/yandex")
@require_auth
def yandex_page():
    resp = send_file(BASE_DIR / "yandex.html")
    resp.headers["Content-Type"] = "text/html; charset=utf-8"
    resp.headers.setdefault("Cache-Control", "no-store")
    return resp

@app.route("/chunks/<path:filename>")
@require_auth
def serve_chunk(filename):
    chunk_dir = BASE_DIR / "assets" / "chunks"
    if not (chunk_dir / filename).exists():
        abort(404)
    resp = send_from_directory(chunk_dir, filename, mimetype="application/javascript")
    resp.headers["Content-Type"] = "application/javascript; charset=utf-8"
    resp.headers["Cache-Control"] = "no-store"
    return resp

@app.route("/assets/<path:filename>")
def serve_asset(filename):
    asset_dir = BASE_DIR / "assets"
    target = asset_dir / filename
    if not target.exists():
        abort(404)
    if filename.startswith("src/"):
        abort(404)
    if filename == "login.js":
        resp = send_from_directory(asset_dir, filename)
        resp.headers["Cache-Control"] = "no-store"
        return resp
    session_token = request.cookies.get('session_token')
    if session_token not in ACTIVE_SESSIONS:
        next_url = urllib.parse.quote(request.path or '/')
        return redirect(f"/login?next={next_url}")
    resp = send_from_directory(asset_dir, filename)
    resp.headers["Cache-Control"] = "no-store"
    return resp

@app.route("/app.js")
@require_auth
def app_js():
    resp = send_file(BASE_DIR / "app.js")
    resp.headers["Content-Type"] = "application/javascript; charset=utf-8"
    resp.headers.setdefault("Cache-Control", "no-store")
    return resp

@app.route("/yandex.js")
@require_auth
def yandex_js():
    resp = send_file(BASE_DIR / "yandex.js")
    resp.headers["Content-Type"] = "application/javascript; charset=utf-8"
    resp.headers.setdefault("Cache-Control", "no-store")
    return resp


@app.route("/api/me")
@require_auth
def api_me():
    uname = current_username()
    user = USERS_DB.get(uname) or {}
    return jsonify({
        "user": uname,
        "role": user.get("role", "user"),
        "tabs": user.get("tabs") or ["index", "yandex", "users"],
    })

@app.route("/api/proxy", methods=["POST"])
@require_auth
def proxy():
    data = request.get_json() or {}
    return jsonify(iiko_request(data.get("api_key"), data.get("endpoint") or data.get("path"),
                                data.get("payload"), int(data.get("version", 2))))


@app.route("/api/iiko/organizations", methods=["POST"])
@require_auth
def iiko_organizations():
    data = request.get_json() or {}
    api_key = data.get("api_key")
    if not api_key:
        return jsonify({"error": "api_key required"}), 400
    result = iiko_request(api_key, "organizations", version=1)
    if isinstance(result, dict) and result.get("error"):
        return jsonify(result), 502
    return jsonify(result)

@app.route("/download/<filename>")
@require_auth
def download(filename):
    return send_from_directory(EXPORTS_DIR, filename, as_attachment=True)

@app.route("/img")
@require_auth
def image_proxy():
    url = request.args.get("url", "").strip()
    if not url:
        abort(404)
    safe_name = re.sub(r"[^\w\-_\.]", "_", url[-100:])
    local_path = IMAGE_CACHE_DIR / safe_name
    if not local_path.exists():
        try:
            r = requests.get(url, timeout=8)
            if r.status_code == 200:
                local_path.write_bytes(r.content)
        except:
            abort(404)
    return send_file(local_path)

# ==================== YANDEX ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
def yandex_request(client_id: str, client_secret: str, path: str, *, method: str = "GET",
                   params: dict | None = None, payload: dict | None = None,
                   timeout: tuple[int, int] = (20, 60), base: str | None = None,
                   token_path: str | list[str] = ("/oauth2/token", "/security/oauth/token")):
    token, err = get_yandex_token(client_id, client_secret, base or "", token_path=token_path)
    if not token:
        err_lower = (err or "").lower()
        status = 502 if any(x in err_lower for x in ("подключ", "timeout")) else 401
        return None, (status, err or "no token")

    cache_key = f"{client_id}:{client_secret}:{_normalize_base(base or '')}:{token_path if isinstance(token_path, str) else '|'.join(token_path)}"
    cache = YANDEX_TOKENS.get(cache_key) or {}
    api_base = (cache.get("base") or _normalize_base(base or "")).rstrip("/")
    if not api_base:
        return None, (400, "webhook_url (base) required")
    url = f"{api_base}{path}"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = requests.request(method, url, params=params, json=payload, headers=headers, timeout=timeout)
        if resp.ok:
            return resp.json(), None
        return None, (resp.status_code, resp.text)
    except requests.exceptions.RequestException as e:
        return None, (502, f"Ошибка запроса: {e}")


def render_template_string(template: str, variables: dict[str, str]) -> str:
    """Простая подстановка {{var}} в строке."""
    result = template
    for key, val in variables.items():
        result = result.replace(f"{{{{{key}}}}}", val)
    return result


def _extract_base_and_paths(payload: dict | None, args_source=None):
    data = payload or {}
    args = args_source or request.args
    manual_base = (data.get("manual_base") if isinstance(data, dict) else None) or args.get("manual_base")
    webhook_raw = (
        (data.get("webhook_url") if isinstance(data, dict) else None)
        or args.get("webhook_url")
        or ((data.get("base") if isinstance(data, dict) else None) or args.get("base"))
    )
    norm_base = _normalize_base(manual_base or webhook_raw or "")
    manual_token_path = (data.get("manual_token_path") if isinstance(data, dict) else None) or args.get("manual_token_path")
    token_paths = None
    if manual_token_path:
        token_paths = [p.strip() for p in manual_token_path.split(",") if p.strip()]
    return norm_base, token_paths

# ==================== YANDEX РОУТЫ ====================
@app.route("/api/yandex/token", methods=["POST"])
@require_auth
def yandex_token():
    data = request.get_json() or {}
    norm_base, token_paths = _extract_base_and_paths(data)
    token, err = get_yandex_token(
        data.get("client_id"),
        data.get("client_secret"),
        norm_base,
        token_path=token_paths or ("/oauth2/token", "/security/oauth/token"),
    )
    if not token:
        err_lower = (err or "").lower()
        status = 502 if any(x in err_lower for x in ("подключ", "timeout")) else 401
        return jsonify({"error": err or "invalid"}), status
    cache_key = f"{data.get('client_id')}:{data.get('client_secret')}:{norm_base.rstrip('/')}"
    if token_paths:
        cache_key += f":{'|'.join(token_paths)}"
    cache = YANDEX_TOKENS.get(cache_key) or {}
    return jsonify({"token": token, "base": cache.get("base")})


@app.route("/api/yandex/collection", methods=["GET"])
@require_auth
def yandex_collection():
    load_yandex_collection()
    items = [
        {
            "name": item["name"],
            "method": item["method"],
            "path": item["path_template"],
            "description": item.get("description", ""),
        }
        for item in YANDEX_COLLECTION.values()
    ]
    items.sort(key=lambda x: x["name"].lower())
    return jsonify({"items": items})


def build_collection_payload(op: dict, variables: dict) -> dict | None:
    """Сформировать тело запроса, если оно определено в Postman-коллекции."""
    body_raw = op.get("body_raw")
    if not body_raw:
        return None
    try:
        rendered = render_template_string(body_raw, variables)
        return json.loads(rendered)
    except Exception:
        return None


@app.route("/api/yandex/collection/execute", methods=["POST"])
@require_auth
def yandex_collection_execute():
    load_yandex_collection()
    data = request.get_json() or {}
    op_key = (data.get("operation") or data.get("name") or "").lower().strip()
    op = YANDEX_COLLECTION.get(op_key)
    if not op:
        return jsonify({"error": "operation not found"}), 404

    client_id = data.get("client_id") or ""
    client_secret = data.get("client_secret") or ""
    norm_base, token_paths = _extract_base_and_paths(data)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    vars_payload = {k: str(v) for k, v in (data.get("vars") or {}).items()}
    vars_payload.update({"client_id": client_id, "client_secret": client_secret})

    path = render_template_string(op.get("path_template", ""), vars_payload)
    if not path.startswith("/"):
        path = "/" + path

    body_override = data.get("payload") if isinstance(data.get("payload"), dict) else None
    payload = body_override or build_collection_payload(op, vars_payload)
    params = data.get("params") if isinstance(data.get("params"), dict) else None

    # Особый случай: токен из коллекции
    if path.startswith("/oauth2/token"):
        token, err = get_yandex_token(client_id, client_secret, norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
        if token:
            cache_key = f"{client_id}:{client_secret}:{norm_base.rstrip('/')}"
            if token_paths:
                cache_key += f":{'|'.join(token_paths)}"
            cache = YANDEX_TOKENS.get(cache_key) or {}
            return jsonify({"access_token": token, "base": cache.get("base")})
        status = 502 if err and "подключ" in (err or "").lower() else 401
        return jsonify({"error": err or "invalid"}), status

    result, err = yandex_request(
        client_id,
        client_secret,
        path,
        method=op.get("method", "GET"),
        params=params,
        payload=payload,
        timeout=(20, 60),
        base=norm_base,
        token_path=token_paths or ("/oauth2/token", "/security/oauth/token"),
    )
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(result)


@app.route("/api/yandex/cities", methods=["GET"])
@require_auth
def yandex_cities():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    norm_base, token_paths = _extract_base_and_paths(None, request.args)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    data, err = yandex_request(client_id, client_secret, "/v2/cities", timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)

@app.route("/api/yandex/places", methods=["GET"])
@require_auth
def yandex_places():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    norm_base, token_paths = _extract_base_and_paths(None, request.args)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    city_id = request.args.get("city_id")
    params = {"city_id": city_id} if city_id else None
    data, err = yandex_request(client_id, client_secret, "/v2/places", params=params, timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)

@app.route("/api/yandex/menu", methods=["GET"])
@require_auth
def yandex_menu():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    norm_base, token_paths = _extract_base_and_paths(None, request.args)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    restaurant_id = request.args.get("restaurant_id") or request.args.get("place_id")
    if not restaurant_id:
        return jsonify({"error": "restaurant_id required"}), 400
    data, err = yandex_request(client_id, client_secret, f"/menu/{restaurant_id}/composition", timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err and err[0] == 404:
        data, err = yandex_request(client_id, client_secret, f"/menu/{restaurant_id}", timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/availability", methods=["GET"])
@require_auth
def yandex_availability():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    norm_base, token_paths = _extract_base_and_paths(None, request.args)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    restaurant_id = request.args.get("restaurant_id") or request.args.get("place_id")
    if not restaurant_id:
        return jsonify({"error": "restaurant_id required"}), 400
    data, err = yandex_request(client_id, client_secret, f"/menu/{restaurant_id}/availability", timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/promos", methods=["GET"])
@require_auth
def yandex_promos():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    norm_base, token_paths = _extract_base_and_paths(None, request.args)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    restaurant_id = request.args.get("restaurant_id") or request.args.get("place_id")
    if not restaurant_id:
        return jsonify({"error": "restaurant_id required"}), 400
    data, err = yandex_request(client_id, client_secret, "/partner/promos", params={"place_id": restaurant_id}, timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/restaurants", methods=["GET"])
@require_auth
def yandex_restaurants():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    norm_base, token_paths = _extract_base_and_paths(None, request.args)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    data, err = yandex_request(client_id, client_secret, "/restaurants", timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/delivery_zones", methods=["GET"])
@require_auth
def yandex_delivery_zones():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    norm_base, token_paths = _extract_base_and_paths(None, request.args)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    restaurant_id = request.args.get("restaurant_id") or request.args.get("place_id")
    if not restaurant_id:
        return jsonify({"error": "restaurant_id required"}), 400
    data, err = yandex_request(client_id, client_secret, "/partner/delivery/zones", params={"place_id": restaurant_id}, timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/schedule", methods=["GET"])
@require_auth
def yandex_schedule():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    norm_base, token_paths = _extract_base_and_paths(None, request.args)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    restaurant_id = request.args.get("restaurant_id") or request.args.get("place_id")
    if not restaurant_id:
        return jsonify({"error": "restaurant_id required"}), 400
    data, err = yandex_request(client_id, client_secret, "/partner/schedule", params={"place_id": restaurant_id}, timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/orders", methods=["GET"])
@require_auth
def yandex_orders():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    norm_base, token_paths = _extract_base_and_paths(None, request.args)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    params = {"status": request.args.get("status")} if request.args.get("status") else None
    data, err = yandex_request(client_id, client_secret, "/partner/orders", params=params, timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/orders/history", methods=["POST"])
@require_auth
def yandex_orders_history():
    payload = request.get_json() or {}
    client_id = payload.get("client_id") if isinstance(payload, dict) else None
    client_secret = payload.get("client_secret") if isinstance(payload, dict) else None
    norm_base, token_paths = _extract_base_and_paths(payload)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    payload = request.get_json() or {}
    for key in ("client_id", "client_secret"):
        payload.pop(key, None)
    data, err = yandex_request(client_id, client_secret, "/partner/orders/history", method="POST", payload=payload, timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/orders/details", methods=["POST"])
@require_auth
def yandex_orders_details():
    payload = request.get_json() or {}
    client_id = payload.get("client_id") if isinstance(payload, dict) else None
    client_secret = payload.get("client_secret") if isinstance(payload, dict) else None
    norm_base, token_paths = _extract_base_and_paths(payload)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    for key in ("client_id", "client_secret"):
        payload.pop(key, None)
    data, err = yandex_request(client_id, client_secret, "/partner/integration/v1/orders/details", method="POST", payload=payload, timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/order", methods=["POST"])
@require_auth
def yandex_order_create():
    payload = request.get_json() or {}
    client_id = payload.get("client_id") if isinstance(payload, dict) else None
    client_secret = payload.get("client_secret") if isinstance(payload, dict) else None
    norm_base, token_paths = _extract_base_and_paths(payload)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    for key in ("client_id", "client_secret", "webhook_url", "base", "manual_base", "manual_token_path"):
        payload.pop(key, None)
    data, err = yandex_request(client_id, client_secret, "/order", method="POST", payload=payload, timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/order/details", methods=["GET"])
@require_auth
def yandex_order_details():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    norm_base, token_paths = _extract_base_and_paths(None, request.args)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    order_id = request.args.get("order_id") or request.args.get("id")
    if not order_id:
        return jsonify({"error": "order_id required"}), 400
    data, err = yandex_request(client_id, client_secret, f"/order/{order_id}", method="GET", timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/order/status", methods=["GET"])
@require_auth
def yandex_order_status():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    norm_base, token_paths = _extract_base_and_paths(None, request.args)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    order_id = request.args.get("order_id") or request.args.get("id")
    if not order_id:
        return jsonify({"error": "order_id required"}), 400
    data, err = yandex_request(client_id, client_secret, f"/order/{order_id}/status", method="GET", timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/order/update", methods=["PUT"])
@require_auth
def yandex_order_update():
    payload = request.get_json() or {}
    client_id = payload.get("client_id") if isinstance(payload, dict) else None
    client_secret = payload.get("client_secret") if isinstance(payload, dict) else None
    norm_base, token_paths = _extract_base_and_paths(payload)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    order_id = payload.get("order_id") or payload.get("id")
    if not order_id:
        return jsonify({"error": "order_id required"}), 400
    for key in ("client_id", "client_secret", "webhook_url", "base", "manual_base", "manual_token_path", "order_id", "id"):
        payload.pop(key, None)
    data, err = yandex_request(client_id, client_secret, f"/order/{order_id}", method="PUT", payload=payload, timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/order/cancel", methods=["DELETE"])
@require_auth
def yandex_order_cancel():
    payload = request.get_json() or {}
    client_id = payload.get("client_id") if isinstance(payload, dict) else None
    client_secret = payload.get("client_secret") if isinstance(payload, dict) else None
    norm_base, token_paths = _extract_base_and_paths(payload)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    order_id = payload.get("order_id") or payload.get("id")
    if not order_id:
        return jsonify({"error": "order_id required"}), 400
    for key in ("client_id", "client_secret", "webhook_url", "base", "manual_base", "manual_token_path", "order_id", "id"):
        payload.pop(key, None)
    data, err = yandex_request(client_id, client_secret, f"/order/{order_id}", method="DELETE", payload=payload, timeout=(20, 60), base=norm_base, token_path=token_paths or ("/oauth2/token", "/security/oauth/token"))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)

# ==================== ВЕБХУКИ ====================
@app.route("/api/webhooks", methods=["GET"])
@require_auth
def webhooks_list():
    user = current_username() or "_shared"
    items_map = WEBHOOKS_DB.get(user) or WEBHOOKS_DB.get("_legacy") or {}
    items = sorted(({
        "name": name,
        "webhook_url": data.get("webhook_url", ""),
        "client_id": data.get("client_id", ""),
        "client_secret": data.get("client_secret", ""),
        "provider": data.get("provider", "yandex"),
        "iiko_key": data.get("iiko_key", ""),
    } for name, data in items_map.items()), key=lambda x: x["name"].lower())
    return jsonify({"items": items})


@app.route("/api/webhooks", methods=["POST"])
@require_auth
def webhooks_save():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    webhook_url = (data.get("webhook_url") or "").strip()
    client_id = (data.get("client_id") or "").strip()
    client_secret = (data.get("client_secret") or "").strip()
    provider = (data.get("provider") or "yandex").strip() or "yandex"
    iiko_key = (data.get("iiko_key") or "").strip()
    if not name or not webhook_url:
        return jsonify({"error": "name and webhook_url required"}), 400
    user = current_username() or "_shared"
    WEBHOOKS_DB.setdefault(user, {})
    WEBHOOKS_DB[user][name] = {
        "name": name,
        "webhook_url": webhook_url,
        "client_id": client_id,
        "client_secret": client_secret,
        "provider": provider,
        "iiko_key": iiko_key,
    }
    save_webhooks()
    return jsonify({"ok": True, "item": WEBHOOKS_DB[user][name]})


@app.route("/api/webhooks/<name>", methods=["DELETE"])
@require_auth
def webhooks_delete(name):
    key = name.strip()
    user = current_username() or "_shared"
    bucket = WEBHOOKS_DB.get(user) or {}
    if key in bucket:
        bucket.pop(key)
        WEBHOOKS_DB[user] = bucket
        save_webhooks()
        return jsonify({"ok": True})
    return jsonify({"error": "not found"}), 404

# ==================== АДМИНКА И ВЫХОД ====================
@app.route("/users")
@require_auth
def admin_panel():
    if not is_admin():
        return "<h3>Доступ запрещён</h3><a href='/'>На главную</a>", 403
    return render_template("admin.html", users=USERS_DB, message=request.args.get("msg"))

@app.route("/users/save", methods=["POST"])
@require_auth
def admin_save():
    if not is_admin():
        return redirect("/users?msg=Нет+прав")
    # твой оригинальный код без изменений
    # (оставляю как у тебя)
    action = request.form.get("action")
    username = request.form.get("username", "").strip()
    if not username:
        return redirect("/users?msg=Логин+не+указан")
    if action in ("add", "edit"):
        password = request.form.get("password", "").strip()
        if action == "add" and not password:
            return redirect("/users?msg=Пароль+обязателен")
        tabs = request.form.getlist("tabs") or ["index", "yandex"]
        if password:
            hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))
            USERS_DB[username] = {"hash": hashed, "role": request.form.get("role", "user"), "tabs": tabs}
        else:
            if username in USERS_DB:
                USERS_DB[username]["role"] = request.form.get("role", "user")
                USERS_DB[username]["tabs"] = tabs
    elif action == "delete":
        if username in USERS_DB and USERS_DB[username]["role"] == "admin" and len([u for u, d in USERS_DB.items() if d["role"] == "admin"]) == 1:
            return redirect("/users?msg=Нельзя+удалить+последнего+админа")
        USERS_DB.pop(username, None)
    save_users()
    return redirect("/users?msg=Успешно!")


@app.route("/api/export_excel", methods=["POST"])
@require_auth
def export_excel():
    payload = request.get_json(silent=True) or {}
    table_data = payload.get("table_data") or []
    columns = payload.get("columns") or payload.get("layout", {}).get("columns")
    layout_rows = (payload.get("layout") or {}).get("rows") or []

    if not isinstance(table_data, list) or not table_data:
        return json_response({"error": "Нет данных для экспорта"}, 400)

    # Определяем заголовки
    headers: list[str] = []
    keys: list[str] = []
    if columns and isinstance(columns, list) and all(isinstance(c, dict) for c in columns):
        for col in columns:
            title = col.get("title") or col.get("label") or col.get("name") or col.get("key") or ""
            key = col.get("key") or col.get("field") or col.get("name") or title
            headers.append(title)
            keys.append(key)
    else:
        sample = table_data[0]
        if isinstance(sample, dict):
            keys = list(sample.keys())
            headers = keys[:]
        elif isinstance(sample, list):
            headers = [f"Колонка {i+1}" for i in range(len(sample))]

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Экспорт"
    ws.sheet_properties.outlinePr.summaryBelow = True
    ws.append(headers)

    sku_indexes = [i for i, k in enumerate(keys) if str(k).lower() in {"sku", "id"}]

    def normalize_numeric(value: Any):
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return value
        text = str(value).strip()
        if not text:
            return None
        text = text.replace(",", ".")
        try:
            return float(text) if "." in text else int(text)
        except Exception:
            return value

    def normalize_sku(value: Any):
        if value is None:
            return ""
        if isinstance(value, (int,)):
            return str(value)
        if isinstance(value, float):
            if value.is_integer():
                return str(int(value))
            return ("%f" % value).rstrip("0").rstrip(".")
        text = str(value)
        m = re.match(r"^[-+]?\d+[\.,]?\d*$", text)
        if m:
            normalized = text.replace(",", ".")
            if "." in normalized:
                head, tail = normalized.split(".", 1)
                if tail and set(tail) == {"0"}:
                    return head
            return normalized
        return text

    key_to_index = {k: i for i, k in enumerate(keys)}

    def append_row(row_values):
        ws.append(row_values)

    def values_for_item(item: dict) -> list:
        values = []
        for idx, key in enumerate(keys):
            val = item.get(key, "") if isinstance(item, dict) else ""
            if idx in sku_indexes:
                val = normalize_sku(val)
            elif isinstance(val, (int, float)):
                pass
            else:
                num_val = normalize_numeric(val)
                if isinstance(num_val, (int, float)):
                    val = num_val
            values.append(val)
        return values

    city_group_start = None
    city_collapsed = False
    category_group_start = None
    category_collapsed = False
    current_excel_row = 2  # first data row

    def close_category():
        nonlocal category_group_start, category_collapsed, current_excel_row
        if category_group_start is not None and current_excel_row - 1 >= category_group_start + 1:
            ws.row_dimensions.group(category_group_start + 1, current_excel_row - 1, outline_level=2, hidden=category_collapsed)
        category_group_start = None
        category_collapsed = False

    def close_city():
        nonlocal city_group_start, city_collapsed, current_excel_row
        if city_group_start is not None and current_excel_row - 1 >= city_group_start + 1:
            ws.row_dimensions.group(city_group_start + 1, current_excel_row - 1, outline_level=1, hidden=city_collapsed)
        city_group_start = None
        city_collapsed = False

    if not layout_rows:
        for item in table_data:
            append_row(values_for_item(item))
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        return send_file(buf, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                         as_attachment=True, download_name=f"export_{int(time.time())}.xlsx")

    for row in layout_rows:
        r_type = row.get("type")
        if r_type == "city":
            close_category()
            close_city()
            city_group_start = current_excel_row
            city_collapsed = bool(row.get("collapsed"))
            values = ["" for _ in headers]
            if "city" in key_to_index:
                values[key_to_index["city"]] = row.get("city", "")
            append_row(values)
            current_excel_row += 1
        elif r_type == "category":
            close_category()
            category_group_start = current_excel_row
            category_collapsed = bool(row.get("collapsed"))
            values = ["" for _ in headers]
            if "city" in key_to_index and row.get("city"):
                values[key_to_index["city"]] = row.get("city")
            if "category" in key_to_index:
                values[key_to_index["category"]] = row.get("category", "")
            append_row(values)
            current_excel_row += 1
        elif r_type == "item":
            item_idx = row.get("item_index")
            if item_idx is None or item_idx >= len(table_data):
                continue
            item_data = table_data[item_idx] if isinstance(table_data[item_idx], dict) else {}
            # гарантируем наличие города для каждой позиции
            if "city" in key_to_index and not item_data.get("city") and row.get("city"):
                item_data = {**item_data, "city": row.get("city")}
            values = values_for_item(item_data)
            append_row(values)
            current_excel_row += 1

    close_category()
    close_city()

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"export_{int(time.time())}.xlsx"
    return send_file(
        buf,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=filename
    )

@app.route("/logout")
def logout():
    global AUTH_REALM_VERSION
    AUTH_REALM_VERSION = int(time.time())
    ACTIVE_SESSIONS.clear()
    html = LOGOUT_TEMPLATE.substitute()
    resp = Response(html, 200)
    resp.headers['Content-Type'] = 'text/html; charset=utf-8'
    resp.headers['Cache-Control'] = 'no-store'
    resp.set_cookie('session_token', '', expires=0, path='/', samesite='Lax')
    resp.set_cookie('session_user', '', expires=0, path='/', samesite='Lax')
    return resp


@app.errorhandler(404)
def not_found(_error):
    html = """
    <html lang=\"ru\" style=\"background:#0f172a;color:#e5e7eb;font-family:Arial,sans-serif;\">
    <head><title>Страница не найдена</title></head>
    <body style=\"display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;\">
      <div style=\"max-width:520px;width:100%;background:#111827;border:1px solid #1f2937;border-radius:16px;padding:24px;box-shadow:0 18px 45px rgba(0,0,0,0.45);\">
        <div style=\"display:flex;align-items:center;gap:12px;font-weight:800;font-size:18px;\">🔎 Страница не найдена</div>
        <p style=\"margin:12px 0 18px;font-size:14px;line-height:1.6;color:#cbd5e1;\">Проверьте адрес или вернитесь на главную страницу, чтобы снова авторизоваться.</p>
        <a href=\"/\" style=\"display:inline-flex;align-items:center;gap:8px;background:#3b82f6;border:1px solid #2563eb;color:#e0f2fe;padding:10px 14px;border-radius:12px;font-weight:700;text-decoration:none;\">На главную</a>
      </div>
    </body>
    </html>
    """
    resp = Response(html, 404)
    resp.headers['Content-Type'] = 'text/html; charset=utf-8'
    resp.headers['Cache-Control'] = 'no-store'
    resp.set_cookie('session', '', expires=0, path='/', samesite='Lax')
    return resp

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)
