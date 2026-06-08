import asyncio
import os
from pathlib import Path
from typing import Callable, Awaitable


async def run_command(
    cmd: list[str],
    cwd: Path,
    aws_env: dict | None = None,
    on_line: Callable[[str], Awaitable[None]] | None = None,
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

    lines: list[str] = []
    async for raw in proc.stdout:
        line = raw.decode("utf-8", errors="replace")
        lines.append(line)
        if on_line:
            await on_line(line)

    await proc.wait()
    return proc.returncode, "".join(lines)


async def terraform_init(
    workspace_path: Path,
    aws_env: dict | None = None,
    on_line: Callable[[str], Awaitable[None]] | None = None,
) -> tuple[int, str]:
    return await run_command(
        ["terraform", "init", "-input=false", "-upgrade"],
        workspace_path,
        aws_env,
        on_line,
    )


async def terraform_plan(
    workspace_path: Path,
    aws_env: dict | None = None,
    on_line: Callable[[str], Awaitable[None]] | None = None,
) -> tuple[int, str]:
    return await run_command(
        ["terraform", "plan", "-input=false", "-out=tfplan"],
        workspace_path,
        aws_env,
        on_line,
    )


async def terraform_apply(
    workspace_path: Path,
    aws_env: dict | None = None,
    on_line: Callable[[str], Awaitable[None]] | None = None,
) -> tuple[int, str]:
    return await run_command(
        ["terraform", "apply", "-input=false", "-auto-approve", "tfplan"],
        workspace_path,
        aws_env,
        on_line,
    )


async def terraform_destroy(
    workspace_path: Path,
    aws_env: dict | None = None,
    on_line: Callable[[str], Awaitable[None]] | None = None,
) -> tuple[int, str]:
    return await run_command(
        ["terraform", "destroy", "-input=false", "-auto-approve"],
        workspace_path,
        aws_env,
        on_line,
    )


async def terraform_show(workspace_path: Path, aws_env: dict | None = None) -> tuple[int, str]:
    return await run_command(
        ["terraform", "show", "-json"],
        workspace_path,
        aws_env,
    )
