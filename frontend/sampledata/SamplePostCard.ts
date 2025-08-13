import type { PostCard } from '@/types/api'
import { samplePostDetails } from './SamplePostDetail'

export const samplePostCards: PostCard[] = samplePostDetails.map(item => ({
  id: item.id,
  title: item.title,
  author: item.author,
  authorInitial: item.authorInitial,
  avatarSrc: item.avatarSrc,
  createdAt: item.createdAt,
  views: item.views,
  satisfaction: item.satisfaction,
  likes: item.likes,
  isliked: item.isLiked,
  platform: item.platform,
  model: item.model,
  model_etc: item.model_etc,
  category: item.category,
  category_etc: item.category_etc,
}))
