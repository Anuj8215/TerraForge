import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.project import CloudProvider


class TemplateCreate(BaseModel):
    name: str
    description: str | None = None
    provider: CloudProvider = CloudProvider.aws
    region: str = "us-east-1"
    resources: list[dict]
    tags: list[str] = []

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Template name cannot be empty")
        return v.strip()

    @field_validator("resources")
    @classmethod
    def resources_not_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("Template must contain at least one resource")
        return v


class TemplateResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    provider: CloudProvider
    region: str
    resources: list[dict]
    tags: list[str]
    is_builtin: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TemplateListResponse(BaseModel):
    total: int
    items: list[TemplateResponse]
