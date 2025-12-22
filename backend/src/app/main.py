from fastapi import FastAPI

from app.database import lifespan
from app.routers import auth

app = FastAPI(title="Spendario API", version="0.1.0", lifespan=lifespan)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router)
