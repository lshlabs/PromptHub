"""
Accounts 앱 설정

PromptHub의 사용자 계정 관리 앱을 설정합니다.
Django 앱 시스템을 통해 앱의 메타데이터와 초기화 로직을 정의합니다.

주요 기능:
- 앱 메타데이터 설정 (이름, 표시명)
- 시그널 등록을 통한 자동 초기화
- 데이터베이스 모델 자동 필드 설정
"""
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """
    Accounts 앱 설정 클래스
    
    Django 앱의 설정 정보와 초기화 로직을 담당합니다.
    앱이 로드될 때 필요한 설정들을 자동으로 적용합니다.
    """
    
    # 기본 자동 필드 타입 설정 (Django 3.2+)
    default_auto_field = 'django.db.models.BigAutoField'
    
    # 앱 이름 (Python 패키지 경로)
    name = 'apps.accounts'
    
    # 관리자 사이트에서 표시될 앱 이름
    verbose_name = '사용자 계정 관리'
    
    def ready(self):
        """
        앱 준비 완료 시 실행되는 메서드
        
        Django가 앱을 완전히 로드한 후 호출됩니다.
        시그널 등록, 초기 설정 등을 수행합니다.
        
        Note:
            이 메서드는 Django 시작 시 한 번만 실행되며,
            signals.py의 모든 시그널 핸들러들을 등록합니다.
        """
        try:
            # 시그널 핸들러 등록
            import apps.accounts.signals
        except ImportError:
            # 시그널 파일이 없거나 import 오류가 발생해도 앱은 정상 동작
            pass
