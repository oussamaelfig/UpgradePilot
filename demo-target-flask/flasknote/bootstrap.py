"""One-time application bootstrap."""

from flasknote import storage
from flasknote.priorities import Priority

WELCOME_TITLE = "Welcome to flasknote"
WELCOME_BODY = "Create your first note with POST /notes."


def seed_welcome_note():
    """Seed the welcome note. Callers guarantee this runs exactly once."""
    storage.add(title=WELCOME_TITLE, body=WELCOME_BODY, priority=Priority("normal"))
