/**
 * Edit Post 페이지
 *
 * 게시글 수정 페이지
 */

'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { Save, X } from 'lucide-react'
import EditPostMetaSection from '@/components/edit-post/edit-post-meta-section'
import EditPostContentSection from '@/components/edit-post/edit-post-content-section'
import { GoBackButton } from '@/components/common/go-back-button'
import CustomButton from '@/components/common/custom-button'
import { postsApi } from '@/lib/api/posts'
import type { PostCreateRequest, PostUpdateRequest, PostEditData } from '@/types/api'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { getPlatformName, getModelName, getCategoryName, getModelsByPlatform } from '@/lib/utils'

// 백엔드 API 응답과 일치하는 타입 정의
// PostEditData 인터페이스는 @/lib/api에서 import됨

export default function EditPost({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15: params를 React.use()로 unwrap
  const { id } = use(params)
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  // 전역 스타일 추가
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      input:focus, textarea:focus, select:focus, button:focus {
        outline: none !important;
        box-shadow: none !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // 기본 포스트 데이터
  const defaultPost: PostEditData = {
    id: 1,
    title: '새 포스트',
    satisfaction: 0,
    platformId: 1,
    modelId: 1,
    modelEtc: '',
    categoryId: 1,
    categoryEtc: '',
    tags: [],
    prompt: '',
    aiResponse: '',
    additionalOpinion: '',
  }

  // 상태 관리
  const [title, setTitle] = useState('')
  const [satisfaction, setSatisfaction] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [additionalOpinion, setAdditionalOpinion] = useState('')

  // 접기/펼치기 상태
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // 플랫폼 및 모델 관련 상태 (백엔드와 동일한 이름 사용)
  const [platform, setPlatform] = useState('OpenAI')
  const [model, setModel] = useState('GPT-5')
  const [model_etc, setModelEtc] = useState('')
  const [model_detail, setModelDetail] = useState('')
  const [showModelEtcInput, setShowModelEtcInput] = useState(false)

  // 카테고리 관련 상태
  const [category, setCategory] = useState('기타')
  const [category_etc, setCategoryEtc] = useState('')
  const [showCategoryEtcInput, setShowCategoryEtcInput] = useState(false)

  // 태그 관련 상태
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  // 사용자 변경 감지 플래그
  const [isUserChange, setIsUserChange] = useState(false)

  // 저장 중 상태
  const [isSaving, setIsSaving] = useState(false)

  // 메타데이터 상태 - 독립적인 로딩 상태 관리
  const [platformsData, setPlatformsData] = useState<any[]>([])
  const [modelsData, setModelsData] = useState<any[]>([])
  const [categoriesData, setCategoriesData] = useState<any[]>([])
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)
  const [metadataError, setMetadataError] = useState<string | null>(null)

  // 게시글 데이터 로딩 상태
  const [isLoadingPost, setIsLoadingPost] = useState(true)
  const [postError, setPostError] = useState<string | null>(null)

  // 현재 게시글의 원본 ID 정보 저장
  const [originalPlatformId, setOriginalPlatformId] = useState<number | null>(null)
  const [originalModelId, setOriginalModelId] = useState<number | null | undefined>(null)
  const [originalCategoryId, setOriginalCategoryId] = useState<number | null>(null)

  // 독립적인 메타데이터 로드
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setMetadataError(null)
        const [platformsRes, modelsRes, categoriesRes] = await Promise.all([
          postsApi.getPlatforms(),
          postsApi.getModels(),
          postsApi.getCategories(),
        ])

        setPlatformsData(platformsRes.data || [])
        setModelsData(modelsRes.data || [])
        setCategoriesData(categoriesRes.data || [])
      } catch (error) {
        console.error('메타데이터 로드 실패:', error)
        setMetadataError('메타데이터를 불러오는데 실패했습니다. 기본값으로 진행합니다.')

        // 실패 시 기본 메타데이터 사용 (최소한의 기능 제공)
        setPlatformsData([
          { id: 1, name: 'OpenAI' },
          { id: 2, name: 'Google' },
          { id: 3, name: 'Anthropic' },
          { id: 99, name: '기타' },
        ])
        setModelsData([
          { id: 1, name: 'o3', platform: 1, platform_name: 'OpenAI' },
          { id: 2, name: 'Gemini 2.5 Pro', platform: 2, platform_name: 'Google' },
          { id: 3, name: 'Claude 3.5 Sonnet', platform: 3, platform_name: 'Anthropic' },
          { id: 99, name: '기타', platform: 99, platform_name: '기타' },
        ])
        setCategoriesData([
          { id: 1, name: '창작' },
          { id: 2, name: '분석' },
          { id: 3, name: '코딩' },
          { id: 99, name: '기타' },
        ])
      } finally {
        setIsLoadingMetadata(false)
      }
    }

    loadMetadata()
  }, [])

  // 독립적인 게시글 데이터 로드 - 메타데이터와 분리
  useEffect(() => {
    const loadPostData = async () => {
      if (!id) return
      // 메타데이터가 준비되기 전에는 표시명 계산을 보류
      if (
        isLoadingMetadata ||
        platformsData.length === 0 ||
        modelsData.length === 0 ||
        categoriesData.length === 0
      ) {
        return
      }

      try {
        setPostError(null)
        setIsLoadingPost(true)

        // 실제 API에서 게시글 데이터 가져오기
        const response = await postsApi.getPost(Number(id))
        const postDetail = response.data

        // PostDetail을 PostEditData로 변환
        const post: PostEditData = {
          id: postDetail.id,
          title: postDetail.title,
          platformId: postDetail.platformId,
          modelId: postDetail.modelId,
          categoryId: postDetail.categoryId,
          modelEtc: postDetail.modelEtc,
          categoryEtc: postDetail.categoryEtc,
          satisfaction: postDetail.satisfaction,
          prompt: postDetail.prompt,
          aiResponse: postDetail.aiResponse,
          additionalOpinion: postDetail.additionalOpinion,
          tags: postDetail.tags,
        }

        console.log('EditPost API Data Load Debug:', post)

        // 백엔드에서 ID 기반으로 반환하므로 표시명으로 변환
        setTitle(post.title || '')
        setSatisfaction(Number(post.satisfaction) || 0)
        setPrompt(post.prompt || '')
        setAiResponse(post.aiResponse || '')
        setAdditionalOpinion(post.additionalOpinion || '')

        // ID를 기반으로 표시명 설정
        const platformName = getPlatformName(post.platformId, platformsData)
        const modelName = getModelName(post.modelId, post.modelEtc || null, modelsData)
        const categoryName = getCategoryName(
          post.categoryId,
          post.categoryEtc || null,
          categoriesData,
        )
        const modelDetailFromApi = (
          (postDetail as any).model_detail ||
          (postDetail as any).modelDetail ||
          ''
        ).toString()

        setPlatform(platformName)

        // model_etc가 있거나 모델이 '기타'이면 model_etc 필드 표시
        if (post.modelEtc && post.modelEtc.trim()) {
          setModel('기타')
          setModelEtc(post.modelEtc)
          setShowModelEtcInput(true)
          setModelDetail('')
        } else if (modelName === '기타') {
          setModel('기타')
          setModelEtc('')
          setShowModelEtcInput(true)
          setModelDetail('')
        } else {
          // 기본 모델 선택 상태: 상세모델 입력을 열고 기존 상세모델이 있으면 반영
          setModel(modelName)
          setModelEtc('')
          // model_detail이 기본 모델명과 다를 때만 설정, 같으면 빈 문자열
          setModelDetail(
            modelDetailFromApi && modelDetailFromApi !== modelName ? modelDetailFromApi : '',
          )
          setShowModelEtcInput(true)
        }

        setCategory(categoryName)

        // category_etc가 있거나 카테고리가 '기타'이면 category_etc 필드 표시
        if (post.categoryEtc && post.categoryEtc.trim()) {
          setCategory('기타')
          setCategoryEtc(post.categoryEtc)
          setShowCategoryEtcInput(true)
        } else if (categoryName === '기타') {
          setCategory('기타')
          setCategoryEtc('')
          setShowCategoryEtcInput(true)
        } else {
          setCategory(categoryName)
          setCategoryEtc('')
          setShowCategoryEtcInput(false)
        }

        setTags(post.tags || [])

        // 원본 ID 정보 저장 (수정 시 사용)
        setOriginalPlatformId(post.platformId)
        setOriginalModelId(post.modelId)
        setOriginalCategoryId(post.categoryId)
      } catch (error) {
        console.error('게시글 데이터 로딩 실패:', error)
        setPostError('게시글을 불러오는데 실패했습니다.')
      } finally {
        setIsLoadingPost(false)
      }
    }

    loadPostData()
  }, [id, platformsData, modelsData, categoriesData, isLoadingMetadata])

  // 단순화된 플랫폼 변경 핸들러 - 백엔드에서 기본값 처리
  const handlePlatformChange = async (newPlatform: string) => {
    setIsUserChange(true)
    setPlatform(newPlatform)

    if (newPlatform === '기타') {
      // 플랫폼이 '기타'인 경우 "기타" 모델로 설정 (ID: 43)
      // 기타 플랫폼의 기타 모델을 찾아서 설정
      const 기타_플랫폼 = platformsData.find(p => p.name === '기타')
      if (기타_플랫폼) {
        const 기타_모델 = modelsData.find(m => m.platform === 기타_플랫폼.id && m.name === '기타')
        if (기타_모델) {
          setModel('기타')
          setShowModelEtcInput(true)
          setModelEtc('')
        }
      }
    } else {
      // 일반 플랫폼인 경우 백엔드에서 기본값 가져오기
      try {
        const platformData = platformsData.find(p => p.name === newPlatform)
        if (platformData) {
          const response = await postsApi.getPlatformModels(platformData.id)
          const { default_model } = response.data

          if (default_model) {
            setModel(default_model.name)
            // 상세모델 입력은 자동 채우지 않음 (사용자 직접 입력)
            setShowModelEtcInput(true)
            setModelEtc('')
            setModelDetail('')
          }
        }
      } catch (error) {
        console.error('플랫폼 모델 로딩 실패:', error)
        // 에러 시 기본값 설정
        setModel('GPT-5')
        setShowModelEtcInput(true)
        setModelEtc('')
        // 상세모델 자동 채우지 않음
        setModelDetail('')
      }
    }
  }

  // 단순화된 모델 변경 핸들러
  const handleModelChange = (newModel: string) => {
    setIsUserChange(true)
    setModel(newModel)

    // 어떤 기본 모델을 선택해도 상세 모델 입력을 열지만 기존 model_detail 유지
    if (newModel === '기타') {
      setShowModelEtcInput(true)
      setModelEtc('')
      setModelDetail('')
    } else {
      setShowModelEtcInput(true)
      setModelEtc('')
      // 새로운 모델 선택 시에만 model_detail을 빈 문자열로 초기화
      // 기존 값이 있다면 유지하되, 사용자가 직접 변경할 수 있도록 함
      if (!model_detail || model_detail === model) {
        setModelDetail('')
      }
    }
  }

  // 단순화된 카테고리 변경 핸들러
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)

    if (newCategory === '기타') {
      setShowCategoryEtcInput(true)
    } else {
      setShowCategoryEtcInput(false)
      setCategoryEtc('')
    }
  }

  // 카테고리 직접 입력 필드 초기화
  useEffect(() => {
    if (!showCategoryEtcInput && category_etc) {
      setCategoryEtc('')
    }
  }, [showCategoryEtcInput, category_etc])

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast({
        title: '로그인 필요',
        description: '게시글을 수정하려면 로그인이 필요합니다.',
        variant: 'destructive',
      })
      return
    }

    // 기본적인 필수 필드 검증만 수행 (나머지는 백엔드에서 처리)
    if (!title.trim()) {
      toast({
        title: '입력 오류',
        description: '제목을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (!prompt.trim()) {
      toast({
        title: '입력 오류',
        description: '프롬프트를 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (!aiResponse.trim()) {
      toast({
        title: '입력 오류',
        description: 'AI 응답을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSaving(true)

      // 플랫폼/모델/카테고리 이름을 ID로 변환
      const platformData = platformsData.find(p => p.name === platform)
      const modelData = modelsData.find(m => m.name === model && m.platform === platformData?.id)
      const categoryData = categoriesData.find(c => c.name === category)

      if (!platformData) {
        toast({
          title: '입력 오류',
          description: '유효하지 않은 플랫폼입니다.',
          variant: 'destructive',
        })
        return
      }

      if (!categoryData) {
        toast({
          title: '입력 오류',
          description: '유효하지 않은 카테고리입니다.',
          variant: 'destructive',
        })
        return
      }

      // 백엔드로 전송할 데이터 구성
      // 상세모델 저장 규칙 (생성 다이얼로그와 동일)
      const trimmedEtc = (model_etc || '').trim()
      const trimmedDetail = (model_detail || '').trim()
      const baseName = model
      const detailForSave =
        baseName !== '기타' && trimmedDetail && trimmedDetail !== baseName ? trimmedDetail : ''

      const updateData: PostUpdateRequest = {
        id: Number(id),
        title: title.trim(),
        satisfaction: satisfaction,
        platform: platformData.id,
        model: modelData?.id || null, // 기본 모델 ID 저장
        model_etc: baseName === '기타' ? trimmedEtc : '',
        // @ts-ignore: 백엔드에서 수용
        model_detail: baseName !== '기타' ? detailForSave : '',
        category: categoryData.id,
        category_etc: category === '기타' ? category_etc.trim() : '',
        tags: tags,
        prompt: prompt.trim(),
        ai_response: aiResponse.trim(),
        additional_opinion: additionalOpinion.trim(),
      }

      console.log('EditPost Save Debug:', {
        updateData,
        platformsData: platformsData.length,
        modelsData: modelsData.length,
        categoriesData: categoriesData.length,
      })

      // 백엔드에서 모든 유효성 검사와 비즈니스 로직을 처리
      await postsApi.updatePost(Number(id), updateData)

      toast({
        title: '저장 완료',
        description: '게시글이 성공적으로 수정되었습니다.',
      })

      // 게시글 상세 페이지로 이동
      router.push(`/post/${id}`)
    } catch (error) {
      console.error('게시글 수정 실패:', error)

      // 백엔드에서 반환한 에러 메시지를 그대로 표시
      const errorMessage = error instanceof Error ? error.message : '게시글 수정에 실패했습니다.'
      toast({
        title: '저장 실패',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.history.back()
  }

  // 로딩 상태 UI
  if (isLoadingPost || isLoadingMetadata) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
              <p className="text-gray-600">게시글을 불러오는 중입니다...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태 UI
  if (postError && !title) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="container mx-auto px-2 py-2 pb-4 sm:px-4 sm:py-4">
            <div className="mx-auto max-w-7xl">
              <div className="px-2 py-2">
                <div className="flex justify-start pb-2">
                  <GoBackButton />
                </div>
                <div className="flex min-h-[400px] items-center justify-center">
                  <div className="text-center">
                    <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
                      <div className="mb-4 text-red-600">
                        <svg
                          className="mx-auto h-12 w-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-red-800">데이터 로딩 실패</h3>
                      <p className="mb-4 text-red-700">{postError}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700">
                        다시 시도
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="container mx-auto px-2 py-2 pb-4 sm:px-4 sm:py-4">
          <div className="mx-auto max-w-7xl">
            <div className="px-2 py-2">
              {/* 목록으로 가기 버튼 */}
              <div className="flex justify-start pb-2">
                <GoBackButton />
              </div>

              {/* 메타데이터 에러 알림 */}
              {metadataError && (
                <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-center">
                    <div className="mr-3 text-yellow-600">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-yellow-800">{metadataError}</p>
                  </div>
                </div>
              )}

              {/* 게시글 에러 알림 */}
              {postError && title && (
                <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-center">
                    <div className="mr-3 text-orange-600">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-orange-800">
                      {postError} 샘플 데이터를 사용하여 편집이 가능합니다.
                    </p>
                  </div>
                </div>
              )}

              {/* 메인 포스트 카드 - 수정 모드 */}
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                {/* 상단 그라데이션 바 */}
                <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                <div className="p-6">
                  {/* 메타 섹션 */}
                  <EditPostMetaSection
                    satisfaction={satisfaction}
                    platform={platform}
                    model={model}
                    model_etc={model_etc}
                    model_detail={model_detail}
                    category={category}
                    category_etc={category_etc}
                    tags={tags}
                    tagInput={newTag}
                    activeSection={expandedSection}
                    platformsData={platformsData}
                    modelsData={modelsData}
                    categoriesData={categoriesData}
                    onSatisfactionChange={setSatisfaction}
                    onPlatformChange={handlePlatformChange}
                    onModelChange={handleModelChange}
                    onModelEtcValueChange={setModelEtc}
                    onModelDetailValueChange={setModelDetail}
                    onCategoryChange={handleCategoryChange}
                    onCategoryEtcValueChange={setCategoryEtc}
                    onTagsChange={setTags}
                    onTagInputChange={setNewTag}
                    onActiveSectionChange={setExpandedSection}
                    onUserInteraction={setIsUserChange}
                    showModelEtcInput={showModelEtcInput}
                    showCategoryEtcInput={showCategoryEtcInput}
                  />

                  {/* 본문 내용 수정 */}
                  <EditPostContentSection
                    title={title}
                    prompt={prompt}
                    aiResponse={aiResponse}
                    additionalOpinion={additionalOpinion}
                    onTitleChange={setTitle}
                    onPromptChange={setPrompt}
                    onAiResponseChange={setAiResponse}
                    onAdditionalOpinionChange={setAdditionalOpinion}
                  />

                  {/* 액션 버튼 */}
                  <div className="flex items-center justify-end border-t border-gray-100 pt-6">
                    <div className="flex gap-3">
                      <CustomButton
                        color="flat"
                        border="none"
                        shape="rounded"
                        size="responsive"
                        icon={<X className="h-4 w-4" />}
                        onClick={handleCancel}
                        className="text-gray-600">
                        취소
                      </CustomButton>
                      <CustomButton
                        color="gradient"
                        border="none"
                        shape="rounded"
                        size="responsive"
                        icon={<Save className="h-4 w-4" />}
                        onClick={handleSave}
                        disabled={isSaving}>
                        {isSaving ? '저장 중...' : '저장'}
                      </CustomButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
