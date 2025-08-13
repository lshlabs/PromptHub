from django.utils import timezone
from datetime import datetime


def format_relative_time(date_obj):
    """
    날짜 객체를 상대적 시간 문자열로 변환
    
    Args:
        date_obj: datetime 객체
        
    Returns:
        str: 상대적 시간 문자열 (예: "5분 전", "2시간 전", "3일 전")
    """
    if not date_obj:
        return "날짜 없음"
    
    try:
        now = timezone.now()
        
        # 유효하지 않은 날짜인지 확인
        if not isinstance(date_obj, datetime):
            return "유효하지 않은 날짜"
        
        diff_in_seconds = (now - date_obj).total_seconds()
        
        if diff_in_seconds < 60:
            return "방금 전"
        elif diff_in_seconds < 3600:  # 1시간
            minutes = int(diff_in_seconds // 60)
            return f"{minutes}분 전"
        elif diff_in_seconds < 86400:  # 24시간
            hours = int(diff_in_seconds // 3600)
            return f"{hours}시간 전"
        elif diff_in_seconds < 604800:  # 7일
            days = int(diff_in_seconds // 86400)
            return f"{days}일 전"
        else:
            # 주, 개월, 년 단위 계산
            days = int(diff_in_seconds // 86400)
            
            if days < 30:
                weeks = days // 7
                return f"{weeks}주 전"
            elif days < 365:
                months = days // 30
                return f"{months}개월 전"
            else:
                years = days // 365
                return f"{years}년 전"
                
    except Exception as e:
        print(f"상대적 시간 변환 오류: {e}")
        return "날짜 변환 오류" 