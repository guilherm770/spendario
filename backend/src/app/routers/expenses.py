from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session
from app.models import Category, Expense, User
from app.schemas.expense import ExpenseCreate, ExpenseRead, ExpenseUpdate, PaginatedExpenses

router = APIRouter(prefix="/expenses", tags=["expenses"])


async def _get_owned_expense(expense_id: uuid.UUID, user_id: uuid.UUID, session: AsyncSession) -> Expense:
    query = select(Expense).where(
        Expense.id == expense_id,
        Expense.user_id == user_id,
        Expense.deleted_at.is_(None),
    )
    result = await session.execute(query)
    expense = result.scalar_one_or_none()
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


@router.post("", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
async def create_expense(
    payload: ExpenseCreate,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> ExpenseRead:
    category = await session.get(Category, payload.category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    expense = Expense(
        user_id=current_user.id,
        category_id=payload.category_id,
        amount=payload.amount,
        currency=payload.currency.upper(),
        description=payload.description,
        transaction_date=payload.transaction_date,
    )
    session.add(expense)
    await session.commit()
    await session.refresh(expense)
    return ExpenseRead.model_validate(expense)


@router.get("", response_model=PaginatedExpenses)
async def list_expenses(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> PaginatedExpenses:
    base_query = select(Expense).where(Expense.user_id == current_user.id, Expense.deleted_at.is_(None))

    total_result = await session.execute(select(func.count()).select_from(base_query.subquery()))
    total = total_result.scalar_one()

    expenses_result = await session.execute(
        base_query.order_by(Expense.transaction_date.desc(), Expense.created_at.desc())
        .limit(page_size)
        .offset((page - 1) * page_size)
    )
    expenses = expenses_result.scalars().all()

    return PaginatedExpenses(
        items=[ExpenseRead.model_validate(expense) for expense in expenses],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{expense_id}", response_model=ExpenseRead)
async def get_expense(
    expense_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> ExpenseRead:
    expense = await _get_owned_expense(expense_id, current_user.id, session)
    return ExpenseRead.model_validate(expense)


@router.put("/{expense_id}", response_model=ExpenseRead)
async def update_expense(
    expense_id: uuid.UUID,
    payload: ExpenseUpdate,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> ExpenseRead:
    expense = await _get_owned_expense(expense_id, current_user.id, session)

    category = await session.get(Category, payload.category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    expense.amount = payload.amount
    expense.currency = payload.currency.upper()
    expense.description = payload.description
    expense.transaction_date = payload.transaction_date
    expense.category_id = payload.category_id

    session.add(expense)
    await session.commit()
    await session.refresh(expense)
    return ExpenseRead.model_validate(expense)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_expense(
    expense_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Response:
    expense = await _get_owned_expense(expense_id, current_user.id, session)
    expense.deleted_at = datetime.now(UTC)

    session.add(expense)
    await session.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
