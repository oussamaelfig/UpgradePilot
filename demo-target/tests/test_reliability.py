import pytest

from briefbot import reliability, summarizer
from tests.stub_server import SUMMARY_TEXT


def test_recovers_from_transient_rate_limits(stub):
    notes = "Standup notes [flaky:transient-1] about the release."
    summary = reliability.call_with_retry(summarizer.summarize_notes, notes, retries=4, backoff_seconds=0)
    assert summary == SUMMARY_TEXT
    # Two 429s were served before the success, so the API saw at least 3 requests.
    assert stub.marker_count("flaky", "transient-1") >= 3


def test_persistent_failure_raises_upstream_error(stub):
    notes = "Standup notes [fail:always-down] about the release."
    with pytest.raises(reliability.UpstreamError):
        reliability.call_with_retry(summarizer.summarize_notes, notes, retries=2, backoff_seconds=0)
    assert stub.marker_count("fail", "always-down") >= 2
