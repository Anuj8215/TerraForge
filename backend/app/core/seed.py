from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.template import Template

BUILTIN_TEMPLATES = [
    {
        "name": "Web Application Stack",
        "description": "EC2 instance + VPC with public/private subnets + S3 for static assets",
        "provider": "aws",
        "region": "us-east-1",
        "tags": ["web", "production", "starter"],
        "resources": [
            {"type": "vpc", "name": "main_vpc", "config": {"cidr_block": "10.0.0.0/16", "create_igw": True}},
            {"type": "ec2", "name": "web_server", "config": {"instance_type": "t3.small", "volume_size": 20}},
            {"type": "s3", "name": "static_assets", "config": {"versioning": False}},
        ],
    },
    {
        "name": "Static Site Hosting",
        "description": "S3 bucket configured for static website hosting with versioning enabled",
        "provider": "aws",
        "region": "us-east-1",
        "tags": ["static", "s3", "website"],
        "resources": [
            {"type": "s3", "name": "website_bucket", "config": {"versioning": True}},
        ],
    },
    {
        "name": "Network Foundation",
        "description": "VPC with public/private subnets, Internet Gateway, and route tables",
        "provider": "aws",
        "region": "us-east-1",
        "tags": ["network", "vpc", "foundation"],
        "resources": [
            {"type": "vpc", "name": "foundation_vpc", "config": {"cidr_block": "10.0.0.0/16", "create_igw": True, "enable_dns": True}},
        ],
    },
    {
        "name": "Data Lake",
        "description": "Three S3 buckets for raw, processed, and curated data layers",
        "provider": "aws",
        "region": "us-east-1",
        "tags": ["data", "analytics", "s3"],
        "resources": [
            {"type": "s3", "name": "raw_data", "config": {"versioning": True}},
            {"type": "s3", "name": "processed_data", "config": {"versioning": True}},
            {"type": "s3", "name": "curated_data", "config": {"versioning": True}},
        ],
    },
    {
        "name": "Multi-Region DR",
        "description": "Primary EC2 in us-east-1 and S3 backup bucket replicated to eu-west-1",
        "provider": "aws",
        "region": "us-east-1",
        "tags": ["disaster-recovery", "multi-region", "ha"],
        "resources": [
            {"type": "ec2", "name": "primary_server", "config": {"instance_type": "t3.micro"}},
            {"type": "s3", "name": "primary_backup", "config": {"versioning": True}},
            {"type": "s3", "name": "dr_backup", "config": {"versioning": True}, "region": "eu-west-1"},
        ],
    },
]


async def seed_builtin_templates(db: AsyncSession) -> None:
    for tmpl_data in BUILTIN_TEMPLATES:
        existing = await db.execute(select(Template).where(Template.name == tmpl_data["name"]))
        if existing.scalar_one_or_none():
            continue
        template = Template(**tmpl_data, is_builtin=True)
        db.add(template)
    await db.commit()
