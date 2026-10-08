from ..models import SubmissionTestCaseResult
from .executor import run_code


def grade_submission(submission):
    """
    Run the submission's code against every test case of its question.
    Saves one SubmissionTestCaseResult per test case.
    Updates submission.auto_score.
    Returns a dict summary.
    """
    question = submission.question
    test_cases = list(question.test_cases.all())

    if not test_cases:
        submission.auto_score = 0
        submission.save(update_fields=["auto_score"])
        return {
            "auto_score": 0,
            "total_marks": question.marks,
            "passed": 0,
            "total": 0,
            "results": [],
            "note": "No test cases defined for this question.",
        }

    # Clear old test results if resubmitting
    submission.test_results.all().delete()

    passed_count = 0
    results = []

    for tc in test_cases:
        r = run_code(
            source_code=submission.source_code,
            language=submission.language,
            stdin=tc.input_data or "",
        )

        expected = (tc.expected_output or "").strip()
        actual = (r["stdout"] or "").strip()

        passed = (
            r["error"] is None
            and r["status"] == "Accepted"
            and actual == expected
        )

        if passed:
            passed_count += 1

        SubmissionTestCaseResult.objects.create(
            submission=submission,
            test_case=tc,
            passed=passed,
            actual_output=actual,
            stderr=r["stderr"] or "",
            runtime_ms=int(float(r["time"]) * 1000) if r["time"] else None,
        )

        results.append({
            "test_case_id": tc.id,
            "passed": passed,
            "expected": expected,
            "actual": actual,
            "status": r["status"],
            "stderr": r["stderr"],
            "is_hidden": tc.is_hidden,
            "error": r["error"],
        })

    total = len(test_cases)
    score = round((passed_count / total) * question.marks)
    submission.auto_score = score
    submission.save(update_fields=["auto_score"])

    return {
        "auto_score": score,
        "total_marks": question.marks,
        "passed": passed_count,
        "total": total,
        "results": results,
    }