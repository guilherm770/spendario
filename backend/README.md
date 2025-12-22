# Spendario Backend

FastAPI backend service for Spendario.

## Comandos

- `poetry install` — instala dependências.
- `poetry run uvicorn app.main:app --reload` — sobe a API local em modo dev.
- `poetry run ruff check .` — lint.
- `poetry run black --check .` — formatação.
- `poetry run mypy src` — type check.
- `poetry run pytest` — testes.
- `poetry run alembic upgrade head` — aplica migrações (usa `DATABASE_URL`).

### Auth
- Endpoints básicos: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`.
- JWT: expira em 7 dias (`ACCESS_TOKEN_EXPIRES_MINUTES`), segredo em `JWT_SECRET`.
