"""
Analytics dashboard (document module 9).

Includes a regression test for the fix where the role-summary endpoint
returned HTTP 500 ("no such table: purchase_orders") because the procurement
tables were missing. These tests guarantee the charts endpoint stays healthy.
"""
from app.config import settings
from tests.conftest import auth

API = settings.API_V1_STR

EXPECTED_CHART_KEYS = {
    "project_progress",
    "procurement_status",
    "resource_status",
    "workforce_trades",
}


def test_role_summary_requires_authentication(client):
    assert client.get(f"{API}/analytics/dashboard/role-summary").status_code == 401


def test_role_summary_returns_dashboard_with_charts(client, admin_token):
    # Regression: this used to 500 on "no such table: purchase_orders".
    response = client.get(
        f"{API}/analytics/dashboard/role-summary", headers=auth(admin_token)
    )
    assert response.status_code == 200, response.text
    body = response.json()

    assert body["user_role"] == "administrator"
    assert "financial" in body and "budget_total" in body["financial"]
    assert EXPECTED_CHART_KEYS <= set(body["charts"])

    # project_progress is a list of per-project points.
    assert isinstance(body["charts"]["project_progress"], list)

    # Distribution charts share a labels/values shape.
    procurement = body["charts"]["procurement_status"]
    assert set(procurement) == {"labels", "values"}
    assert len(procurement["labels"]) == len(procurement["values"])


def test_project_analytics_summary(client, admin_token):
    response = client.get(f"{API}/analytics/project/1", headers=auth(admin_token))
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["project_id"] == 1
    for field in (
        "total_budget",
        "spent_budget",
        "budget_remaining",
        "overall_progress_percentage",
    ):
        assert field in body
