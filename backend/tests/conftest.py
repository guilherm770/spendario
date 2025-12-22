from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Monkey-patch passlib bcrypt detection to avoid ValueError due to long password
import sys
import passlib.handlers.bcrypt as bcrypt_module

original_calc_checksum = bcrypt_module._BcryptBackend._calc_checksum

def patched_calc_checksum(self, secret):
    # bcrypt limits password to 72 bytes; truncate if longer
    if len(secret) > 72:
        secret = secret[:72]
    return original_calc_checksum(self, secret)

bcrypt_module._BcryptBackend._calc_checksum = patched_calc_checksum

from app.dependencies import get_db_session
from app.main import app
from app.models import Base


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async_session = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_session() -> AsyncIterator[AsyncSession]:
        async with async_session() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as async_client:
        yield async_client

    app.dependency_overrides.clear()
    await test_engine.dispose()
