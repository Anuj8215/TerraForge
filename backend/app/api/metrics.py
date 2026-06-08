from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.deployment import Deployment, DeploymentStatus
from app.models.project import Project
from app.models.resource import Resource
from app.services.monitoring.cost import estimate

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("")
async def get_metrics(db: AsyncSession = Depends(get_db)):
    dep_rows = (
        await db.execute(
            select(Deployment.status, func.count(Deployment.id)).group_by(Deployment.status)
        )
    ).all()
    dep_by_status = {row[0].value: row[1] for row in dep_rows}

    proj_rows = (
        await db.execute(
            select(Project.provider, func.count(Project.id)).group_by(Project.provider)
        )
    ).all()
    proj_by_provider = {row[0].value: row[1] for row in proj_rows}

    total_projects = (await db.execute(select(func.count()).select_from(Project))).scalar()
    total_resources = (await db.execute(select(func.count()).select_from(Resource))).scalar()
    total_deployments = sum(dep_by_status.values())

    recent = (
        await db.execute(
            select(Deployment).order_by(Deployment.created_at.desc()).limit(30)
        )
    ).scalars().all()

    daily: dict[str, dict] = {}
    for d in recent:
        day = d.created_at.strftime("%Y-%m-%d")
        if day not in daily:
            daily[day] = {"date": day, "success": 0, "failed": 0, "total": 0}
        daily[day]["total"] += 1
        if d.status == DeploymentStatus.success:
            daily[day]["success"] += 1
        elif d.status == DeploymentStatus.failed:
            daily[day]["failed"] += 1

    return {
        "deployments": {
            "total": total_deployments,
            "by_status": dep_by_status,
        },
        "projects": {
            "total": total_projects,
            "by_provider": proj_by_provider,
        },
        "resources": {"total": total_resources},
        "activity": sorted(daily.values(), key=lambda x: x["date"]),
    }


@router.post("/estimate")
async def estimate_cost(payload: dict):
    resources = payload.get("resources", [])
    return estimate(resources)
