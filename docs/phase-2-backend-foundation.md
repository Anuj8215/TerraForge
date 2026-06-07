# Phase 2 — Backend Foundation

## What we built

Three PostgreSQL tables (Projects, Deployments, Resources), their SQLAlchemy ORM models, Pydantic schemas for validation, full CRUD REST API endpoints, and Alembic migrations to version the schema.

---

## Data Model

```
Project  ──< Deployment ──< Resource
  │                              │
  └──────────────────────────────┘
         (also direct FK)
```

A **Project** is the top-level entity — an isolated infrastructure environment (e.g., "prod-vpc", "staging-cluster").

A **Deployment** is one Terraform execution run against a project (plan / apply / destroy). A project can have many deployments over time.

A **Resource** is an individual AWS object created by a deployment (one EC2 instance, one S3 bucket, etc.). It has a direct FK to both its project and the deployment that created it.

---

## Files Created

```
backend/
├── app/
│   ├── models/
│   │   ├── __init__.py          ← exports all models + enums
│   │   ├── base.py              ← UUIDMixin + TimestampMixin
│   │   ├── project.py           ← Project model
│   │   ├── deployment.py        ← Deployment model
│   │   └── resource.py          ← Resource model
│   ├── schemas/
│   │   ├── __init__.py          ← exports all schemas
│   │   ├── project.py           ← ProjectCreate / Update / Response
│   │   ├── deployment.py        ← DeploymentCreate / StatusUpdate / Response
│   │   └── resource.py          ← ResourceCreate / StatusUpdate / Response
│   └── api/
│       ├── __init__.py          ← registers all 4 routers
│       ├── projects.py          ← POST/GET/PUT/DELETE /projects
│       ├── deployments.py       ← POST/GET/PATCH/DELETE /deployments
│       └── resources.py         ← POST/GET/PATCH/DELETE /resources
└── alembic/
    ├── env.py                   ← async-aware migration runner
    ├── script.py.mako           ← template for new migration files
    └── versions/
        └── 001_initial_schema.py ← creates all 3 tables + indexes
```

---

## Key Concepts

### Mixins (`models/base.py`)

```python
class UUIDMixin:
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=utcnow)
```

Instead of repeating `id`, `created_at`, `updated_at` in every model, we define them once as mixins and inherit. Python MRO (Method Resolution Order) merges them cleanly.

**Why UUID over integer ID?** UUIDs are globally unique — safe to generate client-side, safe to expose in URLs, no sequential enumeration attack.

---

### Enums in SQLAlchemy

```python
class ProjectStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    archived = "archived"
```

`str, enum.Enum` makes the enum JSON-serializable by default (Pydantic and FastAPI can use it directly). SQLAlchemy stores the string value in a Postgres `ENUM` type column.

---

### ORM Relationships + Cascade Delete

```python
# Project model
deployments: Mapped[list["Deployment"]] = relationship(
    "Deployment", back_populates="project", cascade="all, delete-orphan"
)
```

`cascade="all, delete-orphan"` means: when a Project is deleted, SQLAlchemy automatically deletes all its Deployments and Resources. This mirrors the `ondelete="CASCADE"` set on the FK — the DB enforces it at the SQL level too (belt and suspenders).

`back_populates` is the two-way link: `project.deployments` and `deployment.project` stay in sync within the same session.

---

### Pydantic Schemas — Why Separate from Models?

```
ORM Model (SQLAlchemy)  ←→  Database
Pydantic Schema         ←→  API request/response
```

They serve different purposes:
- **ORM models** map to database columns, have relationships, lazy-loading etc.
- **Pydantic schemas** validate incoming JSON and shape outgoing JSON. They can omit sensitive fields, rename fields, or add computed fields — without touching the DB layer.

`model_config = {"from_attributes": True}` tells Pydantic to read attributes from SQLAlchemy model instances (not just dicts).

---

### CRUD Pattern

Every router follows the same 5-operation pattern:

| Method   | Path                    | Action                        |
|----------|-------------------------|-------------------------------|
| `POST`   | `/projects`             | Create — returns 201          |
| `GET`    | `/projects`             | List — paginated, with total  |
| `GET`    | `/projects/{id}`        | Get one — 404 if missing      |
| `PUT`    | `/projects/{id}`        | Full update                   |
| `DELETE` | `/projects/{id}`        | Delete — returns 204 No Content |

**Why 204 on delete?** There's nothing to return — the resource is gone. Returning 200 with an empty body is technically valid but misleading.

