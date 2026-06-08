from app.services.terraform.modules import GENERATORS


def _alias_name(region: str) -> str:
    return region.replace("-", "_")


def _build_provider_blocks(provider: str, default_region: str, extra_regions: list[str]) -> str:
    blocks = []

    if provider == "aws":
        blocks.append(f"""terraform {{
  required_providers {{
    aws = {{
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }}
  }}
}}

provider "aws" {{
  region = "{default_region}"
}}
""")
        for region in extra_regions:
            alias = _alias_name(region)
            blocks.append(f"""provider "aws" {{
  alias  = "{alias}"
  region = "{region}"
}}
""")

    elif provider == "azure":
        blocks.append("""terraform {
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
""")

    elif provider == "gcp":
        blocks.append(f"""terraform {{
  required_providers {{
    google = {{
      source  = "hashicorp/google"
      version = "~> 5.0"
    }}
  }}
}}

provider "google" {{
  region = "{default_region}"
}}
""")
        for region in extra_regions:
            alias = _alias_name(region)
            blocks.append(f"""provider "google" {{
  alias  = "{alias}"
  region = "{region}"
}}
""")

    return "\n".join(blocks)


def generate_hcl(
    provider: str,
    default_region: str,
    project_name: str,
    resources: list[dict],
) -> str:
    seen_regions: dict[str, str] = {}
    for r in resources:
        region = r.get("region") or default_region
        if region != default_region:
            seen_regions[region] = _alias_name(region)

    extra_regions = list(seen_regions.keys())
    blocks = [_build_provider_blocks(provider, default_region, extra_regions)]

    for resource in resources:
        resource_type = resource.get("type")
        resource_name = resource.get("name", "resource")
        config = resource.get("config", {})
        resource_region = resource.get("region") or default_region

        provider_alias = None
        if resource_region != default_region:
            provider_alias = f"{provider}.{_alias_name(resource_region)}"

        generator_fn = GENERATORS.get(resource_type)
        if generator_fn:
            blocks.append(generator_fn(resource_name, config, project_name, provider_alias))

    return "\n".join(blocks)
