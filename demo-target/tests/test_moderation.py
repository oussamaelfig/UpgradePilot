from briefbot import moderation


def test_clean_text_is_safe(stub):
    assert moderation.is_safe("Discussed roadmap priorities and hiring plans.") is True


def test_flagged_text_is_unsafe(stub):
    assert moderation.is_safe("Plan the attack on the server room.") is False
