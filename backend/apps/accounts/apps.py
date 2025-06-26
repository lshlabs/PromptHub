"""
Accounts 앱 설정
"""
from django.apps import AppConfig

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    verbose_name = '사용자 계정'
    
    def ready(self):
        """앱이 준비될 때 시그널 등록"""
        import apps.accounts.signals
