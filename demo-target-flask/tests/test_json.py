import pytest

from flasknote.priorities import Priority


@pytest.mark.parametrize("label", Priority.LEVELS)
def test_note_priority_serializes_as_label(client, label):
    resp = client.post("/notes", json={"title": "t", "body": "b", "priority": label})
    assert resp.status_code == 201
    assert resp.get_json()["priority"] == label
