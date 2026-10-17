"""Request validation and auth guards (document module 1 / testing task)."""
from app.config import settings
from tests.conftest import auth

API = settings.API_V1_STR


def test_login_missing_fields_returns_422(client):
    # No password field -> Pydantic validation error.
    response = client.post(f"{API}/auth/login/json", json={"email": "admin@buildtrack.com"})
    assert response.status_code == 422


def test_register_invalid_email_returns_422(client):
    response = client.post(
        f"{API}/auth/register",
        json={"email": "not-an-email", "password": "secret123", "full_name": "X"},
    )
    assert response.status_code == 422


def test_bad_token_returns_401(client):
    response = client.get(f"{API}/auth/me", headers=auth("obviously.invalid.token"))
    assert response.status_code == 401


def test_unknown_project_returns_404(client, admin_token):
    response = client.get(f"{API}/projects/999999", headers=auth(admin_token))
    assert response.status_code == 404


def test_health_and_root_are_public(client):
    assert client.get("/health").status_code == 200
    assert client.get("/").status_code == 200
