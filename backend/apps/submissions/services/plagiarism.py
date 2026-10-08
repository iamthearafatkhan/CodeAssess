"""
Lightweight token-based plagiarism detection.

Approach:
  1. Strip comments and strings from source code.
  2. Tokenize.
  3. Build n-grams (default 5 tokens) as a set.
  4. Compare pairs by Jaccard similarity:
        |A ∩ B| / |A ∪ B|
  5. Flag pairs above a threshold (default 0.7).

This is not production-grade (AST-based similarity is better),
but it catches copy-paste and light renaming, which is the
common case for student code.
"""

import re


LINE_COMMENT = re.compile(r"//[^\n]*|#[^\n]*")
BLOCK_COMMENT = re.compile(r"/\*.*?\*/", re.DOTALL)
STRING_LITERAL = re.compile(r'"[^"]*"|\'[^\']*\'')


def _strip_comments_and_strings(code):
    code = BLOCK_COMMENT.sub(" ", code)
    code = LINE_COMMENT.sub(" ", code)
    code = STRING_LITERAL.sub('""', code)
    return code


def tokenize(code):
    code = _strip_comments_and_strings(code)
    # Keep identifiers, numbers, and single-char operators
    tokens = re.findall(r"[A-Za-z_][A-Za-z0-9_]*|\d+|.", code)
    # Drop whitespace
    return [t for t in tokens if not t.isspace()]


def ngrams(tokens, n=5):
    if len(tokens) < n:
        return set(tuple(tokens)) if tokens else set()
    return {tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)}


def jaccard(set_a, set_b):
    if not set_a or not set_b:
        return 0.0
    return len(set_a & set_b) / len(set_a | set_b)


def compare(code_a, code_b, n=5):
    a = ngrams(tokenize(code_a), n)
    b = ngrams(tokenize(code_b), n)
    return jaccard(a, b)


def find_similar_pairs(submissions, threshold=0.7, n=5):
    """
    submissions: list of Submission objects (already filtered to one question).
    Returns: list of { id_a, id_b, student_a, student_b, score }
    """
    prepared = []
    for s in submissions:
        prepared.append((s, ngrams(tokenize(s.source_code), n)))

    results = []
    for i in range(len(prepared)):
        for j in range(i + 1, len(prepared)):
            sub_a, grams_a = prepared[i]
            sub_b, grams_b = prepared[j]
            score = jaccard(grams_a, grams_b)
            if score >= threshold:
                results.append({
                    "submission_a_id": sub_a.id,
                    "submission_b_id": sub_b.id,
                    "student_a": sub_a.student.email,
                    "student_b": sub_b.student.email,
                    "score": round(score, 3),
                })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results