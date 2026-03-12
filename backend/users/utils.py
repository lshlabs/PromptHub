import random
import string
from typing import Tuple
import ipaddress
import logging
import requests
from requests import RequestException
from .models import CustomUser

logger = logging.getLogger(__name__)

LOCAL_DEFAULT_LOCATION = "Seoul, South Korea"
UNKNOWN_LOCATION = "Unknown"


def _is_private_ip(ip_address: str) -> bool:
    try:
        return ipaddress.ip_address(ip_address).is_private
    except ValueError:
        return ip_address in {"localhost", "::1"}


def get_location_from_ip(ip_address: str) -> str:
    if not ip_address or _is_private_ip(ip_address):
        return LOCAL_DEFAULT_LOCATION

    try:
        response = requests.get(f"https://ipapi.co/{ip_address}/json/", timeout=3)
        if response.status_code == 200:
            data = response.json()
            city = data.get("city")
            country = data.get("country_name")
            if city and country and city != UNKNOWN_LOCATION and country != UNKNOWN_LOCATION:
                return f"{city}, {country}"
            if city and city != UNKNOWN_LOCATION:
                return f"{city}, {UNKNOWN_LOCATION}"
            if country and country != UNKNOWN_LOCATION:
                return f"{UNKNOWN_LOCATION}, {country}"
    except (RequestException, ValueError) as geolocation_error:
        logger.info("Failed to resolve location from IP %s: %s", ip_address, geolocation_error)

    return LOCAL_DEFAULT_LOCATION


def should_auto_set_location(user: CustomUser) -> bool:
    return not user.location or not user.location.strip()


def generate_random_username() -> str:
    while True:
        random_chars = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
        username = f"user-{random_chars}"
        if not CustomUser.objects.filter(username=username).exists():
            return username


def email_to_hex_color(email: str) -> str:
    if not email:
        return "#6B73FF"

    first_char = email[0].lower()
    ascii_val = ord(first_char)

    color_map = {
        "a": "#FF6B6B",
        "b": "#4ECDC4",
        "c": "#FF9F43",
        "d": "#96CEB4",
        "e": "#FFEAA7",
        "f": "#DDA0DD",
        "g": "#98D8C8",
        "h": "#F7DC6F",
        "i": "#BB8FCE",
        "j": "#FF7675",
        "k": "#F8C471",
        "l": "#82E0AA",
        "m": "#F1948A",
        "n": "#6C5CE7",
        "o": "#D7BDE2",
        "p": "#A9DFBF",
        "q": "#F9E79F",
        "r": "#FADBD8",
        "s": "#74B9FF",
        "t": "#00B894",
        "u": "#A3E4D7",
        "v": "#D2B4DE",
        "w": "#F4D03F",
        "x": "#EC7063",
        "y": "#58D68D",
        "z": "#E17055",
    }

    if first_char.isdigit():
        r = (ascii_val * 17) % 256
        g = (ascii_val * 23) % 256
        b = (ascii_val * 31) % 256
        return f"#{r:02X}{g:02X}{b:02X}"

    return color_map.get(first_char, "#6B73FF")


def get_complementary_color(hex_color: str) -> str:
    if not hex_color or not hex_color.startswith("#"):
        return "#9EE5FF"

    try:
        hex_color = hex_color.lstrip("#")
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)

        comp_r = 255 - r
        comp_g = 255 - g
        comp_b = 255 - b

        brightness = (comp_r + comp_g + comp_b) / 3
        if brightness < 100:
            comp_r = min(255, comp_r + 80)
            comp_g = min(255, comp_g + 80)
            comp_b = min(255, comp_b + 80)
        elif brightness > 200:
            comp_r = max(0, comp_r - 80)
            comp_g = max(0, comp_g - 80)
            comp_b = max(0, comp_b - 80)

        return f"#{comp_r:02X}{comp_g:02X}{comp_b:02X}"
    except ValueError:
        return "#9EE5FF"


def generate_avatar_colors(email: str) -> Tuple[str, str]:
    color1 = email_to_hex_color(email)
    color2 = get_complementary_color(color1)
    return color1, color2


def _random_bright_hex_color() -> str:
    r = random.randint(40, 235)
    g = random.randint(40, 235)
    b = random.randint(40, 235)
    return f"#{r:02X}{g:02X}{b:02X}"


def generate_random_avatar_colors() -> Tuple[str, str]:
    for _ in range(10):
        color1 = _random_bright_hex_color()
        color2 = _random_bright_hex_color()
        if color1 != color2:
            return color1, color2

    return "#6B73FF", "#9EE5FF"
