# TrueForge setup for UpgradePilot

Everything below is configured through the TrueForge HTTP API (`http://localhost:8790/api/v1`)
or Settings UI. Secrets live in TrueForge's local store — never in this repository.

## 1. Model provider

`POST /settings/model-providers` — OpenAI provider with an API key and at least one configured
model (the demo uses a current GPT reasoning-capable model).

## 2. Sandbox provider

`PUT /settings/sandbox-providers` — Daytona with an API key. UpgradePilot uses the sandbox for
all cloning, dependency installation, test execution, and migration edits. The sandbox is
credential-free by design.

## 3. MCP connectors (`POST /settings/mcp-servers`)

| Name | URL | Auth |
| --- | --- | --- |
| `brightdata` | `https://mcp.brightdata.com/mcp` | `Authorization: Bearer <BRIGHTDATA_API_TOKEN>` |
| `github` | `https://api.githubcopilot.com/mcp/` | `Authorization: Bearer <GITHUB_PAT>` (fine-grained; Contents + Pull requests read/write on the target repos) |
| `mission-control` | `http://127.0.0.1:4100/mcp` | none locally (optional `MC_TOKEN` bearer) |

GitHub write tools keep TrueForge's default approval policy (`@write`, `@destructive`), so the
harness itself pauses before any repository mutation — in addition to Mission Control's own
approval gate.

## 4. Skills (`POST /settings/skills`)

Git-backed from this repository:

- `release-intel` — url `https://github.com/oussamaelfig/UpgradePilot`, path `skills/release-intel`, ref `main`
- `openai-v1-migration` — url `https://github.com/oussamaelfig/UpgradePilot`, path `skills/openai-v1-migration`, ref `main`
- `flask-3-migration` — url `https://github.com/oussamaelfig/UpgradePilot`, path `skills/flask-3-migration`, ref `main`

## 5. Agent (`POST /agents`)

Create agent `upgradepilot` with the instructions from `upgradepilot.agent.md`, the three MCP
servers, all three skills, sandbox enabled, and dynamic subagents enabled.

## 6. Mission Control

```bash
cd mission-control/web && npm install && npm run build
cd ../server && npm install && npm start   # http://127.0.0.1:4100
```

## 7. Kick off a mission

Open a session with the `upgradepilot` agent and ask, for example:

> Upgrade https://github.com/oussamaelfig/briefbot from openai 0.28.1 to the current OpenAI
> Python SDK. Read the official migration documentation, reproduce what breaks, migrate the
> code, prove the tests pass, and ask for approval before opening the PR.

Watch it live on the Mission Control dashboard.
