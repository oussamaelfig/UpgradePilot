"""HTTP surface of flasknote."""

from flask import Flask, abort, jsonify, request

from flasknote import storage
from flasknote.encoders import NoteJSONEncoder
from flasknote.priorities import Priority


def create_app():
    """Build the flasknote application."""
    app = Flask(__name__)
    # Notes carry Priority values; the stock JSON machinery cannot serialize
    # them, so the app installs its own encoder.
    app.json_encoder = NoteJSONEncoder

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.post("/notes")
    def create_note():
        payload = request.get_json(force=True)
        title = (payload.get("title") or "").strip()
        body = payload.get("body") or ""
        if not title:
            abort(400, description="title is required")
        try:
            priority = Priority(payload.get("priority", Priority.DEFAULT))
        except ValueError:
            abort(400, description="unknown priority")
        note = storage.add(title=title, body=body, priority=priority)
        return jsonify(note), 201

    @app.get("/notes")
    def list_notes():
        notes = storage.all_notes()
        wanted = request.args.get("priority")
        if wanted is not None:
            try:
                wanted_priority = Priority(wanted)
            except ValueError:
                abort(400, description="unknown priority")
            notes = [note for note in notes if note["priority"] == wanted_priority]
        return jsonify({"notes": notes})

    @app.get("/notes/<int:note_id>")
    def get_note(note_id):
        note = storage.get(note_id)
        if note is None:
            abort(404)
        return jsonify(note)

    return app
