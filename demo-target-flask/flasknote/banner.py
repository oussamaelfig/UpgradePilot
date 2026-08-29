"""Site-wide message-of-the-day banner."""

from flask import Markup


def motd_banner(message):
    """Wrap operator text in the banner div.

    The div itself is trusted markup; the message is escaped by Markup's
    string concatenation rules.
    """
    return Markup('<div class="motd">') + message + Markup("</div>")
