"""Add deleted_at column to expenses

Revision ID: 202502171200
Revises: 202408121200
Create Date: 2025-02-17 12:00:00
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "202502171200"
down_revision = "202408121200"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("expenses", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("expenses", "deleted_at")

