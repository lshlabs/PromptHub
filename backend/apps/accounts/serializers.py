"""
사용자 계정 시리얼라이저

DRF(Django Rest Framework)를 사용한 사용자 인증 및 프로필 관리 API의
데이터 직렬화/역직렬화를 담당합니다.

주요 기능:
- 회원가입 (이메일 인증, 비밀번호 검증)
- 로그인 (이메일 기반 인증)
- 사용자 프로필 관리
"""
import logging
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, UserProfile

# 로거 설정
logger = logging.getLogger(__name__)


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    사용자 회원가입 시리얼라이저
    
    새로운 사용자 계정을 생성하기 위한 데이터 검증 및 처리를 담당합니다.
    
    Features:
    - 이메일 중복 검사
    - 비밀번호 강도 검증
    - 비밀번호 확인 검증  
    - 자동 username 생성 (선택사항)
    """
    
    password = serializers.CharField(
        write_only=True, 
        min_length=8,
        style={'input_type': 'password'},
        help_text="8자 이상의 안전한 비밀번호를 입력하세요."
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="비밀번호 확인을 위해 동일한 비밀번호를 다시 입력하세요."
    )
    
    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password_confirm')
        extra_kwargs = {
            'email': {
                'required': True,
                'help_text': '로그인에 사용될 유효한 이메일 주소를 입력하세요.'
            },
            'username': {
                'required': False,
                'help_text': '사용자명 (비워두면 자동 생성됩니다)'
            }
        }
        
    def validate_email(self, value):
        """
        이메일 중복 검사 및 형식 검증
        
        Args:
            value (str): 검증할 이메일 주소
            
        Returns:
            str: 검증된 이메일 주소
            
        Raises:
            ValidationError: 이메일이 이미 사용 중인 경우
        """
        # 소문자로 정규화
        value = value.lower().strip()
        
        # 중복 검사
        if User.objects.filter(email=value).exists():
            logger.warning(f"이메일 중복 회원가입 시도: {value}")
            raise serializers.ValidationError("이미 사용 중인 이메일입니다.")
            
        return value
        
    def validate_username(self, value):
        """
        사용자명 검증
        
        Args:
            value (str): 검증할 사용자명
            
        Returns:
            str: 검증된 사용자명
            
        Raises:
            ValidationError: 사용자명이 유효하지 않은 경우
        """
        if not value:
            return value
            
        # 중복 검사
        if User.objects.filter(username=value).exists():
            logger.warning(f"사용자명 중복 회원가입 시도: {value}")
            raise serializers.ValidationError("이미 사용 중인 사용자명입니다.")
        
        # 길이 검증
        if len(value) < 3:
            raise serializers.ValidationError("사용자명은 3자 이상이어야 합니다.")
        
        if len(value) > 30:
            raise serializers.ValidationError("사용자명은 30자 이하여야 합니다.")
            
        return value
        
    def validate_password(self, value):
        """
        Django의 비밀번호 검증 사용
        
        Args:
            value (str): 검증할 비밀번호
            
        Returns:
            str: 검증된 비밀번호
            
        Raises:
            ValidationError: 비밀번호가 정책에 맞지 않는 경우
        """
        try:
            validate_password(value)
        except ValidationError as e:
            logger.warning(f"비밀번호 정책 위반: {e}")
            raise serializers.ValidationError(list(e.messages))
        return value
        
    def validate(self, attrs):
        """
        전체 데이터 교차 검증
        
        Args:
            attrs (dict): 검증할 전체 데이터
            
        Returns:
            dict: 검증된 데이터
            
        Raises:
            ValidationError: 비밀번호 확인이 일치하지 않는 경우
        """
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        # 비밀번호 일치 확인
        if password != password_confirm:
            logger.warning("비밀번호 확인 불일치")
            raise serializers.ValidationError({
                'password_confirm': '비밀번호가 일치하지 않습니다.'
            })
            
        return attrs
        
    def create(self, validated_data):
        """
        새 사용자 계정 생성
        
        Args:
            validated_data (dict): 검증된 사용자 데이터
            
        Returns:
            User: 생성된 사용자 객체
            
        Raises:
            ValidationError: 사용자 생성 중 오류 발생 시
        """
        try:
            # password_confirm 제거 (DB에 저장할 필요 없음)
            validated_data.pop('password_confirm', None)
            
            # username이 없으면 자동 생성 (UserManager에서 처리)
            if not validated_data.get('username'):
                validated_data['username'] = self.generate_random_username()
                
            # 사용자 생성 (UserManager의 create_user 메서드 사용)
            user = User.objects.create_user(**validated_data)
            
            logger.info(f"새 사용자 회원가입 성공: {user.email} (username: {user.username})")
            return user
            
        except Exception as e:
            logger.error(f"사용자 생성 실패: {e}")
            raise serializers.ValidationError("회원가입 처리 중 오류가 발생했습니다.")

    @staticmethod
    def generate_random_username(length=8):
        """
        랜덤 username 생성 (UserManager 위임)
        
        Args:
            length (int): 랜덤 부분의 길이
            
        Returns:
            str: 생성된 고유한 username
        """
        return User.objects.generate_random_username(length)


class UserLoginSerializer(serializers.Serializer):
    """
    사용자 로그인 시리얼라이저
    
    이메일과 비밀번호를 사용한 사용자 인증을 처리합니다.
    
    Features:
    - 이메일 기반 인증
    - 계정 활성화 상태 확인
    - 상세한 에러 메시지 제공
    """
    
    email = serializers.EmailField(
        help_text="가입 시 사용한 이메일 주소를 입력하세요."
    )
    password = serializers.CharField(
        style={'input_type': 'password'},
        help_text="계정의 비밀번호를 입력하세요."
    )
    
    def validate(self, attrs):
        """
        로그인 정보 검증 및 사용자 인증
        
        Args:
            attrs (dict): 로그인 데이터 (email, password)
            
        Returns:
            dict: 검증된 데이터 + 인증된 사용자 객체
            
        Raises:
            ValidationError: 인증 실패 시 상세한 에러 메시지
        """
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password', '')
        
        # 필수 필드 확인
        if not email or not password:
            raise serializers.ValidationError(
                '이메일과 비밀번호를 모두 입력해주세요.'
            )
        
        # 사용자 존재 여부 확인
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning(f"존재하지 않는 이메일로 로그인 시도: {email}")
            raise serializers.ValidationError(
                '등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.'
            )
        
        # 비밀번호 확인 (Django의 authenticate 사용)
        authenticated_user = authenticate(username=email, password=password)
        if not authenticated_user:
            logger.warning(f"잘못된 비밀번호로 로그인 시도: {email}")
            raise serializers.ValidationError(
                '비밀번호가 올바르지 않습니다.'
            )
            
        # 계정 활성화 상태 확인
        if not authenticated_user.is_active:
            logger.warning(f"비활성화된 계정으로 로그인 시도: {email}")
            raise serializers.ValidationError(
                '비활성화된 계정입니다. 관리자에게 문의하세요.'
            )
            
        # 인증 성공
        attrs['user'] = authenticated_user
        logger.info(f"로그인 성공: {email}")
        
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """
    사용자 프로필 시리얼라이저
    
    UserProfile 모델의 데이터 직렬화/역직렬화를 담당합니다.
    아바타 색상 정보와 관련 메서드들을 포함하여 프론트엔드에서
    쉽게 사용할 수 있는 형태로 데이터를 제공합니다.
    """
    
    # 아바타 관련 추가 정보 (읽기 전용)
    avatar_color_class = serializers.CharField(source='get_avatar_color_class', read_only=True)
    has_custom_avatar = serializers.BooleanField(read_only=True)
    avatar_url = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = (
            'avatar', 'avatar_url', 'avatar_color', 'avatar_color_class', 'has_custom_avatar',
            'location', 'website', 'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at', 'avatar_color', 'avatar_color_class', 'has_custom_avatar', 'avatar_url')
        
    def get_avatar_url(self, obj):
        """아바타 이미지의 전체 URL 반환"""
        if obj.avatar and obj.avatar.name:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None
        
    def validate_website(self, value):
        """웹사이트 URL 형식 검증"""
        if value and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError("올바른 URL 형식으로 입력해주세요. (http:// 또는 https://)")
        return value


class UserSerializer(serializers.ModelSerializer):
    """
    사용자 정보 시리얼라이저
    
    User 모델과 연관된 UserProfile을 포함한 완전한 사용자 정보를 제공합니다.
    API 응답에서 사용자 정보를 표시할 때 사용됩니다.
    """
    
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'profile', 
            'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'is_active')

    def update(self, instance, validated_data):
        """
        사용자 정보 업데이트
        
        Args:
            instance (User): 업데이트할 사용자 객체
            validated_data (dict): 검증된 업데이트 데이터
            
        Returns:
            User: 업데이트된 사용자 객체
        """
        # 기본 사용자 정보 업데이트
        instance.username = validated_data.get('username', instance.username)
        instance.save()

        # 프로필 데이터가 있으면 업데이트
        profile_data = validated_data.get('profile')
        if profile_data and hasattr(instance, 'profile'):
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
            
        logger.info(f"사용자 정보 업데이트: {instance.email}")
        return instance


class UserDetailSerializer(UserSerializer):
    """
    상세 사용자 정보 시리얼라이저
    
    관리자나 사용자 본인만 볼 수 있는 민감한 정보를 포함합니다.
    이미지 업로드와 프로필 정보 수정을 지원합니다.
    """
    
    profile = UserProfileSerializer()
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ('last_login',)
    
    def update(self, instance, validated_data):
        """
        사용자 정보 및 프로필 업데이트 (이미지 업로드 포함)
        
        Args:
            instance (User): 업데이트할 사용자 객체
            validated_data (dict): 검증된 업데이트 데이터
            
        Returns:
            User: 업데이트된 사용자 객체
        """
        logger.info(f"프로필 업데이트 시작: {instance.email}")
        
        # 프로필 데이터 분리
        profile_data = validated_data.pop('profile', {})
        
        # 기본 사용자 정보 업데이트
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # 프로필 업데이트 (이미지 포함)
        if hasattr(instance, 'profile'):
            profile = instance.profile
            
            # 프로필 필드들 업데이트
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            
            # request.FILES에서 직접 이미지 가져오기 (FormData 처리)
            request = self.context.get('request')
            if request and hasattr(request, 'FILES') and 'avatar' in request.FILES:
                profile.avatar = request.FILES['avatar']
                logger.info(f"아바타 이미지 업로드: {instance.email}")
            
            # avatar 필드가 None이면 이미지 삭제
            elif 'avatar' in profile_data and profile_data['avatar'] is None:
                if profile.avatar:
                    profile.avatar.delete(save=False)  # 파일 시스템에서도 삭제
                profile.avatar = None
                logger.info(f"아바타 이미지 삭제: {instance.email}")
            
            profile.save()
        
        logger.info(f"프로필 업데이트 완료: {instance.email}")
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    """
    비밀번호 변경 시리얼라이저
    
    현재 비밀번호를 확인하고 새로운 비밀번호로 변경합니다.
    """
    
    current_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="현재 비밀번호를 입력하세요."
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        help_text="새로운 비밀번호를 입력하세요 (8자 이상)."
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="새로운 비밀번호를 다시 입력하세요."
    )

    def validate_current_password(self, value):
        """현재 비밀번호 검증"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("현재 비밀번호가 올바르지 않습니다.")
        return value

    def validate_new_password(self, value):
        """새 비밀번호 강도 검증"""
        if len(value) < 8:
            raise serializers.ValidationError("비밀번호는 8자 이상이어야 합니다.")
        
        # 숫자 포함 검사
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("비밀번호에는 최소 1개의 숫자가 포함되어야 합니다.")
        
        # 문자 포함 검사
        if not any(char.isalpha() for char in value):
            raise serializers.ValidationError("비밀번호에는 최소 1개의 문자가 포함되어야 합니다.")
        
        return value

    def validate(self, attrs):
        """새 비밀번호 확인 검증"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("새 비밀번호가 일치하지 않습니다.")
        
        # 현재 비밀번호와 새 비밀번호가 같은지 검사
        if attrs['current_password'] == attrs['new_password']:
            raise serializers.ValidationError("새 비밀번호는 현재 비밀번호와 달라야 합니다.")
        
        return attrs

    def save(self):
        """비밀번호 변경 실행"""
        user = self.context['request'].user
        new_password = self.validated_data['new_password']
        
        user.set_password(new_password)
        user.save()
        
        logger.info(f"비밀번호 변경 성공: {user.email}")
        return user


class AccountDeleteSerializer(serializers.Serializer):
    """
    계정 삭제 시리얼라이저
    
    확인 텍스트 입력 후 계정을 삭제합니다.
    """
    
    confirmation = serializers.CharField(
        write_only=True,
        help_text="계정 삭제를 확인하려면 'DELETE' 또는 '삭제'를 입력하세요."
    )

    def validate_confirmation(self, value):
        """삭제 확인 텍스트 검증"""
        if value.upper() not in ['DELETE', '삭제']:
            raise serializers.ValidationError("계정 삭제를 확인하려면 'DELETE' 또는 '삭제'를 입력하세요.")
        return value

    def save(self):
        """계정 삭제 실행"""
        user = self.context['request'].user
        user_email = user.email
        
        # 프로필 이미지 파일 삭제
        if hasattr(user, 'profile') and user.profile.avatar:
            user.profile.avatar.delete(save=False)
        
        # 계정 삭제
        user.delete()
        
        logger.info(f"계정 삭제 성공: {user_email}")
        return user_email
