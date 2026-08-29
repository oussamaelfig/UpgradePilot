"""Global OpenAI SDK configuration for briefbot."""

import os

import openai

_DEFAULT_API_BASE = openai.api_base


def configure():
    """Configure the OpenAI SDK from the environment.

    OPENAI_API_KEY is required. OPENAI_API_BASE optionally points the SDK at a
    different API host (used by the offline test suite); when absent, the SDK
    default is restored so reconfiguration never leaves a stale endpoint.
    """
    openai.api_key = os.environ["OPENAI_API_KEY"]
    openai.api_base = os.environ.get("OPENAI_API_BASE", _DEFAULT_API_BASE)
