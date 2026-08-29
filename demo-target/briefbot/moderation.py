"""Content screening via the OpenAI moderation endpoint."""

import openai


def is_safe(text):
    """Return True when the text passes moderation, False when flagged."""
    response = openai.Moderation.create(input=text)
    return not response["results"][0]["flagged"]
