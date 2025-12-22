from http import HTTPStatus

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_creates_user_and_returns_token(client: AsyncClient) -> None:
    response = await client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "password123", "full_name": "Test User"},
    )

    assert response.status_code == HTTPStatus.CREATED
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "user@example.com"


@pytest.mark.asyncio
async def test_register_with_duplicate_email_returns_400(client: AsyncClient) -> None:
    payload = {"email": "dup@example.com", "password": "password123"}
    first = await client.post("/auth/register", json=payload)
    assert first.status_code == HTTPStatus.CREATED

    second = await client.post("/auth/register", json=payload)
    assert second.status_code == HTTPStatus.BAD_REQUEST


@pytest.mark.asyncio
async def test_login_returns_token(client: AsyncClient) -> None:
    await client.post("/auth/register", json={"email": "login@example.com", "password": "password123"})

    response = await client.post("/auth/login", json={"email": "login@example.com", "password": "password123"})

    assert response.status_code == HTTPStatus.OK
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "login@example.com"


@pytest.mark.asyncio
async def test_login_with_wrong_password_returns_401(client: AsyncClient) -> None:
    await client.post("/auth/register", json={"email": "wrongpass@example.com", "password": "password123"})

    response = await client.post("/auth/login", json={"email": "wrongpass@example.com", "password": "badpass"})

    assert response.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.asyncio
async def test_me_returns_current_user(client: AsyncClient) -> None:
    login = await client.post("/auth/register", json={"email": "me@example.com", "password": "password123"})
    token = login.json()["access_token"]

    response = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == HTTPStatus.OK
    assert response.json()["email"] == "me@example.com"


@pytest.mark.asyncio
async def test_me_requires_authentication(client: AsyncClient) -> None:
    response = await client.get("/auth/me")
    assert response.status_code == HTTPStatus.UNAUTHORIZED
