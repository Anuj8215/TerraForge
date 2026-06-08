import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.variable import Variable
from app.models.project import Project
from app.schemas.variable import VariableCreate, VariableUpdate, VariableResponse, VariableListResponse

router = APIRouter(prefix="/variables", tags=["variables"])


async def _get_project_or_404(project_id: uuid.UUID, db: AsyncSession) -> Project:
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/{project_id}", response_model=VariableResponse, status_code=status.HTTP_201_CREATED)
async def create_variable(
    project_id: uuid.UUID,
    payload: VariableCreate,
    db: AsyncSession = Depends(get_db),
):
    await _get_project_or_404(project_id, db)

    existing = await db.execute(
        select(Variable).where(Variable.project_id == project_id, Variable.name == payload.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Variable '{payload.name}' already exists")

    variable = Variable(project_id=project_id, **payload.model_dump())
    db.add(variable)
    await db.commit()
    await db.refresh(variable)
    return variable


@router.get("/{project_id}", response_model=VariableListResponse)
async def list_variables(
    project_id: uuid.UUID,
    environment: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    await _get_project_or_404(project_id, db)

    query = select(Variable).where(Variable.project_id == project_id)
    if environment:
        query = query.where(Variable.environment == environment)

    total_result = await db.execute(
        select(func.count()).select_from(Variable).where(Variable.project_id == project_id)
    )
    result = await db.execute(query.order_by(Variable.name))
    variables = result.scalars().all()
    return VariableListResponse(total=total_result.scalar(), items=variables)


@router.put("/{project_id}/{variable_id}", response_model=VariableResponse)
async def update_variable(
    project_id: uuid.UUID,
    variable_id: uuid.UUID,
    payload: VariableUpdate,
    db: AsyncSession = Depends(get_db),
):
    variable = await db.get(Variable, variable_id)
    if not variable or variable.project_id != project_id:
        raise HTTPException(status_code=404, detail="Variable not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(variable, field, value)

    await db.commit()
    await db.refresh(variable)
    return variable


@router.delete("/{project_id}/{variable_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_variable(
    project_id: uuid.UUID,
    variable_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    variable = await db.get(Variable, variable_id)
    if not variable or variable.project_id != project_id:
        raise HTTPException(status_code=404, detail="Variable not found")
    await db.delete(variable)
    await db.commit()
