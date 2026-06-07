import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.deployment import Deployment
from app.models.project import Project
from app.schemas.deployment import (
    DeploymentCreate,
    DeploymentStatusUpdate,
    DeploymentResponse,
    DeploymentListResponse,
)

router = APIRouter(prefix="/deployments", tags=["deployments"])


@router.post("", response_model=DeploymentResponse, status_code=status.HTTP_201_CREATED)
async def create_deployment(payload: DeploymentCreate, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, payload.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    deployment = Deployment(**payload.model_dump())
    db.add(deployment)
    await db.commit()
    await db.refresh(deployment)
    return deployment


@router.get("", response_model=DeploymentListResponse)
async def list_deployments(
    project_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    query = select(Deployment)
    count_query = select(func.count()).select_from(Deployment)

    if project_id:
        query = query.where(Deployment.project_id == project_id)
        count_query = count_query.where(Deployment.project_id == project_id)

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(query.offset(skip).limit(limit).order_by(Deployment.created_at.desc()))
    deployments = result.scalars().all()

    return DeploymentListResponse(total=total, items=deployments)


@router.get("/{deployment_id}", response_model=DeploymentResponse)
async def get_deployment(deployment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    deployment = await db.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment


@router.patch("/{deployment_id}/status", response_model=DeploymentResponse)
async def update_deployment_status(
    deployment_id: uuid.UUID,
    payload: DeploymentStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    deployment = await db.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(deployment, field, value)

    await db.commit()
    await db.refresh(deployment)
    return deployment


@router.delete("/{deployment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deployment(deployment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    deployment = await db.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    await db.delete(deployment)
    await db.commit()
