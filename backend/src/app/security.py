from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from app.config import settings

MAX_PASSWORD_BYTES = 72
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__truncate_error=True,
)


def _truncate_password(password: str) -> str:
    data = password.encode("utf-8")
    if len(data) <= MAX_PASSWORD_BYTES:
        return password
    truncated = data[:MAX_PASSWORD_BYTES].decode("utf-8", errors="ignore")
    return truncated


def hash_password(password: str) -> str:
    normalized = _truncate_password(password)
    hashed: str = pwd_context.hash(normalized)
    return hashed


def verify_password(plain_password: str, hashed_password: str) -> bool:
    normalized = _truncate_password(plain_password)
    verified: bool = pwd_context.verify(normalized, hashed_password)
    return verified


def create_access_token(subject: uuid.UUID, expires_minutes: int | None = None) -> str:
    expire = datetime.now(UTC) + timedelta(
        minutes=expires_minutes or settings.access_token_expires_minutes
    )
    to_encode = {"sub": str(subject), "exp": expire}
    token: str = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token


def decode_token(token: str) -> dict[str, Any]:
    decoded: dict[str, Any] = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    return decoded
