import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { PostCard } from '@/components/common/post-card'
import { useState, useEffect } from 'react'
import { trendingApi } from '@/lib/api'
import type { PostCard as ApiPostCard, TrendingModelInfo } from '@/types/api'

interface PostsListProps {
  selectedModel: string | null
  setSelectedModel: (model: string | null) => void
}

export default function PostsList({ selectedModel, setSelectedModel }: PostsListProps) {
  const [posts, setPosts] = useState<ApiPostCard[]>([])
  const [modelInfo, setModelInfo] = useState<TrendingModelInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 선택된 모델이 변경될 때마다 관련 게시글 조회
  useEffect(() => {
    if (!selectedModel) {
      setPosts([])
      setModelInfo(null)
      setError(null)
      return
    }

    const fetchModelPosts = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await trendingApi.getTrendingModelPosts(selectedModel, {
          page: 1,
          page_size: 20,
          sort: 'latest',
        })

        setPosts(response.results)
        setModelInfo(response.trending_model)
      } catch (err) {
        console.error('트렌딩 모델 게시글 조회 실패:', err)
        setError('게시글을 불러오는데 실패했습니다.')
        setPosts([])
        setModelInfo(null)
      } finally {
        setLoading(false)
      }
    }

    fetchModelPosts()
  }, [selectedModel])

  return (
    <>
      {selectedModel && (
        <Card className="border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{selectedModel} 관련 게시물</h3>
                {modelInfo && (
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <span>{modelInfo.provider}</span>
                    <span>•</span>
                    <span>순위 #{modelInfo.rank}</span>
                    <span>•</span>
                    <span>{modelInfo.related_posts_count}개 게시글</span>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedModel(null)
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}>
                선택 해제
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-orange-600"></div>
                <div className="text-gray-600">게시글을 불러오는 중...</div>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <div className="mb-2 text-red-600">{error}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedModel) {
                      // 재시도 로직 - useEffect가 다시 실행되도록 강제
                      setError(null)
                      setLoading(true)
                    }
                  }}>
                  다시 시도
                </Button>
              </div>
            ) : posts.length > 0 ? (
              posts.map(item => (
                <PostCard
                  key={item.id}
                  data={item}
                  onClick={() => {
                    window.location.href = `/post/${item.id}`
                  }}
                />
              ))
            ) : (
              <div className="py-8 text-center">
                <div className="mb-2 text-gray-500">
                  {modelInfo?.related_model
                    ? `${selectedModel} 모델로 작성된 게시물이 없습니다.`
                    : `${selectedModel} 모델이 연결되지 않았습니다.`}
                </div>
                <div className="text-sm text-gray-400">
                  {modelInfo?.related_model
                    ? '다른 모델을 선택해보세요.'
                    : '관리자가 관련 모델을 설정해야 합니다.'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedModel && (
        <Card className="border-0 bg-white/70 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-red-100 to-orange-100">
              <MessageCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-700">모델을 선택해주세요</h3>
            <p className="text-gray-500">
              위의 카테고리에서 관심있는 AI 모델을 클릭하면 관련 게시물을 확인할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
