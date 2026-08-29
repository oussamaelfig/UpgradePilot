from flasknote.rendering import render_note_preview


def test_user_content_is_escaped():
    html = render_note_preview("<script>alert(1)</script>", "safe body")
    assert "<script>" not in html
    assert "&lt;script&gt;alert(1)&lt;/script&gt;" in html


def test_preview_wraps_note_in_article():
    html = render_note_preview("Title", "Body")
    assert html == "<article><h2>Title</h2><p>Body</p></article>"
