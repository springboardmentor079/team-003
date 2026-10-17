"""
Pytest fixtures for the BuildTrack API test suite (Milestone 4 / 7 — testing
and validations).

A dedicated, throwaway SQLite database is used so tests never touch the
developer's buildtrack.db. The environment variable is set *before* the app is
imported so pydantic-settings (env vars outrank the .env file) points the
engine at the temporary file. The FastAPI lifespan then creates the tables and
seeds the demo data when the TestClient starts up.
"""
import os
import tempfile

import pytest

# Isolate the database before anything imports app.config / app.database.
_TMP_DB = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_TMP_DB.close()
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DB.name}"
os.environ["BUILDTRACK_UPLOAD_DIR"] = tempfile.mkdtemp(prefix="buildtrack_uploads_")

from fastapi.testclient import TestClient  # noqa: E402

from app.config import settings  # noqa: E402
from app.main import app  # noqa: E402

# Fail loudly if the override did not take effect — otherwise tests would run
# against the real database.
assert settings.DATABASE_URL.endswith(".db")
assert _TMP_DB.name.replace("\\", "/") in settings.DATABASE_URL.replace("\\", "/"), (
    f"Test DB override failed: settings.DATABASE_URL={settings.DATABASE_URL!r}"
)

API = settings.API_V1_STR

# Credentials created by app/seed.py (one per role, plus the worker account).
CREDENTIALS = {
    "administrator": ("admin@buildtrack.com", "admin123"),
    "project_manager": ("manager@buildtrack.com", "manager123"),
    "site_engineer": ("engineer@buildtrack.com", "engineer123"),
    "contractor": ("contractor@buildtrack.com", "contractor123"),
    "client": ("client@buildtrack.com", "client123"),
    "worker": ("worker@buildtrack.com", "worker123"),
}


@pytest.fixture(scope="session")
def client():
    # The context manager runs the lifespan: create_all + seed_database.
    with TestClient(app) as test_client:
        yield test_client


def _token(client, role: str) -> str:
    email, password = CREDENTIALS[role]
    response = client.post(f"{API}/auth/login/json", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture(scope="session")
def admin_token(client):
    return _token(client, "administrator")


@pytest.fixture(scope="session")
def manager_token(client):
    return _token(client, "project_manager")


@pytest.fixture(scope="session")
def worker_token(client):
    return _token(client, "worker")


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
