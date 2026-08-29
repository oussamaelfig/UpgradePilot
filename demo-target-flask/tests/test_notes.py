def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.get_json() == {"status": "ok"}


def test_create_note_returns_stored_payload(client):
    resp = client.post(
        "/notes", json={"title": "Groceries", "body": "Milk, eggs", "priority": "high"}
    )
    assert resp.status_code == 201
    note = resp.get_json()
    assert note["id"] == 1
    assert note["title"] == "Groceries"
    assert note["body"] == "Milk, eggs"
    assert note["priority"] == "high"


def test_create_note_requires_title(client):
    resp = client.post("/notes", json={"body": "no title"})
    assert resp.status_code == 400


def test_get_note_by_id(client):
    created = client.post("/notes", json={"title": "One", "body": "first"}).get_json()
    resp = client.get(f"/notes/{created['id']}")
    assert resp.status_code == 200
    assert resp.get_json()["title"] == "One"


def test_missing_note_is_404(client):
    assert client.get("/notes/999").status_code == 404


def test_filter_notes_by_priority(client):
    client.post("/notes", json={"title": "A", "body": "", "priority": "low"})
    client.post("/notes", json={"title": "B", "body": "", "priority": "high"})
    resp = client.get("/notes?priority=high")
    titles = [note["title"] for note in resp.get_json()["notes"]]
    assert titles == ["B"]
