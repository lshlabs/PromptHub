from django.db.models import Q, Case, When, Value, IntegerField, F

from posts.models import AiModel


class ModelSuggestService:
    @staticmethod
    def suggest_models(query: str, platform_id=None, limit: int = 10):
        normalized_query = (query or "").strip()
        if not normalized_query:
            return []

        queryset = AiModel.objects.select_related('platform').filter(
            is_active=True,
            platform__is_active=True,
        )

        if platform_id is not None:
            queryset = queryset.filter(platform_id=platform_id)

        queryset = queryset.filter(
            Q(name__icontains=normalized_query)
            | Q(slug__icontains=normalized_query)
            | Q(platform__name__icontains=normalized_query)
            | Q(platform__slug__icontains=normalized_query)
        )

        score = (
            Case(When(name__istartswith=normalized_query, then=Value(300)), default=Value(0), output_field=IntegerField())
            + Case(When(slug__istartswith=normalized_query, then=Value(250)), default=Value(0), output_field=IntegerField())
            + Case(When(platform__name__istartswith=normalized_query, then=Value(200)), default=Value(0), output_field=IntegerField())
            + Case(When(platform__slug__istartswith=normalized_query, then=Value(180)), default=Value(0), output_field=IntegerField())
            + Case(When(name__icontains=normalized_query, then=Value(100)), default=Value(0), output_field=IntegerField())
            + Case(When(slug__icontains=normalized_query, then=Value(80)), default=Value(0), output_field=IntegerField())
            + Case(When(platform__name__icontains=normalized_query, then=Value(70)), default=Value(0), output_field=IntegerField())
            + Case(When(platform__slug__icontains=normalized_query, then=Value(60)), default=Value(0), output_field=IntegerField())
        )

        sort_key = Case(
            When(sort_order=0, then=Value(999999)),
            default=F('sort_order'),
            output_field=IntegerField(),
        )

        results = list(
            queryset.annotate(
                score=score,
                sort_key=sort_key,
            ).order_by('-score', 'sort_key', 'name')[:limit]
        )

        return [
            {
                'id': model.id,
                'name': model.name,
                'slug': model.slug,
                'platform': {
                    'id': model.platform.id,
                    'name': model.platform.name,
                    'slug': model.platform.slug,
                },
            }
            for model in results
        ]
