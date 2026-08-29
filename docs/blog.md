# From breaking change to verified PR: building UpgradePilot in one hackathon day

*Agent Harness Hackathon, San Francisco — August 29, 2026*

Every AI engineer in the room lived through the same moment in 2023: `openai>=1.0` landed and
every `openai.ChatCompletion.create` in production started throwing `APIRemovedInV1`. The fix
was never intellectually hard — the migration guide existed. It was toil: read the docs, find
the call sites, upgrade, run the tests, open the PR.

That toil is a shaped hole for an agent. Not a chatbot that *explains* the migration — an agent
that *performs* it and can prove it did.

## What UpgradePilot does

Give it a repository and an upgrade target. It:

1. reads the live official migration documentation (Bright Data MCP),
2. maps the breaking changes to actual call sites (parallel subagents),
3. reproduces the failures in a Daytona sandbox — installs the new SDK against the old code and
   watches the suite burn: `9 failed, 1 error — APIRemovedInV1`,
4. applies the smallest correct migration,
5. proves it: full test suite green plus a deterministic scan for leftover legacy patterns,
6. stops. Shows a human the exact action and the evidence. Waits.
7. Only after approval: branch, commit, real pull request — via GitHub MCP.

The one-liner we optimized everything around: **understand → locate → reproduce → migrate →
verify → ask permission → act.**

## How the harness carried it

We built on TrueForge, and the honest review is that the harness did the heavy lifting we'd
otherwise have hand-rolled: the agent loop, MCP connectors (Bright Data, GitHub, and our own
server), Daytona sandbox-as-tool, dynamic subagents with isolated contexts, git-backed skills
with progressive disclosure, session persistence — and native human approval on write tools,
which became a load-bearing part of our security story rather than a demo garnish.

The design decision we're proudest of: **the dashboard is itself an MCP server.** Mission
Control exposes tools like `report_baseline`, `report_verification`, `request_approval`,
`await_approval`. The agent reports structured evidence through ordinary tool calls; the UI
renders exactly what the agent proved, with raw log excerpts. No harness internals scraped, no
narrator LLM. And because model output is untrusted input, every payload crosses a zod trust
boundary — malformed reports bounce with structured errors the agent can self-correct from.

Approval is defense in depth: our state machine (an approval resolves exactly once; a recorded
PR must *match* the approved action) plus TrueForge's native tool gate on GitHub write tools.
The sandbox never holds a credential. The only path from agent to the real world is a human
click.

## What broke along the way

- **A supply-chain hole in our own rules.** Our docs-recovery search accepted any
  `site:github.com` result as "official." Qodo flagged it — High severity, first PR. GitHub is
  shared hosting; schema validation checks shape, not provenance. We shipped a publisher
  allowlist.
- **An approval-laundering bug.** `report_pr_opened` originally required *an* approved approval
  — not that the recorded PR *was the approved one*. Approve PR A, record PR B. Qodo caught it;
  the guard now matches branch and repository, with regression tests.
- **The SDK moved under us.** `pip install --upgrade openai` in the sandbox resolved 3.6.0,
  which depends on `httpx2` (not `httpx`), which broke our reference test migration. The fix
  that survives SDK churn: construct v1+ exceptions with `request=None` in tests. Validated in
  a live sandbox before the demo ever depended on it.
- **A fix that broke the demo's soul.** Reviewing our fixture, Qodo asked for `api_base` restore
  semantics; our fix read `openai.api_base` at import time — which turned the beautiful
  call-time `APIRemovedInV1` failures into an import-time `AttributeError` wall. Caught by
  re-running the sandbox protocol; `getattr` with a default preserved both.

## Qodo as a second engineer, not a checkbox

Every meaningful change went through a PR; Qodo reviewed all of them, twice or more. The tally:
five merged PRs, 20+ findings evaluated, most applied with regression tests, several declined
with evidence (one — "batch tools unavailable" — was contradicted by a live `tools/list` from
the actual endpoint; we posted the output and merged with the decline on record). The review →
fix → re-review trail is public in the repo, and the test suite roughly doubled because of it.

## The result

A 2.5-minute demo: paste one sentence into TrueForge, watch the dashboard light up — breaking
changes with doc provenance, a red baseline, a green verification, an approval screen with the
exact external action — click Approve, and open the real PR on GitHub.

The software didn't say it worked. It proved it, and then it asked.

*UpgradePilot: [github.com/oussamaelfig/UpgradePilot](https://github.com/oussamaelfig/UpgradePilot) ·
demo target: [github.com/oussamaelfig/briefbot](https://github.com/oussamaelfig/briefbot)*
