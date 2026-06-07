import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.deployment import DeploymentAction, DeploymentStatus


class DeploymentCreate(BaseModel):
    project_id: uuid.UUID
    action: DeploymentAction


class DeploymentStatusUpdate(BaseModel):
    status: DeploymentStatus
    logs: str | None = None
    plan_output: str | None = None
    error_message: str | None = None


class DeploymentResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    action: DeploymentAction
    status: DeploymentStatus
    logs: str | None
    plan_output: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DeploymentListResponse(BaseModel):
    total: int
    items: list[DeploymentResponse]
