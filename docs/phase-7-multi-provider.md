# Phase 7 — Multi-Provider & Multi-Region

## What we built

Provider alias generation in HCL so a single deployment can span multiple AWS regions. Azure and GCP module stubs showing the platform's extensibility. Per-resource region override in the UI with a "multi-region deployment" indicator in the review step.

---

## Architecture

```
User selects EC2 in us-east-1 (project default) + S3 in eu-west-1 (override)
    ↓
NewDeployment.jsx builds payload:
  resources: [
    { type: "ec2", name: "web",    config: {...}, region: null    },
    { type: "s3",  name: "assets", config: {...}, region: "eu-west-1" }
  ]
    ↓
POST /api/v1/terraform/apply
    ↓
generator.generate_hcl(provider="aws", default_region="us-east-1", resources=[...])
    ↓
Detects eu-west-1 ≠ default → generates provider alias block
    ↓
Generated main.tf:

  provider "aws" {
    region = "us-east-1"           ← default, no alias
  }

  provider "aws" {
    alias  = "eu_west_1"           ← aliased provider
    region = "eu-west-1"
  }

  resource "aws_instance" "web" {
    # no provider attribute → uses default aws
    ...
  }

  resource "aws_s3_bucket" "assets" {
    provider = aws.eu_west_1       ← references alias
    ...
  }
```

---

## Files Modified

```
backend/
├── app/
│   ├── schemas/terraform.py             ← added region: str | None to ResourceConfig
│   └── services/terraform/
│       ├── generator.py                 ← full rewrite: provider alias detection + generation
│       └── modules/
│           ├── __init__.py              ← registered azure + gcp generators
│           ├── ec2.py                   ← added provider_alias param
│           ├── s3.py                    ← added provider_alias param
│           ├── vpc.py                   ← added provider_alias param
│           ├── azure.py                 ← new: resource group + storage account
│           └── gcp.py                   ← new: compute instance + cloud storage bucket

frontend/
└── src/
    ├── components/aws/
    │   ├── EC2Form.jsx                  ← added Region Override field
    │   ├── S3Form.jsx                   ← added Region Override field
    │   ├── VPCForm.jsx                  ← added Region Override field
    │   ├── AzureForm.jsx                ← new: resource kind + location + storage config
    │   ├── GCPForm.jsx                  ← new: compute instance + cloud storage
    │   └── ServiceSelector.jsx          ← grouped by provider (AWS / Azure / GCP)
    └── pages/NewDeployment.jsx          ← multi-region indicator + region per resource
```

---

## Key Concept: Provider Aliases

Terraform's **provider alias** mechanism lets one configuration file manage resources in multiple regions simultaneously:

```hcl
provider "aws" {
  region = "us-east-1"      # default (no alias)
}

provider "aws" {
  alias  = "eu_west_1"      # aliased
  region = "eu-west-1"
}
```

Resources reference the alias explicitly — if omitted they use the default:
```hcl
resource "aws_instance" "web" {
  # uses default provider (us-east-1)
}

resource "aws_s3_bucket" "backup" {
  provider = aws.eu_west_1  # uses aliased provider (eu-west-1)
}
```

**Why this matters for Terraform state:** Both resources exist in the same state file, and Terraform tracks which provider (region) each resource was created in. A `terraform apply` on the same config is idempotent — it won't re-create the US instance just because the EU bucket was added.

---

## Generator Logic (`generator.py`)

```python
def generate_hcl(provider, default_region, project_name, resources):
    # 1. Collect all unique non-default regions from resources
    seen_regions = {}
    for r in resources:
        region = r.get("region") or default_region
        if region != default_region:
            seen_regions[region] = _alias_name(region)  # "eu-west-1" → "eu_west_1"

    # 2. Build provider blocks (one default + one per extra region)
    blocks = [_build_provider_blocks(provider, default_region, list(seen_regions.keys()))]

    # 3. For each resource, determine its provider_alias
    for resource in resources:
        resource_region = resource.get("region") or default_region
        provider_alias = None
        if resource_region != default_region:
            provider_alias = f"{provider}.{_alias_name(resource_region)}"
        blocks.append(GENERATORS[resource_type](name, config, project_name, provider_alias))

    return "\n".join(blocks)
```

