def generate_compute_instance(name: str, config: dict, project_name: str, provider_alias: str | None = None) -> str:
    machine_type = config.get("machine_type", "e2-micro")
    zone = config.get("zone", "us-central1-a")
    image = config.get("image", "debian-cloud/debian-11")
    disk_size = config.get("disk_size", 20)
    provider_block = f'  provider = {provider_alias}' if provider_alias else ""

    return f"""
resource "google_compute_instance" "{name}" {{
{provider_block}
  name         = "{name}"
  machine_type = "{machine_type}"
  zone         = "{zone}"

  boot_disk {{
    initialize_params {{
      image = "{image}"
      size  = {disk_size}
    }}
  }}

  network_interface {{
    network = "default"
    access_config {{}}
  }}

  labels = {{
    project    = "{project_name.lower().replace(" ", "_")}"
    managed_by = "terraforge"
  }}
}}

output "{name}_instance_id" {{
  value = google_compute_instance.{name}.instance_id
}}

output "{name}_public_ip" {{
  value = google_compute_instance.{name}.network_interface[0].access_config[0].nat_ip
}}
"""


def generate_storage_bucket(name: str, config: dict, project_name: str, provider_alias: str | None = None) -> str:
    location = config.get("location", "US")
    storage_class = config.get("storage_class", "STANDARD")
    versioning = str(config.get("versioning", False)).lower()
    provider_block = f'  provider = {provider_alias}' if provider_alias else ""

    return f"""
resource "google_storage_bucket" "{name}" {{
{provider_block}
  name          = "{project_name.lower()}-{name}"
  location      = "{location}"
  storage_class = "{storage_class}"
  force_destroy = true

  versioning {{
    enabled = {versioning}
  }}

  uniform_bucket_level_access = true

  labels = {{
    project    = "{project_name.lower().replace(" ", "_")}"
    managed_by = "terraforge"
  }}
}}

output "{name}_url" {{
  value = google_storage_bucket.{name}.url
}}
"""


def generate(name: str, config: dict, project_name: str, provider_alias: str | None = None) -> str:
    resource_kind = config.get("kind", "compute_instance")
    if resource_kind == "storage_bucket":
        return generate_storage_bucket(name, config, project_name, provider_alias)
    return generate_compute_instance(name, config, project_name, provider_alias)
