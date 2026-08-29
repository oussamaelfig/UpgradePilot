import os

import pytest

from tests.stub_server import start_stub_server


@pytest.fixture(scope="session")
def stub():
    server = start_stub_server()
    os.environ["OPENAI_API_KEY"] = "test-key-123"
    os.environ["OPENAI_API_BASE"] = server.base_url

    from briefbot import config

    config.configure()
    yield server
    server.shutdown()
