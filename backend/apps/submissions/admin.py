from django.contrib import admin
from .models import Submission, SubmissionTestCaseResult


class SubmissionTestCaseResultInline(admin.TabularInline):
    model = SubmissionTestCaseResult
    extra = 0
    readonly_fields = ("test_case", "passed", "actual_output", "stderr", "runtime_ms")
    can_delete = False


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student",
        "question",
        "language",
        "auto_score",
        "teacher_score",
        "submitted_at",
    )
    list_filter = ("language", "question__exam")
    search_fields = ("student__email", "question__title", "question__exam__code")
    readonly_fields = ("submitted_at", "created_at", "auto_score")
    inlines = [SubmissionTestCaseResultInline]


@admin.register(SubmissionTestCaseResult)
class SubmissionTestCaseResultAdmin(admin.ModelAdmin):
    list_display = ("id", "submission", "test_case", "passed", "runtime_ms")
    list_filter = ("passed",)