from sqlalchemy import String, Text, Boolean, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import UUIDMixin, TimestampMixin
from app.models.project import CloudProvider
from app.core.database import Base


class Template(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "templates"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    provider: Mapped[CloudProvider] = mapped_column(Enum(CloudProvider), default=CloudProvider.aws)
    region: Mapped[str] = mapped_column(String(50), default="us-east-1")
    resources: Mapped[list] = mapped_column(JSON, default=list)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    is_builtin: Mapped[bool] = mapped_column(Boolean, default=False)
