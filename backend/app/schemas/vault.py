import uuid
from pydantic import BaseModel, field_validator


SENSITIVE_KEYS = {"aws_secret_access_key", "db_password", "api_key", "token"}


class SecretWrite(BaseModel):
    key: str
    value: str

    @field_validator("key")
    @classmethod
    def key_valid(cls, v: str) -> str:
        if not v.strip() or " " in v:
            raise ValueError("Key must be non-empty and contain no spaces")
        return v.lower().strip()


class SecretResponse(BaseModel):
    key: str
    value: str
    is_sensitive: bool

    @classmethod
    def from_kv(cls, key: str, value: str) -> "SecretResponse":
        masked = "••••••••" if key in SENSITIVE_KEYS else value
        return cls(key=key, value=masked, is_sensitive=key in SENSITIVE_KEYS)


class ProjectSecretsResponse(BaseModel):
    project_id: uuid.UUID
    secrets: list[SecretResponse]
    total: int
