---
name: openai-v1-migration
description: Deterministic playbook for migrating a Python repository from openai<1.0 (module-level API) to the v1+ client interface — baseline reproduction, minimal migration, and verification, all executed in the sandbox. Use when the mission's package is the OpenAI Python SDK.
---

# OpenAI Python SDK v1 migration playbook

The migration is only *claimed* when deterministic evidence exists: a failing baseline run, a
passing verification run, and a zero-count legacy-pattern scan — all from commands executed in
the sandbox. Model reasoning is never evidence.

## Known pattern map (from the official migration guide)

| Legacy (<1.0) | v1+ replacement |
| --- | --- |
| `openai.api_key = KEY` | `client = OpenAI(api_key=KEY)` |
| `openai.api_base = URL` | `client = OpenAI(base_url=URL)` |
| `openai.ChatCompletion.create(...)` | `client.chat.completions.create(...)` |
| `openai.Completion.create(...)` | `client.completions.create(...)` |
| `openai.Embedding.create(...)` | `client.embeddings.create(...)` |
| `openai.Moderation.create(...)` | `client.moderations.create(...)` |
| `resp["choices"][0]["message"]["content"]` | `resp.choices[0].message.content` |
| `resp["data"][i]["embedding"]` | `resp.data[i].embedding` |
| `resp["results"][0]["flagged"]` | `resp.results[0].flagged` |
| `openai.error.RateLimitError` | `openai.RateLimitError` |
| `openai.error.APIError` | `openai.APIError` |
| `openai.error.Timeout` | `openai.APITimeoutError` (subclass of `openai.APIConnectionError`) |
| `openai.error.APIConnectionError` | `openai.APIConnectionError` |
| `import openai.error` | remove; exceptions live at the package top level |

Notes that matter in real repositories:

- v1 clients read `OPENAI_API_KEY` automatically, but explicit env plumbing (e.g. a custom
  `OPENAI_API_BASE` variable) must be carried over to `base_url` or the code silently targets the
  default endpoint. Check the tests' conftest for the env contract before deciding.
- v1 clients retry rate limits and transient 5xx internally (default `max_retries=2`); keep the
  repository's own retry wrappers — they compose fine — but expect servers to see extra requests.
- Response objects are typed models, not dicts; `.get(...)`/`[...]` access must be converted.
- v1+ exception constructors are keyword-based and expect a transport request object
  (`APITimeoutError(request=...)`, `APIConnectionError(message=..., request=...)`). When *tests*
  must raise these directly, construct them with `request=None` — there is no construct-time
  validation, and it avoids importing the SDK's HTTP library (which has changed names across
  major versions; current releases depend on `httpx2`, older ones on `httpx`).

## Sandbox protocol (execute in order, report each phase)

Work in the sandbox exclusively. The sandbox never receives credentials; the target repository
must be public to clone.

1. **Clone + baseline install**
   - `git clone https://github.com/<owner>/<repo>.git target && cd target`
   - `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`
2. **Reproduce the upgrade failure** (`report_stage: running_baseline`)
   - Install the requested target: when the mission specifies a version, install exactly that
     (`.venv/bin/pip install "openai==<requested>"`); only when the mission says "latest"/"current"
     (or gives no version) use `.venv/bin/pip install --upgrade openai`. Record the resolved
     version with `pip show openai` — it is the mission's `to_version` and the pin you will write
     to `requirements.txt`.
   - `.venv/bin/python -m pytest --continue-on-collection-errors` (add `-q` only if output is
     huge). Parse the exact counts from the summary line and capture a short raw excerpt.
   - `mission-control.report_baseline` with the real command, exit code, counts, resolved
     version, and excerpt.
   - If the baseline unexpectedly PASSES, do not conclude anything yet: run the legacy-pattern
     scan from step 4 first. Only when tests pass AND the scan finds zero legacy call sites may
     you report that there is nothing to migrate; passing tests alone do not prove the affected
     call sites are gone (coverage gaps). If the scan finds matches, proceed with the migration.
3. **Migrate** (`report_stage: migrating_code`)
   - Apply the smallest set of edits that completes the migration, using the pattern map plus
     the breaking changes extracted from the live documentation. Update code, tests, and
     `requirements.txt` (pin the resolved target version). No unrelated refactors, no formatting
     churn.
   - `mission-control.report_migration_plan` with every touched file and a one-line summary each.
4. **Verify** (`report_stage: verifying_upgrade`)
   - `.venv/bin/python -m pytest` — must exit 0.
   - Legacy-pattern scan (deterministic, from `checks.yaml`):
     `grep -rEn 'openai\.(ChatCompletion|Completion|Embedding|Moderation|error)\b|openai\.api_base|import openai\.error|\[.choices.\]\[|\[.data.\]\[|\[.results.\]\[' --include='*.py' --exclude-dir=.venv --exclude-dir=venv .`
     The match count must be 0. `grep` exits 1 on zero matches — that is the success case.
     The venv exclusion is mandatory: without it the scan walks the installed SDK's own sources.
     The last three patterns catch legacy dict-style access on response objects
     (`resp["choices"][...]`, `resp["data"][...]`, `resp["results"][...]`), which typed v1
     responses no longer support. They are heuristics: if a match is demonstrably not an SDK
     response access (an unrelated dict that happens to use these keys), record that
     justification in the migration plan notes instead of changing unrelated code.
   - `mission-control.report_verification` with real counts, the resolved version, and
     `legacy_patterns_remaining` from the scan.
   - If verification fails, iterate on the migration (back to step 3); never report numbers you
     did not observe.
5. **Hand off for approval** — verification evidence in hand, follow the mission's approval
   protocol before any GitHub mutation.

## Output discipline

Every `report_*` number comes from command output produced in this run. Log excerpts are copied,
not summarized. If a step cannot be completed, report the stage as `failed` with what actually
happened.
