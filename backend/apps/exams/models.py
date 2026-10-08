import random
import string

from django.conf import settings
from django.db import models


def generate_exam_code():
    """Return a random 6-character uppercase code like '7XK92A'."""
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = "".join(random.choices(alphabet, k=6))
        if not Exam.objects.filter(code=code).exists():
            return code


class Exam(models.Model):
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="exams",
    )
    code = models.CharField(max_length=12, unique=True, default=generate_exam_code)

    title = models.CharField(max_length=255)
    course_code = models.CharField(max_length=32, blank=True)
    section = models.CharField(max_length=16, blank=True)
    semester = models.CharField(max_length=32, blank=True)

    duration_minutes = models.PositiveIntegerField(default=60)
    total_marks = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    show_score_immediately = models.BooleanField(
        default=True,
        help_text="If false, students see 'submitted' but not their score until the exam ends.",
    )
    results_published = models.BooleanField(
    default=False,
    help_text="If true, students can see their final results in the Results page.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.code} — {self.title}"

    def recalculate_total_marks(self):
        total = sum(q.marks for q in self.questions.all())
        self.total_marks = total
        self.save(update_fields=["total_marks"])


class Question(models.Model):
    class Language(models.TextChoices):
        PYTHON = "python", "Python"
        C = "c", "C"
        CPP = "cpp", "C++"
        JAVA = "java", "Java"

    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name="questions",
    )
    order_number = models.PositiveIntegerField(default=1)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    marks = models.PositiveIntegerField(default=10)
    language = models.CharField(
        max_length=16,
        choices=Language.choices,
        default=Language.PYTHON,
    )

    class Meta:
        ordering = ["order_number"]

    def __str__(self):
        return f"Q{self.order_number}: {self.title}"


class TestCase(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="test_cases",
    )
    input_data = models.TextField(blank=True)
    expected_output = models.TextField()
    is_hidden = models.BooleanField(
        default=True,
        help_text="Hidden test cases are used for grading, not shown to students.",
    )

    def __str__(self):
        return f"TestCase #{self.pk} for Q{self.question.order_number}"


class ExamEvent(models.Model):
    class EventType(models.TextChoices):
        TAB_SWITCH = "TAB_SWITCH", "Tab switch"
        EXIT_FULLSCREEN = "EXIT_FULLSCREEN", "Exit fullscreen"
        COPY = "COPY", "Copy"
        PASTE = "PASTE", "Paste"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="exam_events",
    )
    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name="events",
    )
    event_type = models.CharField(max_length=32, choices=EventType.choices)
    occurred_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-occurred_at"]

    def __str__(self):
        return f"{self.event_type} · {self.student.email} · {self.exam.code}"