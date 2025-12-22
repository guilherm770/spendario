from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class Settings:
    database_url: str
    jwt_secret: str
    jwt_algorithm: str
    access_token_expires_minutes: int

    def __init__(self) -> None:
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://spendario:spendario@localhost:5432/spendario",
        )
        self.jwt_secret = os.getenv("JWT_SECRET", "change-me")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.access_token_expires_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRES_MINUTES", "10080"))


settings = Settings()
