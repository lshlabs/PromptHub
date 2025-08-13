"""
기존 게시글의 model_detail 데이터를 정리하는 Django 관리 명령어

사용법:
    python manage.py clean_model_detail --dry-run  # 미리보기
    python manage.py clean_model_detail            # 실제 정리
    
기능:
    - 기존 model_detail 데이터를 새로운 AiModel 테이블의 표준 모델명과 매칭
    - 유사한 모델명을 찾아 표준화
    - 매칭되지 않는 경우 사용자 확인 후 처리
"""

from django.core.management.base import BaseCommand
from django.db import transaction, models
from posts.models import Post, AiModel
from difflib import SequenceMatcher
from collections import defaultdict


class Command(BaseCommand):
    help = '기존 게시글의 model_detail 데이터를 표준 모델명으로 정리합니다.'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제 변경사항을 적용하지 않고 미리보기만 합니다.',
        )
        parser.add_argument(
            '--auto-confirm',
            action='store_true',
            help='유사도 0.7 이상인 경우 자동으로 매칭합니다.',
        )
        parser.add_argument(
            '--threshold',
            type=float,
            default=0.6,
            help='자동 매칭을 위한 최소 유사도 임계값 (기본값: 0.6)',
        )
    
    def similarity_score(self, a, b):
        """두 문자열 간의 유사도를 계산합니다."""
        return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()
    
    def find_best_match(self, query, models, threshold=0.6):
        """주어진 쿼리에 대해 가장 유사한 모델을 찾습니다."""
        best_match = None
        best_score = 0
        
        for model in models:
            # 직접 유사도 계산
            name_similarity = self.similarity_score(query, model.name)
            
            # 포함 관계 체크
            contains_score = 0
            if query.lower().strip() in model.name.lower():
                contains_score = 0.8
            elif model.name.lower() in query.lower().strip():
                contains_score = 0.6
            
            # 최종 점수
            final_score = max(name_similarity, contains_score)
            
            if final_score > best_score and final_score >= threshold:
                best_score = final_score
                best_match = {
                    'model': model,
                    'score': final_score,
                    'match_type': 'contains' if contains_score > name_similarity else 'similarity'
                }
        
        return best_match
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        auto_confirm = options['auto_confirm']
        threshold = options['threshold']
        
        self.stdout.write(
            self.style.SUCCESS(
                f'모델 상세명 정리 {'시뮬레이션' if dry_run else '실행'} (임계값: {threshold})'
            )
        )
        
        # model_detail이 있는 게시글들 조회
        posts_with_detail = Post.objects.exclude(
            models.Q(model_detail__isnull=True) | models.Q(model_detail__exact='')
        ).select_related('platform', 'model')
        
        total_posts = posts_with_detail.count()
        self.stdout.write(f'정리 대상 게시글: {total_posts}개')
        
        if total_posts == 0:
            self.stdout.write(self.style.WARNING('정리할 model_detail 데이터가 없습니다.'))
            return
        
        # 모든 모델 목록 가져오기
        all_models = list(AiModel.objects.select_related('platform'))
        
        # 통계 수집
        stats = {
            'processed': 0,
            'matched': 0,
            'already_standard': 0,
            'no_match': 0,
            'updated': 0,
        }
        
        # model_detail 값별 통계
        detail_stats = defaultdict(list)
        
        for post in posts_with_detail:
            current_detail = post.model_detail.strip()
            detail_stats[current_detail].append(post.id)
        
        self.stdout.write(f'\n고유한 model_detail 값: {len(detail_stats)}개')
        
        # 각 고유 model_detail 값에 대해 처리
        updates_to_apply = []
        
        for detail_value, post_ids in detail_stats.items():
            if not detail_value:
                continue
                
            stats['processed'] += 1
            post_count = len(post_ids)
            
            self.stdout.write(f'\n--- 처리 중: "{detail_value}" (게시글 {post_count}개) ---')
            
            # 해당 플랫폼의 모델들만 필터링해서 검색 (첫 번째 게시글 기준)
            first_post = Post.objects.get(id=post_ids[0])
            platform_models = [m for m in all_models if m.platform_id == first_post.platform_id]
            
            # 이미 표준 모델명인지 확인
            exact_match = next((m for m in platform_models if m.name == detail_value), None)
            if exact_match:
                stats['already_standard'] += post_count
                self.stdout.write(
                    self.style.SUCCESS(f'✓ 이미 표준 모델명: {detail_value}')
                )
                continue
            
            # 유사한 모델 찾기
            best_match = self.find_best_match(detail_value, platform_models, threshold)
            
            if best_match:
                model = best_match['model']
                score = best_match['score']
                match_type = best_match['match_type']
                
                stats['matched'] += post_count
                
                self.stdout.write(
                    f'→ 매칭 후보: "{model.name}" (플랫폼: {model.platform.name})'
                )
                self.stdout.write(
                    f'  유사도: {score:.3f} ({match_type}), 게시글 수: {post_count}'
                )
                
                # 자동 확인 또는 사용자 확인
                should_update = False
                if auto_confirm and score >= 0.7:
                    should_update = True
                    self.stdout.write(self.style.SUCCESS('  → 자동 승인 (유사도 0.7 이상)'))
                elif not dry_run:
                    response = input(f'  "{detail_value}" → "{model.name}" 으로 변경하시겠습니까? (y/n): ')
                    should_update = response.lower() == 'y'
                else:
                    should_update = True  # dry-run에서는 모든 매칭을 표시
                    self.stdout.write('  → 변경 예정 (dry-run)')
                
                if should_update:
                    updates_to_apply.append({
                        'post_ids': post_ids,
                        'old_value': detail_value,
                        'new_value': model.name,
                        'model_id': model.id,
                    })
                    stats['updated'] += post_count
            else:
                stats['no_match'] += post_count
                self.stdout.write(
                    self.style.ERROR(f'✗ 매칭되는 모델을 찾을 수 없음: {detail_value}')
                )
                self.stdout.write(f'  플랫폼: {first_post.platform.name}, 게시글 수: {post_count}')
        
        # 실제 업데이트 적용
        if updates_to_apply and not dry_run:
            self.stdout.write(f'\n{len(updates_to_apply)}개 그룹의 변경사항을 적용합니다...')
            
            with transaction.atomic():
                for update in updates_to_apply:
                    Post.objects.filter(id__in=update['post_ids']).update(
                        model_detail=update['new_value']
                    )
                    self.stdout.write(
                        f'✓ "{update["old_value"]}" → "{update["new_value"]}" '
                        f'({len(update["post_ids"])}개 게시글)'
                    )
        
        # 최종 통계
        self.stdout.write(self.style.SUCCESS('\n=== 정리 완료 ==='))
        self.stdout.write(f'처리된 고유 model_detail 값: {stats["processed"]}개')
        self.stdout.write(f'이미 표준화된 게시글: {stats["already_standard"]}개')
        self.stdout.write(f'매칭된 게시글: {stats["matched"]}개')
        self.stdout.write(f'매칭 실패 게시글: {stats["no_match"]}개')
        
        if not dry_run:
            self.stdout.write(f'실제 업데이트된 게시글: {stats["updated"]}개')
        else:
            self.stdout.write(f'업데이트 예정 게시글: {stats["updated"]}개')
            self.stdout.write(self.style.WARNING('실제 적용하려면 --dry-run 옵션을 제거하세요.'))
        
        # 매칭되지 않은 model_detail 값들 상세 표시
        if stats['no_match'] > 0:
            self.stdout.write('\n=== 매칭 실패 목록 ===')
            unmatched_details = []
            for detail_value, post_ids in detail_stats.items():
                if detail_value and detail_value.strip():
                    first_post = Post.objects.get(id=post_ids[0])
                    platform_models = [m for m in all_models if m.platform_id == first_post.platform_id]
                    if not self.find_best_match(detail_value, platform_models, threshold):
                        unmatched_details.append((detail_value, len(post_ids), first_post.platform.name))
            
            for detail, count, platform in unmatched_details:
                self.stdout.write(f'• "{detail}" (플랫폼: {platform}, {count}개 게시글)')
            
            self.stdout.write(
                f'\n매칭되지 않은 {len(unmatched_details)}개 항목은 수동으로 처리가 필요합니다.'
            )
