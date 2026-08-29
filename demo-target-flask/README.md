# flasknote

A small personal notes service. It:

- **stores notes in memory** with validated priorities (`flasknote.storage`, `flasknote.priorities`)
- **serves a JSON API** to create, fetch and filter notes, serializing priorities through a
  custom JSON encoder (`flasknote.app`, `flasknote.encoders`)
- **seeds a welcome note** the first time the deployed app serves a request (`flasknote.wsgi`,
  `flasknote.bootstrap`)
- **renders safe HTML previews** of user content (`flasknote.rendering`, `flasknote.banner`,
  `flasknote.cli`)

Built against `flask==2.2.5` (with its `werkzeug==2.3.8` companion pin).

## Running tests

The test suite is fully offline and deterministic: everything runs through Flask's
`app.test_client()`, so no server, network access, or API keys are involved.

```bash
pip install -r requirements.txt
python -m pytest -q
```

> This repository is the demo target for
> [UpgradePilot](https://github.com/oussamaelfig/UpgradePilot): an autonomous
> dependency-migration agent. UpgradePilot reads the official Flask changelog,
> reproduces this project's failures under Flask 3, migrates the code in a sandbox,
> proves the tests pass again, and opens the migration PR after human approval.
