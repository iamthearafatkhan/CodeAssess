from django.conf import settings
from django.core.mail import send_mail
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """
    POST /api/register/
    Body: email, password, role (STUDENT|TEACHER), plus profile fields.
    """
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send welcome email — never block registration if this fails
        try:
            send_mail(
                subject="Welcome to CodeAssess",
                message=(
                    f"Hi {user.first_name or user.email},\n\n"
                    f"Your account is ready. You can log in and start using the platform.\n\n"
                    f"— The CodeAssess Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response(
            {
                "message": "Registered successfully.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveAPIView):
    """
    GET /api/me/
    Returns the currently authenticated user's data.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AvatarUploadView(APIView):
    """
    POST /api/me/avatar/
    Multipart form upload: field name is "avatar".
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("avatar")
        if not file:
            return Response(
                {"error": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file.size > 2 * 1024 * 1024:
            return Response(
                {"error": "Image must be under 2 MB"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.avatar:
            request.user.avatar.delete(save=False)

        request.user.avatar = file
        request.user.save(update_fields=["avatar"])

        return Response(
            UserSerializer(request.user, context={"request": request}).data
        )