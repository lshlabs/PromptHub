import { PostEdit } from '@/types/datatype_sample'
import { samplePostDetails } from './SamplePostDetail'

export const samplePostEdits: PostEdit[] = samplePostDetails.map(item => ({
  id: item.id,
  title: item.title,
  satisfaction: item.satisfaction,
  platform: item.platform,
  model: item.model,
  model_etc: item.model_etc ?? '',
  category: item.category,
  category_etc: item.category_etc ?? '',
  tags: item.tags,
  prompt: item.prompt,
  aiResponse: item.aiResponse,
  additionalOpinion: item.additionalOpinion ?? '',
}))
