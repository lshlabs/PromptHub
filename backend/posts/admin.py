from django.contrib import admin
from .models import Platform, AiModel, Category, Post, PostInteraction


class AiModelInline(admin.TabularInline):
    model = AiModel
    fields = (
        'name', 'slug', 'sort_order', 'is_active', 'is_deprecated',
        'variant_free_text_allowed', 'released_at', 'posts_count_inline'
    )
    readonly_fields = ('slug', 'posts_count_inline')
    extra = 0
    show_change_link = True

    def posts_count_inline(self, obj):
        return obj.posts.count()
    posts_count_inline.short_description = '게시글 수'


@admin.register(Platform)
class PlatformAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'slug', 'is_active', 'models_count']
    list_filter = ['is_active']
    search_fields = ['name', 'slug']
    readonly_fields = ['slug', 'created_at', 'updated_at']
    inlines = [AiModelInline]

    fieldsets = (
        ('기본 정보', {
            'fields': ('name', 'slug', 'is_active')
        }),
        ('메타데이터', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def models_count(self, obj):
        return obj.models.count()
    models_count.short_description = '모델 수'


@admin.register(AiModel)
class AiModelAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'slug', 'platform', 'sort_order', 'is_active', 'is_deprecated', 'released_at', 'posts_count']
    list_filter = ['platform', 'is_active', 'is_deprecated']
    search_fields = ['name', 'slug', 'platform__name']
    list_select_related = ['platform']
    ordering = ['platform__name', 'sort_order', 'name']
    list_editable = ['sort_order', 'is_active', 'is_deprecated', 'released_at']
    readonly_fields = ['slug']
    autocomplete_fields = ['platform']

    fieldsets = (
        ('기본 정보', {
            'fields': ('platform', 'name', 'slug')
        }),
        ('상태', {
            'fields': ('is_active', 'is_deprecated', 'variant_free_text_allowed')
        }),
        ('릴리스', {
            'fields': ('released_at', 'sort_order')
        }),
    )
    
    def posts_count(self, obj):
        return obj.posts.count()
    posts_count.short_description = '게시글 수'


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'posts_count']
    search_fields = ['name']
    
    def posts_count(self, obj):
        return obj.posts.count()
    posts_count.short_description = '게시글 수'


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'author', 'platform', 'get_model_display', 'category', 
        'satisfaction', 'view_count', 'like_count', 'bookmark_count', 'created_at'
    ]
    list_filter = [
        'platform', 'category', 'created_at', 'satisfaction'
    ]
    search_fields = [
        'title', 'author__username', 'author__email', 
        'prompt', 'ai_response', 'tags'
    ]
    readonly_fields = [
        'view_count', 'like_count', 'bookmark_count', 
        'created_at', 'updated_at'
    ]
    list_select_related = ['author', 'platform', 'model', 'category']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('title', 'author')
        }),
        ('AI 정보', {
            'fields': ('platform', 'model', 'model_etc', 'model_detail')
        }),
        ('분류 정보', {
            'fields': ('category', 'category_etc', 'tags')
        }),
        ('내용', {
            'fields': ('prompt', 'ai_response', 'additional_opinion')
        }),
        ('평가', {
            'fields': ('satisfaction',)
        }),
        ('통계', {
            'fields': ('view_count', 'like_count', 'bookmark_count'),
            'classes': ('collapse',)
        }),
        ('메타데이터', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_model_display(self, obj):
        return obj.get_model_display_name()
    get_model_display.short_description = '모델'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'author', 'platform', 'model', 'category'
        )


@admin.register(PostInteraction)
class PostInteractionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'post_title', 'is_liked', 'is_bookmarked', 
        'created_at', 'updated_at'
    ]
    list_filter = [
        'is_liked', 'is_bookmarked', 'created_at'
    ]
    search_fields = [
        'user__username', 'user__email', 'post__title'
    ]
    readonly_fields = ['created_at', 'updated_at']
    list_select_related = ['user', 'post']
    
    def post_title(self, obj):
        return obj.post.title
    post_title.short_description = '게시글 제목'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'post')


# 관리자 사이트 설정
admin.site.site_header = 'PromptHub 관리자'
admin.site.site_title = 'PromptHub Admin'
admin.site.index_title = 'PromptHub 관리자 대시보드'