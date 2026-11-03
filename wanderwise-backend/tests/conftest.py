import os
import pathlib

TEST_DB = pathlib.Path(__file__).parent / "test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

# Must be set before the app is imported.
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-hs256"
os.environ["AI_API_KEY"] = ""
os.environ["APP_ENV"] = "test"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c
    engine.dispose()
    if TEST_DB.exists():
        TEST_DB.unlink()


def make_user(client, email="user@example.com", password="Passw0rd!x"):
    r = client.post("/api/auth/register", json={"email": email, "password": password, "full_name": "Test User"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


TRIP = {
    "destination": "Goa",
    "country": "India",
    "start_date": "2026-12-20",
    "end_date": "2026-12-23",
    "traveler_count": 2,
    "budget_amount": 2000,
    "currency": "usd",
    "interests": ["food", "nature"],
}
