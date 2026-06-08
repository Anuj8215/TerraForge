def generate(name: str, config: dict, project_name: str, provider_alias: str | None = None) -> str:
    cidr_block = config.get("cidr_block", "10.0.0.0/16")
    public_subnet_cidr = config.get("public_subnet_cidr", "10.0.1.0/24")
    private_subnet_cidr = config.get("private_subnet_cidr", "10.0.2.0/24")
    availability_zone = config.get("availability_zone", "us-east-1a")
    enable_dns = str(config.get("enable_dns", True)).lower()
    create_igw = config.get("create_igw", True)
    provider_block = f'  provider = {provider_alias}' if provider_alias else ""

    igw_block = f"""
resource "aws_internet_gateway" "{name}_igw" {{
{provider_block}
  vpc_id = aws_vpc.{name}.id

  tags = {{
    Name    = "{name}-igw"
    Project = "{project_name}"
  }}
}}

resource "aws_route_table" "{name}_public_rt" {{
{provider_block}
  vpc_id = aws_vpc.{name}.id

  route {{
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.{name}_igw.id
  }}

  tags = {{
    Name    = "{name}-public-rt"
    Project = "{project_name}"
  }}
}}

resource "aws_route_table_association" "{name}_public_rta" {{
{provider_block}
  subnet_id      = aws_subnet.{name}_public.id
  route_table_id = aws_route_table.{name}_public_rt.id
}}
""" if create_igw else ""

    return f"""
resource "aws_vpc" "{name}" {{
{provider_block}
  cidr_block           = "{cidr_block}"
  enable_dns_support   = {enable_dns}
  enable_dns_hostnames = {enable_dns}

  tags = {{
    Name      = "{name}"
    Project   = "{project_name}"
    ManagedBy = "TerraForge"
  }}
}}

resource "aws_subnet" "{name}_public" {{
{provider_block}
  vpc_id                  = aws_vpc.{name}.id
  cidr_block              = "{public_subnet_cidr}"
  availability_zone       = "{availability_zone}"
  map_public_ip_on_launch = true

  tags = {{
    Name    = "{name}-public"
    Project = "{project_name}"
  }}
}}

resource "aws_subnet" "{name}_private" {{
{provider_block}
  vpc_id            = aws_vpc.{name}.id
  cidr_block        = "{private_subnet_cidr}"
  availability_zone = "{availability_zone}"

  tags = {{
    Name    = "{name}-private"
    Project = "{project_name}"
  }}
}}
{igw_block}
output "{name}_vpc_id" {{
  value = aws_vpc.{name}.id
}}

output "{name}_public_subnet_id" {{
  value = aws_subnet.{name}_public.id
}}

output "{name}_private_subnet_id" {{
  value = aws_subnet.{name}_private.id
}}
"""
