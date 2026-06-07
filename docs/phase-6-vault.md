# Phase 6 — HashiCorp Vault Integration

## What we built

End-to-end secret management: AWS credentials stored encrypted in HashiCorp Vault, fetched at runtime and injected as environment variables into every Terraform subprocess — never written to disk or committed to code.

---

## Architecture

```
Frontend Secrets Page
    │
    ▼
PUT /api/v1/secrets/{project_id}       ← write a secret
GET /api/v1/secrets/{project_id}       ← list (values masked for sensitive keys)
DELETE /api/v1/secrets/{project_id}/{key}
    │
    ▼
app/services/vault/secrets.py          ← hvac KV v2 read/write/delete
    │
    ▼
HashiCorp Vault (KV v2)
    └── terraforge/
        └── projects/{project_id}
            ├── aws_access_key_id
            ├── aws_secret_access_key
            └── custom_key

                    ↑ fetched at terraform run time
                    │
app/services/terraform/engine.py
    └── _get_aws_env(project) → { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, ... }
        └── passed to executor.run_command(env_override=aws_env)
            └── env vars injected into terraform subprocess
```

---

## Files Created / Modified

```
backend/
├── app/
│   ├── core/vault.py                  ← hvac client singleton (lru_cache)
│   ├── schemas/vault.py               ← SecretWrite, SecretResponse, ProjectSecretsResponse
│   ├── api/vault.py                   ← CRUD endpoints for secrets
│   └── services/
│       ├── vault/secrets.py           ← read/write/delete/list via hvac KV v2
│       └── terraform/
│           ├── engine.py              ← updated: _get_aws_env() + aws_env passed to all executor calls
│           └── executor.py            ← updated: aws_env param on all terraform_* functions

frontend/
├── src/
│   ├── api/vault.js                   ← API wrappers
│   ├── store/slices/vaultSlice.js     ← Redux slice: fetch/write/delete
│   ├── store/index.js                 ← added vaultReducer
│   ├── pages/Secrets.jsx              ← secrets management UI with presets
│   ├── pages/ProjectDetail.jsx        ← added "Secrets" button
│   ├── App.jsx                        ← added /projects/:id/secrets route
│   └── components/Layout/Sidebar.jsx  ← added Secrets nav item
```

---

## Key Concepts

### Vault KV v2 — Why Version 2?

KV v2 adds **versioned secrets** — every write creates a new version, and you can roll back to a previous value. It also separates **metadata** (version history, creation time) from **data** (the actual secret values). KV v1 is simpler but has no versioning.

```
terraforge/          ← custom mount point we enable on startup
└── projects/
    └── {project_id}  ← one path per project, stores all secrets as a JSON object
        {
          "aws_access_key_id": "AKIA...",
          "aws_secret_access_key": "wJal..."
        }
```

All of a project's secrets live under **one path** rather than one path per secret. This means one API call to Vault reads all credentials at once, which is faster than N calls before each terraform run.

---

### Vault Client Singleton (`core/vault.py`)

```python
@lru_cache(maxsize=1)
def get_vault_client() -> hvac.Client:
    client = hvac.Client(url=settings.vault_addr, token=settings.vault_root_token)
    client.sys.enable_secrets_engine(backend_type="kv", path="terraforge", options={"version": "2"})
    return client
```

`@lru_cache(maxsize=1)` makes this a **singleton** — the client is created once and reused. The `enable_secrets_engine` call is idempotent (Vault ignores it if the mount already exists), so it's safe to call on every startup.

**Why a singleton?** Creating an `hvac.Client` on every request would open a new HTTP connection to Vault each time. A singleton reuses the same client and its connection pool.

---

### Secrets Service (`services/vault/secrets.py`)

```python
def write_secret(client, project_id, key, value):
    path = f"projects/{project_id}"
    try:
        existing = client.secrets.kv.v2.read_secret_version(path=path, mount_point=MOUNT)
        data = existing["data"]["data"]
    except InvalidPath:
        data = {}
    data[key] = value
    client.secrets.kv.v2.create_or_update_secret(path=path, secret=data, mount_point=MOUNT)
```

**Read-modify-write pattern** — we read the existing secrets first, add/update the new key, and write the whole object back. This is necessary because KV v2's `create_or_update_secret` **replaces the entire secret** — if we only sent `{ "aws_secret_access_key": "..." }` we'd delete all other keys.

---

### Sensitive Key Masking (`schemas/vault.py`)

```python
SENSITIVE_KEYS = {"aws_secret_access_key", "db_password", "api_key", "token"}

@classmethod
def from_kv(cls, key: str, value: str) -> "SecretResponse":
    masked = "••••••••" if key in SENSITIVE_KEYS else value
    return cls(key=key, value=masked, is_sensitive=key in SENSITIVE_KEYS)
```

