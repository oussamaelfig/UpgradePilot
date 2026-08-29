import pytest

from flasknote import storage
from flasknote.app import create_app


@pytest.fixture()
def client():
    storage.reset()
    app = create_app()
    app.testing = True
    return app.test_client()
