from django.contrib import admin
from .models import Exam, Question, TestCase


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ("order_number", "title", "marks", "language", "description")
    show_change_link = True


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "teacher", "section", "semester", "total_marks", "is_active", "created_at")
    list_filter = ("is_active", "semester", "section")
    search_fields = ("code", "title", "course_code")
    readonly_fields = ("code", "created_at")
    inlines = [QuestionInline]


class TestCaseInline(admin.TabularInline):
    model = TestCase
    extra = 1
    fields = ("input_data", "expected_output", "is_hidden")


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("exam", "order_number", "title", "marks", "language")
    list_filter = ("language",)
    search_fields = ("title", "exam__code")
    inlines = [TestCaseInline]


@admin.register(TestCase)
class TestCaseAdmin(admin.ModelAdmin):
    list_display = ("id", "question", "is_hidden")
    list_filter = ("is_hidden",)