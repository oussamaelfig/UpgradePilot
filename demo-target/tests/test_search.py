import pytest

from briefbot import search

CORPUS = [
    "quarterly budget planning notes",
    "deploy runbook for the api service",
    "hiring sync interview loop notes",
]


def test_embeds_each_text_in_order(stub):
    vectors = search.embed_texts(CORPUS)
    assert len(vectors) == len(CORPUS)
    assert all(isinstance(v, list) and len(v) == 4 for v in vectors)


def test_finds_related_budget_note(stub):
    assert search.find_related("budget review for next quarter", CORPUS) == 0


def test_finds_related_deploy_note(stub):
    assert search.find_related("how do we deploy the new build", CORPUS) == 1


def test_empty_corpus_rejected(stub):
    with pytest.raises(ValueError):
        search.find_related("anything", [])
