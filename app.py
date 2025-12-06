from flask import Flask, request, jsonify, send_file, abort, Response, render_template, redirect
from flask_cors import CORS
import requests
from requests.auth import HTTPBasicAuth
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
import bcrypt
import json

app = Flask(__name__)
CORS(app)
app.secret_key = "iiko-menu-secret-2025"

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

IIKO_V1 = "https://api-ru.iiko.services/api/1"
IIKO_V2 = "https://api-ru.iiko.services/api/2"
YANDEX_BASE = "https://api.eda.yandex.ru"

TOKENS = {}
YANDEX_TOKENS = {}  # {f"{client_id}:{secret}": {"token": ..., "time": ...}}

BASE_DIR = Path(__file__).resolve().parent
IMAGE_CACHE_DIR = BASE_DIR / "image_cache"
EXPORTS_DIR = BASE_DIR / "exports"
USERS_FILE = BASE_DIR / "users.json"
WEBHOOKS_FILE = BASE_DIR / "webhooks.json"

for d in (IMAGE_CACHE_DIR, EXPORTS_DIR):
    d.mkdir(exist_ok=True)
    if d == IMAGE_CACHE_DIR and list(d.iterdir()):
        shutil.rmtree(d)
        d.mkdir()

# ==================== АВТОРИЗАЦИЯ ====================
USERS_DB = {}

def load_users():
    global USERS_DB
    try:
        if USERS_FILE.exists():
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for login, info in data.items():
                    USERS_DB[login] = {
                        "hash": info["hash"].encode(),
                        "role": info.get("role", "user")
                    }
    except Exception as e:
        logger.error(f"Ошибка загрузки users.json: {e}")

def save_users():
    try:
        data = {login: {"hash": info["hash"].decode(), "role": info["role"]} for login, info in USERS_DB.items()}
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Не удалось сохранить users.json: {e}")

load_users()

WEBHOOKS_DB: dict[str, dict] = {}


def load_webhooks():
    global WEBHOOKS_DB
    try:
        if not WEBHOOKS_FILE.exists():
            WEBHOOKS_FILE.write_text("{}", encoding="utf-8")
        with open(WEBHOOKS_FILE, "r", encoding="utf-8") as f:
            content = f.read().strip() or "{}"
            WEBHOOKS_DB = json.loads(content)
    except Exception as e:
        logger.error(f"Ошибка загрузки webhooks.json: {e}")


