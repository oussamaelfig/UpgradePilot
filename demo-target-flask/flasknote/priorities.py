"""Note priorities as a small validated value object."""


class Priority:
    """Priority level attached to every note.

    Deliberately not a dataclass or enum: Flask's default JSON machinery has
    no idea how to serialize it, which is why the app registers a custom
    encoder (see flasknote.encoders).
    """

    LEVELS = ("low", "normal", "high")
    DEFAULT = "normal"

    def __init__(self, label):
        if isinstance(label, Priority):
            label = label.label
        if label not in self.LEVELS:
            raise ValueError(f"unknown priority: {label!r}")
        self.label = label

    def __eq__(self, other):
        return isinstance(other, Priority) and other.label == self.label

    def __hash__(self):
        return hash(self.label)

    def __repr__(self):
        return f"Priority({self.label!r})"
