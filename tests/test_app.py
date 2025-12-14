from fastapi.testclient import TestClient
import pytest

from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert "Programming Class" in data


def test_signup_and_unregister_flow():
    activity = "Programming Class"
    email = "testuser+pytest@mergington.edu"

    # Ensure clean start
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Signup should succeed
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Signed up {email} for {activity}"
    assert email in activities[activity]["participants"]

    # Duplicate signup should be rejected
    resp2 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp2.status_code == 400

    # Unregister should succeed
    resp3 = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert resp3.status_code == 200
    assert email not in activities[activity]["participants"]

    # Unregistering again should fail
    resp4 = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert resp4.status_code == 400
