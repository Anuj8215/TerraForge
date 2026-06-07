import enum
from sqlalchemy import String, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import UUIDMixin, TimestampMixin
from app.core.database import Base


class ProjectStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    archived = "archived"


class CloudProvider(str, enum.Enum):
    aws = "aws"
    azure = "azure"
    gcp = "gcp"


class Project(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    provider: Mapped[CloudProvider] = mapped_column(
        Enum(CloudProvider), default=CloudProvider.aws
    )
    region: Mapped[str] = mapped_column(String(50), default="us-east-1")
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus), default=ProjectStatus.active
    )

    deployments: Mapped[list["Deployment"]] = relationship(
        "Deployment", back_populates="project", cascade="all, delete-orphan"
    )
    resources: Mapped[list["Resource"]] = relationship(
        "Resource", back_populates="project", cascade="all, delete-orphan"
    )
