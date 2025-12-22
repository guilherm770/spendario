from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class Settings:
    database_url: str
    jwt_secret: str
    jwt_algorithm: str
    access_token_expires_minutes: int
    cors_origins: list[str]

    def __init__(self) -> None:
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://spendario:spendario@localhost:5432/spendario",
        )
        self.jwt_secret = os.getenv("JWT_SECRET", "change-me")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.access_token_expires_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRES_MINUTES", "10080"))
        raw_origins = os.getenv("CORS_ORIGINS")
        if raw_origins:
            self.cors_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
        else:
            self.cors_origins = [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]


settings = Settings()
