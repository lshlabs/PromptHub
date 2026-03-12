import os
import random
from dataclasses import dataclass

import requests
from django.db import DatabaseError
from requests import RequestException

from users.models import CustomUser, UserSettings
from users.utils import get_location_from_ip

DEFAULT_OAUTH_LOCATION = "위치 정보를 설정해주세요."


class OAuthProviderError(RuntimeError):
    pass


class OAuthValidationError(ValueError):
    pass


@dataclass
class GoogleLoginResult:
    user: CustomUser
    created: bool
    message: str


def verify_google_id_token(id_token: str) -> dict:
    try:
        response = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": id_token},
            timeout=5,
        )
    except RequestException as exc:
        raise OAuthProviderError("Google 인증 서버와 통신할 수 없습니다.") from exc

    if response.status_code != 200:
        raise OAuthValidationError("유효하지 않은 Google 토큰입니다.")

    return response.json()


def resolve_or_create_google_user(token_payload: dict, client_ip: str | None) -> GoogleLoginResult:
    email = token_payload.get("email")
    email_verified = token_payload.get("email_verified") in (True, "true", "True", "1", 1)
    audience = token_payload.get("aud")
    expected_client_id = os.environ.get("GOOGLE_CLIENT_ID") or os.environ.get("NEXT_PUBLIC_GOOGLE_CLIENT_ID")

    if expected_client_id and audience != expected_client_id:
        raise OAuthValidationError("허용되지 않은 클라이언트에서 발급된 토큰입니다.")
    if not email or not email_verified:
        raise OAuthValidationError("이메일 확인에 실패했습니다.")

    try:
        user = CustomUser.objects.filter(email=email).first()
        created = False
        if not user:
            user = CustomUser.objects.create_user(email=email, password=None, is_active=True)
            created = True

            google_name = token_payload.get("name", "")
            if google_name:
                name_parts = google_name.split()
                if name_parts:
                    user.username = f"{name_parts[0].lower()}_{random.randint(1000, 9999)}"

            if not user.github_handle:
                user.github_handle = ""

            user.location = get_location_from_ip(client_ip) if client_ip else DEFAULT_OAUTH_LOCATION
            user.save()

            settings, settings_created = UserSettings.objects.get_or_create(user=user)
            if settings_created:
                settings.email_notifications_enabled = True
                settings.in_app_notifications_enabled = True
                settings.public_profile = True
                settings.save()
        elif not user.is_active:
            user.is_active = True
            user.save()

        if not user.is_active:
            raise OAuthValidationError("계정이 비활성화되어 있습니다.")

        if not user.has_usable_password():
            user.is_active = True
            user.is_staff = False
            user.is_superuser = False
            user.save()

        return GoogleLoginResult(
            user=user,
            created=created,
            message="Google 로그인에 성공했습니다." if not created else "Google 계정으로 회원가입이 완료되었습니다.",
        )
    except DatabaseError as exc:
        raise OAuthProviderError("Google 로그인 처리 중 오류가 발생했습니다.") from exc
