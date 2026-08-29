import type { Request, Response } from "express";
import { Router, json } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildMcpServer } from "./mcp.js";
import { MissionStore, MissionStoreError } from "./mission.js";
import { ApprovalDecisionSchema } from "./schemas.js";

/**
 * HTTP surface:
 *  - POST /mcp                          agent-facing MCP endpoint (stateless streamable HTTP)
 *  - GET  /api/mission                  active mission snapshot + last event seq
 *  - GET  /api/stream?since=N           SSE: replay events after N, then live
 *  - POST /api/approvals/:id/decision   human approval decision from the dashboard
 */
export function buildRouter(store: MissionStore, options: { mcpToken?: string } = {}): Router {
  const router = Router();
  router.use(json({ limit: "2mb" }));

  router.post("/mcp", async (req: Request, res: Response) => {
    if (options.mcpToken) {
      const auth = req.headers.authorization;
      if (auth !== `Bearer ${options.mcpToken}`) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
    }
    // Express 4 does not surface rejected promises from async handlers; an
    // uncaught transport failure would hang the request and crash the process
    // on unhandled rejection instead of returning a controlled error.
    try {
      const server = buildMcpServer(store);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("mission-control: /mcp request failed:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "internal server error" },
          id: null,
        });
      } else {
        res.end();
      }
    }
  });

  router.get("/api/mission", (_req, res) => {
    if (!store.hasActiveMission()) {
      res.status(404).json({ error: "no active mission" });
      return;
    }
    res.json({ mission: store.snapshot(), last_seq: store.lastSeq() });
  });

  router.get("/api/stream", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    const sinceParam = req.query.since ?? req.headers["last-event-id"];
    const since = Number.parseInt(String(sinceParam ?? "0"), 10) || 0;

    const send = (event: { seq: number; type: string; data: unknown; ts: string }) => {
      res.write(`id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    };

    // If the client's requested position falls outside the retained window —
    // older than capped history, or newer than the store's own sequence (the
    // store was reset or replaced) — say so explicitly instead of silently
    // serving an incomplete suffix; clients should refetch the snapshot.
    const oldest = store.oldestAvailableSeq();
    const behindWindow = since > 0 && oldest !== null && since < oldest - 1;
    const aheadOfStore = since > store.lastSeq();
    if (behindWindow || aheadOfStore) {
      res.write(
        `event: replay_gap\ndata: ${JSON.stringify({
          requested_since: since,
          oldest_available: oldest,
          last_seq: store.lastSeq(),
        })}\n\n`,
      );
    }

    for (const event of store.eventsSince(since)) send(event);
    const unsubscribe = store.subscribe(send);
    const heartbeat = setInterval(() => res.write(": ping\n\n"), 15_000);
    req.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  router.post("/api/approvals/:id/decision", (req, res) => {
    const parsed = ApprovalDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid decision payload", details: parsed.error.flatten() });
      return;
    }
    try {
      const approval = store.decideApproval(String(req.params.id), parsed.data);
      res.json({ approval });
    } catch (error) {
      if (error instanceof MissionStoreError) {
        const status = error.code === "unknown_approval" ? 404 : 409;
        res.status(status).json({ error: error.message, code: error.code });
        return;
      }
      throw error;
    }
  });

  return router;
}
