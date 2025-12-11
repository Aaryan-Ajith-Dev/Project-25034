import pytest
from fastapi.testclient import TestClient
from server.main import app

def test_search_jobs(test_user_token, test_job_id):
    """Test filtering jobs by company/title"""
    with TestClient(app) as client:
        resp = client.get(
            "/jobs/filter",
            params=[("search", "Test Company")],  # match company from your fixture
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert resp.status_code == 200
        results = resp.json()
        assert any(job["id"] == test_job_id for job in results)


def test_delete_job(test_user_token, test_job_id):
    """Test deleting the job"""
    with TestClient(app) as client:
        resp = client.delete(
            f"/jobs/{test_job_id}",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert resp.status_code == 200

        # Optionally verify that fetching the job now returns 404
        resp2 = client.get(
            f"/jobs/{test_job_id}",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert resp2.status_code == 404
