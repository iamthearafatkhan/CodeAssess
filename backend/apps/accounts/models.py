from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        TEACHER = "TEACHER", "Teacher"

    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)

    avatar = models.ImageField(
        upload_to="avatars/",
        null=True,
        blank=True,
        help_text="Profile picture. Optional.",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    student_id = models.CharField(max_length=32, unique=True)
    university = models.CharField(max_length=128, blank=True)
    department = models.CharField(max_length=64, blank=True)
    section = models.CharField(max_length=16, blank=True)
    session = models.CharField(max_length=32, blank=True)
    semester = models.CharField(max_length=16, blank=True)

    def __str__(self):
        return f"{self.student_id} - {self.user.email}"


class TeacherProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="teacher_profile")
    teacher_id = models.CharField(max_length=32, unique=True)
    university = models.CharField(max_length=128, blank=True)
    department = models.CharField(max_length=64, blank=True)

    def __str__(self):
        return f"{self.teacher_id} - {self.user.email}"