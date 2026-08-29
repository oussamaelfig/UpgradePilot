"""Retry handling for transient OpenAI API failures."""

import time

import openai.error


class UpstreamError(RuntimeError):
    """Raised when the OpenAI API keeps failing after all retries."""


def call_with_retry(fn, *args, **kwargs):
    """Call fn, retrying on rate limits and transient API errors.

    Retries up to `retries` times (keyword-only, default 3) with a small
    linear backoff, then raises UpstreamError.
    """
    retries = kwargs.pop("retries", 3)
    backoff_seconds = kwargs.pop("backoff_seconds", 0.05)
    last_error = None
    for attempt in range(retries):
        try:
            return fn(*args, **kwargs)
        except (openai.error.RateLimitError, openai.error.APIError) as exc:
            last_error = exc
            time.sleep(backoff_seconds * (attempt + 1))
    raise UpstreamError("OpenAI API failed after {} attempts: {}".format(retries, last_error))
