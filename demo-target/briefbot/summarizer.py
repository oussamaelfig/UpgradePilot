"""Meeting-notes summarization."""

import openai

SYSTEM_PROMPT = (
    "You are a meeting-notes assistant. Summarize the notes into decisions and "
    "action items, one per line, starting each line with '- '."
)

MODEL = "gpt-4o-mini"


def summarize_notes(notes):
    """Summarize raw meeting notes into decisions and action items."""
    response = openai.ChatCompletion.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": notes},
        ],
        temperature=0.2,
    )
    return response["choices"][0]["message"]["content"].strip()
