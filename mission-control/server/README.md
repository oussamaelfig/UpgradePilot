# Mission Control server

Mission event store + agent-facing MCP server + dashboard API. Listens on
`http://127.0.0.1:4100` by default and serves the built dashboard from
`mission-control/web/dist` when present.

## Running

```bash
npm start        # tsx src/index.ts
npm run dev      # watch mode
npm test         # vitest (supertest HTTP-level tests)
```

Configuration (environment variables):

| Variable        | Default                    | Purpose                                   |
| --------------- | -------------------------- | ----------------------------------------- |
| `PORT`          | `4100`                     | HTTP listen port                          |
| `MC_STATE_FILE` | `data/mission-state.json`  | Mission state persistence file            |
| `MC_TOKEN`      | _(unset)_                  | If set, `POST /mcp` requires `Bearer` auth |

## HTTP surface

| Method   | Path                          | Behavior                                                        |
| -------- | ----------------------------- | --------------------------------------------------------------- |
| `POST`   | `/mcp`                        | Agent-facing MCP endpoint (stateless streamable HTTP, JSON-RPC) |
| `GET`    | `/mcp`                        | `405 Method Not Allowed` — see transport contract below         |
| `DELETE` | `/mcp`                        | `405 Method Not Allowed` — see transport contract below         |
| `GET`    | `/api/mission`                | Active mission snapshot + status + last event seq               |
| `GET`    | `/api/stream?since=N`         | SSE: replay events after seq `N`, then live (15s heartbeat)     |
| `POST`   | `/api/approvals/:id/decision` | Human approval decision from the dashboard                      |

## MCP transport contract

The `/mcp` endpoint is a **stateless** streamable-HTTP transport: every `POST`
carries a complete JSON-RPC exchange, and no session or server-initiated stream
exists between requests.

Streamable-HTTP clients still probe the other transport methods per spec —
`GET /mcp` to open a server-initiated SSE stream and `DELETE /mcp` to tear down
a session. Following the MCP SDK's documented stateless-server convention, both
answer:

- Status `405 Method Not Allowed` with header `Allow: POST`
- Body: `{"jsonrpc":"2.0","error":{"code":-32000,"message":"Method not allowed."},"id":null}`

This tells clients cleanly that only `POST` is supported instead of surfacing
Express's default `404`, which clients (e.g. TrueForge) would log as a remote
transport error and retry. The 405 responses are deliberately unauthenticated:
they expose no mission state, and `MC_TOKEN` auth continues to apply to
`POST /mcp` only.
