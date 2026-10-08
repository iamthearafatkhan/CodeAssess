from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import StudentProfile, TeacherProfile

User = get_user_model()


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ("student_id", "university", "department", "section", "session", "semester")


class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherProfile
        fields = ("teacher_id", "university", "department")


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "role", "avatar_url", "profile")

    def get_avatar_url(self, user):
        if not user.avatar:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(user.avatar.url)
        return user.avatar.url

    def get_profile(self, user):
        if user.role == "STUDENT":
            try:
                return StudentProfileSerializer(user.student_profile).data
            except StudentProfile.DoesNotExist:
                return None
        else:
            try:
                return TeacherProfileSerializer(user.teacher_profile).data
            except TeacherProfile.DoesNotExist:
                return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=["STUDENT", "TEACHER"])

    # Shared profile fields
    university = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)

    # Student-only
    student_id = serializers.CharField(required=False, allow_blank=True)
    section = serializers.CharField(required=False, allow_blank=True)
    session = serializers.CharField(required=False, allow_blank=True)
    semester = serializers.CharField(required=False, allow_blank=True)

    # Teacher-only
    teacher_id = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            "email", "password", "first_name", "last_name", "role",
            "student_id", "section", "session", "semester",
            "teacher_id", "university", "department",
        )

    def validate(self, attrs):
        role = attrs.get("role")
        if role == "STUDENT" and not attrs.get("student_id"):
            raise serializers.ValidationError({"student_id": "Required for students."})
        if role == "TEACHER" and not attrs.get("teacher_id"):
            raise serializers.ValidationError({"teacher_id": "Required for teachers."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        role = validated_data.pop("role")
        password = validated_data.pop("password")

        # Profile fields
        student_id = validated_data.pop("student_id", "")
        section = validated_data.pop("section", "")
        session = validated_data.pop("session", "")
        semester = validated_data.pop("semester", "")
        teacher_id = validated_data.pop("teacher_id", "")
        university = validated_data.pop("university", "")
        department = validated_data.pop("department", "")

        user = User.objects.create_user(
            email=validated_data["email"],
            password=password,
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=role,
        )

        if role == "STUDENT":
            StudentProfile.objects.create(
                user=user,
                student_id=student_id,
                university=university,
                department=department,
                section=section,
                session=session,
                semester=semester,
            )
        else:
            TeacherProfile.objects.create(
                user=user,
                teacher_id=teacher_id,
                university=university,
                department=department,
            )

        return user