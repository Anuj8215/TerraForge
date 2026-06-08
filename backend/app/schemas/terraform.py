import uuid
from pydantic import BaseModel


class ResourceConfig(BaseModel):
    type: str
    name: str
    config: dict = {}
    region: str | None = None


class TerraformPlanRequest(BaseModel):
    project_id: uuid.UUID
    resources: list[ResourceConfig]


class TerraformApplyRequest(BaseModel):
    project_id: uuid.UUID
    resources: list[ResourceConfig]


class TerraformDestroyRequest(BaseModel):
    project_id: uuid.UUID


class WorkspaceInfo(BaseModel):
    project_id: uuid.UUID
    exists: bool
    has_state: bool
    generated_hcl: str | None = None