The raw secret value is **never sent to the frontend** for sensitive keys. The `GET /secrets/{project_id}` endpoint returns `"••••••••"` for anything in `SENSITIVE_KEYS`. The real value remains in Vault — only the Terraform subprocess can access it via environment variable injection.

---

### Vault → Terraform Injection (`engine.py`)

```python
def _get_aws_env(project: Project) -> dict:
    try:
        client = get_vault_client()
        secrets = read_secrets(client, project.id)
        return _build_aws_env(secrets, project.region)
    except Exception:
        return {"AWS_DEFAULT_REGION": project.region}

def _build_aws_env(secrets, region):
    env = {"AWS_DEFAULT_REGION": region}
    if secrets.get("aws_access_key_id"):
        env["AWS_ACCESS_KEY_ID"] = secrets["aws_access_key_id"]
    if secrets.get("aws_secret_access_key"):
        env["AWS_SECRET_ACCESS_KEY"] = secrets["aws_secret_access_key"]
    return env
```

The `try/except` makes Vault optional — if Vault is unavailable, the engine falls back to the OS environment (which may have AWS credentials from `~/.aws/credentials` or instance profile). This is important: terraform can still run if Vault is down.

The env dict is passed to `asyncio.create_subprocess_exec` and **exists only in memory for the duration of the subprocess**. The credentials are never written to disk (not in `main.tf`, not in logs — logs only show terraform output which doesn't echo env vars).

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/secrets/{project_id}` | List keys (sensitive values masked) |
| PUT | `/api/v1/secrets/{project_id}` | Write/update a key-value pair |
| DELETE | `/api/v1/secrets/{project_id}/{key}` | Delete one key |
| DELETE | `/api/v1/secrets/{project_id}` | Delete all secrets for a project |

### Example
```json
PUT /api/v1/secrets/{project_id}
{ "key": "aws_access_key_id", "value": "AKIAIOSFODNN7EXAMPLE" }

GET /api/v1/secrets/{project_id}
→ {
    "project_id": "...",
    "secrets": [
      { "key": "aws_access_key_id", "value": "AKIAIOSFODNN7EXAMPLE", "is_sensitive": false },
      { "key": "aws_secret_access_key", "value": "••••••••", "is_sensitive": true }
    ],
    "total": 2
  }
```

---

## Frontend — Secrets Page

Located at `/projects/{id}/secrets`:
- **AWS Credential Shortcuts** — one-click chips to pre-fill the form key with `aws_access_key_id`, `aws_secret_access_key`, or `aws_session_token`
- **Sensitive masking** — `aws_secret_access_key` shows `VisibilityOff` icon + masked value
- **Password input** — the value field uses `type="password"` so the value isn't visible while typing
- **Redux state keyed by project ID** — `secretsByProject[projectId]` so switching between projects doesn't show stale data

---

## Interview Talking Points

**Q: Why Vault instead of AWS Secrets Manager or environment variables?**
Vault is provider-agnostic — it works the same whether you're deploying to AWS, Azure, or GCP. AWS Secrets Manager only works with AWS and costs per secret. Environment variables are visible in `ps aux` output and docker inspect. Vault provides a proper audit log, fine-grained policies, and secret versioning that env vars can't match.

**Q: How do the AWS credentials reach Terraform without being in the .tf files?**
The Terraform AWS provider reads credentials from environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) automatically — that's documented AWS provider behavior. We never put credentials in the HCL. The Python engine fetches the secrets from Vault just before spawning the subprocess, injects them into the subprocess environment, and they disappear when the process exits.

**Q: What happens if a user deletes a secret before a deployment finishes?**
The `_get_aws_env` call happens at the start of `run_plan`/`run_apply` — before `terraform init` is called. If the secret is deleted after that point, the subprocess still has the env var in its process memory for the duration of the run. The next run would fail if credentials are missing.

**Q: Why is Vault running in dev mode?**
Dev mode starts Vault unsealed with a known root token — correct for development where you want zero setup friction. In production, Vault runs in server mode, is sealed at startup, and unsealed via an auto-unseal mechanism (AWS KMS is the most common). The root token is never used in production — instead you create policies and roles with minimum required permissions.

**Q: Why mask values in the API response but not delete them entirely?**
The frontend needs to know whether a key exists (to show it in the table) but doesn't need to show the raw secret. Returning `"••••••••"` lets users see what's configured without exposing the value. Deleting the key entirely from the response would make the UI unable to show which secrets are set.

---

## What's Next — Phase 7

Multi-provider and multi-region support: provider aliases in generated HCL for cross-region deployments, region selector per resource in the UI, and stub support for Azure and GCP providers.
