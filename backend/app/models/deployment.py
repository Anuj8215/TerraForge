import enum
import uuid
from sqlalchemy import String, Text, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import UUIDMixin, TimestampMixin
from app.core.database import Base


class DeploymentAction(str, enum.Enum):
    plan = "plan"
    apply = "apply"
    destroy = "destroy"


class DeploymentStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    success = "success"
    failed = "failed"


class Deployment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "deployments"

    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    action: Mapped[DeploymentAction] = mapped_column(Enum(DeploymentAction))
    status: Mapped[DeploymentStatus] = mapped_column(
        Enum(DeploymentStatus), default=DeploymentStatus.pending
    )
    logs: Mapped[str | None] = mapped_column(Text)
    plan_output: Mapped[str | None] = mapped_column(Text)
    error_message: Mapped[str | None] = mapped_column(Text)

    project: Mapped["Project"] = relationship("Project", back_populates="deployments")
    resources: Mapped[list["Resource"]] = relationship(
        "Resource", back_populates="deployment", cascade="all, delete-orphan"
    )
