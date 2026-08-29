---
name: release-intel
description: Fetch live release/migration documentation for a dependency upgrade through Bright Data MCP, extract structured breaking changes, validate provenance against the publisher allowlist, and self-repair when a source has drifted. Use whenever a mission needs authoritative knowledge about what a version bump breaks.
---

# Release Intelligence

You are gathering the documentary evidence a migration will be built on. Everything you extract
must be traceable to an official source; everything you report must validate against the
mission-control schema.

## Source registry

The authoritative registry is `sources.yaml` in this skill directory. It defines, per package:
ordered sources, the publisher allowlist, and the recovery search query. Never invent sources —
resolve them from the registry.

## Procedure

1. Read `sources.yaml`; select the entry for the package being migrated.
2. Report the stage: `mission-control.report_stage` with stage `reading_release_notes`, status
   `active`.
3. Fetch the highest-priority source with `brightdata.scrape_as_markdown`. Report a
   `mission-control.report_event` (kind `tool`) naming the tool and URL used.
4. Judge the scrape: it has **drifted** when the fetch errors, returns thin or empty content
   (< 500 characters of substantive markdown), or clearly no longer contains migration guidance.
5. Extract every breaking change relevant to the migration into the structure defined by
   `breaking_changes.schema.json`: `symbol`, `change_type` (one of `removed`, `renamed`,
   `signature_changed`, `config_changed`, `behavior_changed`), `before`, `after`, `source_url`.
   Only record changes the documentation actually states. Do not pad the list.
6. Submit via `mission-control.report_breaking_changes` as ONE consolidated report — every
   accepted call overwrites the previous table, so never split findings across calls. The server
   validates the payload and rejects malformed reports; a rejected call stores nothing — fix the
   payload from the tool's structured errors and resubmit. The corrected resubmission is still
   the mission's single report; never work around validation.
7. Mark the stage `done` with a one-line summary (e.g. "6 breaking changes extracted").

## Drift recovery (self-repair)

When a source has drifted:

1. Report `mission-control.report_event` kind `warning`: which source drifted and how it was
   detected.
2. Try the next source in the registry.
3. If all registered URLs fail, run `brightdata.search_engine` with the registry's
   `recovery_query`. Discard every result whose URL does not start with one of the registry's
   `allowed_publishers` prefixes — shared hosting domains never establish authenticity by
   themselves. Scrape the best allowed result.
4. When recovery succeeds, set `source.recovered: true` and a short `source.recovery_note` in the
   `report_breaking_changes` payload, and report a `mission-control.report_event` kind `recovery`
   describing the fallback used. Provenance must be visible to the human.

## Drift simulation (demo mode)

If the mission request explicitly says to *simulate documentation drift*, treat the primary
source as drifted without fetching it (report the warning event, noting it is a simulated drift),
then execute the real recovery path — genuinely fetch the fallback source. Never simulate the
recovery itself.

## Delegation contract (when this procedure runs in a subagent)

Dynamic subagents do not inherit skills or mission context. The delegating orchestrator MUST
embed in the subagent brief: the active `mission_id` (subagents never call `start_mission`),
the package being migrated, and the full registry entry for it — ordered source URLs, the
`allowed_publishers` allowlist, and the `recovery_query` — copied verbatim from `sources.yaml`.
A brief without the allowlist is invalid: the subagent would have no way to judge authenticity
and must refuse to substitute sources from memory.

The brief must also require the subagent to include in its final answer: the `mission_id` it
reported with, each mission-control call it made with the server's accepted/rejected result,
and every `source_url` it cited. Mission Control has no dashboard read-back tool — the
orchestrator verifies delegation through this returned evidence and redoes any report that is
missing, rejected, mis-keyed, or cites a non-allowlisted source.

## Hard rules

- All web access goes through Bright Data MCP tools; never fetch docs any other way.
- Never extract migration guidance from a URL outside `allowed_publishers`.
- Every breaking change carries the `source_url` where it is documented.
