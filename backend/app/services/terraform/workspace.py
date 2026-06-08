import os
import shutil
import uuid
from pathlib import Path

WORKSPACES_ROOT = Path("/terraform/workspaces")


class WorkspaceManager:
    def __init__(self, project_id: uuid.UUID):
        self.project_id = str(project_id)
        self.path = WORKSPACES_ROOT / self.project_id

    def setup(self) -> None:
        self.path.mkdir(parents=True, exist_ok=True)

    def write_main_tf(self, content: str) -> None:
        (self.path / "main.tf").write_text(content)

    def write_variables_tf(self, content: str) -> None:
        (self.path / "variables.tf").write_text(content)

    def read_main_tf(self) -> str | None:
        tf_file = self.path / "main.tf"
        return tf_file.read_text() if tf_file.exists() else None

    def read_variables_tf(self) -> str | None:
        tf_file = self.path / "variables.tf"
        return tf_file.read_text() if tf_file.exists() else None

    def exists(self) -> bool:
        return self.path.exists()

    def destroy(self) -> None:
        if self.path.exists():
            shutil.rmtree(self.path)

    def get_state_path(self) -> Path:
        return self.path / "terraform.tfstate"

    def has_state(self) -> bool:
        return self.get_state_path().exists()

    def get_plan_path(self) -> Path:
        return self.path / "tfplan"
