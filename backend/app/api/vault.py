import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.vault import get_vault_client
from app.models.project import Project
from app.schemas.vault import SecretWrite, SecretResponse, ProjectSecretsResponse
from app.services.vault import secrets as vault_secrets

router = APIRouter(prefix="/secrets", tags=["secrets"])


async def _get_project_or_404(project_id: uuid.UUID, db: AsyncSession) -> Project:
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{project_id}", response_model=ProjectSecretsResponse)
async def list_secrets(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await _get_project_or_404(project_id, db)
    client = get_vault_client()
    raw = vault_secrets.read_secrets(client, project_id)
    items = [SecretResponse.from_kv(k, v) for k, v in raw.items()]
    return ProjectSecretsResponse(project_id=project_id, secrets=items, total=len(items))


@router.put("/{project_id}", response_model=ProjectSecretsResponse)
async def write_secret(project_id: uuid.UUID, payload: SecretWrite, db: AsyncSession = Depends(get_db)):
    await _get_project_or_404(project_id, db)
    client = get_vault_client()
    vault_secrets.write_secret(client, project_id, payload.key, payload.value)
    raw = vault_secrets.read_secrets(client, project_id)
    items = [SecretResponse.from_kv(k, v) for k, v in raw.items()]
    return ProjectSecretsResponse(project_id=project_id, secrets=items, total=len(items))


@router.delete("/{project_id}/{key}")
async def delete_secret(project_id: uuid.UUID, key: str, db: AsyncSession = Depends(get_db)):
    await _get_project_or_404(project_id, db)
    client = get_vault_client()
    deleted = vault_secrets.delete_secret(client, project_id, key)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Secret key '{key}' not found")
    return {"deleted": key}


@router.delete("/{project_id}")
async def delete_all_secrets(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await _get_project_or_404(project_id, db)
    client = get_vault_client()
    vault_secrets.delete_all_secrets(client, project_id)
    return {"message": f"All secrets for project {project_id} deleted"}
