from briefbot import summarizer
from tests.stub_server import SUMMARY_TEXT

NOTES = "Long meeting about the billing migration. Sam volunteered to own the rollout plan."


def test_returns_summary_text(stub):
    assert summarizer.summarize_notes(NOTES) == SUMMARY_TEXT


def test_summary_is_whitespace_stripped(stub):
    summary = summarizer.summarize_notes(NOTES)
    assert summary == summary.strip()


def test_sends_model_and_notes_to_api(stub):
    summarizer.summarize_notes(NOTES)
    _, body = stub.requests_for("chat")[-1]
    assert body["model"] == summarizer.MODEL
    roles = [message["role"] for message in body["messages"]]
    assert roles == ["system", "user"]
    assert body["messages"][1]["content"] == NOTES


def test_api_key_sent_as_bearer_token(stub):
    summarizer.summarize_notes(NOTES)
    headers, _ = stub.requests_for("chat")[-1]
    auth = {k.lower(): v for k, v in headers.items()}.get("authorization")
    assert auth == "Bearer test-key-123"
