import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.project import ProjectStatus, CloudProvider


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    provider: CloudProvider = CloudProvider.aws
    region: str = "us-east-1"

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Project name cannot be empty")
        return v.strip()


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    region: str | None = None
    status: ProjectStatus | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    provider: CloudProvider
    region: str
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    total: int
    items: list[ProjectResponse]
