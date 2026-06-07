# Phase 1 — Project Scaffolding

## What we built

A fully wired monorepo skeleton: FastAPI backend, Vite + React frontend, PostgreSQL, HashiCorp Vault, and Redis — all orchestrated via Docker Compose.

---

## Folder Structure

```
TerraForge/
├── backend/
│   ├── app/
│   │   ├── api/          ← Route handlers (grouped by feature)
│   │   │   ├── __init__.py   ← Central APIRouter that registers all sub-routers
│   │   │   └── health.py     ← /health endpoints
│   │   ├── core/
│   │   │   ├── config.py     ← Pydantic Settings — reads from .env
│   │   │   └── database.py   ← Async SQLAlchemy engine + session factory
│   │   ├── models/       ← SQLAlchemy ORM models (Phase 2)
│   │   ├── schemas/      ← Pydantic request/response schemas (Phase 2)
│   │   ├── services/     ← Business logic: Terraform engine, Vault, AWS (Phase 3+)
│   │   └── main.py       ← FastAPI app entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.js    ← Axios instance with base URL + error interceptor
│   │   ├── pages/           ← Full-page components (Dashboard, NotFound)
│   │   ├── components/      ← Reusable UI components (Phase 4)
│   │   ├── store/index.js   ← Redux Toolkit store (slices added per phase)
│   │   ├── theme.js         ← MUI dark theme config
│   │   ├── App.jsx          ← React Router route definitions
│   │   └── main.jsx         ← ReactDOM entry — wraps with Provider + ThemeProvider
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
├── terraform/
│   └── workspaces/      ← Generated per-project .tf files live here (Phase 3)
├── docs/
├── docker-compose.yml
├── .env.example
└── .gitignore
```

---

## Key Files Explained

### `docker-compose.yml`

Defines 5 services on a shared bridge network (`terraforge_net`):

| Service    | Image                   | Port | Purpose                          |
|------------|-------------------------|------|----------------------------------|
| `api`      | Custom (backend/)       | 8000 | FastAPI app + Terraform CLI      |
| `frontend` | Custom (frontend/)      | 3000 | Vite dev server / React          |
| `db`       | postgres:15-alpine      | 5432 | Primary application database     |
| `vault`    | hashicorp/vault:1.15    | 8200 | Secrets management (dev mode)    |
| `redis`    | redis:7-alpine          | 6379 | Caching / task queuing (Phase 9) |

**Why a shared network?** Services communicate by container name (e.g., `db`, `vault`) instead of IPs, which are dynamic. The `api` container connects to `db:5432`, not `localhost:5432`.

**Why `depends_on` with healthcheck?** PostgreSQL takes a few seconds to be ready after the container starts. Without a healthcheck, the API would crash on boot trying to connect to an unavailable DB.

---

### `backend/Dockerfile`

Installs the Terraform CLI inside the Python container. This is the core of TerraForge — the API calls `terraform` as a subprocess, so it must live on the same container.

```dockerfile
RUN curl -fsSL https://releases.hashicorp.com/terraform/1.8.3/... | unzip → /usr/local/bin/terraform
```

---

### `backend/app/core/config.py`

Uses `pydantic-settings` to read environment variables and validate types at startup.

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str
    vault_addr: str = "http://vault:8200"
```

**Why pydantic-settings?** The app crashes at startup if a required env var is missing — fail fast is better than a runtime `KeyError` deep in the code.

---

### `backend/app/core/database.py`

```python
DATABASE_URL = settings.database_url.replace("postgresql://", "postgresql+asyncpg://")
engine = create_async_engine(DATABASE_URL, echo=True)
```

**Why async?** FastAPI is built on ASGI (async). Using `asyncpg` means DB queries don't block the event loop — the API can handle concurrent requests while waiting on the database.

**Why replace the scheme?** SQLAlchemy requires `postgresql+asyncpg://` for the async driver, but tools like `psql` and many hosting platforms give you `postgresql://`. We patch it programmatically so the env var stays standard.

---

### `backend/app/main.py`

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()
```

**Lifespan** replaces deprecated `@app.on_event("startup")`. On boot: runs `CREATE TABLE IF NOT EXISTS` for all models. On shutdown: closes the connection pool cleanly.

**CORS middleware** allows `http://localhost:3000` (the React dev server) to call the API. Without this, browsers block cross-origin requests.

---

### `frontend/src/main.jsx`

The React entry wraps the entire app in 4 providers (outermost → innermost):

1. `<Provider store={store}>` — Redux state available everywhere
2. `<BrowserRouter>` — React Router HTML5 history mode
3. `<ThemeProvider theme={theme}>` — MUI design tokens
4. `<CssBaseline />` — Resets browser default styles to match the MUI theme

---

### `frontend/vite.config.js`

```js
proxy: {
  "/api": { target: "http://api:8000", changeOrigin: true }
}
```

The Vite dev server proxies any `/api/*` request to the FastAPI container. The browser thinks everything is on `localhost:3000`, so CORS never fires during development.

---

### `frontend/src/api/client.js`

A single Axios instance shared across all API calls. The `baseURL: "/api/v1"` means every call like `apiClient.get("/health")` resolves to `/api/v1/health` → proxied to FastAPI.

The response interceptor logs errors centrally — one place to add auth token refresh logic in Phase 10.

---

## Interview Talking Points

**Q: Why FastAPI over Flask?**
FastAPI is async-native (ASGI), auto-generates OpenAPI docs at `/docs`, and uses Pydantic for request/response validation with zero boilerplate. Flask is WSGI (synchronous by default) and requires extensions for all of this.

**Q: Why Docker Compose instead of running services locally?**
Reproducibility. Any developer clones the repo and runs `docker compose up` — they get identical PostgreSQL version, Vault config, and Redis. No "works on my machine."

**Q: Why HashiCorp Vault in dev mode?**
Dev mode starts Vault unsealed with a known root token — perfect for development. In production you'd run Vault in server mode with auto-unseal (AWS KMS or GCP Cloud KMS).

**Q: Why is Terraform inside the API container?**
The backend needs to call `terraform plan` and `terraform apply` as subprocesses. Keeping Terraform in the same container avoids network calls and shared filesystem complexity. In a production system you'd likely use a dedicated worker container or Terraform Cloud API.

---

## How to Run

```bash
# 1. Copy env file
cp .env.example .env

# 2. Start all services
docker compose up --build

# 3. Verify
curl http://localhost:8000/api/v1/health
# → {"status":"ok","environment":"development","version":"1.0.0"}

# 4. Open React app
open http://localhost:3000

# 5. Open API docs
open http://localhost:8000/docs
```

---

## What's Next — Phase 2

Build the database models (Projects, Deployments, Resources) and full CRUD API endpoints so the frontend can create and track infrastructure deployments.
