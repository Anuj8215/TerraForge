import asyncio
import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.project import Project
from app.models.deployment import Deployment, DeploymentAction, DeploymentStatus
from app.schemas.terraform import (
    TerraformPlanRequest,
    TerraformApplyRequest,
    TerraformDestroyRequest,
    WorkspaceInfo,
)
from app.schemas.deployment import DeploymentResponse
from app.services.terraform import engine
from app.services.terraform.workspace import WorkspaceManager
from app.services.terraform.generator import generate_hcl

router = APIRouter(prefix="/terraform", tags=["terraform"])


async def _get_project_or_404(project_id: uuid.UUID, db: AsyncSession) -> Project:
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


async def _create_deployment(db: AsyncSession, project_id: uuid.UUID, action: DeploymentAction) -> Deployment:
    deployment = Deployment(project_id=project_id, action=action, status=DeploymentStatus.pending)
    db.add(deployment)
    await db.commit()
    await db.refresh(deployment)
    return deployment


@router.post("/plan", response_model=DeploymentResponse, status_code=202)
async def plan(
    payload: TerraformPlanRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    project = await _get_project_or_404(payload.project_id, db)
    deployment = await _create_deployment(db, project.id, DeploymentAction.plan)
    resources = [r.model_dump() for r in payload.resources]

    background_tasks.add_task(engine.run_plan, db, deployment.id, project, resources)
    return deployment


@router.post("/apply", response_model=DeploymentResponse, status_code=202)
async def apply(
    payload: TerraformApplyRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    project = await _get_project_or_404(payload.project_id, db)
    deployment = await _create_deployment(db, project.id, DeploymentAction.apply)
    resources = [r.model_dump() for r in payload.resources]

    background_tasks.add_task(engine.run_apply, db, deployment.id, project, resources)
    return deployment


@router.post("/destroy", response_model=DeploymentResponse, status_code=202)
async def destroy(
    payload: TerraformDestroyRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    project = await _get_project_or_404(payload.project_id, db)
    deployment = await _create_deployment(db, project.id, DeploymentAction.destroy)

    background_tasks.add_task(engine.run_destroy, db, deployment.id, project)
    return deployment


@router.get("/workspace/{project_id}", response_model=WorkspaceInfo)
async def get_workspace(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    project = await _get_project_or_404(project_id, db)
    workspace = WorkspaceManager(project.id)
    return WorkspaceInfo(
        project_id=project.id,
        exists=workspace.exists(),
        has_state=workspace.has_state(),
        generated_hcl=workspace.read_main_tf(),
    )


@router.get("/preview/{project_id}")
async def preview_hcl(
    project_id: uuid.UUID,
    resource_types: str = "ec2,s3",
    db: AsyncSession = Depends(get_db),
):
    project = await _get_project_or_404(project_id, db)
    sample_resources = []
    for rt in resource_types.split(","):
        sample_resources.append({"type": rt.strip(), "name": f"sample_{rt.strip()}", "config": {}})

    hcl = generate_hcl(project.provider.value, project.region, project.name, sample_resources)
    return {"hcl": hcl}
