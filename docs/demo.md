# Demo runbook — 2.5 minutes

## Pre-flight (10 minutes before judging)

1. Mission Control running: `cd mission-control && npm start` → http://127.0.0.1:4100 shows the
   empty state ("Waiting for a mission").
2. TrueForge running (`npx @truefoundry/trueforge`), agent `upgradepilot` in the library;
   connectors green: `brightdata`, `github`, `mission-control`; Daytona sandbox provider `ready`.
3. Reset the demo target if a previous run left a PR/branch:
   `gh pr close <n> --repo oussamaelfig/briefbot --delete-branch` (keep `main` pinned to
   `openai==0.28.1`).
4. Fresh mission state: stop the server, delete `mission-control/server/data/`, restart.
5. Two windows side by side: left = TrueForge chat, right = Mission Control dashboard.

## The run

Say: *"briefbot is a real app frozen in 2023 on openai 0.28. Watch UpgradePilot ship the
upgrade — not explain it."*

Paste into a new `upgradepilot` session:

> Upgrade https://github.com/oussamaelfig/briefbot from openai 0.28.1 to the current OpenAI
> Python SDK. Read the official migration documentation, determine what breaks, reproduce the
> failures in the sandbox, migrate the code, prove the migration works, then request approval
> before opening the real PR on GitHub.

Narration beats (the dashboard drives itself):

1. **Timeline lights up** — "Two subagents in parallel: Release Intelligence is pulling the
   official migration guide live through Bright Data; the Repo Investigator maps it to actual
   call sites."
2. **Breaking-changes table fills** — "Six breaking changes, each linked to the official doc it
   came from. Provenance is allowlisted to the publisher — a random GitHub repo can't feed this."
3. **Baseline goes red** — "It installed the new SDK in a Daytona sandbox and *reproduced* the
   damage: 9 failed, 1 error — `APIRemovedInV1`. No credentials in that sandbox, ever."
4. **Verification goes green** — "Migration applied, full test suite re-run, plus a
   deterministic scan for leftover legacy calls: 13/13 pass, zero legacy sites. No LLM claims —
   exit codes."
5. **Approval modal** — "And here it stops. The exact action, the evidence, and a human
   decision. The harness enforces this too: GitHub write tools are approval-gated at the tool
   boundary." → Click **Approve** (+ approve the harness card in TrueForge).
6. **PR card** — open the real PR on GitHub: verified changes, evidence, doc links. "From
   breaking change to verified PR."

## Drift-recovery encore (30s, if asked about Bright Data)

New session: same prompt + *"Simulate documentation drift on the primary source."* The
dashboard shows the drift warning and the `RECOVERED SOURCE` badge — the fallback fetch is real,
only the trigger is simulated.

## Fallbacks

- Live run slow → a pre-run mission's populated dashboard stays on screen (state persists);
  walk the timeline while the live one progresses.
- Catastrophic (venue Wi-Fi, provider outage) → `docs/dashboard-walkthrough.webm` + the merged
  PRs and README evidence carry the story.

## Reset between runs

Stop server → `rm -rf mission-control/server/data` → start server → close/delete the briefbot
PR and branch → new TrueForge session.
