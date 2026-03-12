from django.db.models import Q

from posts.models import AiModel


class ModelSuggestService:
    @staticmethod
    def suggest_models(query: str, platform_id=None, limit: int = 10):
        q_lower = query.lower()
        queryset = AiModel.objects.select_related('platform').filter(
            is_active=True,
            platform__is_active=True,
        )

        if platform_id is not None:
            queryset = queryset.filter(platform_id=platform_id)

        queryset = queryset.filter(
            Q(name__icontains=query)
            | Q(slug__icontains=q_lower)
            | Q(platform__name__icontains=query)
            | Q(platform__slug__icontains=q_lower)
        )

        def compute_score(model):
            name = model.name or ''
            slug = model.slug or ''
            platform_name = model.platform.name or ''
            platform_slug = model.platform.slug or ''
            name_lower = name.lower()
            slug_lower = slug.lower()
            platform_name_lower = platform_name.lower()
            platform_slug_lower = platform_slug.lower()

            score = 0.0
            if name_lower.startswith(q_lower):
                score += 3.0
            if slug_lower.startswith(q_lower):
                score += 2.5
            if platform_name_lower.startswith(q_lower):
                score += 2.0
            if platform_slug_lower.startswith(q_lower):
                score += 1.8
            if q_lower in name_lower:
                score += 1.0
            if q_lower in slug_lower:
                score += 0.8
            if q_lower in platform_name_lower:
                score += 0.7
            if q_lower in platform_slug_lower:
                score += 0.6
            return score

        results = sorted(
            queryset,
            key=lambda model: (-compute_score(model), model.sort_order, model.name.lower()),
        )[:limit]

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
