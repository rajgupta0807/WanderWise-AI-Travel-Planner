from tests.conftest import TRIP, make_user


def test_health_and_root(client):
    health = client.get("/api/health").json()
    assert health["status"] == "ok"
    assert health["database"]["status"] == "ok"
    assert health["database"]["mode"] in {"sqlite", "postgresql"}
    assert health["ai_engine"]["mode"] in {"api", "offline_templates"}
    assert client.get("/").status_code == 200


def test_auth_flow(client):
    headers = make_user(client, "auth@example.com")
    me = client.get("/api/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["email"] == "auth@example.com"

    dup = client.post("/api/auth/register", json={"email": "AUTH@example.com", "password": "Passw0rd!x"})
    assert dup.status_code == 409

    bad = client.post("/api/auth/login", json={"email": "auth@example.com", "password": "wrong-password"})
    assert bad.status_code == 401
    ok = client.post("/api/auth/login", json={"email": "auth@example.com", "password": "Passw0rd!x"})
    assert ok.status_code == 200 and ok.json()["access_token"]

    upd = client.patch("/api/me", json={"full_name": "New Name", "preferred_currency": "inr"}, headers=headers)
    assert upd.json()["full_name"] == "New Name"
    assert upd.json()["preferred_currency"] == "INR"


def test_validation_and_unauthorized(client):
    assert client.get("/api/trips").status_code == 401
    assert client.get("/api/me", headers={"Authorization": "Bearer nonsense"}).status_code == 401
    short = client.post("/api/auth/register", json={"email": "x@example.com", "password": "short"})
    assert short.status_code == 422
    bad_email = client.post("/api/auth/register", json={"email": "nope", "password": "Passw0rd!x"})
    assert bad_email.status_code == 422


def test_trip_lifecycle(client):
    headers = make_user(client, "trips@example.com")

    bad_dates = client.post("/api/trips", json={**TRIP, "end_date": "2026-12-01"}, headers=headers)
    assert bad_dates.status_code == 422

    created = client.post("/api/trips", json=TRIP, headers=headers)
    assert created.status_code == 201, created.text
    trip = created.json()
    assert trip["title"] == "Trip to Goa"
    assert trip["currency"] == "USD"
    assert trip["duration_days"] == 4 and len(trip["days"]) == 4
    assert all(len(d["activities"]) >= 2 for d in trip["days"])
    assert trip["days"][0]["date"] == "2026-12-20"
    budget = trip["budget_breakdown"]
    assert budget and not budget["is_over_budget"]
    assert budget["estimated_total"] <= TRIP["budget_amount"]

    tid = trip["id"]
    assert client.get(f"/api/trips/{tid}", headers=headers).json()["id"] == tid

    listing = client.get("/api/trips?search=goa&sort_by=start_date&sort_order=asc", headers=headers).json()
    assert listing["total"] == 1 and listing["items"][0]["id"] == tid
    assert client.get("/api/trips?search=paris", headers=headers).json()["total"] == 0

    patched = client.patch(f"/api/trips/{tid}", json={"title": "Goa Escape", "status": "confirmed"}, headers=headers)
    assert patched.json()["title"] == "Goa Escape" and patched.json()["status"] == "confirmed"
    assert client.patch(f"/api/trips/{tid}", json={"status": "bogus"}, headers=headers).status_code == 422

    old_ids = {d["id"] for d in trip["days"]}
    for path in ("regenerate", "generate"):
        again = client.post(f"/api/trips/{tid}/{path}", headers=headers)
        assert again.status_code == 200 and len(again.json()["days"]) == 4
    assert not old_ids & {d["id"] for d in again.json()["days"]}

    assert client.delete(f"/api/trips/{tid}", headers=headers).status_code == 204
    assert client.get(f"/api/trips/{tid}", headers=headers).status_code == 404


def test_itinerary_and_activities(client):
    headers = make_user(client, "itin@example.com")
    trip = client.post("/api/trips", json=TRIP, headers=headers).json()
    tid = trip["id"]

    days = client.get(f"/api/trips/{tid}/itinerary", headers=headers).json()
    assert len(days) == 4
    day = days[0]

    upd = client.patch(f"/api/trips/{tid}/days/{day['id']}", json={"title": "Arrival", "notes": "Late flight"}, headers=headers)
    assert upd.json()["title"] == "Arrival" and upd.json()["notes"] == "Late flight"

    regen = client.post(f"/api/trips/{tid}/days/{day['id']}/regenerate", json={"focus_preference": "adventure"}, headers=headers)
    assert regen.status_code == 200 and regen.json()["activities"]
    assert client.post(f"/api/trips/{tid}/days/{day['id']}/regenerate", headers=headers).status_code == 200

    new_act = {
        "title": "Beach sunset",
        "description": "Watch the sunset",
        "activity_type": "evening",
        "start_time": "17:30",
        "end_time": "19:00",
        "estimated_cost": 50,
        "location_name": "Baga Beach",
    }
    base = client.get(f"/api/trips/{tid}/itinerary", headers=headers).json()[0]["estimated_total"]
    made = client.post(f"/api/trips/{tid}/days/{day['id']}/activities", json=new_act, headers=headers)
    assert made.status_code == 201, made.text
    aid = made.json()["id"]
    after = client.get(f"/api/trips/{tid}/itinerary", headers=headers).json()[0]["estimated_total"]
    assert round(after - base, 2) == 50

    assert client.post(
        f"/api/trips/{tid}/days/{day['id']}/activities", json={**new_act, "start_time": "25:99"}, headers=headers
    ).status_code == 422

    edited = client.patch(f"/api/trips/{tid}/activities/{aid}", json={"estimated_cost": 80, "title": "Sunset cruise"}, headers=headers)
    assert edited.json()["estimated_cost"] == 80 and edited.json()["title"] == "Sunset cruise"

    assert client.delete(f"/api/trips/{tid}/activities/{aid}", headers=headers).status_code == 204
    assert client.delete(f"/api/trips/{tid}/activities/{aid}", headers=headers).status_code == 404
    final = client.get(f"/api/trips/{tid}/itinerary", headers=headers).json()[0]["estimated_total"]
    assert round(final, 2) == round(base, 2)



def test_guest_sessions_are_isolated(client):
    first = client.post("/api/auth/guest")
    second = client.post("/api/auth/guest")
    assert first.status_code == second.status_code == 200
    assert first.json()["user_id"] != second.json()["user_id"]
    assert first.json()["email"] != second.json()["email"]

    first_headers = {"Authorization": f"Bearer {first.json()['access_token']}"}
    second_headers = {"Authorization": f"Bearer {second.json()['access_token']}"}
    created = client.post("/api/trips", json=TRIP, headers=first_headers)
    assert created.status_code == 201
    assert client.get("/api/trips", headers=first_headers).json()["total"] == 1
    assert client.get("/api/trips", headers=second_headers).json()["total"] == 0

def test_users_cannot_see_each_others_trips(client):
    alice = make_user(client, "alice@example.com")
    bob = make_user(client, "bob@example.com")
    trip = client.post("/api/trips", json=TRIP, headers=alice).json()
    tid = trip["id"]
    day_id = trip["days"][0]["id"]

    assert client.get(f"/api/trips/{tid}", headers=bob).status_code == 404
    assert client.delete(f"/api/trips/{tid}", headers=bob).status_code == 404
    assert client.get(f"/api/trips/{tid}/itinerary", headers=bob).status_code == 404
    assert client.patch(f"/api/trips/{tid}/days/{day_id}", json={"title": "x"}, headers=bob).status_code == 404
    assert client.get("/api/trips", headers=bob).json()["total"] == 0
