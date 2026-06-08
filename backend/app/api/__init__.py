from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.projects import router as projects_router
from app.api.deployments import router as deployments_router
from app.api.resources import router as resources_router
from app.api.terraform import router as terraform_router
from app.api.vault import router as vault_router
from app.api.templates import router as templates_router
from app.api.variables import router as variables_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(projects_router)
api_router.include_router(deployments_router)
api_router.include_router(resources_router)
api_router.include_router(terraform_router)
api_router.include_router(vault_router)
api_router.include_router(templates_router)
api_router.include_router(variables_router)
