# briefbot

A small AI meeting-notes assistant. Give it raw meeting notes and it:

- **summarizes** them into decisions and action items (`briefbot.summarizer`)
- **finds related past notes** with embeddings + cosine similarity (`briefbot.search`)
- **screens content** through the moderation endpoint before processing (`briefbot.moderation`)
- **survives transient API failures** with a retry wrapper (`briefbot.reliability`)

Built against `openai==0.28.1`.

## Running tests

The test suite is fully offline and deterministic: a local stub server implements the OpenAI
REST endpoints (`/chat/completions`, `/embeddings`, `/moderations`) and the app is pointed at it
through the `OPENAI_API_BASE` environment variable. No API key or network access is required.

```bash
pip install -r requirements.txt
python -m pytest -q
```

> This repository is the demo target for
> [UpgradePilot](https://github.com/oussamaelfig/UpgradePilot): an autonomous
> dependency-migration agent. UpgradePilot reads the official OpenAI SDK migration guide,
> reproduces this project's failures under `openai>=1.0`, migrates the code in a sandbox,
> proves the tests pass again, and opens the migration PR after human approval.
