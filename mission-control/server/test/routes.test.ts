import express from "express";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { MissionStore } from "../src/mission.js";
import { buildRouter } from "../src/routes.js";

function app(store: MissionStore, mcpToken?: string) {
  const application = express();
  application.use(buildRouter(store, { mcpToken }));
  return application;
}

describe("approval decision endpoint", () => {
  it("accepts a valid decision exactly once", async () => {
    const store = new MissionStore();
    const mission = store.startMission({ repo: "o/r", package: "openai" });
    const approval = store.requestApproval({
      mission_id: mission.id,
      action: { kind: "open_github_pr", repo: "o/r", branch: "b", base: "main", title: "t" },
      evidence_summary: "evidence",
    });

    const first = await request(app(store))
      .post(`/api/approvals/${approval.id}/decision`)
      .send({ decision: "approved" });
    expect(first.status).toBe(200);
    expect(first.body.approval.status).toBe("approved");

    const second = await request(app(store))
      .post(`/api/approvals/${approval.id}/decision`)
      .send({ decision: "rejected" });
    expect(second.status).toBe(409);
  });

  it("rejects malformed decision payloads", async () => {
    const store = new MissionStore();
    const response = await request(app(store)).post("/api/approvals/x/decision").send({ decision: "maybe" });
    expect(response.status).toBe(400);
  });

  it("returns 404 for unknown approvals", async () => {
    const store = new MissionStore();
    const response = await request(app(store)).post("/api/approvals/ghost/decision").send({ decision: "approved" });
    expect(response.status).toBe(404);
  });
});

describe("mission snapshot endpoint", () => {
  it("404s with no active mission and returns the snapshot afterwards", async () => {
    const store = new MissionStore();
    expect((await request(app(store)).get("/api/mission")).status).toBe(404);

    store.startMission({ repo: "o/r", package: "openai" });
    const response = await request(app(store)).get("/api/mission");
    expect(response.status).toBe(200);
    expect(response.body.mission.repo).toBe("o/r");
    expect(response.body.last_seq).toBeGreaterThan(0);
  });
});

describe("MCP endpoint auth", () => {
  it("rejects unauthenticated MCP requests when a token is configured", async () => {
    const store = new MissionStore();
    const response = await request(app(store, "secret-token"))
      .post("/mcp")
      .send({ jsonrpc: "2.0", id: 1, method: "ping" });
    expect(response.status).toBe(401);
  });

  it("accepts the configured bearer token", async () => {
    const store = new MissionStore();
    const response = await request(app(store, "secret-token"))
      .post("/mcp")
      .set("Authorization", "Bearer secret-token")
      .set("Accept", "application/json, text/event-stream")
      .send({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "1" } },
      });
    expect(response.status).toBe(200);
  });
});
