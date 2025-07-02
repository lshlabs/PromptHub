"""
사용자 계정 관련 시그널

사용자 생성/수정 시 자동으로 실행되는 로직들을 정의합니다.
Django의 시그널 시스템을 사용하여 User 모델의 생명 주기에 따라
관련 객체들을 자동으로 생성하고 관리합니다.

주요 기능:
- 사용자 생성 시 프로필 자동 생성
- 사용자 생성 시 인증 토큰 자동 생성
- 사용자 저장 시 프로필 동기화
"""
import logging
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token
from .models import User, UserProfile

# 로거 설정
logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    사용자 생성 시 프로필 자동 생성
    
    새로운 User 객체가 생성될 때 자동으로 연결된 UserProfile을 생성합니다.
    이때 이메일을 기반으로 한 일관된 아바타 색상도 함께 설정됩니다.
    이를 통해 모든 사용자가 개성있는 기본 프로필을 가지게 됩니다.
    
    Args:
        sender: 시그널을 보낸 모델 클래스 (User)
        instance: 저장된 User 인스턴스
        created (bool): 새로 생성된 객체인지 여부
        **kwargs: 추가 키워드 인수
    """
    if created:
        try:
            # 이메일 기반 아바타 색상 생성
            avatar_color = UserProfile.generate_avatar_color_from_email(instance.email)
            
            # 프로필 생성 시 아바타 색상도 함께 설정
            UserProfile.objects.create(user=instance, avatar_color=avatar_color)
            
            logger.info(f"사용자 프로필 생성: {instance.email} (아바타 색상: {avatar_color})")
        except Exception as e:
            logger.error(f"프로필 생성 실패 [{instance.email}]: {e}")

@receiver(post_save, sender=User)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    """
    사용자 생성 시 인증 토큰 자동 생성
    
    새로운 User 객체가 생성될 때 자동으로 DRF 인증 토큰을 생성합니다.
    이를 통해 회원가입과 동시에 API 인증이 가능해집니다.
    
    Args:
        sender: 시그널을 보낸 모델 클래스 (User)
        instance: 저장된 User 인스턴스  
        created (bool): 새로 생성된 객체인지 여부
        **kwargs: 추가 키워드 인수
    """
    if created and instance:
        try:
            Token.objects.create(user=instance)
            logger.info(f"인증 토큰 생성: {instance.email}")
        except Exception as e:
            logger.error(f"토큰 생성 실패 [{instance.email}]: {e}")

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    사용자 저장 시 프로필도 함께 저장
    
    User 객체가 저장될 때 연결된 UserProfile도 함께 저장합니다.
    사용자 정보와 프로필 정보의 동기화를 보장합니다.
    
    Args:
        sender: 시그널을 보낸 모델 클래스 (User)
        instance: 저장된 User 인스턴스
        **kwargs: 추가 키워드 인수
    """
    try:
        if hasattr(instance, 'profile'):
            instance.profile.save()
            logger.debug(f"사용자 프로필 저장: {instance.email}")
    except Exception as e:
        logger.error(f"프로필 저장 실패 [{instance.email}]: {e}")
