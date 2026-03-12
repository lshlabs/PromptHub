from functools import wraps

from django.http import JsonResponse
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


_token_auth = TokenAuthentication()


def _authenticate(request):
    try:
        return _token_auth.authenticate(request)
    except AuthenticationFailed:
        return None


def attach_authenticated_user(request) -> bool:
    auth_result = _authenticate(request)
    if not auth_result:
        return False
    user, _ = auth_result
    request.user = user
    return True


def token_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not attach_authenticated_user(request):
            return JsonResponse({'status': 'error', 'message': '유효한 토큰이 필요합니다.'}, status=401)
        return view_func(request, *args, **kwargs)

    return wrapper
