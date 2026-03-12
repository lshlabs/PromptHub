from django.utils import timezone
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def format_relative_time(date_obj):
    if not date_obj:
        return "날짜 없음"

    if not isinstance(date_obj, datetime):
        return "유효하지 않은 날짜"

    try:
        now = timezone.now()
        diff_in_seconds = (now - date_obj).total_seconds()

        if diff_in_seconds < 60:
            return "방금 전"
        if diff_in_seconds < 3600:
            minutes = int(diff_in_seconds // 60)
            return f"{minutes}분 전"
        if diff_in_seconds < 86400:
            hours = int(diff_in_seconds // 3600)
            return f"{hours}시간 전"
        if diff_in_seconds < 604800:
            days = int(diff_in_seconds // 86400)
            return f"{days}일 전"

        days = int(diff_in_seconds // 86400)
        if days < 30:
            return f"{days // 7}주 전"
        if days < 365:
            return f"{days // 30}개월 전"
        return f"{days // 365}년 전"
    except TypeError as conversion_error:
        logger.warning("Failed to format relative time for %r: %s", date_obj, conversion_error)
        return "날짜 변환 오류"
