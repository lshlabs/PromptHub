from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, UserProfile
import logging
import string
import random

logger = logging.getLogger(__name__)

class UserRegistrationSerializer(serializers.ModelSerializer):
    """사용자 회원가입 시리얼라이저 (개선된 버전)"""
    password = serializers.CharField(
        write_only=True, 
        min_length=8,
        style={'input_type': 'password'},
        help_text="8자 이상의 비밀번호를 입력하세요."
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="비밀번호를 다시 입력하세요."
    )
    
    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password_confirm')
        extra_kwargs = {
            'email': {
                'required': True,
                'help_text': '유효한 이메일 주소를 입력하세요.'
            },
            'username': {
                'required': False,
                'help_text': '사용자명을 입력하세요.'
            }
        }
        
    def validate_email(self, value):
        """이메일 중복 검사"""
        if User.objects.filter(email=value).exists():
            logger.warning(f"이메일 중복 시도: {value}")
            raise serializers.ValidationError("이미 사용 중인 이메일입니다.")
        return value
        
    def validate_username(self, value):
        """사용자명 검증"""
        if User.objects.filter(username=value).exists():
            logger.warning(f"사용자명 중복 시도: {value}")
            raise serializers.ValidationError("이미 사용 중인 사용자명입니다.")
        
        # 사용자명 길이 및 형식 검증
        if len(value) < 3:
            raise serializers.ValidationError("사용자명은 3자 이상이어야 합니다.")
        
        if len(value) > 30:
            raise serializers.ValidationError("사용자명은 30자 이하여야 합니다.")
            
        return value
        
    def validate_password(self, value):
        """비밀번호 검증"""
        try:
            validate_password(value)
        except ValidationError as e:
            logger.warning(f"비밀번호 검증 실패: {e}")
            raise serializers.ValidationError(list(e.messages))
        return value
        
    def validate(self, attrs):
        """전체 데이터 검증"""
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        if password != password_confirm:
            logger.warning("비밀번호 확인 불일치")
            raise serializers.ValidationError({
                'password_confirm': '비밀번호가 일치하지 않습니다.'
            })
            
        return attrs
        
    def create(self, validated_data):
        """사용자 생성"""
        try:
            # password_confirm 제거
            validated_data.pop('password_confirm', None)
            # username이 없으면 자동 생성
            if not validated_data.get('username'):
                validated_data['username'] = self.generate_random_username()
            # 사용자 생성
            user = User.objects.create_user(**validated_data)
            logger.info(f"새 사용자 생성 성공: {user.email}")
            return user
        except Exception as e:
            logger.error(f"사용자 생성 실패: {e}")
            raise serializers.ValidationError("사용자 생성 중 오류가 발생했습니다.")

    @staticmethod
    def generate_random_username(length=8):
        prefix = "user_"
        chars = string.ascii_lowercase + string.digits
        while True:
            random_part = ''.join(random.choices(chars, k=length))
            username = prefix + random_part
            if not User.objects.filter(username=username).exists():
                return username

class UserLoginSerializer(serializers.Serializer):
    """사용자 로그인 시리얼라이저 (개선된 버전)"""
    email = serializers.EmailField(
        help_text="등록된 이메일 주소를 입력하세요."
    )
    password = serializers.CharField(
        style={'input_type': 'password'},
        help_text="비밀번호를 입력하세요."
    )
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('이메일과 비밀번호를 모두 입력해주세요.')
        
        # 이메일로 사용자 찾기
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning(f"존재하지 않는 이메일로 로그인 시도: {email}")
            raise serializers.ValidationError('등록되지 않은 이메일입니다.')
        
        # 비밀번호 확인
        user = authenticate(username=email, password=password)
        if not user:
            logger.warning(f"잘못된 비밀번호로 로그인 시도: {email}")
            raise serializers.ValidationError('비밀번호가 올바르지 않습니다.')
            
        if not user.is_active:
            logger.warning(f"비활성화된 계정으로 로그인 시도: {email}")
            raise serializers.ValidationError('비활성화된 계정입니다.')
            
        attrs['user'] = user
        logger.info(f"로그인 성공: {email}")
        return attrs

class UserProfileSerializer(serializers.ModelSerializer):
    """사용자 프로필 시리얼라이저"""
    class Meta:
        model = UserProfile
        fields = ('bio', 'avatar', 'location', 'website')

class UserSerializer(serializers.ModelSerializer):
    """사용자 정보 시리얼라이저"""
    profile = UserProfileSerializer()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'profile', 'created_at')
        read_only_fields = ('id', 'created_at')

    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.save()

        profile_data = validated_data.get('profile')
        profile = getattr(instance, 'profile', None)
        if profile and profile_data:
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        return instance
