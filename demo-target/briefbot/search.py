"""Semantic search over past meeting notes using embeddings."""

import math

import openai

EMBEDDING_MODEL = "text-embedding-ada-002"


def embed_texts(texts):
    """Embed a list of texts; returns one vector per input, in order."""
    response = openai.Embedding.create(model=EMBEDDING_MODEL, input=texts)
    return [item["embedding"] for item in response["data"]]


def _cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def find_related(query, corpus):
    """Return the index of the corpus document most similar to the query."""
    if not corpus:
        raise ValueError("corpus must not be empty")
    vectors = embed_texts([query] + list(corpus))
    query_vec, doc_vecs = vectors[0], vectors[1:]
    scores = [_cosine(query_vec, doc) for doc in doc_vecs]
    return max(range(len(scores)), key=lambda i: scores[i])
