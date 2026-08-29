"""Command-line HTML preview of stored notes."""

import sys

from flasknote import storage
from flasknote.banner import motd_banner
from flasknote.rendering import render_note_preview


def main():
    print(motd_banner("flasknote preview"))
    for note in storage.all_notes():
        print(render_note_preview(note["title"], note["body"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
