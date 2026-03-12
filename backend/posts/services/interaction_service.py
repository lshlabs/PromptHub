from posts.models import Post, PostInteraction


class InteractionService:
    @staticmethod
    def toggle_like(user, post: Post) -> dict:
        interaction, _ = PostInteraction.objects.get_or_create(
            user=user,
            post=post,
            defaults={'is_liked': False, 'is_bookmarked': False},
        )
        interaction.is_liked = not interaction.is_liked
        interaction.save()
        post.refresh_from_db()
        return {
            'is_liked': interaction.is_liked,
            'like_count': post.like_count,
        }

    @staticmethod
    def toggle_bookmark(user, post: Post) -> dict:
        interaction, _ = PostInteraction.objects.get_or_create(
            user=user,
            post=post,
            defaults={'is_liked': False, 'is_bookmarked': False},
        )
        interaction.is_bookmarked = not interaction.is_bookmarked
        interaction.save()
        post.refresh_from_db()
        return {
            'is_bookmarked': interaction.is_bookmarked,
            'bookmark_count': post.bookmark_count,
        }
