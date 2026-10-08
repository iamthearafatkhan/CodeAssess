"""
Create a superuser from environment variables if one doesn't exist.
Safe to run on every deploy — it's a no-op once the user exists.

Env vars:
    DJANGO_SUPERUSER_EMAIL
    DJANGO_SUPERUSER_PASSWORD
"""

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create a superuser from env vars if it doesn't already exist."

    def handle(self, *args, **options):
        User = get_user_model()

        email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

        if not email or not password:
            self.stdout.write(self.style.WARNING(
                "DJANGO_SUPERUSER_EMAIL / DJANGO_SUPERUSER_PASSWORD not set — skipping."
            ))
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.SUCCESS(
                f"Superuser {email} already exists — skipping."
            ))
            return

        User.objects.create_superuser(email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Superuser {email} created."))