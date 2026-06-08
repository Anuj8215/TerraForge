import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateResponse, TemplateListResponse

router = APIRouter(prefix="/templates", tags=["templates"])


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(payload: TemplateCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Template).where(Template.name == payload.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Template name already exists")

    template = Template(**payload.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.get("", response_model=TemplateListResponse)
async def list_templates(
    provider: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    query = select(Template)
    count_query = select(func.count()).select_from(Template)

    if provider:
        query = query.where(Template.provider == provider)
        count_query = count_query.where(Template.provider == provider)

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(
        query.offset(skip).limit(limit).order_by(Template.is_builtin.desc(), Template.created_at.desc())
    )
    templates = result.scalars().all()
    return TemplateListResponse(total=total, items=templates)


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    template = await db.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    template = await db.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if template.is_builtin:
        raise HTTPException(status_code=403, detail="Built-in templates cannot be deleted")
    await db.delete(template)
    await db.commit()