**Why `exclude_none=True` in updates?**
```python
for field, value in payload.model_dump(exclude_none=True).items():
    setattr(project, field, value)
```
This implements a **partial update** — only fields explicitly sent by the client are updated. Fields left as `None` in the Pydantic schema are skipped entirely, so you can't accidentally null out a field by omitting it.

---

### Pagination

```python
@router.get("", response_model=ProjectListResponse)
async def list_projects(skip: int = 0, limit: int = 20, db: ...):
    total = (await db.execute(select(func.count()).select_from(Project))).scalar()
    result = await db.execute(select(Project).offset(skip).limit(limit))
```

`skip` + `limit` is offset-based pagination. The response always includes `total` so the frontend can render page counts without a second request.

---

### Alembic — Why It Exists

`Base.metadata.create_all()` (what we use in development lifespan) is destructive in production — it doesn't modify existing tables, only creates missing ones. Alembic generates **versioned migration scripts** that can:
- Add a column to an existing table
- Rename a column safely
- Roll back (`downgrade`) if a release goes wrong

```bash
# generate a new migration after changing a model
alembic revision --autogenerate -m "add_tags_column_to_projects"

# apply all pending migrations
alembic upgrade head

# roll back one migration
alembic downgrade -1
```

**`env.py` async setup** — Alembic was originally synchronous. We use `asyncio.run(run_migrations_online())` with `async_engine_from_config` to make it work with our async SQLAlchemy engine.

---

## API Endpoints Summary

| Method   | Endpoint                          | Description                      |
|----------|-----------------------------------|----------------------------------|
| POST     | `/api/v1/projects`                | Create project                   |
| GET      | `/api/v1/projects`                | List projects (paginated)        |
| GET      | `/api/v1/projects/{id}`           | Get project by ID                |
| PUT      | `/api/v1/projects/{id}`           | Update project                   |
| DELETE   | `/api/v1/projects/{id}`           | Delete project (cascades)        |
| POST     | `/api/v1/deployments`             | Create deployment                |
| GET      | `/api/v1/deployments`             | List deployments (filter by project) |
| GET      | `/api/v1/deployments/{id}`        | Get deployment + logs            |
| PATCH    | `/api/v1/deployments/{id}/status` | Update deployment status/logs    |
| DELETE   | `/api/v1/deployments/{id}`        | Delete deployment                |
| POST     | `/api/v1/resources`               | Create resource                  |
| GET      | `/api/v1/resources`               | List resources (filter by project/deployment) |
| GET      | `/api/v1/resources/{id}`          | Get resource                     |
| PATCH    | `/api/v1/resources/{id}/status`   | Update resource status           |
| DELETE   | `/api/v1/resources/{id}`          | Delete resource                  |

---

## How to Run Migrations

```bash
# inside the api container
docker compose exec api alembic upgrade head

# or locally (with DB accessible)
cd backend
alembic upgrade head

# check current state
alembic current

# generate migration from model changes
alembic revision --autogenerate -m "describe_change"
```

---

## Interview Talking Points

**Q: Why SQLAlchemy over raw SQL or a simpler ORM like Tortoise?**
SQLAlchemy has the most mature async support (`asyncpg` driver), the best tooling (Alembic), and is production-battle-tested. The Mapped / mapped_column API (SQLAlchemy 2.0) gives you full type checking at IDE level.

**Q: What's the difference between `PUT` and `PATCH`?**
`PUT` replaces the entire resource. `PATCH` applies a partial update. We use `PUT` for projects (full update) and `PATCH /status` for deployments/resources because status transitions are the only field updated by the Terraform engine — we don't want it accidentally overwriting logs.

**Q: Why are Deployment status updates a separate endpoint (`PATCH /status`) instead of part of the main `PUT`?**
The Terraform engine (Phase 3) is the only thing that should update deployment status and logs. Separating it makes the API self-documenting — a human updating a project name goes to `PUT /projects/{id}`, the Terraform worker goes to `PATCH /deployments/{id}/status`. Separation of concerns in the API surface.

**Q: How does cascade delete work end-to-end?**
Two layers: (1) PostgreSQL `ON DELETE CASCADE` on the foreign key — if a project row is deleted, the DB deletes all deployment and resource rows automatically. (2) SQLAlchemy `cascade="all, delete-orphan"` — if you delete a project object within an active session before committing, SQLAlchemy issues the child DELETEs itself. Both exist because the SQLAlchemy cascade fires within a session, while the DB constraint protects against deletes issued outside the ORM (e.g., raw SQL, migrations).

---

## What's Next — Phase 3

Build the Terraform Engine: a Python service that generates `.tf` HCL files from a project's config, then executes `terraform init → plan → apply` as subprocesses, streams logs back to the API in real time, and updates deployment status automatically.
