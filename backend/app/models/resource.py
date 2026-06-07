import enum
import uuid
from sqlalchemy import String, Enum, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import UUIDMixin, TimestampMixin
from app.core.database import Base


class ResourceStatus(str, enum.Enum):
    pending = "pending"
    creating = "creating"
    active = "active"
    updating = "updating"
    destroying = "destroying"
    destroyed = "destroyed"
    failed = "failed"


class Resource(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "resources"

    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    deployment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False
    )
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_name: Mapped[str] = mapped_column(String(100), nullable=False)
    aws_resource_id: Mapped[str | None] = mapped_column(String(200))
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[ResourceStatus] = mapped_column(
        Enum(ResourceStatus), default=ResourceStatus.pending
    )

    project: Mapped["Project"] = relationship("Project", back_populates="resources")
    deployment: Mapped["Deployment"] = relationship("Deployment", back_populates="resources")
