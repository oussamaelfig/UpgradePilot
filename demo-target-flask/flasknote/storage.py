"""In-memory note store (deliberately simple; reset between tests)."""

_notes = {}
_next_id = 1


def add(title, body, priority):
    """Store a note and return it."""
    global _next_id
    note = {"id": _next_id, "title": title, "body": body, "priority": priority}
    _notes[note["id"]] = note
    _next_id += 1
    return note


def get(note_id):
    """Return the note with this id, or None."""
    return _notes.get(note_id)


def all_notes():
    """All notes in insertion order."""
    return [_notes[note_id] for note_id in sorted(_notes)]


def reset():
    """Drop every note and restart id numbering."""
    global _next_id
    _notes.clear()
    _next_id = 1
