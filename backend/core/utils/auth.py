from django.http import JsonResponse
from rest_framework.authtoken.models import Token


def token_required(view_func):
    """
    Token auth decorator for function-based views.

    Extracts the Token from Authorization header and attaches the user to request.
    Returns 401 when token is missing or invalid.
    """

    def wrapper(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Token '):
            return JsonResponse({'status': 'error', 'message': '유효한 토큰이 필요합니다.'}, status=401)

        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            request.user = token.user
            return view_func(request, *args, **kwargs)
        except Token.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': '유효하지 않은 토큰입니다.'}, status=401)

    return wrapper


