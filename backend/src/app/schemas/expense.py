from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer

DecimalStr = Annotated[Decimal, PlainSerializer(lambda v: format(v, "f"), return_type=str)]


class ExpenseBase(BaseModel):
    amount: Annotated[Decimal, Field(max_digits=12, decimal_places=2, gt=0)]
    currency: str = Field(min_length=3, max_length=3, examples=["BRL"])
    description: str = Field(min_length=1, max_length=255)
    transaction_date: date
    category_id: int = Field(gt=0)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(ExpenseBase):
    pass


class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    category_id: int
    amount: DecimalStr
    currency: str
    description: str
    transaction_date: date
    created_at: datetime


class PaginatedExpenses(BaseModel):
    items: list[ExpenseRead]
    total: int
    page: int
    page_size: int
