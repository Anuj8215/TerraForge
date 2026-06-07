import uuid
import hvac
from hvac.exceptions import InvalidPath


MOUNT = "terraforge"


def _path(project_id: uuid.UUID) -> str:
    return f"projects/{project_id}"


def write_secret(client: hvac.Client, project_id: uuid.UUID, key: str, value: str) -> None:
    path = _path(project_id)
    try:
        existing = client.secrets.kv.v2.read_secret_version(path=path, mount_point=MOUNT)
        data = existing["data"]["data"]
    except InvalidPath:
        data = {}
    data[key] = value
    client.secrets.kv.v2.create_or_update_secret(path=path, secret=data, mount_point=MOUNT)


def read_secrets(client: hvac.Client, project_id: uuid.UUID) -> dict:
    try:
        result = client.secrets.kv.v2.read_secret_version(path=_path(project_id), mount_point=MOUNT)
        return result["data"]["data"] or {}
    except InvalidPath:
        return {}


def delete_secret(client: hvac.Client, project_id: uuid.UUID, key: str) -> bool:
    path = _path(project_id)
    try:
        existing = client.secrets.kv.v2.read_secret_version(path=path, mount_point=MOUNT)
        data = existing["data"]["data"]
    except InvalidPath:
        return False
    if key not in data:
        return False
    del data[key]
    if data:
        client.secrets.kv.v2.create_or_update_secret(path=path, secret=data, mount_point=MOUNT)
    else:
        client.secrets.kv.v2.delete_metadata_and_all_versions(path=path, mount_point=MOUNT)
    return True


def delete_all_secrets(client: hvac.Client, project_id: uuid.UUID) -> None:
    try:
        client.secrets.kv.v2.delete_metadata_and_all_versions(
            path=_path(project_id), mount_point=MOUNT
        )
    except InvalidPath:
        pass


def list_secret_keys(client: hvac.Client, project_id: uuid.UUID) -> list[str]:
    return list(read_secrets(client, project_id).keys())
