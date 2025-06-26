"""
인증 관련 시리얼라이저

사용자 인증과 관련된 데이터 직렬화를 담당합니다.
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from ..models import UserProfile
import logging

logger = logging.getLogger(__name__)

class UserProfileSerializer(serializers.ModelSerializer):
    """사용자 프로필 시리얼라이저"""
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = UserProfile
        fields = [
            'bio', 'location', 'birth_date', 'avatar', 
            'phone_number', 'is_email_verified', 'full_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['is_email_verified', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    """사용자 기본 정보 시리얼라이저"""
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'date_joined', 'last_login', 'profile'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']

class UserRegistrationSerializer(serializers.ModelSerializer):
    """사용자 회원가입 시리얼라이저"""
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        help_text="최소 8자 이상의 패스워드"
    )
    password_confirm = serializers.CharField(
        write_only=True,
        help_text="패스워드 확인"
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm', 
            'first_name', 'last_name'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
        }
    
    def validate_first_name(self, value):
        """이름 필드 검증 (선택사항)"""
        logger.debug(f"first_name 검증: '{value}'")
        return value or ""

    def validate_last_name(self, value):
        """성 필드 검증 (선택사항)"""
        logger.debug(f"last_name 검증: '{value}'")
        return value or ""
    
    def validate_email(self, value):
        """이메일 중복 검사"""
        logger.debug(f"이메일 중복 검사: {value}")
        if User.objects.filter(email=value).exists():
            logger.warning(f"이메일 중복: {value}")
            raise serializers.ValidationError("이미 사용 중인 이메일입니다.")
        return value
    
    def validate_username(self, value):
        """사용자명 중복 검사"""
        logger.debug(f"사용자명 중복 검사: {value}")
        if User.objects.filter(username=value).exists():
            logger.warning(f"사용자명 중복: {value}")
            raise serializers.ValidationError("이미 사용 중인 사용자명입니다.")
        return value
    
    def validate(self, attrs):
        """패스워드 일치 검사 및 복잡성 검증"""
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        logger.debug(f"패스워드 검증 시작")
        
        if password != password_confirm:
            logger.warning("패스워드 불일치")
            raise serializers.ValidationError("패스워드가 일치하지 않습니다.")
        
        try:
            validate_password(password)
            logger.debug("패스워드 복잡성 검증 통과")
        except serializers.ValidationError as e:
            logger.warning(f"패스워드 복잡성 검증 실패: {e.messages}")
            raise serializers.ValidationError({"password": e.messages})
        
        return attrs
    
    def create(self, validated_data):
        """사용자 생성"""
        validated_data.pop('password_confirm', None)
        
        # 빈 문자열을 None으로 변환하지 않고 그대로 유지
        if 'first_name' not in validated_data:
            validated_data['first_name'] = ""
        if 'last_name' not in validated_data:
            validated_data['last_name'] = ""
            
        logger.info(f"사용자 생성 시작: {validated_data.get('username')}")
        
        try:
            user = User.objects.create_user(**validated_data)
            logger.info(f"사용자 생성 성공: {user.username}")
            return user
        except Exception as e:
            logger.error(f"사용자 생성 실패: {str(e)}")
            raise

class UserLoginSerializer(serializers.Serializer):
    """사용자 로그인 시리얼라이저"""
    username = serializers.CharField(help_text="사용자명 또는 이메일")
    password = serializers.CharField(write_only=True, help_text="패스워드")
    
    def validate(self, attrs):
        """사용자 인증 검증"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        logger.info(f"로그인 시도: {username}")
        
        if username and password:
            # 이메일로 로그인 시도
            if '@' in username:
                try:
                    user_obj = User.objects.get(email=username)
                    username = user_obj.username
                    logger.debug(f"이메일로 로그인: {username}")
                except User.DoesNotExist:
                    logger.warning(f"존재하지 않는 이메일: {username}")
                    pass
            
            user = authenticate(username=username, password=password)
            
            if user:
                if user.is_active:
                    attrs['user'] = user
                    logger.info(f"로그인 성공: {user.username}")
                else:
                    logger.warning(f"비활성화된 계정: {user.username}")
                    raise serializers.ValidationError("비활성화된 계정입니다.")
            else:
                logger.warning(f"로그인 실패: {username}")
                raise serializers.ValidationError("잘못된 사용자명 또는 패스워드입니다.")
        else:
            logger.warning("로그인 정보 누락")
            raise serializers.ValidationError("사용자명과 패스워드를 모두 입력해주세요.")
        
        return attrs

class ChangePasswordSerializer(serializers.Serializer):
    """패스워드 변경 시리얼라이저"""
    old_password = serializers.CharField(write_only=True, help_text="현재 패스워드")
    new_password = serializers.CharField(write_only=True, min_length=8, help_text="새 패스워드")
    new_password_confirm = serializers.CharField(write_only=True, help_text="새 패스워드 확인")
    
    def validate_old_password(self, value):
        """현재 패스워드 검증"""
        user = self.context['request'].user
        if not user.check_password(value):
            logger.warning(f"잘못된 현재 패스워드: {user.username}")
            raise serializers.ValidationError("현재 패스워드가 올바르지 않습니다.")
        return value
    
    def validate(self, attrs):
        """새 패스워드 일치 검사 및 복잡성 검증"""
        new_password = attrs.get('new_password')
        new_password_confirm = attrs.get('new_password_confirm')
        
        if new_password != new_password_confirm:
            logger.warning("새 패스워드 불일치")
            raise serializers.ValidationError("새 패스워드가 일치하지 않습니다.")
        
        try:
            validate_password(new_password, self.context['request'].user)
            logger.debug("새 패스워드 복잡성 검증 통과")
        except serializers.ValidationError as e:
            logger.warning(f"새 패스워드 복잡성 검증 실패: {e.messages}")
            raise serializers.ValidationError({"new_password": e.messages})
        
        return attrs
