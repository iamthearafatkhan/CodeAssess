import csv

from django.utils import timezone
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.throttling import UserRateThrottle

from apps.submissions.models import Submission
from apps.submissions.services.plagiarism import find_similar_pairs
from .models import Exam, Question, TestCase, ExamEvent
from .serializers import (
    ExamPublicSerializer,
    MySubmissionSerializer,
    ExamTeacherSerializer,
    ExamDetailTeacherSerializer,
    ExamWriteSerializer,
    QuestionWriteSerializer,
    TestCaseWriteSerializer,
)


def _is_teacher(user):
    return user.is_authenticated and user.role == "TEACHER"


def _letter_grade(percentage):
    """Standard Bangladeshi 4.00 scale."""
    if percentage >= 80: return "A+", 4.00
    if percentage >= 75: return "A",  3.75
    if percentage >= 70: return "A-", 3.50
    if percentage >= 65: return "B+", 3.25
    if percentage >= 60: return "B",  3.00
    if percentage >= 55: return "B-", 2.75
    if percentage >= 50: return "C+", 2.50
    if percentage >= 45: return "C",  2.25
    if percentage >= 40: return "D",  2.00
    return "F", 0.00


class JoinExamThrottle(UserRateThrottle):
    scope = 'join_exam'


# ---------------------------------------------------------------------------
# Student — exam
# ---------------------------------------------------------------------------

class ExamByCodeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [JoinExamThrottle]

    def get(self, request, code):
        code = code.strip().upper()
        exam = Exam.objects.filter(code=code).first()
        if not exam:
            return Response({"error": "Invalid exam code"}, status=status.HTTP_404_NOT_FOUND)
        if not exam.is_active:
            return Response({"error": "This exam is not active"}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        if exam.start_time and now < exam.start_time:
            return Response({"error": "Exam has not started yet"}, status=status.HTTP_403_FORBIDDEN)
        if exam.end_time and now > exam.end_time:
            return Response({"error": "Exam has ended"}, status=status.HTTP_403_FORBIDDEN)

        exam_data = ExamPublicSerializer(exam).data
        my_subs = Submission.objects.filter(
            student=request.user, question__exam=exam,
        ).values("question_id", "auto_score", "teacher_score", "submitted_at")
        exam_data["my_submissions"] = MySubmissionSerializer(my_subs, many=True).data
        return Response(exam_data, status=status.HTTP_200_OK)


class LogExamEventView(APIView):
    """
    POST /api/exams/<code>/log-event/  { "event_type": "TAB_SWITCH" }
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [JoinExamThrottle]

    def post(self, request, code):
        event_type = request.data.get("event_type")
        valid_types = {c[0] for c in ExamEvent.EventType.choices}
        if event_type not in valid_types:
            return Response({"error": "Invalid event type"}, status=status.HTTP_400_BAD_REQUEST)

        exam = Exam.objects.filter(code=code.upper()).first()
        if not exam:
            return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)

        ExamEvent.objects.create(student=request.user, exam=exam, event_type=event_type)
        return Response({"ok": True}, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Student — results
# ---------------------------------------------------------------------------

class MyResultsListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subs = Submission.objects.filter(
            student=request.user,
            question__exam__results_published=True,
        ).select_related("question", "question__exam").order_by(
            "question__exam__created_at", "question__order_number",
        )

        exams = {}
        for s in subs:
            exam = s.question.exam
            if exam.code not in exams:
                exams[exam.code] = {
                    "exam_code": exam.code,
                    "exam_title": exam.title,
                    "course_code": exam.course_code,
                    "section": exam.section,
                    "semester": exam.semester,
                    "total_marks": exam.total_marks,
                    "questions": [],
                }
            exams[exam.code]["questions"].append({
                "question_id": s.question.id,
                "order_number": s.question.order_number,
                "title": s.question.title,
                "marks": s.question.marks,
                "score": s.final_score,
                "is_final": s.teacher_score is not None,
            })

        results = []
        for e in exams.values():
            obtained = sum(q["score"] for q in e["questions"])
            total = e["total_marks"] or sum(q["marks"] for q in e["questions"]) or 1
            pct = round((obtained / total) * 100, 2) if total else 0
            letter, points = _letter_grade(pct)
            results.append({
                **e,
                "obtained_marks": obtained,
                "percentage": pct,
                "grade": letter,
                "grade_points": points,
            })

        results.sort(key=lambda r: r["exam_code"], reverse=True)
        return Response(results)


# ---------------------------------------------------------------------------
# Teacher — exams
# ---------------------------------------------------------------------------

class TeacherExamListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_teacher(request.user):
            return Response({"error": "Teacher account required"}, status=status.HTTP_403_FORBIDDEN)
        exams = Exam.objects.filter(teacher=request.user).order_by("-created_at")
        return Response(ExamTeacherSerializer(exams, many=True).data)

    def post(self, request):
        if not _is_teacher(request.user):
            return Response({"error": "Teacher account required"}, status=status.HTTP_403_FORBIDDEN)
        serializer = ExamWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        exam = serializer.save(teacher=request.user)
        return Response(ExamTeacherSerializer(exam).data, status=status.HTTP_201_CREATED)


class TeacherExamDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def _get_exam(self, request, code):
        if not _is_teacher(request.user):
            return None, Response({"error": "Teacher account required"}, status=status.HTTP_403_FORBIDDEN)
        exam = Exam.objects.filter(code=code.upper(), teacher=request.user).first()
        if not exam:
            return None, Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)
        return exam, None

    def get(self, request, code):
        exam, err = self._get_exam(request, code)
        if err:
            return err
        return Response(ExamDetailTeacherSerializer(exam).data)

    def patch(self, request, code):
        exam, err = self._get_exam(request, code)
        if err:
            return err
        serializer = ExamWriteSerializer(exam, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(ExamTeacherSerializer(exam).data)

    def delete(self, request, code):
        exam, err = self._get_exam(request, code)
        if err:
            return err
        exam.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Teacher — questions
# ---------------------------------------------------------------------------

class TeacherQuestionListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def _get_exam(self, request, code):
        if not _is_teacher(request.user):
            return None, Response({"error": "Teacher account required"}, status=status.HTTP_403_FORBIDDEN)
        exam = Exam.objects.filter(code=code.upper(), teacher=request.user).first()
        if not exam:
            return None, Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)
        return exam, None

    def post(self, request, code):
        exam, err = self._get_exam(request, code)
        if err:
            return err
        serializer = QuestionWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        question = serializer.save(exam=exam)
        exam.recalculate_total_marks()
        return Response(QuestionWriteSerializer(question).data, status=status.HTTP_201_CREATED)


class TeacherQuestionDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def _get_question(self, request, question_id):
        if not _is_teacher(request.user):
            return None, Response({"error": "Teacher account required"}, status=status.HTTP_403_FORBIDDEN)
        q = Question.objects.filter(id=question_id, exam__teacher=request.user).select_related("exam").first()
        if not q:
            return None, Response({"error": "Question not found"}, status=status.HTTP_404_NOT_FOUND)
        return q, None

    def patch(self, request, question_id):
        q, err = self._get_question(request, question_id)
        if err:
            return err
        serializer = QuestionWriteSerializer(q, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        q.exam.recalculate_total_marks()
        return Response(QuestionWriteSerializer(q).data)

    def delete(self, request, question_id):
        q, err = self._get_question(request, question_id)
        if err:
            return err
        exam = q.exam
        q.delete()
        exam.recalculate_total_marks()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Teacher — test cases
# ---------------------------------------------------------------------------

class TeacherTestCaseListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def _get_question(self, request, question_id):
        if not _is_teacher(request.user):
            return None, Response({"error": "Teacher account required"}, status=status.HTTP_403_FORBIDDEN)
        q = Question.objects.filter(id=question_id, exam__teacher=request.user).first()
        if not q:
            return None, Response({"error": "Question not found"}, status=status.HTTP_404_NOT_FOUND)
        return q, None

    def post(self, request, question_id):
        q, err = self._get_question(request, question_id)
        if err:
            return err
        serializer = TestCaseWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        tc = serializer.save(question=q)
        return Response(TestCaseWriteSerializer(tc).data, status=status.HTTP_201_CREATED)


class TeacherTestCaseDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def _get_testcase(self, request, testcase_id):
        if not _is_teacher(request.user):
            return None, Response({"error": "Teacher account required"}, status=status.HTTP_403_FORBIDDEN)
        tc = TestCase.objects.filter(id=testcase_id, question__exam__teacher=request.user).first()
        if not tc:
            return None, Response({"error": "Test case not found"}, status=status.HTTP_404_NOT_FOUND)
        return tc, None

    def patch(self, request, testcase_id):
        tc, err = self._get_testcase(request, testcase_id)
        if err:
            return err
        serializer = TestCaseWriteSerializer(tc, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(TestCaseWriteSerializer(tc).data)

    def delete(self, request, testcase_id):
        tc, err = self._get_testcase(request, testcase_id)
        if err:
            return err
        tc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Teacher — submissions
# ---------------------------------------------------------------------------

class TeacherSubmissionListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, code):
        if not _is_teacher(request.user):
            return Response({"error": "Teacher account required"}, status=status.HTTP_403_FORBIDDEN)
        exam = Exam.objects.filter(code=code.upper(), teacher=request.user).first()
        if not exam:
            return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)

        subs = Submission.objects.filter(question__exam=exam).select_related(
            "student", "question"
        ).order_by("question__order_number", "student__email")

        data = [{
            "id": s.id,
            "student_email": s.student.email,
            "student_name": f"{s.student.first_name} {s.student.last_name}".strip() or s.student.email,
            "question_id": s.question.id,
            "question_order": s.question.order_number,
            "question_title": s.question.title,
            "question_marks": s.question.marks,
            "language": s.language,
            "auto_score": s.auto_score,
            "teacher_score": s.teacher_score,
            "final_score": s.final_score,
            "submitted_at": s.submitted_at,
            "has_feedback": bool(s.feedback.strip()),
        } for s in subs]

        return Response({
            "exam": ExamTeacherSerializer(exam).data,
            "submissions": data,
        })


class TeacherSubmissionDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def _get_submission(self, request, submission_id):
        if not _is_teacher(request.user):
            return None, Response({"error": "Teacher account required"}, status=status.HTTP_403_FORBIDDEN)
        sub = Submission.objects.filter(
            id=submission_id, question__exam__teacher=request.user,
        ).select_related("student", "question", "question__exam").first()
        if not sub:
            return None, Response({"error": "Submission not found"}, status=status.HTTP_404_NOT_FOUND)
        return sub, None

    def get(self, request, submission_id):
        sub, err = self._get_submission(request, submission_id)
        if err:
            return err

        test_results = [{
            "test_case_id": tr.test_case_id,
            "passed": tr.passed,
            "actual_output": tr.actual_output,
            "expected_output": tr.test_case.expected_output,
            "input_data": tr.test_case.input_data,
            "is_hidden": tr.test_case.is_hidden,
            "stderr": tr.stderr,
            "runtime_ms": tr.runtime_ms,
        } for tr in sub.test_results.select_related("test_case").all()]

        events = list(ExamEvent.objects.filter(
            student=sub.student,
            exam=sub.question.exam,
        ).values("event_type", "occurred_at"))

        return Response({
            "id": sub.id,
            "student_email": sub.student.email,
            "student_name": f"{sub.student.first_name} {sub.student.last_name}".strip() or sub.student.email,
            "exam_code": sub.question.exam.code,
            "exam_title": sub.question.exam.title,
            "question_id": sub.question.id,
            "question_title": sub.question.title,
            "question_description": sub.question.description,
            "question_marks": sub.question.marks,
            "language": sub.language,
            "source_code": sub.source_code,
            "auto_score": sub.auto_score,
            "teacher_score": sub.teacher_score,
            "final_score": sub.final_score,
            "feedback": sub.feedback,
            "submitted_at": sub.submitted_at,
            "test_results": test_results,
            "events": events,
        })

    def patch(self, request, submission_id):
        sub, err = self._get_submission(request, submission_id)
        if err:
            return err

        if "teacher_score" in request.data:
            score = request.data["teacher_score"]
            if score is None or score == "":
                sub.teacher_score = None
            else:
                try:
                    score = int(score)
                except (TypeError, ValueError):
                    return Response({"error": "teacher_score must be an integer"}, status=status.HTTP_400_BAD_REQUEST)
                if score < 0 or score > sub.question.marks:
                    return Response(
                        {"error": f"teacher_score must be between 0 and {sub.question.marks}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                sub.teacher_score = score

        if "feedback" in request.data:
            feedback = str(request.data["feedback"])
            if len(feedback) > 5000:
                return Response({"error": "Feedback too long"}, status=status.HTTP_400_BAD_REQUEST)
            sub.feedback = feedback

        sub.save(update_fields=["teacher_score", "feedback"])
        return Response({"ok": True, "final_score": sub.final_score})


# ---------------------------------------------------------------------------
# Teacher — publish results
# ---------------------------------------------------------------------------

class TeacherPublishResultsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, code):
        if not _is_teacher(request.user):
            return Response({"error": "Teacher account required"}, status=status.HTTP_403_FORBIDDEN)
        exam = Exam.objects.filter(code=code.upper(), teacher=request.user).first()
        if not exam:
            return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)

        published = bool(request.data.get("published", True))
        exam.results_published = published
        exam.save(update_fields=["results_published"])
        return Response({"code": exam.code, "results_published": exam.results_published})


# ---------------------------------------------------------------------------
# Teacher — plagiarism
# ---------------------------------------------------------------------------

class TeacherPlagiarismView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, code):
        if not _is_teacher(request.user):
            return Response({"error": "Teacher account required"}, status=status.HTTP_403_FORBIDDEN)
        exam = Exam.objects.filter(code=code.upper(), teacher=request.user).first()
        if not exam:
            return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            threshold = float(request.query_params.get("threshold", 0.7))
            threshold = max(0.3, min(0.95, threshold))
        except (TypeError, ValueError):
            threshold = 0.7

        report = []
        for q in exam.questions.all():
            subs = list(Submission.objects.filter(question=q).select_related("student"))
            if len(subs) < 2:
                continue
            pairs = find_similar_pairs(subs, threshold=threshold)
            if pairs:
                report.append({
                    "question_id": q.id,
                    "question_order": q.order_number,
                    "question_title": q.title,
                    "submission_count": len(subs),
                    "pairs": pairs,
                })

        return Response({
            "exam_code": exam.code,
            "threshold": threshold,
            "report": report,
        })


# ---------------------------------------------------------------------------
# Teacher — CSV export
# ---------------------------------------------------------------------------

class TeacherExportResultsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, code):
        if not _is_teacher(request.user):
            return Response({"error": "Teacher account required"}, status=status.HTTP_403_FORBIDDEN)
        exam = Exam.objects.filter(code=code.upper(), teacher=request.user).first()
        if not exam:
            return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)

        subs = Submission.objects.filter(question__exam=exam).select_related(
            "student", "question",
        ).order_by("student__email", "question__order_number")

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{exam.code}-results.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "student_email", "student_name", "question_order", "question_title",
            "question_marks", "language", "auto_score", "teacher_score",
            "final_score", "submitted_at", "has_feedback",
        ])
        for s in subs:
            writer.writerow([
                s.student.email,
                f"{s.student.first_name} {s.student.last_name}".strip(),
                s.question.order_number,
                s.question.title,
                s.question.marks,
                s.language,
                s.auto_score,
                s.teacher_score if s.teacher_score is not None else "",
                s.final_score,
                s.submitted_at.isoformat(),
                "yes" if s.feedback.strip() else "no",
            ])
        return response