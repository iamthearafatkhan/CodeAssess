from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.throttling import UserRateThrottle

from apps.exams.models import Question
from .models import Submission
from .services.executor import run_code
from .services.grading import grade_submission


MAX_SOURCE_LENGTH = 100_000   # 100 KB
MAX_STDIN_LENGTH = 10_000     # 10 KB


class RunCodeView(APIView):
    """POST /api/run/ — run code without saving."""

    throttle_classes = [UserRateThrottle]

    def post(self, request):
        code = request.data.get("code")
        language = request.data.get("language", "python")
        stdin = request.data.get("stdin", "")

        if not code:
            return Response({"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST)
        if len(code) > MAX_SOURCE_LENGTH:
            return Response({"error": "Source code too long"}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        if len(stdin) > MAX_STDIN_LENGTH:
            return Response({"error": "Input too long"}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

        result = run_code(source_code=code, language=language, stdin=stdin)

        if result["error"]:
            return Response({"error": result["error"]}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(result, status=status.HTTP_200_OK)


class SubmitThrottle(UserRateThrottle):
    scope = "submit"


class SubmitCodeView(APIView):
    """
    POST /api/submit/
    Body: { exam_code, question_id, code, language }
    Requires Bearer token.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [SubmitThrottle]

    def post(self, request):
        exam_code = request.data.get("exam_code")
        question_id = request.data.get("question_id")
        code = request.data.get("code")
        language = request.data.get("language", "python")

        # --- Input validation ---
        if not all([exam_code, question_id, code]):
            return Response(
                {"error": "exam_code, question_id, and code are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(code) > MAX_SOURCE_LENGTH:
            return Response(
                {"error": "Source code too long"},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        # --- Question lookup, scoped to the exam code ---
        try:
            question = Question.objects.select_related("exam").filter(
                id=question_id,
                exam__code=exam_code,
                exam__is_active=True,
            ).first()
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid question_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not question:
            return Response(
                {"error": "Question not found or exam is not active"},
                status=status.HTTP_404_NOT_FOUND,
            )

        exam = question.exam

        # --- Create or update the submission ---
        try:
            submission, _created = Submission.objects.update_or_create(
                student=request.user,
                question=question,
                defaults={"source_code": code, "language": language},
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to save submission: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --- Grade it ---
        try:
            summary = grade_submission(submission)
        except Exception as e:
            return Response(
                {"error": f"Grading failed: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --- Build response, respecting the show_score_immediately flag ---
        # Use getattr so this never crashes if the field is missing.
        show_score = getattr(exam, "show_score_immediately", True)

        public_results = []
        for r in summary["results"]:
            if r["is_hidden"]:
                public_results.append({
                    "test_case_id": r["test_case_id"],
                    "passed": r["passed"],
                    "status": r["status"],
                })
            else:
                public_results.append(r)

        payload = {
            "submission_id": submission.id,
            "total_marks": summary["total_marks"],
            "total": summary["total"],
        }

        if show_score:
            payload.update({
                "auto_score": summary["auto_score"],
                "passed": summary["passed"],
                "results": public_results,
            })
        else:
            payload["message"] = "Submission received. Score will be visible after the exam ends."

        return Response(payload, status=status.HTTP_200_OK)