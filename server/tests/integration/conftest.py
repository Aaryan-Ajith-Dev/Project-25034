import pytest
from fastapi.testclient import TestClient
from server.main import app

@pytest.fixture(scope="session")
def test_user_token():
    """
    Creates a single test user for all tests in the module,
    logs in, yields the token, and deletes the user at the end.
    """
    with TestClient(app) as client:
        # Create the user
        payload = {
            "name": "Test User8",
            "email": "test8@example.com",
            "phone": "1234567890",
            "location": "Test City",
            "summary": "This is a test user.",
            "skills": "Python,FastAPI,Testing",
            "password": "securepassword",
            "role": "Developer"
        }
        signup_resp = client.post("/auth/signup", json=payload)
        assert signup_resp.status_code == 200

        # Log in
        login_resp = client.post("/auth/login", json={"email": payload["email"], "password": payload["password"]})
        assert login_resp.status_code == 200
        token = login_resp.json()["token"]

        # Provide token to tests
        yield token


@pytest.fixture(scope="session")
def test_job_id(test_user_token):
    """
    Creates a test job and yields the job ID for use in tests.
    """
    with TestClient(app) as client:
        job_payload = {
            "id": "test-job-id8",
            "title": "Test Job8",
            "company": "Test Company",
            "location": "Remote",
            "employmentType": "Full-Time",
            "description": "This is a test job description.",
            "salaryMin": 50000,
            "salaryMax": 100000,
            "currency": "USD",
        }

        resp = client.post(
            "/jobs", 
            json=job_payload,
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert resp.status_code == 200
        yield resp.json()["id"]


