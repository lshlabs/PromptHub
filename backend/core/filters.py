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

    @staticmethod
    def _parse_int_ids(value: str) -> list[int]:
        ids: list[int] = []
        for raw_id in value.split(','):
            stripped = raw_id.strip()
            if not stripped:
                continue
            try:
                ids.append(int(stripped))
            except (ValueError, TypeError):
                continue
        return ids

    def categories_filter(self, queryset, name, value):
        if not value:
            return queryset

        parsed_ids = self._parse_int_ids(value)
        if not parsed_ids:
            return queryset

        category_rows = Category.objects.filter(id__in=parsed_ids).values_list('id', 'name')
        other_category_ids = [category_id for category_id, name in category_rows if name == '기타']
        normal_category_ids = [category_id for category_id, name in category_rows if name != '기타']

        conditions = Q()
        if normal_category_ids:
            conditions |= Q(category_id__in=normal_category_ids)
        if other_category_ids:
            conditions |= Q(
                category_id__in=other_category_ids,
                category_etc__isnull=False,
                category_etc__gt='',
            )

        return queryset.filter(conditions) if conditions else queryset

    def models_filter(self, queryset, name, value):
        if not value:
            return queryset

        parsed_ids = self._parse_int_ids(value)
        if not parsed_ids:
            return queryset

        model_rows = AiModel.objects.filter(id__in=parsed_ids).values_list('id', 'name')
        other_model_ids = [model_id for model_id, name in model_rows if name == '기타']
        normal_model_ids = [model_id for model_id, name in model_rows if name != '기타']

        conditions = Q()
        if normal_model_ids:
            conditions |= Q(model_id__in=normal_model_ids)
        if other_model_ids:
            conditions |= Q(
                model_id__in=other_model_ids,
                model_etc__isnull=False,
                model_etc__gt='',
            )

        return queryset.filter(conditions) if conditions else queryset

    def platforms_filter(self, queryset, name, value):
        if not value:
            return queryset

        valid_ids = self._parse_int_ids(value)

        if not valid_ids:
            return queryset

        return queryset.filter(platform_id__in=valid_ids)
