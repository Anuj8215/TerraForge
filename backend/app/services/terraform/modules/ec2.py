def generate(name: str, config: dict, project_name: str, provider_alias: str | None = None) -> str:
    ami = config.get("ami", "ami-0c55b159cbfafe1f0")
    instance_type = config.get("instance_type", "t3.micro")
    key_name = config.get("key_name", "")
    associate_public_ip = str(config.get("associate_public_ip", True)).lower()
    volume_size = config.get("volume_size", 20)
    subnet_id = config.get("subnet_id", "")

    subnet_block = f'  subnet_id                   = "{subnet_id}"' if subnet_id else ""
    key_block = f'  key_name                    = "{key_name}"' if key_name else ""
    provider_block = f'  provider = {provider_alias}' if provider_alias else ""

    return f"""
resource "aws_instance" "{name}" {{
{provider_block}
  ami                         = "{ami}"
  instance_type               = "{instance_type}"
  associate_public_ip_address = {associate_public_ip}
{subnet_block}
{key_block}

  root_block_device {{
    volume_size = {volume_size}
    volume_type = "gp3"
  }}

  tags = {{
    Name      = "{name}"
    Project   = "{project_name}"
    ManagedBy = "TerraForge"
  }}
}}

output "{name}_id" {{
  value = aws_instance.{name}.id
}}

output "{name}_public_ip" {{
  value = aws_instance.{name}.public_ip
}}
"""
