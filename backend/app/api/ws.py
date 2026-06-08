import asyncio
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.redis_client import get_redis
from app.models.deployment import Deployment, DeploymentStatus

router = APIRouter(prefix="/ws", tags=["websocket"])

TERMINAL = {DeploymentStatus.success, DeploymentStatus.failed}


@router.websocket("/deployments/{deployment_id}/logs")
async def deployment_logs_ws(
    websocket: WebSocket,
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    await websocket.accept()

    dep = await db.get(Deployment, deployment_id)
    if not dep:
        await websocket.close(code=4004)
        return

    if dep.status in TERMINAL:
        if dep.logs:
            await websocket.send_text(dep.logs)
        await websocket.close()
        return

    redis = get_redis()
    key = f"deployment:{deployment_id}:logs"
    offset = 0

    try:
        while True:
            new_lines = await redis.lrange(key, offset, -1)
            for raw in new_lines:
                await websocket.send_text(raw.decode("utf-8", errors="replace"))
            offset += len(new_lines)

            result = await db.execute(
                select(Deployment.status).where(Deployment.id == deployment_id)
            )
            current = result.scalar_one_or_none()

            if current in TERMINAL:
                remaining = await redis.lrange(key, offset, -1)
                for raw in remaining:
                    await websocket.send_text(raw.decode("utf-8", errors="replace"))
                break

            await asyncio.sleep(0.3)

    except WebSocketDisconnect:
        pass
