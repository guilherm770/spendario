.PHONY: dev dev-backend dev-frontend lint lint-backend lint-frontend type type-backend type-frontend setup setup-backend setup-frontend test test-backend

setup: setup-backend setup-frontend

setup-backend:
	cd backend && poetry install --with dev

setup-frontend:
	cd frontend && npm install

dev: 
	@echo "Iniciando backend (8000) e frontend (3000)..."
	cd backend && poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 & \
	cd frontend && npm run dev

dev-backend:
	cd backend && poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

lint: lint-backend lint-frontend

lint-backend:
	cd backend && poetry run ruff check .

lint-frontend:
	cd frontend && npm run lint

type: type-backend type-frontend

type-backend:
	cd backend && poetry run mypy src

type-frontend:
	cd frontend && npm run type-check

test: test-backend

test-backend:
	cd backend && poetry run pytest
