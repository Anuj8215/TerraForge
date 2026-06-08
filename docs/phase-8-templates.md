# Phase 8 — Templates & Variable Management

## What Was Built

### Backend
| File | Purpose |
|------|---------|
| `app/models/template.py` | Template DB model — stores name, provider, region, resources (JSON), tags (JSON), is_builtin flag |
| `app/models/variable.py` | Variable DB model — per-project variables with type, validation_condition, is_sensitive |
| `app/schemas/template.py` | Pydantic TemplateCreate / TemplateResponse / TemplateListResponse |
| `app/schemas/variable.py` | VariableCreate / VariableUpdate / VariableResponse / VariableListResponse |
| `app/api/templates.py` | CRUD — builtin templates are protected from DELETE (returns 403) |
| `app/api/variables.py` | CRUD scoped by project_id path parameter |
| `app/services/terraform/variables.py` | `generate_variables_tf()` — emits HCL variable blocks with optional validation sub-blocks |
| `app/services/terraform/engine.py` | `_write_variables()` — fetches Variable rows, calls generator, writes variables.tf before plan/apply |
| `app/core/seed.py` | Seeds 5 built-in templates on startup: Web App Stack, Static Site, Network Foundation, Data Lake, Multi-Region DR |
| `alembic/versions/002_templates_variables.py` | Creates templates + variables tables |

### Frontend
| File | Purpose |
|------|---------|
| `store/slices/templatesSlice.js` | Redux slice — fetchTemplates, createTemplate, deleteTemplate thunks |
| `store/slices/variablesSlice.js` | Redux slice — byProject keyed state, fetchVariables, createVariable, deleteVariable |
| `api/templates.js` | Axios calls for /templates endpoints |
| `api/variables.js` | Axios calls for /projects/{id}/variables endpoints |
| `pages/Templates.jsx` | Gallery page — Built-in section + custom section with TemplateCard (Use Template button) |
| `pages/VariableEditor.jsx` | Per-project variable manager with "Preview variables.tf" live HCL preview |
| `components/templates/SaveTemplateDialog.jsx` | Dialog to save current NewDeployment resources as reusable template with name + tags |
| `pages/NewDeployment.jsx` | Step 0: "Load from Template" chips; Step 2: "Save as Template" button |
| `App.jsx` | Added /templates and /projects/:id/variables routes |
| `components/Layout/Sidebar.jsx` | Added Templates nav item |

---

## Architecture Decisions

### Why store `resources` as JSON in the templates table?
A template's resource list has no relational queries — it's always read as a whole and written as a whole. Storing it as JSONB (PostgreSQL) avoids a join table while keeping the shape flexible as new resource types are added.

### Why are built-in templates protected at the API layer not the DB layer?
A DB constraint (e.g. a trigger) would surface as an opaque 500. Checking `is_builtin` in the DELETE handler returns a clear 403 with a message the UI can display.

### Why does `generate_variables_tf()` live in its own module?
The function has no side effects — it takes a list of Variable objects and returns a string. Isolating it makes it unit-testable without a DB or filesystem.

### Why write variables.tf before every plan/apply rather than caching it?
Variables are mutable. A stale cached file would silently use outdated definitions. Writing on each run is safe and cheap.

---

## Interview Q&A

### Q: What is a Terraform variable block and when do you need a `validation` sub-block?
A `variable` block declares an input that can be passed via `.tfvars`, CLI `-var` flags, or environment variables. The `validation` block lets you enforce domain constraints that the type system cannot express — for example, checking that `instance_type` is one of the approved values. Without it, Terraform only catches type mismatches, not business-rule violations.

```hcl
variable "instance_type" {
  type = string
  validation {
    condition     = contains(["t3.micro", "t3.small"], var.instance_type)
    error_message = "Only t3.micro or t3.small are permitted."
  }
}
```

### Q: What is the difference between a `sensitive = true` variable and a Vault-sourced secret?
`sensitive = true` tells Terraform to redact the value from plan/apply output — it doesn't encrypt it. The value still lands in `terraform.tfstate` in plaintext. Vault-sourced secrets are fetched at runtime via API and injected as environment variables (`TF_VAR_*`), so they never touch the state file. For secrets that must never be persisted, Vault injection is the correct pattern.

### Q: How does TerraForge map frontend Variable rows to actual Terraform input?
`engine.py._write_variables()` queries the Variable table for the project, calls `generate_variables_tf()` to produce the HCL `variables.tf`, and writes it to the workspace directory before running `terraform init`. At apply time, Vault secrets are injected as `TF_VAR_<name>` environment variables, so Terraform automatically resolves them against the declared variables.

### Q: Why seed built-in templates on application startup rather than a one-time migration?
A migration runs once and is tracked in the `alembic_version` table. If the template content needs to change (e.g. a new resource added to "Web Application Stack"), you'd need a new migration. Seeding in the lifespan startup function is idempotent (checks `SELECT name` before inserting) and picks up content changes on every redeploy without requiring a new migration version.

### Q: A user saves a template from a 3-resource deployment, then adds a new resource type (e.g. RDS). What happens when they load the old template?
The template's `resources` JSON is loaded into the NewDeployment wizard. Unknown resource types fall back to `DEFAULT_MAP[type] || {}` (an empty config). The user will see the resource listed but the form will render with blank fields — it won't crash. This is intentional: templates are a starting point, not a locked configuration.

### Q: How would you implement template versioning?
Add a `version` integer column to the templates table and a foreign key `parent_id` (self-referential) to track lineage. Each "Save as Template" call creates a new row with an incremented version. The UI shows the latest version by default but allows browsing history. Alternatively, store the full version history as a JSONB array on a single row — simpler but loses the ability to query by version.

### Q: What is the difference between Alembic `op.execute()` and a revision's `upgrade()` function for seeding data?
`op.execute()` in a migration runs raw SQL inline with the schema change. It's appropriate for one-time backfills that are tied to the migration (e.g. populating a new column). Startup seeding via application code is better for reference data that may change between deployments — it's idempotent, environment-aware, and doesn't permanently bake the data into migration history.
