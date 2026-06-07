import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.resource import ResourceStatus


class ResourceCreate(BaseModel):
    project_id: uuid.UUID
    deployment_id: uuid.UUID
    resource_type: str
    resource_name: str
    config: dict = {}


class ResourceStatusUpdate(BaseModel):
    status: ResourceStatus
    aws_resource_id: str | None = None


class ResourceResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    deployment_id: uuid.UUID
    resource_type: str
    resource_name: str
    aws_resource_id: str | None
    config: dict
    status: ResourceStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResourceListResponse(BaseModel):
    total: int
    items: list[ResourceResponse]
