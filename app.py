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
import urllib.parse
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)
app.secret_key = "iiko-menu-secret-2025"

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
def _normalize_base(webhook_url: str) -> str:
    parsed = urlparse(webhook_url or "")
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return (webhook_url or "").rstrip("/")


def get_yandex_token(client_id: str, client_secret: str, base: str, token_path: str = "/oauth2/token") -> tuple[str | None, str | None]:
    """Получить и кешировать токен Яндекс.Еды у хоста интеграции (webhook base)."""
    if not (client_id and client_secret and base):
        return None, "client_id, client_secret и webhook_url обязательны"

    norm_base = _normalize_base(base)
    key = f"{client_id}:{client_secret}:{norm_base}"
    cached = YANDEX_TOKENS.get(key)
    if cached and time.time() - cached["time"] < 3500:
        return cached["token"], None

    token_errors: list[str] = []

    def request_token(path: str):
        url = f"{norm_base}{path}"
        logger.debug(f"Using base: {norm_base}, token_path: {path}")
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
                return None, "Проверьте API логины в iiko (Транспорт > разблокируйте учётные данные)."
            if resp_main.status_code == 404:
                return None, "404"
            return None, resp_main.text or resp_basic.text
        except requests.exceptions.RequestException as ex:
            logger.error(f"Yandex token request failed for {url}: {ex}")
            return None, "timeout"

    try:
        token, err = request_token(token_path)
        if token:
            YANDEX_TOKENS[key] = {"token": token, "time": time.time(), "base": norm_base}
            return token, None
        if err == "404" or isinstance(err, str) and "timeout" in err.lower():
            token, err = request_token("/security/oauth/token")
            if token:
                YANDEX_TOKENS[key] = {"token": token, "time": time.time(), "base": norm_base}
                return token, None
        if err:
            return None, err
        return None, "; ".join(token_errors) or "Токен не получен"
    except requests.exceptions.RequestException as e:
        logger.error(f"Yandex token error for {norm_base}: {e}")
        return None, "Проверьте сеть/DNS в контейнере (таймаут запроса к iiko host)."



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
                   token_path: str = "/oauth2/token"):
    token, err = get_yandex_token(client_id, client_secret, base or "", token_path=token_path)
    if not token:
        err_lower = (err or "").lower()
        status = 502 if any(x in err_lower for x in ("подключ", "timeout")) else 401
        return None, (status, err or "no token")

    cache_key = f"{client_id}:{client_secret}:{_normalize_base(base or '')}"
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

# ==================== YANDEX РОУТЫ ====================
@app.route("/api/yandex/token", methods=["POST"])
@require_auth
def yandex_token():
    data = request.get_json() or {}
    webhook_url = (data.get("webhook_url") or data.get("base") or "").strip()
    norm_base = _normalize_base(webhook_url)
    token, err = get_yandex_token(data.get("client_id"), data.get("client_secret"), norm_base)
    if not token:
        err_lower = (err or "").lower()
        status = 502 if any(x in err_lower for x in ("подключ", "timeout")) else 401
        return jsonify({"error": err or "invalid"}), status
    cache = YANDEX_TOKENS.get(f"{data.get('client_id')}:{data.get('client_secret')}:{norm_base.rstrip('/')}" ) or {}
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
    webhook_url = (data.get("webhook_url") or data.get("base") or "").strip()
    norm_base = _normalize_base(webhook_url)
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
        token, err = get_yandex_token(client_id, client_secret, webhook_url)
        if token:
            cache = YANDEX_TOKENS.get(f"{client_id}:{client_secret}:{webhook_url.rstrip('/')}" ) or {}
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
    webhook_url = request.args.get("webhook_url") or request.args.get("base")
    norm_base = _normalize_base(webhook_url)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    data, err = yandex_request(client_id, client_secret, "/v2/cities", timeout=(20, 60), base=norm_base)
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)

@app.route("/api/yandex/places", methods=["GET"])
@require_auth
def yandex_places():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    webhook_url = request.args.get("webhook_url") or request.args.get("base")
    norm_base = _normalize_base(webhook_url)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    city_id = request.args.get("city_id")
    params = {"city_id": city_id} if city_id else None
    data, err = yandex_request(client_id, client_secret, "/v2/places", params=params, timeout=(20, 60), base=norm_base)
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)

