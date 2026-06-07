import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.deployment import Deployment, DeploymentStatus
from app.models.project import Project
from app.services.terraform.workspace import WorkspaceManager
from app.services.terraform.generator import generate_hcl
from app.services.terraform import executor
from app.core.vault import get_vault_client
from app.services.vault.secrets import read_secrets


def _build_aws_env(secrets: dict, region: str) -> dict:
    env = {"AWS_DEFAULT_REGION": region}
    if secrets.get("aws_access_key_id"):
        env["AWS_ACCESS_KEY_ID"] = secrets["aws_access_key_id"]
    if secrets.get("aws_secret_access_key"):
        env["AWS_SECRET_ACCESS_KEY"] = secrets["aws_secret_access_key"]
    if secrets.get("aws_session_token"):
        env["AWS_SESSION_TOKEN"] = secrets["aws_session_token"]
    return env


async def _update_deployment(
    db: AsyncSession,
    deployment_id: uuid.UUID,
    status: DeploymentStatus,
    logs: str,
    plan_output: str | None = None,
    error_message: str | None = None,
) -> None:
    result = await db.execute(select(Deployment).where(Deployment.id == deployment_id))
    deployment = result.scalar_one_or_none()
    if not deployment:
        return
    deployment.status = status
    deployment.logs = logs
    if plan_output is not None:
        deployment.plan_output = plan_output
    if error_message is not None:
        deployment.error_message = error_message
    await db.commit()


def _get_aws_env(project: Project) -> dict:
    try:
        client = get_vault_client()
        secrets = read_secrets(client, project.id)
        return _build_aws_env(secrets, project.region)
    except Exception:
        return {"AWS_DEFAULT_REGION": project.region}


async def run_plan(
    db: AsyncSession,
    deployment_id: uuid.UUID,
    project: Project,
    resources: list[dict],
) -> None:
    workspace = WorkspaceManager(project.id)
    workspace.setup()
    aws_env = _get_aws_env(project)

    hcl = generate_hcl(project.provider.value, project.region, project.name, resources)
    workspace.write_main_tf(hcl)

    await _update_deployment(db, deployment_id, DeploymentStatus.running, "Running terraform init...")

    rc, output = await executor.terraform_init(workspace.path, aws_env)
    if rc != 0:
        await _update_deployment(db, deployment_id, DeploymentStatus.failed, output, error_message=output)
        return

    init_logs = output
    await _update_deployment(db, deployment_id, DeploymentStatus.running, init_logs + "\nRunning terraform plan...")

    rc, output = await executor.terraform_plan(workspace.path, aws_env)
    full_logs = init_logs + "\n" + output
    if rc != 0:
        await _update_deployment(db, deployment_id, DeploymentStatus.failed, full_logs, error_message=output)
        return

    await _update_deployment(db, deployment_id, DeploymentStatus.success, full_logs, plan_output=output)


async def run_apply(
    db: AsyncSession,
    deployment_id: uuid.UUID,
    project: Project,
    resources: list[dict],
) -> None:
    workspace = WorkspaceManager(project.id)
    workspace.setup()
    aws_env = _get_aws_env(project)

    hcl = generate_hcl(project.provider.value, project.region, project.name, resources)
    workspace.write_main_tf(hcl)

    await _update_deployment(db, deployment_id, DeploymentStatus.running, "Running terraform init...")

    rc, output = await executor.terraform_init(workspace.path, aws_env)
    if rc != 0:
        await _update_deployment(db, deployment_id, DeploymentStatus.failed, output, error_message=output)
        return

    all_logs = output + "\nRunning terraform plan...\n"
    await _update_deployment(db, deployment_id, DeploymentStatus.running, all_logs)

    rc, plan_out = await executor.terraform_plan(workspace.path, aws_env)
    all_logs += plan_out
    if rc != 0:
        await _update_deployment(db, deployment_id, DeploymentStatus.failed, all_logs, error_message=plan_out)
        return

    all_logs += "\nRunning terraform apply...\n"
    await _update_deployment(db, deployment_id, DeploymentStatus.running, all_logs, plan_output=plan_out)

    rc, apply_out = await executor.terraform_apply(workspace.path, aws_env)
    all_logs += apply_out
    if rc != 0:
        await _update_deployment(db, deployment_id, DeploymentStatus.failed, all_logs, error_message=apply_out)
        return

    await _update_deployment(db, deployment_id, DeploymentStatus.success, all_logs, plan_output=plan_out)


async def run_destroy(
    db: AsyncSession,
    deployment_id: uuid.UUID,
    project: Project,
) -> None:
    workspace = WorkspaceManager(project.id)

    if not workspace.exists():
        await _update_deployment(
            db, deployment_id, DeploymentStatus.failed,
            "Workspace not found — nothing to destroy.",
            error_message="No workspace directory found for this project.",
        )
        return

    aws_env = _get_aws_env(project)
    await _update_deployment(db, deployment_id, DeploymentStatus.running, "Running terraform destroy...")

    rc, output = await executor.terraform_destroy(workspace.path, aws_env)
    if rc != 0:
        await _update_deployment(db, deployment_id, DeploymentStatus.failed, output, error_message=output)
        return

    await _update_deployment(db, deployment_id, DeploymentStatus.success, output)
