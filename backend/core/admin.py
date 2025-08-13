from django.contrib import admin
from django import forms
from django.core.cache import cache
from django.contrib import messages
from django.db.models import Count
from django.utils.html import format_html
from .models.trending import TrendingCategory, TrendingRanking


class TrendingRankingInline(admin.TabularInline):
    """카테고리 편집 시 랭킹들을 함께 편집할 수 있는 인라인"""
    model = TrendingRanking
    extra = 0
    ordering = ['rank']


@admin.register(TrendingCategory)
class TrendingCategoryAdmin(admin.ModelAdmin):
    """트렌딩 카테고리 관리"""
    list_display = ['title', 'name', 'subtitle', 'icon_name', 'order', 'is_active', 'updated_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'title', 'subtitle']
    list_editable = ['order', 'is_active']
    ordering = ['order', 'name']
    inlines = [TrendingRankingInline]
    
    def save_model(self, request, obj, form, change):
        """저장 시 캐시 삭제"""
        super().save_model(request, obj, form, change)
        cache.delete('trending_category_rankings')
        self.message_user(request, '트렌딩 캐시가 삭제되었습니다.', messages.INFO)


class TrendingRankingAdminForm(forms.ModelForm):
    """트렌딩 랭킹 Admin 전용 폼: 두 키워드를 하나로 통합 입력"""
    matching_keyword = forms.CharField(
        required=False,
        label='모델명 포함 조건 (단일 키워드)',
        help_text='대소문자/공백/하이픈/언더스코어 무시. model_detail 또는 model_etc 중 하나라도 포함 시 매칭(OR).'
    )

    class Meta:
        model = TrendingRanking
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        instance = kwargs.get('instance')
        if instance:
            # 두 필드 중 값이 있는 것을 우선 표시. 둘 다 있으면 동일값일 가능성이 높음
            initial_kw = instance.model_detail_contains or instance.model_etc_contains
            self.fields['matching_keyword'].initial = initial_kw

    def save(self, commit=True):
        obj = super().save(commit=False)
        kw = self.cleaned_data.get('matching_keyword', '') or ''
        # 단일 입력을 두 필드에 동일하게 기록하여 OR 매칭 유지
        obj.model_detail_contains = kw
        obj.model_etc_contains = kw
        if commit:
            obj.save()
        return obj


@admin.register(TrendingRanking)
class TrendingRankingAdmin(admin.ModelAdmin):
    """트렌딩 랭킹 관리"""
    form = TrendingRankingAdminForm
    list_display = [
        'category', 'rank', 'name', 'score', 'provider', 
        'related_model', 'get_exact_matching_status', 'get_related_posts_count', 
        'is_active', 'updated_at'
    ]
    list_filter = [
        'category', 'is_active', 'provider', 'related_model', 
        'use_exact_matching', 'created_at'
    ]
    search_fields = ['name', 'provider', 'related_model__name']
    list_editable = ['is_active']
    ordering = ['category__order', 'rank']
    
    readonly_fields = ['matching_rule_note', 'normalized_keyword_preview']

    fieldsets = (
        ('기본 정보', {
            'fields': ('category', 'rank', 'name', 'score', 'provider', 'is_active')
        }),
        ('모델 매칭 설정', {
            'fields': ('related_model', 'use_exact_matching'),
            'description': '이 트렌딩 랭킹과 연결할 AI 모델을 선택하세요.'
        }),
        ('정확한 매칭 조건', {
            'fields': (
                'matching_rule_note',
                'matching_keyword',
                'normalized_keyword_preview',
            ),
            'classes': ('collapse',),
            'description': (
                '정확한 매칭이 활성화된 경우에만 사용됩니다.\n'
                '- 대소문자를 구분하지 않습니다.\n'
                '- 공백(" "), 하이픈("-"), 언더스코어("_")는 무시합니다.\n'
                '- model_detail 또는 model_etc 중 하나라도 포함되면 매칭됩니다 (OR 조건).\n'
                '예: 키워드에 "OSS 20B"를 입력하면 "oss 20b", "oss-20b", "OSS_20B" 등도 매칭됩니다.'
            )
        }),
    )
    
    def get_queryset(self, request):
        """쿼리셋에 관련 게시글 수 어노테이션 추가"""
        queryset = super().get_queryset(request)
        return queryset.select_related('category', 'related_model').annotate(
            posts_count=Count('related_model__posts', distinct=True)
        )
    
    def get_exact_matching_status(self, obj):
        """정확한 매칭 상태 표시"""
        if obj.use_exact_matching:
            # 단일 키워드 표기(두 필드가 동일하도록 저장되므로 하나만 보여줌)
            kw_detail = (obj.model_detail_contains or '').strip()
            kw_etc = (obj.model_etc_contains or '').strip()
            unique_kws = [kw for kw in {kw_detail, kw_etc} if kw]

            if len(unique_kws) == 1:
                condition_text = f"키워드: '{unique_kws[0]}'"
            elif len(unique_kws) > 1:
                # 드물게 두 값이 다르면 OR로 병행 표기
                condition_text = " OR ".join([f"'{kw}'" for kw in unique_kws])
            else:
                condition_text = "조건 없음"
            return format_html(
                '<span style="color: #007cba; font-weight: bold;" title="{} (정규화: 대소문자/공백/-,_ 무시; OR 매칭)">정확 매칭(정규화)</span>',
                condition_text,
            )
        else:
            return format_html('<span style="color: #6c757d;">기본 매칭</span>')
    
    get_exact_matching_status.short_description = '매칭 방식'
    
    def get_related_posts_count(self, obj):
        """관련 게시글 수 표시 (정확한 매칭 조건 적용)"""
        if obj.related_model:
            try:
                # 정확한 매칭 조건을 적용한 게시글 수 계산
                count = obj.get_filtered_posts().count()
                
                if obj.use_exact_matching and count > 0:
                    # 정확한 매칭인 경우 파란색으로 표시
                    return format_html(
                        '<span style="color: #007cba; font-weight: bold;">{} 개</span>',
                        count
                    )
                elif count > 0:
                    # 기본 매칭인 경우 녹색으로 표시
                    return format_html(
                        '<span style="color: #28a745; font-weight: bold;">{} 개</span>',
                        count
                    )
                else:
                    return format_html('<span style="color: #6c757d;">0 개</span>')
            except Exception:
                return format_html('<span style="color: #dc3545;">오류</span>')
        return format_html('<span style="color: #6c757d;">-</span>')
    
    get_related_posts_count.short_description = '관련 게시글 수'

    # 안내/미리보기 필드
    def matching_rule_note(self, obj):
        """정확 매칭 규칙 안내 텍스트 (읽기전용)"""
        return format_html(
            '<div style="color:#495057;">'
            '<div>대소문자 무시, 공백/하이픈/언더스코어 제거 후 비교합니다.</div>'
            '<div><b>model_detail</b> 또는 <b>model_etc</b> 중 하나라도 포함되면 매칭됩니다 (OR).</div>'
            '</div>'
        )

    matching_rule_note.short_description = '매칭 규칙 안내'

    def normalized_keyword_preview(self, obj):
        """입력한 키워드의 정규화 결과 미리보기 (읽기전용)"""
        def _normalize(value: str) -> str:
            return (value or '').lower().replace(' ', '').replace('-', '').replace('_', '')

        norm_detail = _normalize(getattr(obj, 'model_detail_contains', ''))
        norm_etc = _normalize(getattr(obj, 'model_etc_contains', ''))

        if not (norm_detail or norm_etc):
            return format_html('<span style="color:#6c757d;">(키워드를 입력하면 정규화 미리보기가 표시됩니다)</span>')

        items = []
        if norm_detail:
            items.append(f"상세 → <code>{norm_detail}</code>")
        if norm_etc:
            items.append(f"기타 → <code>{norm_etc}</code>")

        return format_html('<div style="color:#495057;">{}</div>', ' / '.join(items))

        
    
    def save_model(self, request, obj, form, change):
        """저장 시 캐시 삭제"""
        super().save_model(request, obj, form, change)
        cache.delete('trending_category_rankings')
        self.message_user(request, '트렌딩 캐시가 삭제되었습니다.', messages.INFO)
