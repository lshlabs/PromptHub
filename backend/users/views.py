from django.contrib.auth import login, authenticate
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
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
import os
import requests
import random


class UserRegistrationView(APIView):
    """
    사용자 회원가입 API 뷰
    
    POST: 새 사용자 계정을 생성하고 Token을 반환합니다.

    Request Body (application/json):
        - email (str, required)
        - password (str, required)
        - password_confirm (str, required)

    Response Body (201):
        - message (str)
        - user (object): 생성된 사용자 프로필
        - token (str): DRF TokenAuthentication 키
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        새로운 사용자 계정을 생성하고 인증 토큰을 반환합니다.
        
        Args:
            request: HTTP 요청 객체
            
        Returns:
            Response: 사용자 정보와 인증 토큰을 포함한 응답
        """
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # 회원가입 시 위치 자동 설정
            # 클라이언트 IP 주소 가져오기
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
            
            # IP 기반으로 위치 설정
            location = get_location_from_ip(ip)
            user.location = location
            user.save()
            
            # Token 생성
            token, created = Token.objects.get_or_create(user=user)
            
            # 사용자 프로필 데이터
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
    """
    사용자 로그인 API 뷰
    
    POST: 이메일/비밀번호로 인증하고 Token을 반환합니다.

    Request Body (application/json):
        - email (str, required)
        - password (str, required)

    Response Body (200):
        - message (str)
        - user (object): 사용자 프로필 필드 일체(snake_case)
        - token (str): DRF TokenAuthentication 키
        - session (object): 서버 생성 세션 정보
            - key (str): 세션 식별 키 (프론트는 'X-Session-Key' 헤더로 전달 가능)
            - user_agent (str | null)
            - ip_address (str | null)
            - device (str | null)
            - browser (str | null)
            - os (str | null)
            - created_at, last_active, revoked_at
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        이메일과 비밀번호로 사용자를 인증하고 토큰을 반환합니다.
        
        Args:
            request: HTTP 요청 객체
            
        Returns:
            Response: 사용자 정보와 인증 토큰을 포함한 응답
        """
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Token 생성 또는 가져오기
            token, created = Token.objects.get_or_create(user=user)
            # 세션 생성
            from secrets import token_urlsafe
            # UA 파싱
            raw_ua = request.META.get('HTTP_USER_AGENT', '')
            ua = parse_ua(raw_ua) if raw_ua else None
            device = None
            if ua:
                if ua.is_mobile:
                    device = ua.device.brand or ua.device.family or 'Mobile'
                elif ua.is_tablet:
                    device = ua.device.brand or ua.device.family or 'Tablet'
                elif ua.is_pc:
                    device = ua.device.family or 'PC'
                elif ua.is_bot:
                    device = 'Bot'
            browser = f"{ua.browser.family} {ua.browser.version_string}" if ua else None
            os = f"{ua.os.family} {ua.os.version_string}" if ua else None

            session = UserSession.objects.create(
                user=user,
                key=token_urlsafe(32),
                user_agent=raw_ua,
                ip_address=(request.META.get('HTTP_X_FORWARDED_FOR') or '').split(',')[0] or request.META.get('REMOTE_ADDR'),
                device=device,
                browser=browser,
                os=os,
            )
            
            # 사용자 프로필 데이터
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
    """
    사용자 로그아웃 API 뷰
    
    POST: 사용자의 Token을 삭제하여 로그아웃합니다.

    Headers (optional):
        - X-Session-Key: 현재 세션을 나타내는 키. 전달 시 해당 세션만 비활성화 처리

    Request Body (optional):
        - session_key (str): 헤더 대신 바디로 세션 키를 전달할 수 있습니다.

    Response Body (200):
        - message (str)
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        사용자의 인증 토큰을 삭제하여 로그아웃을 처리합니다.
        
        Args:
            request: HTTP 요청 객체
            
        Returns:
            Response: 로그아웃 결과 메시지
        """
        try:
            # 사용자의 토큰 삭제
            request.user.auth_token.delete()
            # 세션 키가 제공되면 해당 세션 비활성화
            session_key = request.headers.get('X-Session-Key') or request.data.get('session_key') if hasattr(request, 'data') else None
            if session_key:
                try:
                    from django.utils import timezone
                    session = UserSession.objects.get(user=request.user, key=session_key)
                    session.revoked_at = timezone.now()
                    session.save()
                except UserSession.DoesNotExist:
                    pass
            return Response({'message': '로그아웃이 완료되었습니다.'}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"로그아웃 오류: {e}")  # 디버깅용
            return Response({
                'message': '로그아웃 처리 중 오류가 발생했습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)


class GoogleLoginView(APIView):
    """
    Google ID 토큰으로 로그인/회원가입 처리

    POST Body:
        - id_token (str): Google Identity Services에서 발급된 ID 토큰

    Response (200 | 201):
        - message (str)
        - user (object)
        - token (str)
        - session (object)
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        id_token = request.data.get('id_token') if hasattr(request, 'data') else None
        if not id_token:
            return Response({'message': 'id_token이 필요합니다.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Google의 tokeninfo 엔드포인트로 id_token 검증 (간단 구현)
            resp = requests.get(
                'https://oauth2.googleapis.com/tokeninfo', params={'id_token': id_token}, timeout=5
            )
            if resp.status_code != 200:
                return Response({'message': '유효하지 않은 Google 토큰입니다.'}, status=status.HTTP_400_BAD_REQUEST)
            data = resp.json()

            email = data.get('email')
            email_verified = data.get('email_verified') in (True, 'true', 'True', '1', 1)
            audience = data.get('aud')

            # 선택적으로 클라이언트 ID 검사 (환경변수 GOOGLE_CLIENT_ID 설정 시)
            expected_client_id = os.environ.get('GOOGLE_CLIENT_ID') or os.environ.get('NEXT_PUBLIC_GOOGLE_CLIENT_ID')
            if expected_client_id and audience != expected_client_id:
                return Response({'message': '허용되지 않은 클라이언트에서 발급된 토큰입니다.'}, status=status.HTTP_400_BAD_REQUEST)

            if not email or not email_verified:
                return Response({'message': '이메일 확인에 실패했습니다.'}, status=status.HTTP_400_BAD_REQUEST)

            # 사용자 조회/생성 (매니저의 create_user 사용)
            user = CustomUser.objects.filter(email=email).first()
            created = False
            if not user:
                # Google OAuth 사용자 생성 시 명시적으로 활성화 상태 보장
                user = CustomUser.objects.create_user(
                    email=email, 
                    password=None,
                    is_active=True,  # 명시적으로 활성화
                )
                created = True
                
                # Google 사용자 정보를 실제 사용하는 필드에 설정
                google_name = data.get('name', '')
                if google_name:
                    # username을 Google 이름 기반으로 설정
                    name_parts = google_name.split()
                    if name_parts:
                        # 첫 번째 이름을 username으로 사용 (중복 방지)
                        base_username = name_parts[0].lower()
                        username = f"{base_username}_{random.randint(1000, 9999)}"
                        user.username = username
                
                # 필수 필드에 기본값 설정 (일반 회원가입과 동일하게)
                if not user.github_handle:
                    user.github_handle = ""
                
                # IP 기반으로 위치 설정 (일반 계정과 동일한 로직)
                try:
                    # 클라이언트 IP 주소 가져오기
                    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                    if x_forwarded_for:
                        ip = x_forwarded_for.split(',')[0]
                    else:
                        ip = request.META.get('REMOTE_ADDR')
                    
                    # IP 기반으로 위치 설정
                    if ip:
                        location = get_location_from_ip(ip)
                        user.location = location
                        print(f"📍 IP 기반 위치 설정 완료: {ip} → {location}")
                    else:
                        user.location = "위치 정보를 설정해주세요."
                        print("⚠️ IP 주소를 찾을 수 없어 기본 위치 설정")
                except Exception as e:
                    print(f"⚠️ 위치 설정 중 오류 발생: {e}")
                    user.location = "위치 정보를 설정해주세요."
                
                user.save()
                
                # UserSettings 자동 생성 및 기본값 설정
                settings, created = UserSettings.objects.get_or_create(user=user)
                if created:
                    settings.email_notifications_enabled = True
                    settings.in_app_notifications_enabled = True
                    settings.public_profile = True
                    settings.save()
                print(f"✅ 새 Google OAuth 사용자 생성: {email}, is_active: {user.is_active}")
                    
            else:
                # 기존 사용자인 경우에도 활성화 상태 확인
                if not user.is_active:
                    user.is_active = True
                    user.save()
                    print(f"✅ 기존 Google OAuth 사용자 활성화: {email}")

            # 사용자 활성화 상태 최종 확인
            if not user.is_active:
                print(f"❌ 사용자가 비활성 상태임: {email}, is_active: {user.is_active}")
                return Response({'message': '계정이 비활성화되어 있습니다.'}, status=status.HTTP_400_BAD_REQUEST)

            # Google OAuth 사용자 권한 보장
            if not user.has_usable_password():
                # Google OAuth 사용자인 경우 기본 권한 설정
                user.is_active = True
                user.is_staff = False  # 관리자 권한은 별도 부여
                user.is_superuser = False
                user.save()
                print(f"✅ Google OAuth 사용자 권한 설정 완료: {email}")

            # 토큰 발급
            token, _ = Token.objects.get_or_create(user=user)
            print(f"🔑 토큰 발급 완료: {email}, 토큰: {token.key[:10]}...")

            # 세션 생성 (일반 로그인과 동일한 포맷)
            from secrets import token_urlsafe
            raw_ua = request.META.get('HTTP_USER_AGENT', '')
            ua = parse_ua(raw_ua) if raw_ua else None
            device = None
            if ua:
                if ua.is_mobile:
                    device = ua.device.brand or ua.device.family or 'Mobile'
                elif ua.is_tablet:
                    device = ua.device.brand or ua.device.family or 'Tablet'
                elif ua.is_pc:
                    device = ua.device.family or 'PC'
                elif ua.is_bot:
                    device = 'Bot'
            browser = f"{ua.browser.family} {ua.browser.version_string}" if ua else None
            os_name = f"{ua.os.family} {ua.os.version_string}" if ua else None

            session = UserSession.objects.create(
                user=user,
                key=token_urlsafe(32),
                user_agent=raw_ua,
                ip_address=(request.META.get('HTTP_X_FORWARDED_FOR') or '').split(',')[0] or request.META.get('REMOTE_ADDR'),
                device=device,
                browser=browser,
                os=os_name,
            )

            profile_data = UserProfileSerializer(user).data
            return Response({
                'message': 'Google 로그인에 성공했습니다.' if not created else 'Google 계정으로 회원가입이 완료되었습니다.',
                'user': profile_data,
                'token': token.key,
                'session': UserSessionSerializer(session).data,
            }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Google 로그인 처리 중 오류: {e}")
            return Response({'message': 'Google 로그인 처리 중 오류가 발생했습니다.'}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """
    사용자 프로필 API 뷰
    
    GET: 현재 로그인한 사용자의 프로필 정보를 반환합니다.
    PUT: 현재 로그인한 사용자의 프로필 정보를 업데이트합니다.

    GET Response (200):
        - user (object): 사용자 기본 프로필
        - settings (object): 사용자 설정

    PUT/PATCH Request Body (application/json | multipart/form-data):
        - username (str, optional)
        - bio (str, optional)
        - location (str, optional)
        - github_handle (str, optional)
        - profile_image (file, optional)

    PUT/PATCH Response (200):
        - message (str)
        - user (object)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        현재 로그인한 사용자의 프로필 정보를 조회합니다.
        
        Args:
            request: HTTP 요청 객체
            
        Returns:
            Response: 사용자 프로필 데이터
        """
        """사용자 프로필 조회"""
        serializer = UserProfileSerializer(request.user)
        # 기본 설정 ensure
        UserSettings.objects.get_or_create(user=request.user)
        settings_data = UserSettingsSerializer(request.user.settings).data
        
        # Google OAuth 사용자 프로필 완성도 검증
        profile_completeness = self._check_profile_completeness(request.user)
        
        return Response({
            'user': serializer.data, 
            'settings': settings_data,
            'profile_completeness': profile_completeness
        }, status=status.HTTP_200_OK)

    def put(self, request):
        """
        현재 로그인한 사용자의 프로필 정보를 업데이트합니다.
        
        Args:
            request: HTTP 요청 객체
            
        Returns:
            Response: 업데이트된 사용자 프로필 데이터
        """
        """사용자 프로필 업데이트"""
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
        """프로필 완성도 검증"""
        required_fields = ['username', 'bio', 'location', 'github_handle']
        completed_fields = 0
        
        for field in required_fields:
            value = getattr(user, field, None)
            if value and str(value).strip():
                completed_fields += 1
        
        completeness_percentage = (completed_fields / len(required_fields)) * 100
        
        return {
            'percentage': completeness_percentage,
            'completed_fields': completed_fields,
            'total_fields': len(required_fields),
            'missing_fields': [field for field in required_fields if not getattr(user, field, None) or not str(getattr(user, field, None)).strip()]
        }

    def patch(self, request):
        """
        현재 로그인한 사용자의 프로필 정보를 부분 업데이트합니다.
        JSON/Form-Data 모두 허용합니다.
        """
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
    """
    사용자 설정 조회/수정 API
    GET: 현재 사용자의 설정 조회
    PATCH/PUT: 현재 사용자의 설정 수정

    GET Response (200):
        - email_notifications_enabled (bool)
        - in_app_notifications_enabled (bool)
        - public_profile (bool)
        - data_sharing (bool)
        - two_factor_auth_enabled (bool)
        - updated_at (datetime ISO8601)

    PATCH/PUT Request Body (application/json):
        - 위와 동일한 필드 중 일부
    """
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
    """
    아바타(그라디언트 색상) 재생성 API

    POST:
      - avatar_color1 / avatar_color2를 랜덤 재생성
      - regenerate_username=true인 경우 username도 랜덤 재생성
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user: CustomUser = request.user

        regenerate_username = request.data.get('regenerate_username', False)
        if isinstance(regenerate_username, str):
            regenerate_username = regenerate_username.lower() in ('1', 'true', 'yes', 'on')

        old_color1 = user.avatar_color1
        old_color2 = user.avatar_color2

        # 동일 색상 쌍 재생성 확률을 낮추기 위해 최대 몇 번 재시도
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
    """
    활성 세션 목록 조회 및 세션 종료 API
    GET: 현재 사용자 세션 목록 반환
    DELETE: 특정 세션을 종료하거나 (query/body로 key 전달), all=true 시 현재 세션 제외 전체 종료

    GET Response (200): Array<UserSession>

    DELETE Query Params / Body:
        - key (str, optional): 종료할 세션 키
        - all (bool, optional): true 전달 시 현재 세션을 제외하고 모든 세션 종료

    Headers (optional):
        - X-Session-Key: 현재 세션 키. all=true 시 보존을 위해 사용됨
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # "활성 세션" 목록은 종료(revoked)된 세션을 제외해서 반환
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
    """
    비밀번호 변경 API 뷰
    
    POST: 현재 로그인한 사용자의 비밀번호를 변경합니다.

    Request Body (application/json):
        - current_password (str, required)
        - new_password (str, required)
        - new_password_confirm (str, required)

    Response (200):
        - message (str)
        - token (str, optional): 성공 시 새 토큰이 발급될 수 있음
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        현재 로그인한 사용자의 비밀번호를 변경합니다.
        
        Args:
            request: HTTP 요청 객체
            
        Returns:
            Response: 비밀번호 변경 결과 메시지
        """
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            # 비밀번호 변경 후 기존 토큰 무효화 및 새 토큰 발급 (선택사항)
            try:
                # 기존 토큰 삭제
                Token.objects.filter(user=request.user).delete()
                # 새 토큰 발급
                token, _ = Token.objects.get_or_create(user=request.user)
            except Exception:
                token = None
            response_payload = {'message': '비밀번호가 성공적으로 변경되었습니다.'}
            if token:
                response_payload['token'] = token.key
            return Response(response_payload, status=status.HTTP_200_OK)
        
        return Response({
            'message': '비밀번호 변경에 실패했습니다.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class AccountDeleteView(APIView):
    """
    계정 삭제 API 뷰

    DELETE: 현재 로그인한 사용자의 계정을 삭제합니다.

    Request Body (application/json):
        - confirmation (str, optional): 안전 장치. 값이 '계정 삭제'여야 함

    Response (200):
        - message (str)
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        """
        현재 로그인한 사용자의 계정을 삭제합니다.

        보안을 위해 선택적으로 확인 문구를 요구할 수 있습니다.
        프론트에서는 "계정 삭제" 문자열 확인 후 호출합니다.
        """
        confirmation = request.data.get('confirmation') if hasattr(request, 'data') else None
        if confirmation is not None and confirmation != '계정 삭제':
            return Response({
                'message': '확인 문구를 정확히 입력해주세요.',
                'errors': {'confirmation': ['확인 문구가 올바르지 않습니다.']}
            }, status=status.HTTP_400_BAD_REQUEST)

        user: CustomUser = request.user
        # 사용자의 토큰 삭제
        Token.objects.filter(user=user).delete()
        # 실제 사용자 삭제
        user.delete()
        return Response({
            'message': '계정이 성공적으로 삭제되었습니다.'
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_info(request):
    """
    간단한 사용자 정보 조회 API
    
    GET: 현재 로그인한 사용자의 기본 정보를 반환합니다.

    Response Fields:
        - id (int)
        - email (str)
        - username (str)
        - avatar_url (str | null)
        - avatar_color1 (str)
        - avatar_color2 (str)
        - created_at (datetime ISO8601)
    """
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
    """
    공개 사용자 요약 정보 조회 API

    GET: username 기준으로 팝오버용 요약 정보를 반환합니다.

    Response Fields:
        - username (str)
        - bio (str | null)
        - avatar_url (str | null)
        - avatar_color1 (str)
        - avatar_color2 (str)
        - created_at (datetime ISO8601)
        - post_count (int)
        - total_views (int)
        - total_likes_received (int)
        - total_bookmarks_received (int)
    """
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
