import base64
import hashlib
import hmac
import json
import re
import secrets
import time
from typing import Any

from fastapi import HTTPException, Request, status

from config import settings

TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60
_SECRET = settings.secret_key.encode()
_UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Credenciales inválidas o expiradas.",
)


def normalize_username(value: str) -> str:
    return re.sub(r"[^a-z0-9_-]", "", value.strip().lower())


def is_valid_username(value: str) -> bool:
    return bool(re.fullmatch(r"[a-z0-9_-]{3,64}", value))


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    iterations = 200_000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = stored_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode(),
            bytes.fromhex(salt_hex),
            int(iterations),
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def create_token(username: str, role: str) -> str:
    payload = {
        "sub": username,
        "role": role,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    body = base64.urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":")).encode()
    ).decode().rstrip("=")
    signature = hmac.new(_SECRET, body.encode(), hashlib.sha256).hexdigest()
    return f"{body}.{signature}"


def decode_token(token: str) -> dict[str, Any]:
    try:
        body, signature = token.split(".", 1)
        expected = hmac.new(_SECRET, body.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise _UNAUTHORIZED
        padding = "=" * (-len(body) % 4)
        payload = json.loads(base64.urlsafe_b64decode(body + padding))
        if not isinstance(payload, dict) or payload.get("exp", 0) < time.time():
            raise _UNAUTHORIZED
        return payload
    except (ValueError, TypeError, json.JSONDecodeError):
        raise _UNAUTHORIZED from None


def client_username_from_request(request: Request, required: bool = False) -> str | None:
    header = request.headers.get("Authorization")
    if not header:
        if required:
            raise _UNAUTHORIZED
        return None
    if not header.startswith("Bearer "):
        raise _UNAUTHORIZED

    payload = decode_token(header.removeprefix("Bearer "))
    if payload.get("role") != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta acción requiere una sesión de cliente.",
        )

    username = normalize_username(str(payload.get("sub", "")))
    if not username:
        raise _UNAUTHORIZED
    return username
