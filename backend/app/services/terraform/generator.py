from app.services.terraform.modules import GENERATORS


def generate_provider_block(provider: str, region: str) -> str:
    if provider == "aws":
        return f"""terraform {{
  required_providers {{
    aws = {{
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }}
  }}
}}

provider "aws" {{
  region = "{region}"
}}
"""
    if provider == "azure":
        return """terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}
"""
    if provider == "gcp":
        return f"""terraform {{
  required_providers {{
    google = {{
      source  = "hashicorp/google"
      version = "~> 5.0"
    }}
  }}
}}

provider "google" {{
  region = "{region}"
}}
"""
    return ""


def generate_hcl(
    provider: str,
    region: str,
    project_name: str,
    resources: list[dict],
) -> str:
    blocks = [generate_provider_block(provider, region)]

    for resource in resources:
        resource_type = resource.get("type")
        resource_name = resource.get("name", "resource")
        config = resource.get("config", {})

        generator_fn = GENERATORS.get(resource_type)
        if generator_fn:
            blocks.append(generator_fn(resource_name, config, project_name))

    return "\n".join(blocks)