def save_webhooks():
    try:
        with open(WEBHOOKS_FILE, "w", encoding="utf-8") as f:
            json.dump(WEBHOOKS_DB, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Не удалось сохранить webhooks.json: {e}")


load_webhooks()

def check_auth(username, password):
    user = USERS_DB.get(username)
    return user and bcrypt.checkpw(password.encode("utf-8"), user["hash"])

def is_admin():
    auth = request.authorization
    if not auth:
        return False
    user = USERS_DB.get(auth.username)
    return user and user.get("role") == "admin" and check_auth(auth.username, auth.password)

def authenticate():
    return Response('Доступ запрещён', 401,
                    {'WWW-Authenticate': 'Basic realm="iiko-menu v2"'})

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
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
def get_yandex_token(client_id: str, client_secret: str) -> tuple[str | None, str | None]:
    """Получить и кешировать токен для Яндекс. Возвращает (token, error)."""

    key = f"{client_id}:{client_secret}"
    cached = YANDEX_TOKENS.get(key)
    if cached and time.time() - cached["time"] < 3500:
        return cached["token"], None

    primary_url = f"{YANDEX_BASE}/partner/auth"
    oauth_url = f"{YANDEX_BASE}/security/oauth/token"
    data = {"grant_type": "client_credentials"}
    try:
        resp = requests.post(
            primary_url,
            json={"clientId": client_id, "clientSecret": client_secret},
            timeout=(20, 60),
        )
        if resp.status_code == 200:
            token = resp.json().get("access_token") or resp.json().get("token")
            if token:
                YANDEX_TOKENS[key] = {"token": token, "time": time.time()}
                return token, None
        elif resp.status_code in (401, 403):
            return None, f"Ошибка авторизации {resp.status_code}: {resp.text}"

        # fallback на OAuth, если основной маршрут недоступен
        resp_oauth = requests.post(
            oauth_url,
            data=data,
            auth=HTTPBasicAuth(client_id, client_secret),
            timeout=(20, 60),
        )
        if resp_oauth.status_code == 200:
            token = resp_oauth.json().get("access_token")
            if token:
                YANDEX_TOKENS[key] = {"token": token, "time": time.time()}
                return token, None
            logger.error(f"Yandex token response without token: {resp_oauth.text}")
            return None, "Ответ без access_token"

        logger.error(
            f"Yandex token failed primary={resp.status_code}, oauth={resp_oauth.status_code}: {resp.text} / {resp_oauth.text}"
        )
        return None, f"Ошибка OAuth {resp_oauth.status_code}: {resp_oauth.text}"
    except requests.exceptions.RequestException as e:
        logger.error(f"Yandex token error: {e}")
        return None, f"Ошибка подключения к Yandex: {e}"


# ==================== РОУТЫ ====================
@app.route("/")
@require_auth
def index():
    return send_file(BASE_DIR / "index.html")

@app.route("/yandex")
@require_auth
def yandex_page():
    return send_file(BASE_DIR / "yandex.html")

@app.route("/app.js")
@require_auth
def app_js():
    return send_file(BASE_DIR / "app.js")

@app.route("/yandex.js")
@require_auth
def yandex_js():
    return send_file(BASE_DIR / "yandex.js")

@app.route("/api/proxy", methods=["POST"])
@require_auth
def proxy():
    data = request.get_json() or {}
    return jsonify(iiko_request(data.get("api_key"), data.get("endpoint") or data.get("path"),
                                data.get("payload"), int(data.get("version", 2))))

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
                   timeout: tuple[int, int] = (20, 60)):
    token, err = get_yandex_token(client_id, client_secret)
    if not token:
        status = 502 if err and "подключ" in err.lower() else 401
        return None, (status, err or "no token")

    url = f"{YANDEX_BASE}{path}"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = requests.request(method, url, params=params, json=payload, headers=headers, timeout=timeout)
        if resp.ok:
            return resp.json(), None
        return None, (resp.status_code, resp.text)
    except requests.exceptions.RequestException as e:
        return None, (502, f"Ошибка запроса: {e}")

# ==================== YANDEX РОУТЫ ====================
@app.route("/api/yandex/token", methods=["POST"])
@require_auth
def yandex_token():
    data = request.get_json() or {}
    token, err = get_yandex_token(data.get("client_id"), data.get("client_secret"))
    if not token:
        status = 502 if err and "подключ" in err.lower() else 401
        return jsonify({"error": err or "invalid"}), status
    return jsonify({"token": token})

@app.route("/api/yandex/cities", methods=["GET"])
@require_auth
def yandex_cities():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    data, err = yandex_request(client_id, client_secret, "/v2/cities", timeout=(20, 60))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)

@app.route("/api/yandex/places", methods=["GET"])
@require_auth
def yandex_places():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    city_id = request.args.get("city_id")
    params = {"city_id": city_id} if city_id else None
    data, err = yandex_request(client_id, client_secret, "/v2/places", params=params, timeout=(20, 60))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)

@app.route("/api/yandex/menu", methods=["GET"])
@require_auth
def yandex_menu():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    place_id = request.args.get("place_id")
    if not place_id:
        return jsonify({"error": "place_id required"}), 400
    data, err = yandex_request(client_id, client_secret, "/partner/menu", params={"place_id": place_id}, timeout=(20, 60))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/availability", methods=["GET"])
@require_auth
def yandex_availability():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    place_id = request.args.get("place_id")
    if not place_id:
        return jsonify({"error": "place_id required"}), 400
    data, err = yandex_request(client_id, client_secret, "/partner/availability", params={"place_id": place_id}, timeout=(20, 60))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/promos", methods=["GET"])
@require_auth
def yandex_promos():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    place_id = request.args.get("place_id")
    if not place_id:
        return jsonify({"error": "place_id required"}), 400
    data, err = yandex_request(client_id, client_secret, "/partner/promos", params={"place_id": place_id}, timeout=(20, 60))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/restaurants", methods=["GET"])
