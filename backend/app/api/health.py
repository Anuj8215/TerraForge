from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check():
    return {
        "status": "ok",
        "environment": settings.environment,
        "version": "1.0.0",
    }


@router.get("/db")
async def db_health(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT 1"))
    result.scalar()
    return {"status": "ok", "database": "connected"}


@router.get("/vault")
async def vault_health():
    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{settings.vault_addr}/v1/sys/health")
    return {"status": "ok", "vault": response.json()}
