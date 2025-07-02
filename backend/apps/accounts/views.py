"""
사용자 계정 관리 API 뷰

사용자 인증(회원가입, 로그인, 로그아웃)과 프로필 관리 기능을 제공하는
REST API 엔드포인트들을 정의합니다.

주요 기능:
- 회원가입 (RegisterView)
- 로그인/로그아웃 (login_view, logout_view)
- 프로필 조회/수정 (profile_view, update_profile_view)
- 사용자 정보 조회 (me_view)
- username 중복 확인 (check_username_view)
"""
import logging
import requests
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.db import transaction
from .models import User
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserSerializer, 
    UserDetailSerializer,
    PasswordChangeSerializer,
    AccountDeleteSerializer
)

# 로거 설정
logger = logging.getLogger(__name__)


def get_client_ip(request):
    """
    클라이언트의 실제 IP 주소를 가져옵니다.
    프록시나 로드밸런서를 고려하여 처리합니다.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_location_from_ip(ip_address):
    """
    IP 주소를 기반으로 위치 정보를 가져옵니다.
    ipapi.co 서비스를 사용합니다.
    
    Args:
        ip_address (str): 클라이언트 IP 주소
        
    Returns:
        str: 위치 정보 (예: "Seoul, South Korea") 또는 None
    """
    if not ip_address or ip_address in ['127.0.0.1', 'localhost']:
        return None
        
    try:
        response = requests.get(f'https://ipapi.co/{ip_address}/json/', timeout=5)
        if response.status_code == 200:
            data = response.json()
            city = data.get('city')
            country = data.get('country_name')
            
            if city and country:
                return f"{city}, {country}"
            elif country:
                return country
                
    except Exception as e:
        logger.warning(f"IP 위치 조회 실패 [{ip_address}]: {e}")
        
    return None


class RegisterView(generics.CreateAPIView):
    """
    사용자 회원가입 API
    
    새로운 사용자 계정을 생성하고 인증 토큰을 발급합니다.
    
    HTTP Method: POST
    URL: /api/auth/register/
    Permission: AllowAny (누구나 접근 가능)
    
    Request Body:
        - email (required): 이메일 주소
        - password (required): 비밀번호 (8자 이상)
        - password_confirm (required): 비밀번호 확인
        - username (optional): 사용자명 (없으면 자동 생성)
        
    Response:
        - 성공 (201): 사용자 정보 + 인증 토큰
        - 실패 (400): 검증 오류
        - 실패 (500): 서버 오류
    """
    
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        """
        회원가입 처리
        
        1. 입력 데이터 검증
        2. 사용자 계정 생성
        3. 인증 토큰 생성
        4. 성공 응답 반환
        """
        user_email = request.data.get('email', 'Unknown')
        logger.info(f"회원가입 시도: {user_email}")
        
        # 데이터 검증
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            logger.error(f"회원가입 검증 실패 [{user_email}]: {serializer.errors}")
            return self._error_response(
                message='입력 정보를 확인해주세요.',
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 트랜잭션으로 사용자 생성과 토큰 생성을 원자적으로 처리
            with transaction.atomic():
                # 사용자 생성
                user = serializer.save()
                
                # 인증 토큰 생성 (signals.py에서 자동 생성되지만 명시적으로 처리)
                token, created = Token.objects.get_or_create(user=user)
                
                # 회원가입 시에도 위치 정보 자동 설정
                if hasattr(user, 'profile') and not user.profile.location:
                    client_ip = get_client_ip(request)
                    logger.info(f"클라이언트 IP: {client_ip}")
                    
                    if client_ip:
                        location = get_location_from_ip(client_ip)
                        logger.info(f"IP {client_ip}에서 얻은 위치: {location}")
                        
                        if location:
                            user.profile.location = location
                            user.profile.save()
                            logger.info(f"회원가입 시 자동 위치 설정: {user.email} -> {location}")
                        else:
                            # 개발 환경에서는 기본 위치 설정
                            default_location = "Seoul, South Korea"
                            user.profile.location = default_location
                            user.profile.save()
                            logger.info(f"개발 환경 기본 위치 설정: {user.email} -> {default_location}")
                    else:
                        logger.warning(f"클라이언트 IP를 가져올 수 없음: {user.email}")
                
                logger.info(f"회원가입 성공: {user.email} (ID: {user.id})")
                
                return Response({
                    'success': True,
                    'message': '회원가입이 완료되었습니다. 환영합니다!',
                    'user': UserSerializer(user).data,
                    'token': token.key
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"회원가입 처리 중 서버 오류 [{user_email}]: {e}")
            return self._error_response(
                message='회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                errors={'server_error': [str(e)]},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _error_response(self, message, errors, status_code):
        """통일된 에러 응답 형식"""
        return Response({
            'success': False,
            'message': message,
            'errors': errors
        }, status=status_code)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    사용자 로그인 API
    
    이메일과 비밀번호로 사용자 인증을 수행하고 토큰을 발급합니다.
    
    HTTP Method: POST
    URL: /api/auth/login/
    Permission: AllowAny
    
    Request Body:
        - email (required): 등록된 이메일 주소
        - password (required): 계정 비밀번호
        
    Response:
        - 성공 (200): 사용자 정보 + 인증 토큰
        - 실패 (400): 인증 실패
        - 실패 (500): 서버 오류
    """
    user_email = request.data.get('email', 'Unknown')
    logger.info(f"로그인 시도: {user_email}")
    
    # 데이터 검증 및 인증
    serializer = UserLoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        logger.error(f"로그인 검증 실패 [{user_email}]: {serializer.errors}")
        return Response({
            'success': False,
            'message': '로그인 정보를 확인해주세요.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # 인증된 사용자 가져오기
        user = serializer.validated_data['user']
        
        # 인증 토큰 생성/조회
        token, created = Token.objects.get_or_create(user=user)
        
        # Django 세션 로그인 (선택사항)
        login(request, user)
        
        # 위치 정보가 없으면 IP 기반으로 자동 설정 (첫 로그인 시에만)
        if hasattr(user, 'profile') and not user.profile.location:
            client_ip = get_client_ip(request)
            logger.info(f"로그인 시 클라이언트 IP: {client_ip}")
            
            if client_ip:
                location = get_location_from_ip(client_ip)
                logger.info(f"IP {client_ip}에서 얻은 위치: {location}")
                
                if location:
                    user.profile.location = location
                    user.profile.save()
                    logger.info(f"자동 위치 설정: {user.email} -> {location}")
                else:
                    # 개발 환경에서는 기본 위치 설정
                    default_location = "Seoul, South Korea"
                    user.profile.location = default_location
                    user.profile.save()
                    logger.info(f"로그인 시 개발 환경 기본 위치 설정: {user.email} -> {default_location}")
            else:
                logger.warning(f"로그인 시 클라이언트 IP를 가져올 수 없음: {user.email}")
        
        logger.info(f"로그인 성공: {user.email} (Token: {'새로 생성' if created else '기존 사용'})")
        
        return Response({
            'success': True,
            'message': f'환영합니다, {user.username}님!',
            'user': UserDetailSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"로그인 처리 중 서버 오류 [{user_email}]: {e}")
        return Response({
            'success': False,
            'message': '로그인 처리 중 오류가 발생했습니다.',
            'errors': {'server_error': [str(e)]}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    사용자 로그아웃 API
    
    현재 사용자의 인증 토큰을 삭제하여 로그아웃 처리합니다.
    
    HTTP Method: POST
    URL: /api/auth/logout/
    Permission: IsAuthenticated (로그인 필요)
    
    Response:
        - 성공 (200): 로그아웃 완료 메시지
    """
    user_email = request.user.email
    logger.info(f"로그아웃 시도: {user_email}")
    
    try:
        # 인증 토큰 삭제
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
            logger.info(f"토큰 삭제 성공: {user_email}")
        else:
            logger.warning(f"삭제할 토큰이 없음: {user_email}")
        
        # Django 세션 로그아웃
        logout(request)
        
        logger.info(f"로그아웃 성공: {user_email}")
        
        return Response({
            'success': True,
            'message': '로그아웃되었습니다. 안전하게 종료되었습니다.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"로그아웃 처리 중 오류 [{user_email}]: {e}")
        return Response({
            'success': True,  # 로그아웃은 성공으로 처리 (토큰만 문제)
            'message': '로그아웃되었습니다.',
            'warning': '토큰 정리 중 일부 오류가 발생했습니다.'
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """
    사용자 프로필 조회 API
    
    현재 로그인한 사용자의 상세 프로필 정보를 반환합니다.
    
    HTTP Method: GET
    URL: /api/auth/profile/
    Permission: IsAuthenticated
    
    Response:
        - 성공 (200): 사용자 상세 정보
    """
    try:
        serializer = UserDetailSerializer(request.user)
        
        logger.info(f"프로필 조회: {request.user.email}")
        
        return Response({
            'success': True,
            'user': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"프로필 조회 오류 [{request.user.email}]: {e}")
        return Response({
            'success': False,
            'message': '프로필 조회 중 오류가 발생했습니다.',
            'errors': {'server_error': [str(e)]}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_profile_view(request):
    """
    사용자 프로필 수정 API
    
    현재 로그인한 사용자의 프로필 정보를 수정합니다.
    
    HTTP Method: PUT, PATCH
    URL: /api/auth/profile/
    Permission: IsAuthenticated
    
    Request Body:
        - username (optional): 사용자명
                 - profile (optional): 프로필 정보 객체
           - location: 위치
           - website: 웹사이트
           - avatar: 프로필 이미지
          
    Response:
        - 성공 (200): 수정된 사용자 정보
        - 실패 (400): 검증 오류
        - 실패 (500): 서버 오류
    """
    user_email = request.user.email
    logger.info(f"프로필 수정 시도: {user_email}")
    
    # PATCH 요청인지 PUT 요청인지에 따라 부분 업데이트 결정
    partial = request.method == 'PATCH'
    
    serializer = UserDetailSerializer(
        request.user, 
        data=request.data, 
        partial=partial,
        context={'request': request}
    )
    
    if not serializer.is_valid():
        logger.error(f"프로필 수정 검증 실패 [{user_email}]: {serializer.errors}")
        return Response({
            'success': False,
            'message': '입력 정보를 확인해주세요.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # 프로필 수정
        updated_user = serializer.save()
        
        logger.info(f"프로필 수정 성공: {user_email}")
        
        return Response({
            'success': True,
            'message': '프로필이 성공적으로 수정되었습니다.',
            'user': UserDetailSerializer(updated_user).data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"프로필 수정 실패 [{user_email}]: {e}")
        return Response({
            'success': False,
            'message': '프로필 수정 중 오류가 발생했습니다.',
            'errors': {'server_error': [str(e)]}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    """
    현재 사용자 정보 조회 API (간단 버전)
    
    JWT 토큰 등을 통해 인증된 현재 사용자의 기본 정보를 반환합니다.
    
    HTTP Method: GET
    URL: /api/auth/me/
    Permission: IsAuthenticated
    
    Response:
        - 성공 (200): 기본 사용자 정보
    """
    try:
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"사용자 정보 조회 오류 [{request.user.email}]: {e}")
        return Response({
            'error': '사용자 정보 조회 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def check_username_view(request):
    """
    사용자명 중복 확인 API
    
    입력된 username이 이미 사용 중인지 확인합니다.
    회원가입 시 실시간 중복 확인에 사용됩니다.
    
    HTTP Method: GET
    URL: /api/auth/check-username/?username=testuser
    Permission: AllowAny
    
    Query Parameters:
        - username (required): 확인할 사용자명
        
    Response:
        - 성공 (200): {"available": true/false}
        - 실패 (400): 파라미터 누락
    """
    username = request.GET.get('username', '').strip()
    
    if not username:
        return Response({
            'error': 'username 파라미터가 필요합니다.',
            'available': False
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # 사용자명 중복 여부 확인
        is_taken = User.objects.filter(username=username).exists()
        is_available = not is_taken
        
        logger.info(f"사용자명 중복 확인: {username} -> {'사용 가능' if is_available else '사용 불가'}")
        
        return Response({
            'username': username,
            'available': is_available,
            'message': '사용 가능한 사용자명입니다.' if is_available else '이미 사용 중인 사용자명입니다.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"사용자명 중복 확인 오류: {e}")
        return Response({
            'error': '중복 확인 중 오류가 발생했습니다.',
            'available': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """
    비밀번호 변경 API
    
    현재 비밀번호를 확인하고 새로운 비밀번호로 변경합니다.
    변경 후 모든 세션과 토큰을 무효화합니다.
    
    HTTP Method: POST
    URL: /api/auth/change-password/
    Permission: IsAuthenticated
    
    Request Body:
        - current_password (required): 현재 비밀번호
        - new_password (required): 새로운 비밀번호 (8자 이상)
        - new_password_confirm (required): 새로운 비밀번호 확인
        
    Response:
        - 성공 (200): 변경 완료 메시지
        - 실패 (400): 검증 오류
        - 실패 (500): 서버 오류
    """
    user_email = request.user.email
    logger.info(f"비밀번호 변경 시도: {user_email}")
    
    serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
    
    if not serializer.is_valid():
        logger.error(f"비밀번호 변경 검증 실패 [{user_email}]: {serializer.errors}")
        return Response({
            'success': False,
            'message': '입력 정보를 확인해주세요.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # 비밀번호 변경 실행
        updated_user = serializer.save()
        
        logger.info(f"비밀번호 변경 성공: {user_email}")
        
        return Response({
            'success': True,
            'message': '비밀번호가 성공적으로 변경되었습니다.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"비밀번호 변경 실패 [{user_email}]: {e}")
        return Response({
            'success': False,
            'message': '비밀번호 변경 중 오류가 발생했습니다.',
            'errors': {'server_error': [str(e)]}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def delete_account_view(request):
    """
    계정 삭제 API
    
    확인 텍스트 입력 후 사용자 계정을 완전히 삭제합니다.
    관련된 모든 데이터(프로필, 이미지 등)도 함께 삭제됩니다.
    
    HTTP Method: POST
    URL: /api/auth/delete-account/
    Permission: IsAuthenticated
    
    Request Body:
        - confirmation (required): 'DELETE' 또는 '삭제' 입력
        
    Response:
        - 성공 (200): 삭제 완료 메시지
        - 실패 (400): 검증 오류
        - 실패 (500): 서버 오류
    """
    user_email = request.user.email
    logger.info(f"계정 삭제 시도: {user_email}")
    
    serializer = AccountDeleteSerializer(data=request.data, context={'request': request})
    
    if not serializer.is_valid():
        logger.error(f"계정 삭제 검증 실패 [{user_email}]: {serializer.errors}")
        return Response({
            'success': False,
            'message': '입력 정보를 확인해주세요.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # 계정 삭제 실행
        deleted_email = serializer.save()
        
        logger.info(f"계정 삭제 성공: {deleted_email}")
        
        return Response({
            'success': True,
            'message': '계정이 성공적으로 삭제되었습니다. 그동안 이용해주셔서 감사했습니다.',
            'deleted_email': deleted_email
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"계정 삭제 실패 [{user_email}]: {e}")
        return Response({
            'success': False,
            'message': '계정 삭제 중 오류가 발생했습니다.',
            'errors': {'server_error': [str(e)]}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
