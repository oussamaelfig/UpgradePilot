# UpgradePilot

### From breaking change to verified PR.

UpgradePilot is an autonomous dependency-migration agent built on the
[TrueForge](https://github.com/truefoundry/trueforge) agent harness.

Point it at a repository and an upgrade target. It reads the live migration documentation,
finds the affected code, reproduces the failures in an isolated sandbox, performs the
migration, proves the upgraded software works with real test execution — and then asks for
permission before opening the real pull request.

```text
Docs change
   ↓
UpgradePilot understands the migration      (Bright Data MCP → live official docs)
   ↓
Finds affected code                          (repository analysis via subagents)
   ↓
Migrates in a sandbox                        (Daytona — credential-free isolation)
   ↓
Proves the new version works                 (pytest before/after, deterministic checks)
   ↓
Asks permission                              (human approval — harness-enforced)
   ↓
Opens the PR                                 (GitHub MCP, approval-gated write tools)
```

> Built for the Agent Harness Hackathon (Aug 2026). Full architecture, demo evidence, and the
> Qodo Code Review Evidence section land as the build progresses — development itself happens
> through reviewed PRs on this repository.

## Repository layout

- `mission-control/` — MCP server + web UI. `/` serves the product landing page and
  `/mission` the live Mission Control dashboard (timeline, evidence, approval screen);
  the server rewrites every non-API path to the SPA, so both URLs deep-link directly
- `skills/` — TrueForge skills: release intelligence (Bright Data pipeline) and migration playbooks
- `agent/` — TrueForge agent instructions and setup
- `demo-target/` — source of the demo fixture repository the agent migrates
- `best_practices.md` / `.pr_agent.toml` — repository engineering standards enforced by Qodo