@require_auth
def yandex_restaurants():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    data, err = yandex_request(client_id, client_secret, "/partner/places", timeout=(20, 60))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/delivery_zones", methods=["GET"])
@require_auth
def yandex_delivery_zones():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    place_id = request.args.get("place_id")
    if not place_id:
        return jsonify({"error": "place_id required"}), 400
    data, err = yandex_request(client_id, client_secret, "/partner/delivery/zones", params={"place_id": place_id}, timeout=(20, 60))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/schedule", methods=["GET"])
@require_auth
def yandex_schedule():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    place_id = request.args.get("place_id")
    if not place_id:
        return jsonify({"error": "place_id required"}), 400
    data, err = yandex_request(client_id, client_secret, "/partner/schedule", params={"place_id": place_id}, timeout=(20, 60))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/orders", methods=["GET"])
@require_auth
def yandex_orders():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    params = {"status": request.args.get("status")} if request.args.get("status") else None
    data, err = yandex_request(client_id, client_secret, "/partner/orders", params=params, timeout=(20, 60))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/orders/history", methods=["POST"])
@require_auth
def yandex_orders_history():
    client_id = request.json.get("client_id") if request.is_json else request.form.get("client_id")
    client_secret = request.json.get("client_secret") if request.is_json else request.form.get("client_secret")
    payload = request.get_json() or {}
    for key in ("client_id", "client_secret"):
        payload.pop(key, None)
    data, err = yandex_request(client_id, client_secret, "/partner/orders/history", method="POST", payload=payload, timeout=(20, 60))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/orders/details", methods=["POST"])
@require_auth
def yandex_orders_details():
    client_id = request.json.get("client_id") if request.is_json else request.form.get("client_id")
    client_secret = request.json.get("client_secret") if request.is_json else request.form.get("client_secret")
    payload = request.get_json() or {}
    for key in ("client_id", "client_secret"):
        payload.pop(key, None)
    data, err = yandex_request(client_id, client_secret, "/partner/integration/v1/orders/details", method="POST", payload=payload, timeout=(20, 60))
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)

# ==================== ВЕБХУКИ ====================
@app.route("/api/webhooks", methods=["GET"])
@require_auth
def webhooks_list():
    items = sorted(({
        "name": name,
        "webhook_url": data.get("webhook_url", ""),
        "client_id": data.get("client_id", ""),
        "client_secret": data.get("client_secret", ""),
    } for name, data in WEBHOOKS_DB.items()), key=lambda x: x["name"].lower())
    return jsonify({"items": items})


@app.route("/api/webhooks", methods=["POST"])
@require_auth
def webhooks_save():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    webhook_url = (data.get("webhook_url") or "").strip()
    client_id = (data.get("client_id") or "").strip()
    client_secret = (data.get("client_secret") or "").strip()
    if not name or not webhook_url:
        return jsonify({"error": "name and webhook_url required"}), 400
    WEBHOOKS_DB[name] = {
        "name": name,
        "webhook_url": webhook_url,
        "client_id": client_id,
        "client_secret": client_secret,
    }
    save_webhooks()
    return jsonify({"ok": True, "item": WEBHOOKS_DB[name]})


@app.route("/api/webhooks/<name>", methods=["DELETE"])
@require_auth
def webhooks_delete(name):
    key = name.strip()
    if key in WEBHOOKS_DB:
        WEBHOOKS_DB.pop(key)
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
        if password:
            hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))
            USERS_DB[username] = {"hash": hashed, "role": request.form.get("role", "user")}
        else:
            if username in USERS_DB:
                USERS_DB[username]["role"] = request.form.get("role", "user")
    elif action == "delete":
        if username in USERS_DB and USERS_DB[username]["role"] == "admin" and len([u for u, d in USERS_DB.items() if d["role"] == "admin"]) == 1:
            return redirect("/users?msg=Нельзя+удалить+последнего+админа")
        USERS_DB.pop(username, None)
    save_users()
    return redirect("/users?msg=Успешно!")

@app.route("/logout")
def logout():
    return Response('Вы вышли', 401,
                    {'WWW-Authenticate': 'Basic realm="iiko-menu-logout-temp"'})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)
