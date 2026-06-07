import asyncio
import os
from pathlib import Path


async def run_command(
    cmd: list[str], cwd: Path, aws_env: dict | None = None
) -> tuple[int, str]:
    env = os.environ.copy()
    env["TF_IN_AUTOMATION"] = "1"
    env["TF_CLI_ARGS"] = "-no-color"
    if aws_env:
        env.update(aws_env)

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=str(cwd),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        env=env,
    )
    stdout, _ = await proc.communicate()
    return proc.returncode, stdout.decode("utf-8", errors="replace")


async def terraform_init(workspace_path: Path, aws_env: dict | None = None) -> tuple[int, str]:
    return await run_command(
        ["terraform", "init", "-input=false", "-upgrade"],
        workspace_path,
        aws_env,
    )


async def terraform_plan(workspace_path: Path, aws_env: dict | None = None) -> tuple[int, str]:
    return await run_command(
        ["terraform", "plan", "-input=false", "-out=tfplan"],
        workspace_path,
        aws_env,
    )


async def terraform_apply(workspace_path: Path, aws_env: dict | None = None) -> tuple[int, str]:
    return await run_command(
        ["terraform", "apply", "-input=false", "-auto-approve", "tfplan"],
        workspace_path,
        aws_env,
    )


async def terraform_destroy(workspace_path: Path, aws_env: dict | None = None) -> tuple[int, str]:
    return await run_command(
        ["terraform", "destroy", "-input=false", "-auto-approve"],
        workspace_path,
        aws_env,
    )


async def terraform_show(workspace_path: Path, aws_env: dict | None = None) -> tuple[int, str]:
    return await run_command(
        ["terraform", "show", "-json"],
        workspace_path,
        aws_env,
    )
