from __future__ import annotations

from datetime import date
from http import HTTPStatus

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Category


async def create_category(session: AsyncSession, name: str = "Alimentação") -> Category:
    category = Category(name=name, slug=name.lower().replace(" ", "-"))
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return category


async def create_user_token(client: AsyncClient, email: str = "user@example.com") -> str:
    response = await client.post("/auth/register", json={"email": email, "password": "password123"})
    assert response.status_code == HTTPStatus.CREATED
    return response.json()["access_token"]


async def auth_headers(client: AsyncClient, email: str = "user@example.com") -> dict[str, str]:
    token = await create_user_token(client, email=email)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_expense(client: AsyncClient, db_session: AsyncSession) -> None:
    category = await create_category(db_session, "Supermercado")
    headers = await auth_headers(client)

    response = await client.post(
        "/expenses",
        json={
            "amount": "123.45",
            "currency": "brl",
            "description": "Compra semanal",
            "transaction_date": str(date.today()),
            "category_id": category.id,
        },
        headers=headers,
    )

    assert response.status_code == HTTPStatus.CREATED, response.text
    data = response.json()
    assert data["description"] == "Compra semanal"
    assert data["amount"] == "123.45"
    assert data["currency"] == "BRL"
    assert data["category_id"] == category.id
    assert "id" in data


@pytest.mark.asyncio
async def test_list_expenses_returns_only_current_user_items(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    category_a = await create_category(db_session, "Transporte")
    category_b = await create_category(db_session, "Lazer")

    headers_user1 = await auth_headers(client, email="user1@example.com")
    headers_user2 = await auth_headers(client, email="user2@example.com")

    await client.post(
        "/expenses",
        json={
            "amount": "50.00",
            "currency": "BRL",
            "description": "Uber",
            "transaction_date": "2024-01-02",
            "category_id": category_a.id,
        },
        headers=headers_user1,
    )
    await client.post(
        "/expenses",
        json={
            "amount": "80.00",
            "currency": "BRL",
            "description": "Cinema",
            "transaction_date": "2024-01-03",
            "category_id": category_b.id,
        },
        headers=headers_user1,
    )
    await client.post(
        "/expenses",
        json={
            "amount": "15.00",
            "currency": "BRL",
            "description": "Outro usuário",
            "transaction_date": "2024-01-04",
            "category_id": category_b.id,
        },
        headers=headers_user2,
    )

    response = await client.get("/expenses?page=1&page_size=10", headers=headers_user1)
    assert response.status_code == HTTPStatus.OK
    data = response.json()
    expected_count = 2
    assert data["total"] == expected_count
    assert len(data["items"]) == expected_count
    # Ordered desc by transaction_date
    assert data["items"][0]["description"] == "Cinema"
    assert data["items"][1]["description"] == "Uber"


@pytest.mark.asyncio
async def test_update_expense(client: AsyncClient, db_session: AsyncSession) -> None:
    category = await create_category(db_session, "Moradia")
    headers = await auth_headers(client, email="upd@example.com")

    created = await client.post(
        "/expenses",
        json={
            "amount": "200.00",
            "currency": "BRL",
            "description": "Conta de luz",
            "transaction_date": "2024-02-01",
            "category_id": category.id,
        },
        headers=headers,
    )
    expense_id = created.json()["id"]

    response = await client.put(
        f"/expenses/{expense_id}",
        json={
            "amount": "210.50",
            "currency": "brl",
            "description": "Conta de luz ajustada",
            "transaction_date": "2024-02-02",
            "category_id": category.id,
        },
        headers=headers,
    )

    assert response.status_code == HTTPStatus.OK, response.text
    data = response.json()
    assert data["amount"] == "210.50"
    assert data["description"] == "Conta de luz ajustada"
    assert data["currency"] == "BRL"
    assert data["transaction_date"] == "2024-02-02"


@pytest.mark.asyncio
async def test_delete_expense_soft_removes(client: AsyncClient, db_session: AsyncSession) -> None:
    category = await create_category(db_session, "Saúde")
    headers = await auth_headers(client, email="del@example.com")

    created = await client.post(
        "/expenses",
        json={
            "amount": "99.90",
            "currency": "BRL",
            "description": "Farmácia",
            "transaction_date": "2024-03-01",
            "category_id": category.id,
        },
        headers=headers,
    )
    expense_id = created.json()["id"]

    delete_response = await client.delete(f"/expenses/{expense_id}", headers=headers)
    assert delete_response.status_code == HTTPStatus.NO_CONTENT

    list_response = await client.get("/expenses", headers=headers)
    assert list_response.status_code == HTTPStatus.OK
    assert list_response.json()["total"] == 0

    detail = await client.get(f"/expenses/{expense_id}", headers=headers)
    assert detail.status_code == HTTPStatus.NOT_FOUND


@pytest.mark.asyncio
async def test_create_expense_requires_existing_category(client: AsyncClient) -> None:
    headers = await auth_headers(client, email="nocat@example.com")
    response = await client.post(
        "/expenses",
        json={
            "amount": "10.00",
            "currency": "BRL",
            "description": "Invalid category",
            "transaction_date": "2024-01-01",
            "category_id": 9999,
        },
        headers=headers,
    )

    assert response.status_code == HTTPStatus.NOT_FOUND
