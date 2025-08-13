/**
 * PostContentSections 컴포넌트
 *
 * 게시글 상세 페이지의 내용 섹션들
 * 프롬프트, AI 응답, 추가 의견, 태그를 포함
 */

'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Copy, Hash } from 'lucide-react'
import type { PostDetail } from '@/types/api'
import CustomBadge from '@/components/common/custom-badge'
import { useToast } from '@/hooks/use-toast'

interface PostContentSectionsProps {
  // 개별 필드 버전
  prompt?: string
  aiResponse?: string
  additionalOpinion?: string
  tags?: string[]
  className?: string
  // PostDetail 전체 객체 버전
  post?: PostDetail
}

export function PostContentSections({
  prompt,
  aiResponse,
  additionalOpinion,
  tags,
  className = '',
  post,
}: PostContentSectionsProps) {
  const { toast } = useToast()

  // post 객체가 전달되면 개별 필드 추출
  const finalPrompt = prompt || post?.prompt || ''
  const finalAiResponse = aiResponse || post?.aiResponse || ''
  const finalAdditionalOpinion = additionalOpinion || post?.additionalOpinion || ''
  const finalTags = tags || post?.tags || []

  // 클립보드 복사 함수
  const copyToClipboard = async (text: string, sectionName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: '복사 완료',
        description: `${sectionName}이(가) 클립보드에 복사되었습니다.`,
      })
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
      toast({
        title: '복사 실패',
        description: '클립보드 복사에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 프롬프트 섹션 */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="rounded-t-xl border-b border-gray-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-gray-800">프롬프트</h3>
            <CustomBadge
              variant="white"
              size="responsive"
              icon={<Copy className="mr-1 h-3 w-3" />}
              onClick={() => copyToClipboard(finalPrompt, '프롬프트')}
              className="cursor-pointer transition-colors hover:bg-gray-100">
              복사
            </CustomBadge>
          </div>
        </div>
        <div className="scrollbar-force max-h-60 overflow-y-auto p-4">
          <p className="text-gray-600">{finalPrompt}</p>
        </div>
      </div>

      {/* AI 응답 섹션 */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="rounded-t-xl border-b border-gray-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-gray-800">AI 응답</h3>
            <CustomBadge
              variant="white"
              size="responsive"
              icon={<Copy className="mr-1 h-3 w-3" />}
              onClick={() => copyToClipboard(finalAiResponse, 'AI 응답')}
              className="cursor-pointer transition-colors hover:bg-gray-100">
              복사
            </CustomBadge>
          </div>
        </div>
        <div className="scrollbar-force max-h-60 overflow-y-auto p-4">
          <p className="text-gray-600">{finalAiResponse}</p>
        </div>
      </div>

      {/* 추가 의견 섹션 */}
      {finalAdditionalOpinion && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="rounded-t-xl border-b border-gray-200 bg-blue-50 px-4 py-3">
            <h3 className="font-bold text-gray-800">추가 의견</h3>
          </div>
          <div className="scrollbar-force max-h-60 overflow-y-auto p-4">
            <p className="text-gray-600">{finalAdditionalOpinion}</p>
          </div>
        </div>
      )}

      {/* 태그 섹션 */}
      {finalTags.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="rounded-t-xl border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="font-bold text-gray-800">태그</h3>
          </div>
          <div className="p-4">
            <TooltipProvider>
              <div className="flex flex-wrap gap-2">
                {finalTags.map((tag, index) => {
                  // 모바일에서 4번째 태그부터는 +N 형태로 표시
                  const isMobileHidden = index >= 3

                  return (
                    <CustomBadge
                      key={index}
                      variant="green"
                      size="responsive"
                      icon={<Hash className="mr-1 h-3 w-3" />}
                      className={isMobileHidden ? 'hidden sm:flex' : ''}>
                      {tag}
                    </CustomBadge>
                  )
                })}

                {/* 모바일에서 4번째 태그부터 +N 표시 (툴팁 포함) */}
                {finalTags.length > 3 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CustomBadge variant="green" size="responsive" className="sm:hidden">
                        +{finalTags.length - 3}
                      </CustomBadge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {finalTags.slice(3).map((tag, index) => (
                          <CustomBadge
                            key={index}
                            variant="green"
                            size="responsive"
                            icon={<Hash className="mr-1 h-2.5 w-2.5" />}
                            className="sm:hidden">
                            {tag}
                          </CustomBadge>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  )
}
