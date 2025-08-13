"""
트렌딩 데이터 관리 서비스
트렌딩 카테고리와 랭킹 데이터를 관리하는 독립적인 서비스
"""
from typing import Dict, Any, Optional, List
from django.core.cache import cache
from django.db.models import QuerySet
from ..models.trending import TrendingCategory, TrendingRanking


class TrendingService:
    """트렌딩 데이터 관리 서비스 클래스"""
    
    CACHE_KEY = 'trending_category_rankings'
    CACHE_TIMEOUT = 3600  # 1시간
    
    @classmethod
    def get_category_rankings(cls) -> Dict[str, Any]:
        """
        트렌딩 카테고리 랭킹 데이터 반환
        캐싱을 통해 성능 최적화
        
        Returns:
            Dict: 트렌딩 데이터 및 캐시 정보
        """
        # 캐시에서 데이터 확인
        cached_data = cache.get(cls.CACHE_KEY)
        
        if cached_data is not None:
            return {
                'status': 'success',
                'data': cached_data,
                'from_cache': True
            }
        
        try:
            # 데이터베이스에서 데이터 조회
            category_rankings = cls._fetch_category_rankings()
            
            # 캐시에 저장
            cache.set(cls.CACHE_KEY, category_rankings, cls.CACHE_TIMEOUT)
            
            return {
                'status': 'success',
                'data': category_rankings,
                'from_cache': False
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'트렌딩 데이터 조회 중 오류가 발생했습니다: {str(e)}'
            }
    
    @classmethod
    def _fetch_category_rankings(cls) -> Dict[str, Dict[str, Any]]:
        """
        데이터베이스에서 트렌딩 카테고리 랭킹 데이터 조회
        
        Returns:
            Dict: 카테고리별 랭킹 데이터
        """
        # 활성화된 카테고리들을 순서대로 가져오기
        categories = TrendingCategory.objects.filter(is_active=True).order_by('order', 'name')
        
        category_rankings = {}
        
        for category in categories:
            # 각 카테고리의 활성화된 랭킹 데이터 가져오기
            rankings = TrendingRanking.objects.filter(
                category=category,
                is_active=True
            ).order_by('rank')
            
            category_rankings[category.name] = {
                'title': category.title,
                'subtitle': category.subtitle,
                'icon': category.icon_name,
                'data': [
                    {
                        'rank': ranking.rank,
                        'name': ranking.name,
                        'score': ranking.score,
                        'provider': ranking.provider
                    }
                    for ranking in rankings
                ]
            }
        
        return category_rankings
    
    @classmethod
    def refresh_cache(cls) -> Dict[str, Any]:
        """
        트렌딩 캐시 강제 새로고침 (관리자용)
        
        Returns:
            Dict: 캐시 새로고침 결과
        """
        try:
            cache.delete(cls.CACHE_KEY)
            return {
                'status': 'success',
                'message': '트렌딩 캐시가 성공적으로 삭제되었습니다.'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'캐시 삭제 중 오류가 발생했습니다: {str(e)}'
            }
    
    @classmethod
    def get_category_count(cls) -> int:
        """
        활성화된 카테고리 개수 반환
        
        Returns:
            int: 활성화된 카테고리 수
        """
        return TrendingCategory.objects.filter(is_active=True).count()
    
    @classmethod
    def get_total_rankings_count(cls) -> int:
        """
        전체 활성화된 랭킹 개수 반환
        
        Returns:
            int: 활성화된 랭킹 수
        """
        return TrendingRanking.objects.filter(is_active=True).count()
    
    @classmethod
    def get_category_by_name(cls, category_name: str) -> Optional[Dict[str, Any]]:
        """
        특정 카테고리의 랭킹 데이터만 반환
        
        Args:
            category_name: 카테고리명
            
        Returns:
            Optional[Dict]: 카테고리 랭킹 데이터 또는 None
        """
        try:
            category = TrendingCategory.objects.get(name=category_name, is_active=True)
            rankings = TrendingRanking.objects.filter(
                category=category,
                is_active=True
            ).order_by('rank')
            
            return {
                'title': category.title,
                'subtitle': category.subtitle,
                'icon': category.icon_name,
                'data': [
                    {
                        'rank': ranking.rank,
                        'name': ranking.name,
                        'score': ranking.score,
                        'provider': ranking.provider
                    }
                    for ranking in rankings
                ]
            }
        except TrendingCategory.DoesNotExist:
            return None
    
    @classmethod
    def get_related_posts_by_model_name(cls, model_name: str) -> QuerySet:
        """
        트렌딩 모델명으로 관련 게시글 조회 (스마트 매칭 적용)
        
        Args:
            model_name: 트렌딩 모델명 (예: 'GPT-5', 'Claude 4 Sonnet')
            
        Returns:
            QuerySet: 관련 게시글 쿼리셋 (정확한 매칭 조건 적용)
        """
        try:
            # 트렌딩 랭킹에서 해당 모델명 찾기
            trending_ranking = TrendingRanking.objects.filter(
                name=model_name,
                is_active=True,
                related_model__isnull=False
            ).first()
            
            if trending_ranking:
                # 모델의 get_filtered_posts 메소드를 사용하여 스마트 매칭 적용
                return trending_ranking.get_filtered_posts()
            else:
                # 관련 모델이 설정되지 않은 경우 빈 쿼리셋 반환
                from posts.models import Post
                return Post.objects.none()
                
        except Exception:
            from posts.models import Post
            return Post.objects.none()
    
    @classmethod
    def get_trending_model_info(cls, model_name: str) -> Optional[Dict[str, Any]]:
        """
        트렌딩 모델의 상세 정보 반환 (관련 모델, 게시글 수 포함)
        
        Args:
            model_name: 트렌딩 모델명
            
        Returns:
            Optional[Dict]: 모델 정보 또는 None
        """
        try:
            trending_ranking = TrendingRanking.objects.filter(
                name=model_name,
                is_active=True
            ).select_related('related_model', 'category').first()
            
            if trending_ranking:
                posts_count = 0
                related_model_info = None
                
                if trending_ranking.related_model:
                    # 정확한 매칭 조건을 적용한 게시글 수 계산
                    posts_count = trending_ranking.get_filtered_posts().count()
                    related_model_info = {
                        'id': trending_ranking.related_model.id,
                        'name': trending_ranking.related_model.name,
                        'platform': trending_ranking.related_model.platform.name,
                        'exact_matching': trending_ranking.use_exact_matching,
                        'model_detail_filter': trending_ranking.model_detail_contains,
                        'model_etc_filter': trending_ranking.model_etc_contains
                    }
                
                return {
                    'trending_name': trending_ranking.name,
                    'provider': trending_ranking.provider,
                    'score': trending_ranking.score,
                    'rank': trending_ranking.rank,
                    'category': {
                        'name': trending_ranking.category.name,
                        'title': trending_ranking.category.title
                    },
                    'related_model': related_model_info,
                    'related_posts_count': posts_count
                }
            
            return None
            
        except Exception:
            return None
