---
name: flask-3-migration
description: Deterministic playbook for migrating a Python repository from Flask 2.x (deprecated 2.2-era surfaces) to Flask 3 — baseline reproduction, minimal migration, and verification, all executed in the sandbox. Use when the mission's package is Flask.
---

# Flask 2.x → 3 migration playbook

The migration is only *claimed* when deterministic evidence exists: a failing baseline run, a
passing verification run, and a zero-count legacy-pattern scan — all from commands executed in
the sandbox. Model reasoning is never evidence.

## Known pattern map (from the official Flask changelog)

| Legacy (Flask ≤2.2) | Flask 3 replacement |
| --- | --- |
| `@app.before_first_request` | removed; run the setup while creating the application (e.g. call it once at entrypoint import, after `create_app()`) |
| `from flask import escape` | `from markupsafe import escape` |
| `from flask import Markup` | `from markupsafe import Markup` |
| `app.json_encoder = CustomEncoder` | `app.json = CustomProvider(app)` where `CustomProvider` subclasses `flask.json.provider.DefaultJSONProvider` |
| `from flask.json import JSONEncoder` / `flask.json.JSONEncoder` subclasses (same for `JSONDecoder`) | removed with the `json_encoder` attributes; port the subclass to a `DefaultJSONProvider` subclass |
| `class CustomEncoder(json.JSONEncoder)` with `def default(self, o)` | provider `default` is a `@staticmethod`; delegate unknown types to `DefaultJSONProvider.default(o)` |
| `werkzeug==2.x` companion pin in requirements | Flask 3 requires Werkzeug ≥3; bump the pin in the same edit |

Notes that matter in real repositories (each verified empirically in the sandbox):

- The failure modes differ per surface, so a red baseline mixes exception types: `escape`/
  `Markup` imports raise `ImportError` at collection time; `@app.before_first_request` raises
  `AttributeError` where the decorator is applied; but `app.json_encoder = ...` **silently
  succeeds** on Flask 3 (it is a plain attribute assignment) and is simply ignored — the failure
  surfaces later as `TypeError: Object of type X is not JSON serializable` raised from
  `flask/json/provider.py` during a request. A repository can import cleanly and still be
  broken; always run both the tests and the scan.
- `DefaultJSONProvider.default` is a `staticmethod`. When porting an encoder's
  `default(self, o)` method, drop the bound signature and keep the fallthrough:
  `return DefaultJSONProvider.default(o)` (it still handles dates, UUIDs, dataclasses and
  `__html__` objects).
- The changelog's replacement for `before_first_request` is "run setup code when creating the
  application". Calling the setup function once at entrypoint import preserves the once-only
  semantics; tests that assert one-time initialization remain valid under that shape.
- Werkzeug moves with Flask: `pip install --upgrade flask` resolves a Werkzeug ≥3.1 alongside
  Flask 3. If `requirements.txt` pins an old Werkzeug, bump it to the resolved version in the
  same migration edit or the migrated pins conflict. Old Werkzeug pins can also break the
  *baseline* on modern interpreters (Werkzeug ≤2.2 route compilation uses `ast.Str`, removed in
  Python 3.14; 2.3.8 is the newest release the Flask 2.2 pin supports there).
- `markupsafe` is already a Flask dependency — importing from it adds no new requirement.
- Do not leave legacy symbol names in comments or docstrings you write during the migration;
  the deterministic scan matches them and every match needs false-positive accounting.

## Sandbox protocol (execute in order, report each phase)

Work in the sandbox exclusively. The sandbox never receives credentials; the target repository
must be public to clone.

1. **Clone + baseline install**
   - `git clone https://github.com/<owner>/<repo>.git target && cd target`
   - `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`
2. **Reproduce the upgrade failure** (`report_stage: running_baseline`)
   - Install the requested target: when the mission specifies a version, install exactly that
     (`.venv/bin/pip install "flask==<requested>"`); only when the mission says "latest"/
     "current" (or gives no version) use `.venv/bin/pip install --upgrade flask`. Record the
     resolved version with `pip show flask` — it is the mission's `to_version` and the pin you
     will write to `requirements.txt`. Record the resolved Werkzeug too (`pip show werkzeug`);
     it moves with Flask and its pin must move with it.
   - `.venv/bin/python -m pytest --continue-on-collection-errors` (add `-q` only if output is
     huge). Parse the exact counts from the summary line and capture a short raw excerpt.
   - `mission-control.report_baseline` with the real command, exit code, counts, resolved
     version, and excerpt.
   - If the baseline unexpectedly PASSES, do not conclude anything yet: run the legacy-pattern
     scan from step 4 first. Passing tests alone do not prove the affected call sites are gone
     (coverage gaps). If the scan finds matches, proceed with the full migration. If the scan is
     also clean, the migration reduces to the dependency pin itself: continue with step 3 as a
     pin-only change (update `requirements.txt` to the resolved target, including the Werkzeug
     companion) and verify — the venv upgrade you just tested is temporary and the repository
     must not remain pinned to the old framework. Report "nothing to migrate" only when the
     repository does not pin the dependency at all.
3. **Migrate** (`report_stage: migrating_code`)
   - Apply the smallest set of edits that completes the migration, using the pattern map plus
     the breaking changes extracted from the live documentation. Update code, tests, and
     `requirements.txt` (pin the resolved Flask target and its Werkzeug companion). No
     unrelated refactors, no formatting churn.
   - `mission-control.report_migration_plan` with every touched file and a one-line summary each.
4. **Verify** (`report_stage: verifying_upgrade`)
   - `.venv/bin/python -m pytest` — must exit 0.
   - Legacy-pattern scan (deterministic, from `checks.yaml`):
     `grep -rEn 'before_first_request|from flask import.*\b(escape|Markup)\b|flask\.(escape|Markup)\b|json_(en|de)coder|from flask\.json import.*\b(JSONEncoder|JSONDecoder)\b|flask\.json\.(JSONEncoder|JSONDecoder)\b' --include='*.py' --exclude-dir=.venv --exclude-dir=venv .`
     The match count must be 0. `grep` exits 1 on zero matches — that is the success case.
     The venv exclusion is mandatory: without it the scan walks the installed framework's own
     sources. The `before_first_request` and `json_(en|de)coder` patterns are plain substrings,
     so they also match comments, docstrings, and unrelated identifiers; handle false positives
     explicitly:
     - A match is a *justified exception* only when it is demonstrably not a use of the removed
       Flask surface (an unrelated identifier or prose that happens to contain the substring).
       Do not change unrelated code.
     - `legacy_patterns_remaining` = total matches − justified exceptions. The verification gate
       is `legacy_patterns_remaining == 0`, not raw grep silence.
     - The report's `log_excerpt` must include the full raw scan output plus one line per
       justified exception naming the file/line and the reason, and the same justifications go
       in the migration plan notes. Never report an adjusted count without showing the raw
       matches it was derived from.
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
