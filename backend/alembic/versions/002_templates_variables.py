"""templates and variables tables

Revision ID: 002
Revises: 001
Create Date: 2026-06-08
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
import uuid

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "templates",
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
        sa.Column("resources", sa.JSON(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("is_builtin", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "variables",
        sa.Column("id", sa.UUID(), nullable=False, default=uuid.uuid4),
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column(
            "type",
            sa.Enum("string", "number", "bool", "list(string)", "map(string)", name="variabletype"),
            nullable=False,
            server_default="string",
        ),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("default_value", sa.Text(), nullable=True),
        sa.Column("validation_condition", sa.Text(), nullable=True),
        sa.Column("validation_message", sa.Text(), nullable=True),
        sa.Column("is_sensitive", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("environment", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_variables_project_id", "variables", ["project_id"])
    op.create_index("ix_templates_provider", "templates", ["provider"])


def downgrade() -> None:
    op.drop_table("variables")
    op.drop_table("templates")
    op.execute("DROP TYPE IF EXISTS variabletype")
