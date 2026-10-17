"""Project, resource, inventory and workforce modules (Milestone 2)."""
import pytest

from app.config import settings
from tests.conftest import auth

API = settings.API_V1_STR


def test_projects_require_authentication(client):
    assert client.get(f"{API}/projects").status_code == 401


def test_projects_list_returns_seeded_projects(client, admin_token):
    response = client.get(f"{API}/projects", headers=auth(admin_token))
    assert response.status_code == 200
    projects = response.json()
    assert isinstance(projects, list)
    assert len(projects) >= 1
    first = projects[0]
    assert {"id", "name", "status", "budget"} <= set(first)


def test_project_detail_includes_milestones(client, admin_token):
    response = client.get(f"{API}/projects/1", headers=auth(admin_token))
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 1
    assert "milestones" in body


@pytest.mark.parametrize(
    "path",
    ["/resources", "/inventory", "/workforce/workers", "/workforce/attendance"],
)
def test_module_lists_return_ok(client, admin_token, path):
    response = client.get(f"{API}{path}", headers=auth(admin_token))
    assert response.status_code == 200
    assert isinstance(response.json(), list)
