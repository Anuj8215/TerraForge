import enum
import uuid
from sqlalchemy import String, Text, Boolean, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import UUIDMixin, TimestampMixin
from app.core.database import Base


class VariableType(str, enum.Enum):
    string = "string"
    number = "number"
    bool = "bool"
    list = "list(string)"
    map = "map(string)"


class Variable(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "variables"

    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[VariableType] = mapped_column(Enum(VariableType), default=VariableType.string)
    description: Mapped[str | None] = mapped_column(Text)
    default_value: Mapped[str | None] = mapped_column(Text)
    validation_condition: Mapped[str | None] = mapped_column(Text)
    validation_message: Mapped[str | None] = mapped_column(Text)
    is_sensitive: Mapped[bool] = mapped_column(Boolean, default=False)
    environment: Mapped[str | None] = mapped_column(String(20))

    project: Mapped["Project"] = relationship("Project")
