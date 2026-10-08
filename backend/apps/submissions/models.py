from django.conf import settings
from django.db import models

from apps.exams.models import Question


class Submission(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    source_code = models.TextField()
    language = models.CharField(max_length=16)

    auto_score = models.PositiveIntegerField(
        default=0,
        help_text="Score computed automatically from test cases.",
    )
    teacher_score = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Teacher override. If null, use auto_score.",
    )
    feedback = models.TextField(blank=True)

    submitted_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # One submission per student per question. Resubmission overwrites.
        unique_together = ("student", "question")
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"Submission #{self.pk}: {self.student.email} → Q{self.question.order_number}"

    @property
    def final_score(self):
        return self.teacher_score if self.teacher_score is not None else self.auto_score


class SubmissionTestCaseResult(models.Model):
    submission = models.ForeignKey(
        Submission,
        on_delete=models.CASCADE,
        related_name="test_results",
    )
    test_case = models.ForeignKey(
        "exams.TestCase",
        on_delete=models.CASCADE,
    )
    passed = models.BooleanField(default=False)
    actual_output = models.TextField(blank=True)
    stderr = models.TextField(blank=True)
    runtime_ms = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        status = "PASS" if self.passed else "FAIL"
        return f"[{status}] Submission #{self.submission_id} / TestCase #{self.test_case_id}"