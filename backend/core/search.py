from django.db.models import Q


class SearchManager:
    @staticmethod
    def search_posts(queryset, query, search_type='all'):
        if not query:
            return queryset

        normalized_type = (search_type or 'all').strip().lower()

        title_query = Q(title__icontains=query)
        author_query = Q(author__username__icontains=query)
        content_query = (
            Q(prompt__icontains=query)
            | Q(ai_response__icontains=query)
            | Q(additional_opinion__icontains=query)
            | Q(tags__icontains=query)
        )

        if normalized_type == 'title':
            return queryset.filter(title_query)

        if normalized_type == 'content':
            return queryset.filter(content_query)

        if normalized_type == 'author':
            return queryset.filter(author_query)

        if normalized_type in {'title_content', 'all'}:
            if normalized_type == 'all':
                return queryset.filter(title_query | content_query | author_query)
            return queryset.filter(title_query | content_query)

        return queryset.filter(title_query | content_query | author_query)
