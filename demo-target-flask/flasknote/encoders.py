"""Custom JSON encoder wired into the app via ``app.json_encoder``."""

import json

from flasknote.priorities import Priority


class NoteJSONEncoder(json.JSONEncoder):
    """Serialize Priority values as their plain label."""

    def default(self, o):
        if isinstance(o, Priority):
            return o.label
        return super().default(o)
