from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import User
from app.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async for session in get_session():
        yield session


async def get_current_user(
    token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_db_session)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        user_id = uuid.UUID(str(sub))
    except (JWTError, ValueError) as err:
        raise credentials_exception from err

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception

    return user
