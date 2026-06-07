from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    secret_key: str = "change_this_in_production"

    database_url: str
    postgres_user: str
    postgres_password: str
    postgres_db: str

    vault_addr: str = "http://vault:8200"
    vault_root_token: str = "root"

    redis_url: str = "redis://redis:6379/0"


settings = Settings()
