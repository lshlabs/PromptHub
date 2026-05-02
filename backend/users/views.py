from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.db import DatabaseError, transaction
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import APIException
from .models import CustomUser, UserSettings, UserSession
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserProfileSerializer,
    PasswordChangeSerializer,
    UserSettingsSerializer,
    UserSessionSerializer,
)
from user_agents import parse as parse_ua
from .utils import get_location_from_ip, generate_random_avatar_colors, generate_random_username
import logging
from secrets import token_urlsafe
from .services import (
    OAuthProviderError,
    OAuthValidationError,
    resolve_or_create_google_user,
    verify_google_id_token,
)

logger = logging.getLogger(__name__)

def _extract_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _parse_device_info(request):
    raw_user_agent = request.META.get("HTTP_USER_AGENT", "")
    ua = parse_ua(raw_user_agent) if raw_user_agent else None
    if not ua:
        return raw_user_agent, None, None, None

    if ua.is_mobile:
        device = ua.device.brand or ua.device.family or "Mobile"
    elif ua.is_tablet:
        device = ua.device.brand or ua.device.family or "Tablet"
    elif ua.is_pc:
        device = ua.device.family or "PC"
    elif ua.is_bot:
        device = "Bot"
    else:
        device = "Unknown"

    browser = f"{ua.browser.family} {ua.browser.version_string}"
    os_name = f"{ua.os.family} {ua.os.version_string}"
    return raw_user_agent, device, browser, os_name


def _create_session(request, user):
    raw_user_agent, device, browser, os_name = _parse_device_info(request)
    return UserSession.objects.create(
        user=user,
        key=token_urlsafe(32),
        user_agent=raw_user_agent,
        ip_address=_extract_client_ip(request),
        device=device,
        browser=browser,
        os=os_name,
    )


class UserRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            user.location = get_location_from_ip(_extract_client_ip(request))
            user.save()

            token, _ = Token.objects.get_or_create(user=user)
            profile_data = UserProfileSerializer(user).data

            return Response({
                'message': '회원가입이 완료되었습니다.',
                'user': profile_data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'message': '회원가입에 실패했습니다.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            session = _create_session(request, user)
            profile_data = UserProfileSerializer(user).data

            return Response({
                'message': '로그인이 완료되었습니다.',
                'user': profile_data,
                'token': token.key,
                'session': UserSessionSerializer(session).data,
            }, status=status.HTTP_200_OK)
        
        return Response({
            'message': '로그인에 실패했습니다.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
            session_key = request.headers.get('X-Session-Key') or request.data.get('session_key') if hasattr(request, 'data') else None
            if session_key:
                from django.utils import timezone
                updated = UserSession.objects.filter(
                    user=request.user,
                    key=session_key,
                    revoked_at__isnull=True,
                ).update(revoked_at=timezone.now())
                if updated == 0:
                    logger.info("Logout called with unknown session key for user_id=%s", request.user.id)
            return Response({'message': '로그아웃이 완료되었습니다.'}, status=status.HTTP_200_OK)
        except (AttributeError, DatabaseError):
            logger.exception("Logout failed for user_id=%s", request.user.id)
            return Response({
                'message': '로그아웃 처리 중 서버 오류가 발생했습니다.',
                'error_code': 'USER_LOGOUT_FAILED',
            }, status=status.HTTP_400_BAD_REQUEST)


class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        id_token = request.data.get('id_token') if hasattr(request, 'data') else None
        if not id_token:
            return Response({'message': 'id_token이 필요합니다.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = verify_google_id_token(id_token)
            result = resolve_or_create_google_user(payload, _extract_client_ip(request))

            token, _ = Token.objects.get_or_create(user=result.user)
            session = _create_session(request, result.user)

            profile_data = UserProfileSerializer(result.user).data
            return Response({
                'message': result.message,
                'user': profile_data,
                'token': token.key,
                'session': UserSessionSerializer(session).data,
            }, status=status.HTTP_200_OK if not result.created else status.HTTP_201_CREATED)
        except OAuthValidationError as oauth_error:
            logger.info("Google login validation failed: %s", oauth_error)
            return Response(
                {
                    'message': 'Google 인증 정보가 유효하지 않습니다.',
                    'error_code': 'GOOGLE_AUTH_INVALID',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except OAuthProviderError as oauth_error:
            logger.warning("Google token verification request failed: %s", oauth_error)
            return Response(
                {
                    'message': 'Google 인증 서버 통신 오류가 발생했습니다.',
                    'error_code': 'GOOGLE_PROVIDER_UNAVAILABLE',
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except DatabaseError:
            logger.exception("Google login failed.")
            return Response(
                {
                    'message': 'Google 로그인 처리 중 서버 오류가 발생했습니다.',
                    'error_code': 'GOOGLE_LOGIN_FAILED',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
        settings_data = UserSettingsSerializer(settings_obj).data
        profile_completeness = self._check_profile_completeness(request.user)

        return Response({
            'user': serializer.data,
            'settings': settings_data,
            'profile_completeness': profile_completeness,
        }, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        if serializer.is_valid():
            serializer.save()
            return Response({'message': '프로필이 업데이트되었습니다.', 'user': serializer.data}, status=status.HTTP_200_OK)
        
        return Response({
            'message': '프로필 업데이트에 실패했습니다.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def _check_profile_completeness(self, user):
        required_fields = ['username', 'bio', 'location', 'github_handle']
        completed_fields = sum(1 for field in required_fields if str(getattr(user, field, "")).strip())
        completeness_percentage = (completed_fields / len(required_fields)) * 100
        return {
            'percentage': completeness_percentage,
            'completed_fields': completed_fields,
            'total_fields': len(required_fields),
            'missing_fields': [field for field in required_fields if not str(getattr(user, field, "")).strip()],
        }

    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': '프로필이 업데이트되었습니다.',
                'user': serializer.data
            }, status=status.HTTP_200_OK)
        return Response({
            'message': '프로필 업데이트에 실패했습니다.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class UserSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
        return Response(UserSettingsSerializer(settings_obj).data, status=status.HTTP_200_OK)

    def patch(self, request):
        settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
        serializer = UserSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({'message': '설정 업데이트 실패', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        return self.patch(request)


class RegenerateAvatarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user: CustomUser = request.user

        regenerate_username = request.data.get('regenerate_username', False)
        if isinstance(regenerate_username, str):
            regenerate_username = regenerate_username.lower() in ('1', 'true', 'yes', 'on')

        old_color1 = user.avatar_color1
        old_color2 = user.avatar_color2

        for _ in range(5):
            color1, color2 = generate_random_avatar_colors()
            if color1 != old_color1 or color2 != old_color2:
                break

        user.avatar_color1 = color1
        user.avatar_color2 = color2

        if regenerate_username is True:
            user.username = generate_random_username()

        user.save(update_fields=['avatar_color1', 'avatar_color2', 'username'] if regenerate_username else ['avatar_color1', 'avatar_color2'])

        return Response({
            'message': '아바타가 재생성되었습니다.' if not regenerate_username else '아바타와 사용자명이 재생성되었습니다.',
            'user': UserProfileSerializer(user).data,
        }, status=status.HTTP_200_OK)


class UserSessionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = UserSession.objects.filter(
            user=request.user,
            revoked_at__isnull=True,
        ).order_by('-last_active')
        return Response(UserSessionSerializer(sessions, many=True).data, status=status.HTTP_200_OK)

    def delete(self, request):
        from django.utils import timezone
        key = request.query_params.get('key') or (request.data.get('key') if hasattr(request, 'data') else None)
        end_all = request.query_params.get('all') == 'true' or (request.data.get('all') is True if hasattr(request, 'data') else False)
        current_key = request.headers.get('X-Session-Key')

        if end_all:
            qs = UserSession.objects.filter(user=request.user, revoked_at__isnull=True)
            if current_key:
                qs = qs.exclude(key=current_key)
            updated = qs.update(revoked_at=timezone.now())
            return Response({'message': '다른 모든 세션을 종료했습니다.', 'count': updated}, status=status.HTTP_200_OK)

        if not key:
            return Response({'message': '세션 키가 필요합니다.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = UserSession.objects.get(user=request.user, key=key, revoked_at__isnull=True)
            session.revoked_at = timezone.now()
            session.save()
            return Response({'message': '세션이 종료되었습니다.'}, status=status.HTTP_200_OK)
        except UserSession.DoesNotExist:
            return Response({'message': '해당 세션을 찾을 수 없습니다.'}, status=status.HTTP_404_NOT_FOUND)


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            try:
                with transaction.atomic():
                    Token.objects.filter(user=request.user).delete()
                    token, _ = Token.objects.get_or_create(user=request.user)
            except DatabaseError as token_error:
                logger.exception("Failed to rotate token after password change for user_id=%s", request.user.id)
                raise APIException(
                    {
                        "message": "비밀번호는 변경되었지만 토큰 재발급에 실패했습니다.",
                        "error_code": "TOKEN_ROTATION_FAILED",
                    }
                ) from token_error
            response_payload = {'message': '비밀번호가 성공적으로 변경되었습니다.'}
            response_payload['token'] = token.key
            return Response(response_payload, status=status.HTTP_200_OK)
        
        return Response({
            'message': '비밀번호 변경에 실패했습니다.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class AccountDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        confirmation = request.data.get('confirmation') if hasattr(request, 'data') else None
        if confirmation is not None and confirmation != '계정 삭제':
            return Response({
                'message': '확인 문구를 정확히 입력해주세요.',
                'errors': {'confirmation': ['확인 문구가 올바르지 않습니다.']}
            }, status=status.HTTP_400_BAD_REQUEST)

        user: CustomUser = request.user
        Token.objects.filter(user=user).delete()
        user.delete()
        return Response({
            'message': '계정이 성공적으로 삭제되었습니다.'
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_info(request):
    user = request.user
    return Response({
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'avatar_url': user.avatar_url,
        'avatar_color1': user.avatar_color1,
        'avatar_color2': user.avatar_color2,
        'created_at': user.created_at,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def user_summary(request, username: str):
    user = get_object_or_404(
        CustomUser.objects.select_related('settings'),
        username=username,
    )

    is_public_profile = True
    try:
        is_public_profile = user.settings.public_profile
    except UserSettings.DoesNotExist:
        is_public_profile = True

    aggregate = user.posts.aggregate(
        total_views=Sum('view_count'),
        total_likes_received=Sum('like_count'),
        total_bookmarks_received=Sum('bookmark_count'),
    )

    avatar_url = user.avatar_url
    if avatar_url and isinstance(avatar_url, str) and avatar_url.startswith('/'):
        avatar_url = request.build_absolute_uri(avatar_url)

    return Response(
        {
            'username': user.username,
            'bio': user.bio if is_public_profile else None,
            'avatar_url': avatar_url,
            'avatar_color1': user.avatar_color1,
            'avatar_color2': user.avatar_color2,
            'created_at': user.created_at,
            'post_count': user.posts.count(),
            'total_views': aggregate.get('total_views') or 0,
            'total_likes_received': aggregate.get('total_likes_received') or 0,
            'total_bookmarks_received': aggregate.get('total_bookmarks_received') or 0,
        },
        status=status.HTTP_200_OK,
    )
