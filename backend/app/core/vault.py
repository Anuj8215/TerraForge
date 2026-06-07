import hvac
from functools import lru_cache
from app.core.config import settings


@lru_cache(maxsize=1)
def get_vault_client() -> hvac.Client:
    client = hvac.Client(url=settings.vault_addr, token=settings.vault_root_token)
    client.sys.enable_secrets_engine(
        backend_type="kv",
        path="terraforge",
        options={"version": "2"},
    )
    return client
