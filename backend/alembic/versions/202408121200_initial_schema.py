"""Initial schema for users, categories and expenses

Revision ID: 202408121200
Revises: 
Create Date: 2024-08-12 12:00:00
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "202408121200"
down_revision = None
branch_labels = None
depends_on = None


DEFAULT_CATEGORIES = [
    {"name": "Alimentacao", "slug": "alimentacao"},
    {"name": "Transporte", "slug": "transporte"},
    {"name": "Moradia", "slug": "moradia"},
    {"name": "Saude", "slug": "saude"},
    {"name": "Lazer", "slug": "lazer"},
    {"name": "Educacao", "slug": "educacao"},
    {"name": "Supermercado", "slug": "supermercado"},
    {"name": "Assinaturas", "slug": "assinaturas"},
    {"name": "Servicos", "slug": "servicos"},
    {"name": "Impostos", "slug": "impostos"},
    {"name": "Investimentos", "slug": "investimentos"},
    {"name": "Pets", "slug": "pets"},
    {"name": "Viagem", "slug": "viagem"},
    {"name": "Presentes", "slug": "presentes"},
    {"name": "Outros", "slug": "outros"},
]


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_categories")),
        sa.UniqueConstraint("name", name=op.f("uq_categories_name")),
        sa.UniqueConstraint("slug", name=op.f("uq_categories_slug")),
    )

    op.bulk_insert(sa.table("categories",
                            sa.Column("name", sa.String()),
                            sa.Column("slug", sa.String())), DEFAULT_CATEGORIES)

    op.create_table(
        "expenses",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default="BRL", nullable=False),
        sa.Column("description", sa.String(length=255), nullable=False),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.CheckConstraint("amount > 0", name=op.f("ck_expenses_amount_positive")),
        sa.CheckConstraint("char_length(currency) = 3", name=op.f("ck_expenses_currency_code_length")),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="RESTRICT", name=op.f("fk_expenses_category_id_categories")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name=op.f("fk_expenses_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_expenses")),
    )
    op.create_index(op.f("ix_expenses_category_id"), "expenses", ["category_id"], unique=False)
    op.create_index(op.f("ix_expenses_transaction_date"), "expenses", ["transaction_date"], unique=False)
    op.create_index(op.f("ix_expenses_user_id"), "expenses", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_expenses_user_id"), table_name="expenses")
    op.drop_index(op.f("ix_expenses_transaction_date"), table_name="expenses")
    op.drop_index(op.f("ix_expenses_category_id"), table_name="expenses")
    op.drop_table("expenses")
    op.drop_table("categories")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
