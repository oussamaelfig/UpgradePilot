"""Production entrypoint (``gunicorn flasknote.wsgi:app``)."""

from flasknote.app import create_app
from flasknote.bootstrap import seed_welcome_note

app = create_app()


@app.before_first_request
def _bootstrap():
    """Seed reference content the first time the app serves a request."""
    seed_welcome_note()
