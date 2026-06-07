# Phase 3 — Terraform Engine

## What we built

A Python service that dynamically generates Terraform HCL from JSON config, then executes the full Terraform lifecycle (init → plan → apply / destroy) as async subprocesses — all triggered via REST API endpoints.

---

## Architecture

```
API Request
    │
    ▼
api/terraform.py       ← FastAPI endpoints (plan / apply / destroy)
    │  Creates Deployment record (status=pending)
    │  Dispatches to BackgroundTasks
    ▼
services/terraform/engine.py    ← Orchestrator
    │  1. Sets up workspace directory
    │  2. Generates HCL via generator.py
    │  3. Calls executor functions in sequence
    │  4. Updates deployment status/logs after each step
    ▼
services/terraform/
    ├── workspace.py   ← Manages /terraform/workspaces/{project_id}/
    ├── generator.py   ← Builds HCL string from resource configs
    ├── executor.py    ← Runs terraform CLI via asyncio subprocess
    └── modules/
        ├── ec2.py     ← HCL generator for aws_instance
        ├── s3.py      ← HCL generator for aws_s3_bucket
        └── vpc.py     ← HCL generator for aws_vpc + subnets
```

---

## Files Created

```
backend/app/
├── schemas/terraform.py              ← TerraformPlanRequest, ApplyRequest, DestroyRequest
├── api/terraform.py                  ← POST /terraform/plan, /apply, /destroy + workspace GET
└── services/terraform/
    ├── workspace.py
    ├── generator.py
    ├── executor.py
    ├── engine.py
    └── modules/
        ├── __init__.py               ← GENERATORS registry dict
        ├── ec2.py
        ├── s3.py
        └── vpc.py
```

---

## Key Concepts

### WorkspaceManager (`workspace.py`)

Each project gets a **dedicated directory** on disk:

```
/terraform/workspaces/
└── {project_id}/
    ├── main.tf          ← generated HCL
    ├── tfplan           ← saved plan output (binary)
    ├── terraform.tfstate
    └── .terraform/      ← provider plugins (git-ignored)
```

**Why per-project isolation?** Terraform state is stored in `terraform.tfstate` — if two projects shared a workspace, applying one would overwrite the other's state. Each project must have its own directory.

---

### HCL Generator (`generator.py` + `modules/`)

The generator follows the **strategy pattern** — a registry maps resource type strings to generator functions:

```python
GENERATORS = {
    "ec2": ec2.generate,
    "s3": s3.generate,
    "vpc": vpc.generate,
}
```

Given this JSON input:
```json
{
  "type": "ec2",
  "name": "web_server",
  "config": { "instance_type": "t3.micro", "ami": "ami-0c55b159cbfafe1f0" }
}
```

The generator produces:
```hcl
resource "aws_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  ...
  tags = {
    Name      = "web_server"
    Project   = "my-project"
    ManagedBy = "TerraForge"
  }
}
```

Adding a new AWS service in future phases just requires adding a new module file and registering it in `GENERATORS` — the rest of the code is untouched (Open/Closed Principle).

---

### Async Executor (`executor.py`)

```python
async def run_command(cmd: list[str], cwd: Path) -> tuple[int, str]:
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=str(cwd),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        env=env,
    )
    stdout, _ = await proc.communicate()
    return proc.returncode, stdout.decode()
```

**Why `asyncio.create_subprocess_exec` instead of `subprocess.run`?**
FastAPI runs on an async event loop. `subprocess.run` is blocking — it would freeze the entire event loop while Terraform runs (potentially minutes). `asyncio.create_subprocess_exec` suspends the coroutine and lets other requests be handled while waiting.

**`stderr=asyncio.subprocess.STDOUT`** merges stderr into stdout so all output (including error messages) is captured in one stream.

**`TF_IN_AUTOMATION=1`** disables Terraform's interactive prompts and color codes, making logs machine-readable.

---

### Engine Orchestrator (`engine.py`)

```python
async def run_apply(db, deployment_id, project, resources):
    # 1. Setup workspace
    workspace = WorkspaceManager(project.id)
    workspace.setup()

    # 2. Write HCL
    hcl = generate_hcl(project.provider.value, project.region, project.name, resources)
    workspace.write_main_tf(hcl)

    # 3. init → plan → apply, updating deployment at each step
    await _update_deployment(db, deployment_id, DeploymentStatus.running, "Running terraform init...")
    rc, output = await executor.terraform_init(workspace.path)
    if rc != 0:
        await _update_deployment(db, deployment_id, DeploymentStatus.failed, output)
        return
    ...
```

The engine updates the deployment record after **every step** — if `init` fails, the logs show why. The frontend can poll `GET /deployments/{id}` to track progress.

---

### BackgroundTasks — Why We Use It

```python
@router.post("/apply", status_code=202)
async def apply(payload, background_tasks: BackgroundTasks, db = Depends(get_db)):
    deployment = await _create_deployment(db, project.id, DeploymentAction.apply)
    background_tasks.add_task(engine.run_apply, db, deployment.id, project, resources)
    return deployment  # returns immediately with status=pending
```

Terraform `apply` can take **minutes**. We return HTTP **202 Accepted** immediately with the deployment record (`status=pending`). The actual terraform execution runs in the background. The frontend polls `GET /api/v1/deployments/{id}` to check status and fetch logs.

**Status 202 vs 200:** 202 means "request accepted, processing async." 200 would imply it's already done.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/terraform/plan` | Generate plan, returns deployment (status=pending → running → success/failed) |
| POST | `/api/v1/terraform/apply` | Apply infrastructure, same flow |
| POST | `/api/v1/terraform/destroy` | Destroy infrastructure |
| GET | `/api/v1/terraform/workspace/{project_id}` | Get workspace info + current HCL |
| GET | `/api/v1/terraform/preview/{project_id}` | Preview generated HCL without executing |

### Example request — apply EC2 + S3:
```json
POST /api/v1/terraform/apply
{
  "project_id": "uuid-here",
  "resources": [
    { "type": "ec2", "name": "web_server", "config": { "instance_type": "t3.micro" } },
    { "type": "s3", "name": "assets", "config": { "versioning": true } }
  ]
}
```

---

## Interview Talking Points

**Q: Why generate HCL dynamically instead of using Terraform Cloud or CDK?**
We own the full workflow — no SaaS dependency, no cost-per-run pricing, no API rate limits. The generated `.tf` files are plain text that any Terraform user can read, audit, and modify. CDK compiles to JSON/YAML with abstracted constructs — harder to debug.

**Q: How do you prevent two deployments from running on the same project simultaneously?**
Currently we don't enforce this at the API level — that's Phase 9 (a distributed lock via Redis or a DB-level constraint checking for `status=running`). The workspace isolation prevents data corruption, but concurrent runs would still produce unpredictable state.

**Q: Why not use the Terraform Go SDK / TFC API instead of subprocess?**
The Go SDK requires a CGo build. TFC API requires a Terraform Cloud account. Using the CLI as a subprocess works with any Terraform version, is easy to test (just mock the subprocess), and keeps the runtime portable — it's the same approach used by Atlantis and Spacelift internally.

**Q: Where is Terraform state stored?**
Currently local (`terraform.tfstate` in the workspace). In production you would configure a remote backend (S3 + DynamoDB for locking) in the generated `main.tf`. That's Phase 8 (variable/backend management).

---

## What's Next — Phase 4

Build the React frontend shell: sidebar navigation, project CRUD UI, deployment list, and a live log viewer that polls the deployment API to show Terraform output in real time.