@app.route("/api/yandex/menu", methods=["GET"])
@require_auth
def yandex_menu():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    webhook_url = request.args.get("webhook_url") or request.args.get("base")
    norm_base = _normalize_base(webhook_url)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    restaurant_id = request.args.get("restaurant_id") or request.args.get("place_id")
    if not restaurant_id:
        return jsonify({"error": "restaurant_id required"}), 400
    data, err = yandex_request(client_id, client_secret, f"/menu/{restaurant_id}", timeout=(20, 60), base=norm_base)
    if err and err[0] == 404:
        data, err = yandex_request(client_id, client_secret, f"/menu/{restaurant_id}/composition", timeout=(20, 60), base=norm_base)
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/availability", methods=["GET"])
@require_auth
def yandex_availability():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    webhook_url = request.args.get("webhook_url") or request.args.get("base")
    norm_base = _normalize_base(webhook_url)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    restaurant_id = request.args.get("restaurant_id") or request.args.get("place_id")
    if not restaurant_id:
        return jsonify({"error": "restaurant_id required"}), 400
    data, err = yandex_request(client_id, client_secret, f"/menu/{restaurant_id}/availability", timeout=(20, 60), base=norm_base)
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/promos", methods=["GET"])
@require_auth
def yandex_promos():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    webhook_url = request.args.get("webhook_url") or request.args.get("base")
    norm_base = _normalize_base(webhook_url)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    restaurant_id = request.args.get("restaurant_id") or request.args.get("place_id")
    if not restaurant_id:
        return jsonify({"error": "restaurant_id required"}), 400
    data, err = yandex_request(client_id, client_secret, "/partner/promos", params={"place_id": restaurant_id}, timeout=(20, 60), base=norm_base)
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/restaurants", methods=["GET"])
@require_auth
def yandex_restaurants():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    webhook_url = request.args.get("webhook_url") or request.args.get("base")
    norm_base = _normalize_base(webhook_url)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    data, err = yandex_request(client_id, client_secret, "/restaurants", timeout=(20, 60), base=norm_base)
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/delivery_zones", methods=["GET"])
@require_auth
def yandex_delivery_zones():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    webhook_url = request.args.get("webhook_url") or request.args.get("base")
    norm_base = _normalize_base(webhook_url)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    restaurant_id = request.args.get("restaurant_id") or request.args.get("place_id")
    if not restaurant_id:
        return jsonify({"error": "restaurant_id required"}), 400
    data, err = yandex_request(client_id, client_secret, "/partner/delivery/zones", params={"place_id": restaurant_id}, timeout=(20, 60), base=norm_base)
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/schedule", methods=["GET"])
@require_auth
def yandex_schedule():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    webhook_url = request.args.get("webhook_url") or request.args.get("base")
    norm_base = _normalize_base(webhook_url)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    restaurant_id = request.args.get("restaurant_id") or request.args.get("place_id")
    if not restaurant_id:
        return jsonify({"error": "restaurant_id required"}), 400
    data, err = yandex_request(client_id, client_secret, "/partner/schedule", params={"place_id": restaurant_id}, timeout=(20, 60), base=norm_base)
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/orders", methods=["GET"])
@require_auth
def yandex_orders():
    client_id = request.args.get("client_id")
    client_secret = request.args.get("client_secret")
    webhook_url = request.args.get("webhook_url") or request.args.get("base")
    norm_base = _normalize_base(webhook_url)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    params = {"status": request.args.get("status")} if request.args.get("status") else None
    data, err = yandex_request(client_id, client_secret, "/partner/orders", params=params, timeout=(20, 60), base=norm_base)
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/orders/history", methods=["POST"])
@require_auth
def yandex_orders_history():
    client_id = request.json.get("client_id") if request.is_json else request.form.get("client_id")
    client_secret = request.json.get("client_secret") if request.is_json else request.form.get("client_secret")
    webhook_url = (request.json.get("webhook_url") if request.is_json else request.form.get("webhook_url")) or (request.json.get("base") if request.is_json else request.form.get("base"))
    norm_base = _normalize_base(webhook_url)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    payload = request.get_json() or {}
    for key in ("client_id", "client_secret"):
        payload.pop(key, None)
    data, err = yandex_request(client_id, client_secret, "/partner/orders/history", method="POST", payload=payload, timeout=(20, 60), base=norm_base)
    if err:
        status, msg = err
        return jsonify({"error": msg}), status
    return jsonify(data)


@app.route("/api/yandex/orders/details", methods=["POST"])
@require_auth
def yandex_orders_details():
    client_id = request.json.get("client_id") if request.is_json else request.form.get("client_id")
    client_secret = request.json.get("client_secret") if request.is_json else request.form.get("client_secret")
    webhook_url = (request.json.get("webhook_url") if request.is_json else request.form.get("webhook_url")) or (request.json.get("base") if request.is_json else request.form.get("base"))
    norm_base = _normalize_base(webhook_url)
    if not norm_base:
        return jsonify({"error": "webhook_url required"}), 400
    payload = request.get_json() or {}
    for key in ("client_id", "client_secret"):
        payload.pop(key, None)
    data, err = yandex_request(client_id, client_secret, "/partner/integration/v1/orders/details", method="POST", payload=payload, timeout=(20, 60), base=norm_base)
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
        "provider": data.get("provider", "yandex"),
        "iiko_key": data.get("iiko_key", ""),
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
    provider = (data.get("provider") or "yandex").strip() or "yandex"
    iiko_key = (data.get("iiko_key") or "").strip()
    if not name or not webhook_url:
        return jsonify({"error": "name and webhook_url required"}), 400
    WEBHOOKS_DB[name] = {
        "name": name,
        "webhook_url": webhook_url,
        "client_id": client_id,
        "client_secret": client_secret,
        "provider": provider,
        "iiko_key": iiko_key,
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
