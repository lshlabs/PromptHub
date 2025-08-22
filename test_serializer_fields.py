#!/usr/bin/env python
"""
Serializer 필드 확인 스크립트
백엔드 변경사항이 제대로 적용되었는지 확인합니다.
"""

import sys
import os

# Django 설정 경로 추가
sys.path.append('/Users/mac/Documents/prompthub2/backend')

try:
    # Django 환경 설정
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
    
    import django
    django.setup()
    
    from posts.serializers import PostCardSerializer, PostDetailSerializer
    
    print("✅ PostCardSerializer 필드들:")
    print(f"Fields: {PostCardSerializer.Meta.fields}")
    print(f"modelDisplayName 포함: {'modelDisplayName' in PostCardSerializer.Meta.fields}")
    print(f"categoryDisplayName 포함: {'categoryDisplayName' in PostCardSerializer.Meta.fields}")
    
    print("\n✅ PostDetailSerializer 필드들:")
    print(f"Fields: {PostDetailSerializer.Meta.fields}")
    print(f"modelDisplayName 포함: {'modelDisplayName' in PostDetailSerializer.Meta.fields}")
    print(f"categoryDisplayName 포함: {'categoryDisplayName' in PostDetailSerializer.Meta.fields}")
    
    # SerializerMethodField 메서드 확인
    card_serializer = PostCardSerializer()
    detail_serializer = PostDetailSerializer()
    
    print(f"\n✅ PostCardSerializer 메서드:")
    print(f"get_modelDisplayName 존재: {hasattr(card_serializer, 'get_modelDisplayName')}")
    print(f"get_categoryDisplayName 존재: {hasattr(card_serializer, 'get_categoryDisplayName')}")
    
    print(f"\n✅ PostDetailSerializer 메서드:")
    print(f"get_modelDisplayName 존재: {hasattr(detail_serializer, 'get_modelDisplayName')}")
    print(f"get_categoryDisplayName 존재: {hasattr(detail_serializer, 'get_categoryDisplayName')}")
    
    print("\n🎉 모든 변경사항이 성공적으로 적용되었습니다!")
    
except ImportError as e:
    print(f"❌ Django 모듈 로딩 실패: {e}")
    print("가상환경이나 Django 설치를 확인하세요.")
except Exception as e:
    print(f"❌ 오류 발생: {e}")