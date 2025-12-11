from fastapi.testclient import TestClient
from server.main import app

def test_update_user_profile(test_user_token, test_job_id):
    """Update profile for the shared test user"""
    with TestClient(app) as client:
        update_payload = {"location": "Updated City", "skills": "Python,FastAPI,SQL"}
        resp = client.put(
            "/user/me",
            json=update_payload,
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["location"] == "Updated City"
        assert "SQL" in data["skills"]

def test_get_profile(test_user_token, test_job_id):
    """Fetch profile of shared test user"""
    with TestClient(app) as client:
        resp = client.get(
            "/user/me",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        # assert data["email"] == "test0@example.com"

def test_put_recommendations(test_user_token, test_job_id):
    """Update job recommendations for the shared test user"""
    with TestClient(app) as client:
        resp = client.post(
            "/user/recommendations",
            json={"job_id": test_job_id},
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert resp.status_code == 200
        data = resp.json()

def test_get_recommendations(test_user_token, test_job_id):
    """Fetch job recommendations for the shared test user"""
    with TestClient(app) as client:
        resp = client.get(
            "/user/recommendations",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)  # Assuming recommendations are a list of jobs
        assert len(data) > 0  # Ensure there are some recommendations

def test_reset_recommendations(test_user_token, test_job_id):
    """Reset job recommendations for the shared test user"""
    with TestClient(app) as client:
        resp = client.get(
            "/user/recommendations/reset",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["message"] == "Recommendations reset successfully"

def test_delete_user_profile(test_user_token, test_job_id):
    with TestClient(app) as client:
        resp = client.delete("/user/me", headers={"Authorization": f"Bearer {test_user_token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["message"] == "User account deleted successfully"
