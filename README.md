# Spendario

Monorepo inicial do Spendario (MVP) com frontend em Next.js 14 e backend em FastAPI.

## Requisitos
- Node.js 20+
- npm 10+
- Python 3.12+
- Poetry 1.8+

## Estrutura
- `frontend/` — Next.js 14 + Tailwind.
- `backend/` — FastAPI com tooling de lint/format/type-check e teste inicial.
- `Makefile` — comandos principais para dev, lint, type-check e testes.

## Primeiros passos
```bash
make setup        # instala dependências do backend e frontend
make dev          # inicia backend (8000) e frontend (3000)
```

Comandos úteis:
- `make lint` — roda lint em frontend e backend.
- `make type` — checa tipos (mypy + tsc).
- `make test` — roda testes do backend.
- `make dev-backend` / `make dev-frontend` — servidores isolados.

## CI/CD
- Workflow em `.github/workflows/ci.yml` executa lint e type-check de frontend e backend em pushes e PRs.

## Notas
- `backend/pyproject.toml` já inclui FastAPI, SQLAlchemy, Alembic e libs de auth para as próximas tarefas.
- Frontend vem com Tailwind e layout inicial para Sprint 0.
