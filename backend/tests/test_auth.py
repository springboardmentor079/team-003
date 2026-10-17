"""Authentication, JWT and role-based access control (document module 1)."""
from app.config import settings
from tests.conftest import auth

API = settings.API_V1_STR


def test_login_success_returns_jwt(client):
    response = client.post(
        f"{API}/auth/login/json",
        json={"email": "admin@buildtrack.com", "password": "admin123"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["role"] == "administrator"


def test_login_wrong_password_rejected(client):
    response = client.post(
        f"{API}/auth/login/json",
        json={"email": "admin@buildtrack.com", "password": "not-the-password"},
    )
    assert response.status_code == 401


def test_login_unknown_user_rejected(client):
    response = client.post(
        f"{API}/auth/login/json",
        json={"email": "ghost@buildtrack.com", "password": "whatever123"},
    )
    assert response.status_code == 401


def test_me_requires_authentication(client):
    assert client.get(f"{API}/auth/me").status_code == 401


def test_me_returns_current_profile(client, admin_token):
    response = client.get(f"{API}/auth/me", headers=auth(admin_token))
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "admin@buildtrack.com"
    assert body["role"] == "administrator"
    assert body["is_active"] is True


def test_register_then_login(client):
    email = "newhire@buildtrack.com"
    created = client.post(
        f"{API}/auth/register",
        json={
            "email": email,
            "password": "newhire123",
            "full_name": "New Hire",
            "phone": "+1-555-0199",
            "role": "site_engineer",
        },
    )
    assert created.status_code == 201, created.text
    assert created.json()["email"] == email

    login = client.post(
        f"{API}/auth/login/json", json={"email": email, "password": "newhire123"}
    )
    assert login.status_code == 200


def test_register_duplicate_email_rejected(client):
    response = client.post(
        f"{API}/auth/register",
        json={
            "email": "admin@buildtrack.com",
            "password": "admin123",
            "full_name": "Duplicate",
            "role": "site_engineer",
        },
    )
    assert response.status_code == 400


def test_rbac_admin_can_list_users(client, admin_token):
    response = client.get(f"{API}/auth/users", headers=auth(admin_token))
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_rbac_worker_cannot_list_users(client, worker_token):
    # /auth/users is restricted to Administrator and Project Manager.
    response = client.get(f"{API}/auth/users", headers=auth(worker_token))
    assert response.status_code == 403
