FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

WORKDIR /app

RUN apt-get update \ 
    && apt-get install -y --no-install-recommends build-essential \ 
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry==1.8.2

COPY pyproject.toml poetry.lock* README.md ./
COPY src ./src

RUN if [ -f poetry.lock ]; then \
      poetry install --with dev; \
    else \
      poetry install --with dev --no-root; \
    fi

CMD ["poetry", "run", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
