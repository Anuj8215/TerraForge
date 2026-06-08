import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.variable import VariableType


class VariableCreate(BaseModel):
    name: str
    type: VariableType = VariableType.string
    description: str | None = None
    default_value: str | None = None
    validation_condition: str | None = None
    validation_message: str | None = None
    is_sensitive: bool = False
    environment: str | None = None

    @field_validator("name")
    @classmethod
    def name_valid(cls, v: str) -> str:
        v = v.strip()
        if not v or " " in v:
            raise ValueError("Variable name must be non-empty with no spaces")
        return v.lower()


class VariableUpdate(BaseModel):
    description: str | None = None
    default_value: str | None = None
    validation_condition: str | None = None
    validation_message: str | None = None
    is_sensitive: bool | None = None
    environment: str | None = None


class VariableResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    type: VariableType
    description: str | None
    default_value: str | None
    validation_condition: str | None
    validation_message: str | None
    is_sensitive: bool
    environment: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VariableListResponse(BaseModel):
    total: int
    items: list[VariableResponse]
