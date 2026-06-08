def generate_resource_group(name: str, config: dict, project_name: str, provider_alias: str | None = None) -> str:
    location = config.get("location", "East US")
    provider_block = f'  provider = {provider_alias}' if provider_alias else ""

    return f"""
resource "azurerm_resource_group" "{name}" {{
{provider_block}
  name     = "{name}-rg"
  location = "{location}"

  tags = {{
    Project   = "{project_name}"
    ManagedBy = "TerraForge"
  }}
}}

output "{name}_rg_id" {{
  value = azurerm_resource_group.{name}.id
}}
"""


def generate_storage_account(name: str, config: dict, project_name: str, provider_alias: str | None = None) -> str:
    location = config.get("location", "East US")
    resource_group = config.get("resource_group_name", f"{project_name}-rg")
    account_tier = config.get("account_tier", "Standard")
    replication_type = config.get("replication_type", "LRS")
    provider_block = f'  provider = {provider_alias}' if provider_alias else ""

    safe_name = name.lower().replace("_", "")

    return f"""
resource "azurerm_storage_account" "{name}" {{
{provider_block}
  name                     = "{safe_name}sa"
  resource_group_name      = "{resource_group}"
  location                 = "{location}"
  account_tier             = "{account_tier}"
  account_replication_type = "{replication_type}"

  tags = {{
    Project   = "{project_name}"
    ManagedBy = "TerraForge"
  }}
}}

output "{name}_primary_endpoint" {{
  value = azurerm_storage_account.{name}.primary_blob_endpoint
}}
"""


def generate(name: str, config: dict, project_name: str, provider_alias: str | None = None) -> str:
    resource_kind = config.get("kind", "resource_group")
    if resource_kind == "storage_account":
        return generate_storage_account(name, config, project_name, provider_alias)
    return generate_resource_group(name, config, project_name, provider_alias)
