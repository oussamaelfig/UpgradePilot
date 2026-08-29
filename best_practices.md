# UpgradePilot — Engineering Standards

These are the repository-specific standards that code review (human and Qodo) must enforce.
They describe how this codebase is actually built. Rules that reference tests refer to tests
that exist in this repository.

## What this repository is

UpgradePilot is an autonomous dependency-migration agent built on the TrueForge agent harness.
The agent reads live migration documentation (Bright Data MCP), locates affected code, reproduces
upgrade failures in a Daytona sandbox, applies the migration, verifies it with real test execution,
and — only after explicit human approval — mutates the real repository through GitHub MCP.

Components:

- `mission-control/` — a Node/TypeScript service with two faces:
  - an **MCP server** (streamable HTTP) whose tools the TrueForge agent calls to report
    structured progress, evidence, and to request human approval;
  - a **dashboard** (React SPA + SSE) that renders the mission timeline, evidence, and the
    approval screen.
- `skills/` — git-backed TrueForge SKILL.md packs (release-intel, openai-v1-migration) plus
  version-controlled scraper source registries and JSON schemas.
- `agent/` — the TrueForge agent instructions (system prompt) and setup documentation.
- `demo-target/` — source of the demo fixture app (published to a separate public repo) used to
  demonstrate the migration end-to-end.

## Architectural boundaries (enforce strictly)

1. **The sandbox is credential-free.** No skill, instruction, or code may place API keys, tokens,
   or other secrets inside the Daytona sandbox. The sandbox clones public repositories only.
2. **The only path to the real world is approval-gated.** GitHub mutations (branch, commit, PR)
   happen exclusively through GitHub MCP write tools, which TrueForge pauses for human approval.
   Mission Control additionally gates the flow with its own approval state machine. Any change
   that could allow a mutation before an `approved` decision is a critical defect.
3. **Agent output is untrusted input.** Every payload the agent reports to Mission Control
   (breaking changes, test results, diffs, approval requests) is validated with zod schemas at
   the server boundary. Invalid payloads are rejected with actionable error messages, never
   silently coerced or partially stored.
4. **Verification is deterministic.** Migration success claims must originate from executed
   commands (pytest exit codes, pattern-scan counts) captured in the sandbox — never from model
   assertions. UI copy and PR text must not overstate what was verified.
5. **Business logic lives in `mission-control/server/src/`**, not in route handlers or React
   components. The approval state machine and event store are pure modules with unit tests;
   HTTP/MCP layers are thin adapters over them.

## Code style — TypeScript (mission-control)

- TypeScript strict mode; ESM modules; Node 22+.
- No `any` unless interfacing with untyped third-party payloads, and then it must be narrowed
  immediately via zod parsing.
- Prefer plain functions and module-level state containers over classes with hidden state.
- No new runtime dependencies without clear necessity; the dependency budget is deliberately
  small (express, zod, @modelcontextprotocol/sdk, react, vite toolchain, vitest).
- Errors returned by MCP tools must be structured (`ok: false`, `errors: [...]`) so the agent
  can self-correct; never throw raw stack traces across the MCP boundary.

## Code style — Python (demo-target fixture)

- Pinned dependencies (`openai==0.28.1` pre-migration); pytest suite must be deterministic and
  offline: all OpenAI traffic goes to a local stub server via base-URL override. No network, no
  real API keys, no flaky sleeps.

## Testing expectations

- Every meaningful behavior change ships with tests in the same PR.
- The approval state machine has exhaustive unit tests: single-decision enforcement (no
  double-approve/deny), no mutation-allowed state before approval, terminal-state immutability.
- Payload validation has fixture-based tests: valid payloads accepted, malformed payloads
  rejected with specific errors.
- External services (TrueForge, Bright Data, GitHub, Daytona) are never called in unit tests;
  the server is tested through its public interfaces with in-process requests.

## Hygiene

- No secrets in the repository, ever — keys live in TrueForge settings or local env files that
  are gitignored. `.env*` is gitignored.
- Minimal diffs: no drive-by refactors, no formatting churn outside touched lines, no dead code,
  no commented-out code, no debugging artifacts.
- No unnecessary abstractions: three or more concrete usages before introducing an abstraction.
- Documentation touched by a behavior change is updated in the same PR.

## PR discipline

- Meaningful work happens on feature branches and merges via reviewed PRs; no substantive direct
  pushes to `main`.
- PR descriptions explain design decisions and rejected alternatives, not just what changed.
- Every Qodo finding is answered point-by-point and classified: APPLIED, DECLINED WITH
  REASONING, ACKNOWLEDGED / FOLLOW-UP, or ALREADY FIXED / STALE. Valid behavioral findings get
  regression tests where appropriate.
