"""Command-line entry point: summarize a notes file."""

import sys

from briefbot import config, moderation, reliability, summarizer


def main(argv=None):
    argv = argv if argv is not None else sys.argv[1:]
    if len(argv) != 1:
        print("usage: python -m briefbot.cli <notes-file>", file=sys.stderr)
        return 2

    config.configure()
    with open(argv[0], "r", encoding="utf-8") as handle:
        notes = handle.read()

    if not moderation.is_safe(notes):
        print("Notes were flagged by moderation; refusing to process.", file=sys.stderr)
        return 1

    summary = reliability.call_with_retry(summarizer.summarize_notes, notes)
    print(summary)
    return 0


if __name__ == "__main__":
    sys.exit(main())
