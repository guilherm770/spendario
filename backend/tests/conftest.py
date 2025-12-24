import asyncio
import contextlib
from collections.abc import AsyncIterator

import passlib.handlers.bcrypt as bcrypt_module
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.dependencies import get_db_session
from app.main import app
from app.models import Base

BCRYPT_MAX_BYTES = 72
original_calc_checksum = bcrypt_module._BcryptBackend._calc_checksum


def patched_calc_checksum(self, secret):
    # bcrypt limits password to 72 bytes; truncate if longer
    if len(secret) > BCRYPT_MAX_BYTES:
        secret = secret[:BCRYPT_MAX_BYTES]
    return original_calc_checksum(self, secret)


bcrypt_module._BcryptBackend._calc_checksum = patched_calc_checksum


async def _heartbeat(period: float = 0.05) -> None:
    while True:
        await asyncio.sleep(period)


class InlineExecutorEventLoop(asyncio.SelectorEventLoop):
    def run_in_executor(self, executor, func, *args):  # type: ignore[override]
        future = self.create_future()
        try:
            result = func(*args)
        except Exception as exc:  # pragma: no cover - sync fallback
            future.set_exception(exc)
        else:
            future.set_result(result)
        return future


@pytest.fixture
def event_loop():
    loop = InlineExecutorEventLoop()
    try:
        yield loop
    finally:
        loop.close()


@pytest_asyncio.fixture
async def session_factory() -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async_session = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)

    heartbeat = asyncio.create_task(_heartbeat())
    try:
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        yield async_session
    finally:
        await test_engine.dispose()
        heartbeat.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await heartbeat


@pytest_asyncio.fixture
async def db_session(session_factory: async_sessionmaker[AsyncSession]) -> AsyncIterator[AsyncSession]:
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(session_factory: async_sessionmaker[AsyncSession]) -> AsyncIterator[AsyncClient]:
    async def override_get_session() -> AsyncIterator[AsyncSession]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as async_client:
        yield async_client

    app.dependency_overrides.clear()
