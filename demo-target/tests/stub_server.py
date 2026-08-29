"""A local, deterministic stub of the OpenAI REST API.

The app under test is pointed here via OPENAI_API_BASE. Responses use the plain
OpenAI REST JSON shapes, so the stub works identically for any SDK version that
speaks the same HTTP API.

Special request markers (embedded in message/input text) drive failure modes:

- ``[flaky:<id>]`` — the first two requests carrying this id get HTTP 429,
  subsequent ones succeed. Exercises rate-limit retry behavior.
- ``[fail:<id>]`` — every request carrying this id gets HTTP 500.
"""

import json
import re
import threading
from collections import defaultdict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

SUMMARY_TEXT = "- Decision: migrate the billing service\n- Action: Sam owns the rollout plan"

# Keyword -> orthogonal basis dimension for deterministic embeddings.
_EMBED_KEYWORDS = ("budget", "deploy", "hiring")

_FLAKY_FAILURES_BEFORE_SUCCESS = 2

_MARKER_RE = re.compile(r"\[(flaky|fail):([\w-]+)\]")


def _embed(text):
    lowered = text.lower()
    vector = [1.0 if keyword in lowered else 0.0 for keyword in _EMBED_KEYWORDS]
    vector.append(0.1)  # shared bias dimension so no vector is all-zero
    return vector


class _State:
    def __init__(self):
        self.lock = threading.Lock()
        self.marker_counts = defaultdict(int)
        self.requests = defaultdict(list)  # endpoint -> [(headers, body), ...]

    def record(self, endpoint, headers, body):
        with self.lock:
            self.requests[endpoint].append((dict(headers), body))

    def bump_marker(self, marker):
        with self.lock:
            self.marker_counts[marker] += 1
            return self.marker_counts[marker]

    def marker_count(self, marker):
        with self.lock:
            return self.marker_counts[marker]


class _Handler(BaseHTTPRequestHandler):
    state = None  # set by start_stub_server

    def log_message(self, *args):  # silence request logging in test output
        pass

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(length) or b"{}")

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _maybe_fail(self, text):
        """Apply [flaky:*]/[fail:*] markers. Returns True when a failure was sent."""
        match = _MARKER_RE.search(text)
        if not match:
            return False
        kind, marker_id = match.group(1), match.group(2)
        marker = "{}:{}".format(kind, marker_id)
        count = self.state.bump_marker(marker)
        if kind == "fail":
            self._send_json(500, {"error": {"message": "stub internal error", "type": "server_error"}})
            return True
        if count <= _FLAKY_FAILURES_BEFORE_SUCCESS:
            self._send_json(
                429,
                {"error": {"message": "stub rate limit", "type": "rate_limit_error", "code": "rate_limit_exceeded"}},
            )
            return True
        return False

    def do_POST(self):
        body = self._read_body()

        if self.path.endswith("/chat/completions"):
            self.state.record("chat", self.headers, body)
            text = " ".join(str(m.get("content", "")) for m in body.get("messages", []))
            if self._maybe_fail(text):
                return
            self._send_json(
                200,
                {
                    "id": "chatcmpl-stub",
                    "object": "chat.completion",
                    "created": 1700000000,
                    "model": body.get("model", "stub"),
                    "choices": [
                        {
                            "index": 0,
                            "message": {"role": "assistant", "content": SUMMARY_TEXT + "\n"},
                            "finish_reason": "stop",
                        }
                    ],
                    "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
                },
            )
            return

        if self.path.endswith("/embeddings"):
            self.state.record("embeddings", self.headers, body)
            inputs = body.get("input", [])
            if isinstance(inputs, str):
                inputs = [inputs]
            data = [
                {"object": "embedding", "index": i, "embedding": _embed(text)}
                for i, text in enumerate(inputs)
            ]
            self._send_json(
                200,
                {
                    "object": "list",
                    "data": data,
                    "model": body.get("model", "stub"),
                    "usage": {"prompt_tokens": 5, "total_tokens": 5},
                },
            )
            return

        if self.path.endswith("/moderations"):
            self.state.record("moderations", self.headers, body)
            text = body.get("input", "")
            if isinstance(text, list):
                text = " ".join(text)
            flagged = "attack" in text.lower()
            self._send_json(
                200,
                {
                    "id": "modr-stub",
                    "model": "text-moderation-stub",
                    "results": [
                        {
                            "flagged": flagged,
                            "categories": {"violence": flagged},
                            "category_scores": {"violence": 0.99 if flagged else 0.0},
                        }
                    ],
                },
            )
            return

        self._send_json(404, {"error": {"message": "unknown stub path {}".format(self.path), "type": "invalid_request_error"}})


class StubServer:
    def __init__(self, server, state):
        self._server = server
        self.state = state
        self.port = server.server_address[1]

    @property
    def base_url(self):
        return "http://127.0.0.1:{}/v1".format(self.port)

    def marker_count(self, kind, marker_id):
        return self.state.marker_count("{}:{}".format(kind, marker_id))

    def requests_for(self, endpoint):
        return list(self.state.requests[endpoint])

    def shutdown(self):
        self._server.shutdown()
        self._server.server_close()


def start_stub_server():
    state = _State()
    handler = type("BoundHandler", (_Handler,), {"state": state})
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return StubServer(server, state)