The `_alias_name` helper normalizes region strings to valid HCL identifiers:
```python
def _alias_name(region: str) -> str:
    return region.replace("-", "_")  # "eu-west-1" → "eu_west_1"
```

---

## Module Signature Update

All modules now accept `provider_alias: str | None = None`:

```python
def generate(name, config, project_name, provider_alias=None):
    provider_block = f'  provider = {provider_alias}' if provider_alias else ""

    return f"""
resource "aws_instance" "{name}" {{
{provider_block}
  ...
}}
"""
```

When `provider_alias` is `None` (default region), the `provider` line is simply omitted from the block — Terraform automatically uses the default provider. This keeps single-region deployments identical to before.

---

## Frontend — Region Override

The region override is an **optional field** in each resource form. If left blank, the resource uses the project's default region (single-region behavior). If set, it populates the `region` field in the payload, triggering alias generation.

```jsx
<TextField
  select label="Region Override (optional)" value={region}
  onChange={(e) => onRegionChange(e.target.value)}
  helperText="Overrides the project default region — triggers a provider alias"
>
  <MenuItem value=""><em>Use project default</em></MenuItem>
  {AWS_REGIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
</TextField>
```

In the Review step, the UI shows a multi-region badge when any resource has a non-default region:
```jsx
{isMultiRegion && (
  <Typography color="primary.light">
    Multi-region deployment — provider aliases will be generated for: {uniqueRegions.join(", ")}
  </Typography>
)}
```

---

## Azure & GCP Modules

These are **production-ready stubs** — the HCL they generate is valid and deployable with the correct provider credentials. They follow the exact same interface as AWS modules.

### Azure (`modules/azure.py`)
- `resource_group` — `azurerm_resource_group`
- `storage_account` — `azurerm_storage_account` with LRS/GRS/ZRS replication

### GCP (`modules/gcp.py`)
- `compute_instance` — `google_compute_instance` with boot disk, network interface
- `storage_bucket` — `google_storage_bucket` with versioning + uniform bucket-level access

Both are dispatched through `generate(name, config, project_name, provider_alias)` via a `kind` field in the config, maintaining the same interface as AWS modules.

---

## Supported Services Matrix

| Type | Provider | Resources Generated |
|------|----------|-------------------|
| `ec2` | AWS | `aws_instance` + outputs |
| `s3` | AWS | `aws_s3_bucket` + versioning + SSE + public access block |
| `vpc` | AWS | `aws_vpc` + 2 subnets + IGW + route table |
| `azure` | Azure | `azurerm_resource_group` OR `azurerm_storage_account` |
| `gcp` | GCP | `google_compute_instance` OR `google_storage_bucket` |

---

## Interview Talking Points

**Q: Why use provider aliases instead of separate Terraform workspaces per region?**
Aliases allow a single `terraform apply` to deploy to multiple regions atomically — all resources are tracked in one state file. Separate workspaces mean separate state, separate applies, and manual orchestration of dependencies (e.g., you'd need to run workspace A first to get a VPC ID, then pass it to workspace B). For independent resources, aliases are cleaner.

**Q: What's the naming convention for aliases and why?**
We convert region names to valid HCL identifiers by replacing hyphens with underscores (`eu-west-1 → eu_west_1`). HCL identifiers can't contain hyphens — this is a Terraform syntax rule. The alias is also prefixed with the provider name in the resource reference (`aws.eu_west_1`) to be explicit about which provider the alias belongs to.

**Q: How would you handle a multi-provider deployment (AWS + Azure in the same project)?**
Currently TerraForge projects have a single provider. Multi-provider in a single Terraform config is possible — you'd need both provider blocks and different resource types. The generator would need to accept multiple `(provider, region)` pairs. This is a Phase 9+ enhancement — the module architecture already supports it since each module generates self-contained HCL blocks.

**Q: Why are Azure and GCP implemented as stubs rather than full service parity with AWS?**
Interview answer: in a real product you'd build them iteratively based on demand. Architecturally, adding full Azure/GCP parity requires the same pattern: one module file per resource type, one form component per resource type, registered in `GENERATORS` and `FORM_MAP`. The generator and engine need zero changes — they're provider-agnostic.

---

## What's Next — Phase 8

Templates and variable management: save/load reusable infrastructure templates, Terraform variable files, input validation, and environment-specific configs (dev/staging/prod).
