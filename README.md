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
- `make db-upgrade` — aplica migrações Alembic (usa `DATABASE_URL`).

## Ambiente com Docker
```bash
make docker-up   # sobe Postgres, backend (8000) e frontend (3000) com hot-reload
make docker-down # derruba os containers
make docker-logs # acompanha os logs
```

Detalhes:
- Compose em `docker-compose.yml` com Postgres 16, backend FastAPI e frontend Next.js.
- Código é montado via bind mount, então mudanças refletem sem rebuild.
- Credenciais padrão do Postgres: user `spendario`, senha `spendario`, db `spendario` (para dev local).
- O Makefile detecta `docker-compose` legado ou o plugin `docker compose`. Certifique-se de ter um deles instalado.
- Para rodar migrações no container do backend: `make docker-up` e depois `docker compose exec backend poetry run alembic upgrade head` (ou `docker-compose exec ...` se usar o binário legado).

## CI/CD
- Workflow em `.github/workflows/ci.yml` executa lint e type-check de frontend e backend em pushes e PRs.

## Notas
- `backend/pyproject.toml` já inclui FastAPI, SQLAlchemy, Alembic e libs de auth para as próximas tarefas.
- Frontend vem com Tailwind e layout inicial para Sprint 0.
