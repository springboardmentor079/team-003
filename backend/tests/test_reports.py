"""Reports & Documentation (document module 10) incl. PDF / Excel export."""
import pytest

from app.config import settings
from tests.conftest import auth

API = settings.API_V1_STR

REPORT_TYPES = ["project-progress", "resources", "workforce", "procurement", "budget-cost"]


def test_report_requires_authentication(client):
    assert client.get(f"{API}/reports/project-progress").status_code == 401


@pytest.mark.parametrize("report_type", REPORT_TYPES)
def test_report_generates_json(client, admin_token, report_type):
    response = client.get(f"{API}/reports/{report_type}", headers=auth(admin_token))
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["report_type"] == report_type
    assert "summary" in body
    assert isinstance(body["data"], list)


def test_report_export_pdf_is_valid(client, admin_token):
    response = client.get(
        f"{API}/reports/exports/project-progress?format=pdf", headers=auth(admin_token)
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_report_export_xlsx_is_valid(client, admin_token):
    response = client.get(
        f"{API}/reports/exports/project-progress?format=xlsx", headers=auth(admin_token)
    )
    assert response.status_code == 200
    assert "spreadsheetml" in response.headers["content-type"]
    # XLSX is a zip archive — it must start with the PK signature.
    assert response.content.startswith(b"PK")


def test_report_export_rejects_invalid_format(client, admin_token):
    response = client.get(
        f"{API}/reports/exports/project-progress?format=csv", headers=auth(admin_token)
    )
    assert response.status_code == 422
