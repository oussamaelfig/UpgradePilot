"""Global OpenAI SDK configuration for briefbot."""

import os

import openai

# getattr keeps this module importable even if the installed SDK no longer
# exposes api_base; the failure then surfaces at the call sites that use it.
_DEFAULT_API_BASE = getattr(openai, "api_base", None)


def configure():
    """Configure the OpenAI SDK from the environment.

    OPENAI_API_KEY is required. OPENAI_API_BASE optionally points the SDK at a
    different API host (used by the offline test suite); when absent, the SDK
    default is restored so reconfiguration never leaves a stale endpoint.
    """
    openai.api_key = os.environ["OPENAI_API_KEY"]
    api_base = os.environ.get("OPENAI_API_BASE", _DEFAULT_API_BASE)
    if api_base is not None:
        openai.api_base = api_base
