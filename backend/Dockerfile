FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir poetry==1.8.2

COPY pyproject.toml poetry.lock* ./

RUN if [ -f poetry.lock ]; then \
      poetry install --only main; \
    else \
      poetry install --only main; \
    fi

COPY src ./src

ENV PYTHONPATH=/app/src:$PYTHONPATH

CMD ["poetry", "run", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
