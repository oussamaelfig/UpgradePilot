"""Server-side HTML preview of a note."""

from flask import escape


def render_note_preview(title, body):
    """Render a note as an HTML snippet; user content is escaped."""
    return f"<article><h2>{escape(title)}</h2><p>{escape(body)}</p></article>"
