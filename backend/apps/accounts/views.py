from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from .models import User
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserSerializer
)
import logging

logger = logging.getLogger(__name__)

class RegisterView(generics.CreateAPIView):
    """사용자 회원가입 (개선된 버전)"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        logger.info(f"회원가입 시도: {request.data.get('email', 'Unknown')}")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            logger.error(f"회원가입 검증 실패: {serializer.errors}")
            return Response({
                'success': False,
                'message': '입력 정보를 확인해주세요.',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            
            logger.info(f"회원가입 성공: {user.email}")
            
            return Response({
                'success': True,
                'message': '회원가입이 완료되었습니다.',
                'user': UserSerializer(user).data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"회원가입 처리 중 오류: {e}")
            return Response({
                'success': False,
                'message': '회원가입 처리 중 오류가 발생했습니다.',
                'errors': {'non_field_errors': [str(e)]}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """사용자 로그인 (개선된 버전)"""
    logger.info(f"로그인 시도: {request.data.get('email', 'Unknown')}")
    
    serializer = UserLoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        logger.error(f"로그인 검증 실패: {serializer.errors}")
        return Response({
            'success': False,
            'message': '로그인 정보를 확인해주세요.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        login(request, user)
        
        logger.info(f"로그인 성공: {user.email}")
        
        return Response({
            'success': True,
            'message': '로그인되었습니다.',
            'user': UserSerializer(user).data,
            'token': token.key
        })
        
    except Exception as e:
        logger.error(f"로그인 처리 중 오류: {e}")
        return Response({
            'success': False,
            'message': '로그인 처리 중 오류가 발생했습니다.',
            'errors': {'non_field_errors': [str(e)]}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """사용자 로그아웃"""
    try:
        request.user.auth_token.delete()
        logger.info(f"로그아웃 성공: {request.user.email}")
    except Exception as e:
        logger.warning(f"토큰 삭제 실패: {e}")
    
    logout(request)
    return Response({
        'success': True,
        'message': '로그아웃되었습니다.'
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """사용자 프로필 조회"""
    serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'user': serializer.data
    })

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_profile_view(request):
    """사용자 프로필 수정"""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': '입력 정보를 확인해주세요.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        serializer.save()
        logger.info(f"프로필 수정 성공: {request.user.email}")
        
        return Response({
            'success': True,
            'message': '프로필이 수정되었습니다.',
            'user': serializer.data
        })
        
    except Exception as e:
        logger.error(f"프로필 수정 실패: {e}")
        return Response({
            'success': False,
            'message': '프로필 수정 중 오류가 발생했습니다.',
            'errors': {'non_field_errors': [str(e)]}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
