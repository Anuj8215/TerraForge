def generate(name: str, config: dict, project_name: str) -> str:
    bucket_name = config.get("bucket_name", f"{project_name}-{name}".lower().replace("_", "-"))
    versioning = str(config.get("versioning", False)).lower()
    force_destroy = str(config.get("force_destroy", False)).lower()
    acl = config.get("acl", "private")

    versioning_status = "Enabled" if versioning == "true" else "Suspended"

    return f"""
resource "aws_s3_bucket" "{name}" {{
  bucket        = "{bucket_name}"
  force_destroy = {force_destroy}

  tags = {{
    Name    = "{name}"
    Project = "{project_name}"
    ManagedBy = "TerraForge"
  }}
}}

resource "aws_s3_bucket_versioning" "{name}_versioning" {{
  bucket = aws_s3_bucket.{name}.id

  versioning_configuration {{
    status = "{versioning_status}"
  }}
}}

resource "aws_s3_bucket_server_side_encryption_configuration" "{name}_sse" {{
  bucket = aws_s3_bucket.{name}.id

  rule {{
    apply_server_side_encryption_by_default {{
      sse_algorithm = "AES256"
    }}
  }}
}}

resource "aws_s3_bucket_public_access_block" "{name}_public_access" {{
  bucket                  = aws_s3_bucket.{name}.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}}

output "{name}_arn" {{
  value = aws_s3_bucket.{name}.arn
}}

output "{name}_bucket_name" {{
  value = aws_s3_bucket.{name}.bucket
}}
"""
