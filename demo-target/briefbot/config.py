"""Global OpenAI SDK configuration for briefbot."""

import os

import openai


def configure():
    """Configure the OpenAI SDK from the environment.

    OPENAI_API_KEY is required. OPENAI_API_BASE optionally points the SDK at a
    different API host (used by the offline test suite).
    """
    openai.api_key = os.environ["OPENAI_API_KEY"]
    api_base = os.environ.get("OPENAI_API_BASE")
    if api_base:
        openai.api_base = api_base
