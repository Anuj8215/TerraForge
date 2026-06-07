import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.resource import Resource
from app.schemas.resource import (
    ResourceCreate,
    ResourceStatusUpdate,
    ResourceResponse,
    ResourceListResponse,
)

router = APIRouter(prefix="/resources", tags=["resources"])


@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(payload: ResourceCreate, db: AsyncSession = Depends(get_db)):
    resource = Resource(**payload.model_dump())
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return resource


@router.get("", response_model=ResourceListResponse)
async def list_resources(
    project_id: uuid.UUID | None = None,
    deployment_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    query = select(Resource)
    count_query = select(func.count()).select_from(Resource)

    if project_id:
        query = query.where(Resource.project_id == project_id)
        count_query = count_query.where(Resource.project_id == project_id)
    if deployment_id:
        query = query.where(Resource.deployment_id == deployment_id)
        count_query = count_query.where(Resource.deployment_id == deployment_id)

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(query.offset(skip).limit(limit).order_by(Resource.created_at.desc()))
    resources = result.scalars().all()

    return ResourceListResponse(total=total, items=resources)


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(resource_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    resource = await db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource


@router.patch("/{resource_id}/status", response_model=ResourceResponse)
async def update_resource_status(
    resource_id: uuid.UUID,
    payload: ResourceStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    resource = await db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(resource, field, value)

    await db.commit()
    await db.refresh(resource)
    return resource


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(resource_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    resource = await db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    await db.delete(resource)
    await db.commit()
