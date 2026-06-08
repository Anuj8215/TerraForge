# Phase 9 — Monitoring, Real-time Logs & Cost Estimation

## What Was Built

### Backend
| File | Purpose |
|------|---------|
| `app/core/redis_client.py` | `get_redis()` singleton — `redis.asyncio` client from URL |
| `app/services/monitoring/cost.py` | Static pricing table + `estimate()` — per-resource monthly/annual USD estimates |
| `app/api/ws.py` | WebSocket endpoint `/ws/deployments/{id}/logs` — tails Redis list for live streaming |
| `app/api/metrics.py` | `GET /metrics` — deployment stats, project breakdown, activity by day; `POST /metrics/estimate` |
| `app/services/terraform/executor.py` | Added `on_line` callback to `run_command` + all wrappers — streams each stdout line as it arrives |
| `app/services/terraform/engine.py` | `_make_pusher()` creates a Redis RPUSH callback — wired into all run_plan/run_apply/run_destroy |

### Frontend
| File | Purpose |
|------|---------|
| `api/metrics.js` | Axios calls for `/metrics` and `/metrics/estimate` |
| `store/slices/metricsSlice.js` | Redux slice for metrics state |
| `pages/Dashboard.jsx` | Recharts BarChart (activity by day) + horizontal bar chart (projects by provider) |
| `pages/DeploymentDetail.jsx` | WebSocket-based live log streaming — "Live" chip, pulsing indicator, falls back to DB on close |
| `pages/Resources.jsx` | Resource inventory table — filter by project, navigate to deployment |
| `pages/NewDeployment.jsx` | Cost estimate panel in step 2 — `POST /metrics/estimate` fetched on Review transition |
| `vite.config.js` | Added `ws: true` to proxy — enables WebSocket upgrade proxying to API container |

---

## Architecture: Real-time Log Streaming

```
Background Task (engine.py)
  └─ run_plan() / run_apply()
       ├─ executor.terraform_init(on_line=push)   ← streams each line
       ├─ executor.terraform_plan(on_line=push)
       └─ push(line) → Redis RPUSH deployment:{id}:logs

WebSocket Endpoint (ws.py)
  └─ On connect:
       ├─ If terminal status → send DB logs, close
       └─ Else loop:
            ├─ Redis LRANGE key offset -1  → send new lines
            ├─ Poll Deployment.status from DB
            └─ If terminal → flush remaining lines, break

Browser (DeploymentDetail.jsx)
  └─ new WebSocket("/api/v1/ws/deployments/{id}/logs")
       ├─ onmessage → append to streamedLogs state
       └─ onclose → fetchDeployment for final status
```

---

## Architecture Decisions

### Why Redis list (RPUSH/LRANGE) instead of pub/sub for log streaming?
A Redis list is a **persistent, ordered, indexed** sequence. New WebSocket clients can read the full history from offset 0 before catching up to the tail. Pub/sub is fire-and-forget — any message published before the client subscribes is lost, making reconnection and page refresh unreliable.

### Why poll the Redis list in the WebSocket handler rather than using async blocking read?
`BLPOP` and `XREAD` are blocking commands that consume a dedicated connection. FastAPI's async WebSocket handlers share the event loop with request processing. A dedicated blocking connection per WebSocket would exhaust the Redis connection pool under load. Async polling (sleep 300ms between LRANGE calls) is non-blocking and horizontally scalable.

### Why generate cost estimates on the backend (`POST /metrics/estimate`) instead of client-side?
Centralizing the pricing table in the backend makes it easier to version, update, and eventually replace with real API calls (AWS Cost Explorer, Infracost). If the table were embedded in the frontend bundle, updating prices would require a new client deploy.

### Why use `on_line` callback in executor rather than an async generator?
Async generators with return values have awkward ergonomics in Python — `return value` is illegal inside an async generator. A callback keeps the same `(rc, output)` return signature, which all callers already depend on, while adding line-by-line emission as an optional side effect.

---

## Interview Q&A

### Q: How does TerraForge stream Terraform output to the browser in real time?
The subprocess uses `asyncio.create_subprocess_exec` with `stdout=PIPE`. The engine reads lines in an `async for` loop and calls an `on_line` async callback that does `redis.rpush(key, line)`. The WebSocket endpoint polls that Redis list with `LRANGE key offset -1` every 300ms and forwards new lines to the browser. The browser appends each chunk to a `useState` string.

### Q: What happens if the browser disconnects mid-deployment and reconnects?
On reconnect, the WebSocket handler checks `Deployment.status`. If still running, it reads from offset 0 of the Redis list — getting the full history — then continues tailing. The user sees all logs from the beginning. When the deployment finishes, the full log is also persisted in the DB (`deployment.logs`), so even if Redis keys expire, the history is recoverable.

### Q: Why does FastAPI support WebSockets without additional libraries?
FastAPI is built on Starlette, which natively implements the ASGI WebSocket protocol. `WebSocket` is a first-class Starlette type. FastAPI adds dependency injection support (`Depends`) on top — you can inject a DB session into a WebSocket handler the same way you would an HTTP route.

### Q: What's the difference between `asyncio.subprocess.PIPE` with `communicate()` vs `async for` on stdout?
`communicate()` buffers the **entire** output in memory and returns only when the process exits. `async for proc.stdout` streams line by line as the subprocess writes to stdout, which enables progressive updates. For long-running Terraform operations (minutes), streaming is essential — `communicate()` would hold the connection open with no user feedback.

### Q: How would you make cost estimates accurate instead of static approximations?
Replace the static pricing table with the **AWS Pricing API** (`boto3.client("pricing")`) or the **Infracost** open-source tool. For the AWS Pricing API: call `get_products` with service code and filter by region and instance type. For Infracost: generate a `plan.json` via `terraform show -json tfplan` and call `infracost breakdown --path plan.json --format json`. Both approaches require the generated Terraform plan as input, which TerraForge already produces in `run_plan()`.

### Q: What metrics would you add to a production Terraform dashboard?
- **Drift detection**: compare current Terraform state (`terraform show`) against live AWS resources
- **Run duration histogram**: P50/P95 init/plan/apply times to detect slow provider plugins
- **State size over time**: large state files indicate unmanaged resources or missing lifecycle rules
- **Error rate by resource type**: surfaces systemic failures (e.g. S3 policy errors) not visible in per-deployment logs
- **Cost trend**: actual charges from Cost Explorer vs estimate — surfaces estimate accuracy and unexpected resources

### Q: What is the Redis key TTL strategy for deployment log lists?
Production: set a TTL on the key (e.g. 24h) via `EXPIRE deployment:{id}:logs 86400` after the deployment reaches terminal status. This prevents unbounded memory growth while keeping logs available for same-day debugging. For long-term audit, persist logs to S3 as a gzip file and store the S3 URI in the `Deployment` record.
