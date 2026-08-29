import express from "express";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { MissionStore } from "./mission.js";
import { buildRouter } from "./routes.js";

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 4100);
const persistPath = process.env.MC_STATE_FILE ?? join(here, "..", "data", "mission-state.json");

const store = new MissionStore(persistPath);
const app = express();

app.use(buildRouter(store, { mcpToken: process.env.MC_TOKEN }));

// Serve the built dashboard when present (mission-control/web/dist).
const webDist = join(here, "..", "..", "web", "dist");
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^\/(?!api|mcp).*/, (_req, res) => res.sendFile(join(webDist, "index.html")));
}

app.listen(port, "127.0.0.1", () => {
  console.log(`Mission Control listening on http://127.0.0.1:${port}`);
  console.log(`  MCP endpoint:  http://127.0.0.1:${port}/mcp`);
  console.log(`  Dashboard API: http://127.0.0.1:${port}/api/mission`);
});
