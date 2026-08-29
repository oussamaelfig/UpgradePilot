from flasknote.banner import motd_banner


def test_operator_markup_is_preserved():
    banner = str(motd_banner("maintenance tonight"))
    assert banner == '<div class="motd">maintenance tonight</div>'


def test_message_text_is_escaped():
    banner = str(motd_banner("<b>bold</b> move"))
    assert "&lt;b&gt;bold&lt;/b&gt; move" in banner
