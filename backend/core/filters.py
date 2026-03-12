from django.db.models import Q
from django_filters import rest_framework as filters

from posts.models import AiModel, Category, Post


class PostFilter(filters.FilterSet):
    categories = filters.CharFilter(method='categories_filter', label='카테고리')
    platforms = filters.CharFilter(method='platforms_filter', label='플랫폼')
    models = filters.CharFilter(method='models_filter', label='모델')

    class Meta:
        model = Post
        fields = {
            'author': ['exact'],
        }

    def categories_filter(self, queryset, name, value):
        if not value:
            return queryset

        category_ids = [raw_id.strip() for raw_id in value.split(',') if raw_id.strip()]
        if not category_ids:
            return queryset

        conditions = Q()
        for category_id in category_ids:
            try:
                parsed_id = int(category_id)
                category = Category.objects.get(id=parsed_id)
                if category.name == '기타':
                    conditions |= Q(category=category, category_etc__isnull=False, category_etc__gt='')
                else:
                    conditions |= Q(category_id=parsed_id)
            except (Category.DoesNotExist, ValueError, TypeError):
                continue

        return queryset.filter(conditions) if conditions else queryset

    def models_filter(self, queryset, name, value):
        if not value:
            return queryset

        model_ids = [raw_id.strip() for raw_id in value.split(',') if raw_id.strip()]
        if not model_ids:
            return queryset

        conditions = Q()
        for model_id in model_ids:
            try:
                parsed_id = int(model_id)
                model = AiModel.objects.get(id=parsed_id)
                if model.name == '기타':
                    conditions |= Q(model=model, model_etc__isnull=False, model_etc__gt='')
                else:
                    conditions |= Q(model_id=parsed_id)
            except (AiModel.DoesNotExist, ValueError, TypeError):
                continue

        return queryset.filter(conditions) if conditions else queryset

    def platforms_filter(self, queryset, name, value):
        if not value:
            return queryset

        platform_ids = [raw_id.strip() for raw_id in value.split(',') if raw_id.strip()]
        if not platform_ids:
            return queryset

        valid_ids = []
        for platform_id in platform_ids:
            try:
                valid_ids.append(int(platform_id))
            except (ValueError, TypeError):
                continue

        if not valid_ids:
            return queryset

        return queryset.filter(platform_id__in=valid_ids)
