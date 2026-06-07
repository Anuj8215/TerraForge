# Phase 5 — AWS Service Modules

## What we built

End-to-end provisioning flow for three AWS services: EC2 instances, S3 buckets, and VPCs with subnets. Each service has a dedicated HCL generator on the backend and a configuration form on the frontend, connected through a 3-step wizard UI.

---

## Backend — HCL Module Architecture

```
services/terraform/modules/
├── __init__.py    ← GENERATORS registry { "ec2": fn, "s3": fn, "vpc": fn }
├── ec2.py         ← aws_instance resource block
├── s3.py          ← aws_s3_bucket + versioning + SSE + public access block
└── vpc.py         ← aws_vpc + public/private subnets + IGW + route table
```

Each module is a single `generate(name, config, project_name) -> str` function. The registry in `__init__.py` maps type strings to functions — adding a new service (e.g., RDS) means writing one new module file and one line in the registry.

---

## Generated HCL Examples

### EC2
```hcl
resource "aws_instance" "web_server" {
  ami                         = "ami-0c55b159cbfafe1f0"
  instance_type               = "t3.micro"
  associate_public_ip_address = true

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name      = "web_server"
    Project   = "my-project"
    ManagedBy = "TerraForge"
  }
}
```

### S3 (4 resources generated from 1 config)
```hcl
resource "aws_s3_bucket" "assets" { ... }
resource "aws_s3_bucket_versioning" "assets_versioning" { ... }
resource "aws_s3_bucket_server_side_encryption_configuration" "assets_sse" { ... }
resource "aws_s3_bucket_public_access_block" "assets_public_access" { ... }
```

**Why 4 resources for one S3 bucket?** AWS best practice separates bucket configuration into distinct resources. This also allows Terraform to manage them independently — if you want to disable versioning without recreating the bucket, you just modify the versioning resource.

### VPC
```hcl
resource "aws_vpc" "main_vpc" { cidr_block = "10.0.0.0/16" ... }
resource "aws_subnet" "main_vpc_public"  { ... }
resource "aws_subnet" "main_vpc_private" { ... }
resource "aws_internet_gateway" "main_vpc_igw" { ... }
resource "aws_route_table" "main_vpc_public_rt" { ... }
resource "aws_route_table_association" "main_vpc_public_rta" { ... }
```

**Cross-resource references in HCL** — the subnet references the VPC by `aws_vpc.main_vpc.id` (not a hardcoded ID). Terraform resolves the dependency order automatically — it knows to create the VPC before the subnet.

---

## Frontend — 3-Step Deployment Wizard

```
Step 1: Select Services    → ServiceSelector cards
Step 2: Configure          → Per-service forms (EC2Form, S3Form, VPCForm)
Step 3: Review & Deploy    → Summary + Run Plan / Apply Infrastructure buttons
```

### ServiceSelector

A card grid that maps user clicks to `addResource(type)` calls. Decoupled from the forms — adding a new service only requires adding a card here and a form component.

### Form Components (EC2Form, S3Form, VPCForm)

Each form:
- Receives `config` prop (current values) and `onChange` prop (callback)
- Is controlled — no internal state, parent owns the data
- Exports `FormComponent.defaultConfig` — the initial config used when a service is first added

**Controlled components** — the form never calls `useState`. State lives in `NewDeployment.jsx` in the `resources` array. This means the parent can read all config values at any time to build the API request.

```jsx
<EC2Form
  config={resource.config}
  onChange={(config) => updateResource(index, "config", config)}
/>
```

### NewDeployment Wizard State

```js
const [resources, setResources] = useState([]);
// Each resource: { type: "ec2", name: "web_server", config: { instance_type: "t3.micro", ... } }
```

When the user clicks "Apply Infrastructure":
```js
const payload = { project_id: id, resources };
// → POST /api/v1/terraform/apply
// → Backend generates HCL, runs terraform, returns deployment
// → Navigate to /deployments/{id} for live log polling
```

---

## Full End-to-End Flow

```
User fills EC2Form (instance_type=t3.micro, ami=...) in browser
    ↓
POST /api/v1/terraform/apply { project_id, resources: [{ type: "ec2", name: "web", config: {...} }] }
    ↓
api/terraform.py creates Deployment(action=apply, status=pending)
    ↓
BackgroundTasks → engine.run_apply()
    ↓
WorkspaceManager.setup()       → mkdir /terraform/workspaces/{project_id}/
generator.generate_hcl()       → builds HCL string using ec2.generate()
workspace.write_main_tf(hcl)   → writes /terraform/workspaces/{project_id}/main.tf
    ↓
executor.terraform_init()      → terraform init -input=false -upgrade
executor.terraform_plan()      → terraform plan -input=false -out=tfplan
executor.terraform_apply()     → terraform apply -input=false -auto-approve tfplan
    ↓
_update_deployment() after each step with current logs
    ↓
Frontend polls GET /api/v1/deployments/{id} every 2s → shows live logs
```

---

## Interview Talking Points

**Q: Why do you tag all resources with `ManagedBy = "TerraForge"`?**
Tags are how you identify and filter resources in the AWS console and cost reports. If someone logs into AWS directly they can see which resources were created by TerraForge. It also enables cost allocation — you can group AWS costs by tag.

**Q: Why does S3 generate 4 Terraform resources?**
Since Terraform AWS provider v4, S3 bucket properties (versioning, encryption, public access) are managed as separate resources rather than nested blocks. This was done to make them independently configurable and to avoid bucket recreation when changing a property. It's a breaking change from provider v3.

**Q: What prevents a user from deploying a VPC CIDR that overlaps with an existing one?**
Currently nothing — that's a validation layer we'd add in Phase 8 (variable validation). AWS will reject the apply if there's a conflict, and the error appears in the deployment logs.

**Q: How would you add RDS as a new module?**
1. Create `services/terraform/modules/rds.py` with a `generate(name, config, project_name) -> str` function
2. Register it in `modules/__init__.py`: `GENERATORS["rds"] = rds.generate`
3. Create `frontend/src/components/aws/RDSForm.jsx`
4. Add it to `ServiceSelector` cards
5. Add it to `FORM_MAP` and `DEFAULT_MAP` in `NewDeployment.jsx`

No changes needed to the generator, executor, engine, or API.

---

## What's Next — Phase 6

Integrate HashiCorp Vault for secret management: store AWS credentials in Vault, inject them into Terraform runs via environment variables, and provide a Vault UI in the dashboard for managing secrets.
