from django.urls import path
from .views import (
    ExamByCodeView,
    LogExamEventView,
    MyResultsListView,
    TeacherExamListCreateView,
    TeacherExamDetailView,
    TeacherQuestionListCreateView,
    TeacherQuestionDetailView,
    TeacherTestCaseListCreateView,
    TeacherTestCaseDetailView,
    TeacherSubmissionListView,
    TeacherSubmissionDetailView,
    TeacherPublishResultsView,
    TeacherPlagiarismView,
    TeacherExportResultsView,
)

urlpatterns = [
    path("exams/<str:code>/", ExamByCodeView.as_view(), name="exam-by-code"),
    path("exams/<str:code>/log-event/", LogExamEventView.as_view(), name="exam-log-event"),
    path("my-results/", MyResultsListView.as_view(), name="my-results"),

    path("teacher/exams/", TeacherExamListCreateView.as_view(), name="teacher-exams"),
    path("teacher/exams/<str:code>/", TeacherExamDetailView.as_view(), name="teacher-exam-detail"),
    path("teacher/exams/<str:code>/publish-results/", TeacherPublishResultsView.as_view(), name="teacher-publish-results"),
    path("teacher/exams/<str:code>/plagiarism/", TeacherPlagiarismView.as_view(), name="teacher-plagiarism"),
    path("teacher/exams/<str:code>/export.csv", TeacherExportResultsView.as_view(), name="teacher-export"),

    path("teacher/exams/<str:code>/questions/", TeacherQuestionListCreateView.as_view(), name="teacher-questions"),
    path("teacher/questions/<int:question_id>/", TeacherQuestionDetailView.as_view(), name="teacher-question-detail"),
    path("teacher/questions/<int:question_id>/test-cases/", TeacherTestCaseListCreateView.as_view(), name="teacher-testcases"),
    path("teacher/test-cases/<int:testcase_id>/", TeacherTestCaseDetailView.as_view(), name="teacher-testcase-detail"),

    path("teacher/exams/<str:code>/submissions/", TeacherSubmissionListView.as_view(), name="teacher-submissions"),
    path("teacher/submissions/<int:submission_id>/", TeacherSubmissionDetailView.as_view(), name="teacher-submission-detail"),
]