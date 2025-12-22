from __future__ import annotations

import asyncio
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# Ensure src/ is on the path so `import app` works
SRC_DIR = Path(__file__).resolve().parents[1] / "src"
sys.path.append(str(SRC_DIR))

from app.config import settings  # noqa: E402
from app.models.base import Base  # noqa: E402

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", settings.database_url)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section) or {},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        url=settings.database_url,
    )

    async def process_migrations() -> None:
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)

    asyncio.run(process_migrations())
    connectable.sync_engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
