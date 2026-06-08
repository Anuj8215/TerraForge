import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

_UNAUTH = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(token)
    if not payload:
        raise _UNAUTH
    user_id = payload.get("sub")
    if not user_id:
        raise _UNAUTH
    try:
        user = await db.get(User, uuid.UUID(user_id))
    except (ValueError, Exception):
        raise _UNAUTH
    if not user or not user.is_active:
        raise _UNAUTH
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


async def require_operator(user: User = Depends(get_current_user)) -> User:
    if user.role not in (UserRole.admin, UserRole.operator):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operator or admin access required")
    return user
