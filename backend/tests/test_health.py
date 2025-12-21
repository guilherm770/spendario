from http import HTTPStatus

import pytest
from httpx import AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_returns_ok() -> None:
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == HTTPStatus.OK
    assert response.json() == {"status": "ok"}
