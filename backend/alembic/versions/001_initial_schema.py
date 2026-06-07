"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-08
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
import uuid

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.UUID(), nullable=False, default=uuid.uuid4),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "provider",
            sa.Enum("aws", "azure", "gcp", name="cloudprovider"),
            nullable=False,
            server_default="aws",
        ),
        sa.Column("region", sa.String(50), nullable=False, server_default="us-east-1"),
        sa.Column(
            "status",
            sa.Enum("active", "inactive", "archived", name="projectstatus"),
            nullable=False,
            server_default="active",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "deployments",
        sa.Column("id", sa.UUID(), nullable=False, default=uuid.uuid4),
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.Column(
            "action",
            sa.Enum("plan", "apply", "destroy", name="deploymentaction"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("pending", "running", "success", "failed", name="deploymentstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("logs", sa.Text(), nullable=True),
        sa.Column("plan_output", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "resources",
        sa.Column("id", sa.UUID(), nullable=False, default=uuid.uuid4),
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.Column("deployment_id", sa.UUID(), nullable=False),
        sa.Column("resource_type", sa.String(100), nullable=False),
        sa.Column("resource_name", sa.String(100), nullable=False),
        sa.Column("aws_resource_id", sa.String(200), nullable=True),
        sa.Column("config", sa.JSON(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "pending", "creating", "active", "updating",
                "destroying", "destroyed", "failed",
                name="resourcestatus",
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["deployment_id"], ["deployments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_deployments_project_id", "deployments", ["project_id"])
    op.create_index("ix_resources_project_id", "resources", ["project_id"])
    op.create_index("ix_resources_deployment_id", "resources", ["deployment_id"])


def downgrade() -> None:
    op.drop_table("resources")
    op.drop_table("deployments")
    op.drop_table("projects")
    op.execute("DROP TYPE IF EXISTS resourcestatus")
    op.execute("DROP TYPE IF EXISTS deploymentstatus")
    op.execute("DROP TYPE IF EXISTS deploymentaction")
    op.execute("DROP TYPE IF EXISTS projectstatus")
    op.execute("DROP TYPE IF EXISTS cloudprovider")
