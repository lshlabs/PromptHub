import random
import string
import requests
from typing import Tuple
from .models import CustomUser


def get_location_from_ip(ip_address: str) -> str:
    """
    IP 주소를 기반으로 위치 정보를 가져옵니다.
    
    Args:
        ip_address (str): 클라이언트 IP 주소
        
    Returns:
        str: "City, Country" 형식의 위치 문자열
    """
    # 로컬 IP 주소 체크
    if not ip_address or ip_address in ['127.0.0.1', 'localhost', '::1'] or ip_address.startswith('192.168.') or ip_address.startswith('10.') or ip_address.startswith('172.'):
        return "Seoul, South Korea"
    
    # IP geolocation API 시도 (ipapi.co)
    try:
        response = requests.get(f'https://ipapi.co/{ip_address}/json/', timeout=3)
        if response.status_code == 200:
            data = response.json()
            city = data.get('city')
            country = data.get('country_name')
            
            # 응답 데이터 검증
            if city and country and city != 'Unknown' and country != 'Unknown':
                return f"{city}, {country}"
            elif city and city != 'Unknown':
                return f"{city}, Unknown"
            elif country and country != 'Unknown':
                return f"Unknown, {country}"
    except Exception as e:
        print(f"IP 위치 조회 실패: {e}")
    
    # 기본값 반환
    return "Seoul, South Korea"


def should_auto_set_location(user: CustomUser) -> bool:
    """
    사용자에게 위치를 자동 설정해야 하는지 확인합니다.
    
    Args:
        user (CustomUser): 사용자 객체
        
    Returns:
        bool: 자동 설정이 필요한지 여부
    """
    # location이 비어있거나 None인 경우에만 자동 설정
    return not user.location or user.location.strip() == ''


def generate_random_username() -> str:
    """
    고유한 랜덤 username을 생성합니다.
    
    형식: 'user-' + 8자리 랜덤 문자열 (숫자 + 알파벳 조합)
    예: 'user-a7b3c9d2', 'user-1x8y4z6m'
    
    Returns:
        str: 생성된 고유한 username
    """
    while True:
        # 8자리 랜덤 문자열 생성 (숫자 + 소문자 알파벳)
        random_chars = ''.join(random.choices(
            string.ascii_lowercase + string.digits, k=8
        ))
        username = f'user-{random_chars}'
        
        # 데이터베이스에서 중복 확인
        if not CustomUser.objects.filter(username=username).exists():
            return username


def email_to_hex_color(email: str) -> str:
    """
    이메일의 첫 글자를 hex 색상으로 변환합니다.
    
    Args:
        email (str): 사용자 이메일 주소
        
    Returns:
        str: hex 색상 코드 (예: '#6A73FF')
    """
    if not email:
        return '#6B73FF'  # 기본 색상
    
    # 이메일 첫 글자의 ASCII 값을 가져옴
    first_char = email[0].lower()
    ascii_val = ord(first_char)
    
    # ASCII 값을 기반으로 색상 매핑
    color_map = {
        'a': '#FF6B6B',  # 빨간색 계열
        'b': '#4ECDC4',  # 청록색 계열
        'c': '#45B7D1',  # 파란색 계열
        'd': '#96CEB4',  # 초록색 계열
        'e': '#FFEAA7',  # 노란색 계열
        'f': '#DDA0DD',  # 보라색 계열
        'g': '#98D8C8',  # 민트색 계열
        'h': '#F7DC6F',  # 금색 계열
        'i': '#BB8FCE',  # 라벤더 계열
        'j': '#85C1E9',  # 하늘색 계열
        'k': '#F8C471',  # 주황색 계열
        'l': '#82E0AA',  # 연두색 계열
        'm': '#F1948A',  # 분홍색 계열
        'n': '#85C1E9',  # 연파랑 계열
        'o': '#D7BDE2',  # 연보라 계열
        'p': '#A9DFBF',  # 연초록 계열
        'q': '#F9E79F',  # 연노랑 계열
        'r': '#FADBD8',  # 연분홍 계열
        's': '#D5DBDB',  # 회색 계열
        't': '#AED6F1',  # 연하늘 계열
        'u': '#A3E4D7',  # 연청록 계열
        'v': '#D2B4DE',  # 연자주 계열
        'w': '#F4D03F',  # 연황금 계열
        'x': '#EC7063',  # 연빨강 계열
        'y': '#58D68D',  # 연초록 계열
        'z': '#5DADE2',  # 연파랑 계열
    }
    
    # 숫자의 경우 ASCII 값을 기반으로 색상 생성
    if first_char.isdigit():
        # ASCII 값을 RGB로 변환
        r = (ascii_val * 17) % 256
        g = (ascii_val * 23) % 256
        b = (ascii_val * 31) % 256
        return f'#{r:02X}{g:02X}{b:02X}'
    
    return color_map.get(first_char, '#6B73FF')


def get_complementary_color(hex_color: str) -> str:
    """
    주어진 hex 색상과 조화로운 두 번째 색상을 생성합니다.
    
    Args:
        hex_color (str): 첫 번째 색상 hex 코드
        
    Returns:
        str: 조화로운 두 번째 색상 hex 코드
    """
    if not hex_color or not hex_color.startswith('#'):
        return '#9EE5FF'  # 기본 두 번째 색상
    
    try:
        # hex에서 RGB 값 추출
        hex_color = hex_color.lstrip('#')
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)
        
        # 보색 계산 (255에서 각 RGB 값을 뺀 값)
        comp_r = 255 - r
        comp_g = 255 - g
        comp_b = 255 - b
        
        # 보색이 너무 어둡거나 밝지 않도록 조정
        # 밝기를 50-200 범위로 조정
        brightness = (comp_r + comp_g + comp_b) / 3
        if brightness < 100:
            # 너무 어두우면 밝게 조정
            comp_r = min(255, comp_r + 80)
            comp_g = min(255, comp_g + 80)
            comp_b = min(255, comp_b + 80)
        elif brightness > 200:
            # 너무 밝으면 어둡게 조정
            comp_r = max(0, comp_r - 80)
            comp_g = max(0, comp_g - 80)
            comp_b = max(0, comp_b - 80)
        
        return f'#{comp_r:02X}{comp_g:02X}{comp_b:02X}'
        
    except ValueError:
        return '#9EE5FF'  # 변환 실패 시 기본 색상


def generate_avatar_colors(email: str) -> Tuple[str, str]:
    """
    이메일을 기반으로 아바타 색상 쌍을 생성합니다.
    
    Args:
        email (str): 사용자 이메일 주소
        
    Returns:
        Tuple[str, str]: (첫 번째 색상, 두 번째 색상) hex 코드 쌍
    """
    color1 = email_to_hex_color(email)
    color2 = get_complementary_color(color1)
    return color1, color2