from flasknote import wsgi
from flasknote.bootstrap import WELCOME_TITLE


def test_first_request_seeds_welcome_note_exactly_once():
    client = wsgi.app.test_client()
    client.get("/health")
    client.get("/health")
    resp = client.get("/notes")
    titles = [note["title"] for note in resp.get_json()["notes"]]
    assert titles.count(WELCOME_TITLE) == 1
