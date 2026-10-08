from rest_framework import serializers

from .models import Exam, Question, TestCase


# ---------------------------------------------------------------------------
# Student-facing
# ---------------------------------------------------------------------------

class QuestionPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ("id", "order_number", "title", "description", "marks", "language")


class ExamPublicSerializer(serializers.ModelSerializer):
    questions = QuestionPublicSerializer(many=True, read_only=True)

    class Meta:
        model = Exam
        fields = (
            "code", "title", "course_code", "section", "semester",
            "duration_minutes", "total_marks", "is_active",
            "start_time", "end_time", "questions",
        )


class MySubmissionSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    auto_score = serializers.IntegerField()
    teacher_score = serializers.IntegerField(allow_null=True)
    submitted_at = serializers.DateTimeField()


# ---------------------------------------------------------------------------
# Teacher-facing read
# ---------------------------------------------------------------------------

class TestCaseTeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = ("id", "input_data", "expected_output", "is_hidden")


class QuestionTeacherSerializer(serializers.ModelSerializer):
    test_cases = TestCaseTeacherSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ("id", "order_number", "title", "description", "marks", "language", "test_cases")


class ExamTeacherSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()
    submission_count = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = (
            "code", "title", "course_code", "section", "semester",
            "duration_minutes", "total_marks", "is_active",
            "created_at", "start_time", "end_time",
            "show_score_immediately", "results_published",
            "question_count", "submission_count",
        )

    def get_question_count(self, exam):
        return exam.questions.count()

    def get_submission_count(self, exam):
        from apps.submissions.models import Submission
        return Submission.objects.filter(question__exam=exam).count()


class ExamDetailTeacherSerializer(serializers.ModelSerializer):
    questions = QuestionTeacherSerializer(many=True, read_only=True)

    class Meta:
        model = Exam
        fields = (
            "code", "title", "course_code", "section", "semester",
            "duration_minutes", "total_marks", "is_active",
            "created_at", "start_time", "end_time",
            "show_score_immediately", "results_published", "questions",
        )


# ---------------------------------------------------------------------------
# Teacher-facing write
# ---------------------------------------------------------------------------

class ExamWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = (
            "code", "title", "course_code", "section", "semester",
            "duration_minutes", "is_active",
            "start_time", "end_time",
            "show_score_immediately", "results_published",
        )
        read_only_fields = ("code",)

    def validate_duration_minutes(self, v):
        if v < 1 or v > 600:
            raise serializers.ValidationError("Duration must be between 1 and 600 minutes.")
        return v


class QuestionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ("id", "order_number", "title", "description", "marks", "language")

    def validate_marks(self, v):
        if v < 1 or v > 1000:
            raise serializers.ValidationError("Marks must be between 1 and 1000.")
        return v


class TestCaseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = ("id", "input_data", "expected_output", "is_hidden")

    def validate_expected_output(self, v):
        if v is None or str(v).strip() == "":
            raise serializers.ValidationError("Expected output cannot be empty.")
        return v