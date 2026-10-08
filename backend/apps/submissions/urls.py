from django.urls import path
from .views import RunCodeView, SubmitCodeView

urlpatterns = [
    path("run/", RunCodeView.as_view(), name="run-code"),
    path("submit/", SubmitCodeView.as_view(), name="submit-code"),
]