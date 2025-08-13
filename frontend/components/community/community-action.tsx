/**
 * CommunityAction 컴포넌트
 *
 * 커뮤니티 페이지의 액션 기능을 관리합니다.
 * 백엔드 core 앱의 통합 검색 API를 사용합니다.
 */

'use client'

import { useEffect, useState } from 'react'
import { Filter, Plus } from 'lucide-react'
import CustomButton from '@/components/common/custom-button'
import { SortSelector, type SortOption } from '@/components/common/sort-selector'
import { FilterPanel } from '@/components/community/community-filter'
import type { Platform, Category } from '@/types/api'

interface CommunityActionProps {
  onCreatePost: () => void
  sortBy?: SortOption
  onSortChange?: (value: SortOption) => void
  selectedCategories?: string[]
  selectedPlatforms?: string[]
  selectedModels?: string[]
  onFilterChange?: (filters: {
    categories: string[]
    platforms: string[]
    models: string[]
  }) => void
  platforms?: Platform[]
  categories?: Category[]
  models?: any[]
  loadingFilters?: boolean
  className?: string
}

export function CommunityAction({
  onCreatePost,
  sortBy = 'latest',
  onSortChange,
  selectedCategories = [],
  selectedPlatforms = [],
  selectedModels = [],
  onFilterChange,
  platforms = [],
  categories = [],
  models = [],
  loadingFilters = false,
  className = '',
}: CommunityActionProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [currentPlatformModel, setCurrentPlatformModel] = useState<string | null>(null)
  // 필터 패널 내 임시(스테이징) 상태: 버튼 클릭 시에만 최종 적용
  const [stagedCategories, setStagedCategories] = useState<string[]>(selectedCategories)
  const [stagedModels, setStagedModels] = useState<string[]>(selectedModels)

  // 패널을 열 때 현재 적용중인 필터를 스테이징 상태로 동기화
  useEffect(() => {
    if (showFilters) {
      setStagedCategories(selectedCategories)
      setStagedModels(selectedModels)
    }
  }, [showFilters])

  const handleCreatePost = () => {
    onCreatePost()
  }

  const handleSortChange = (value: SortOption) => {
    onSortChange?.(value)
    console.log('정렬 변경:', value)
  }

  const handleToggleCategory = (categoryId: string) => {
    setStagedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(c => c !== categoryId) : [...prev, categoryId],
    )
  }

  const handleTogglePlatform = (platformId: string) => {
    if (currentPlatformModel === platformId) {
      setCurrentPlatformModel(null)
    } else {
      setCurrentPlatformModel(platformId)
    }
  }

  const handleToggleModel = (modelId: string) => {
    if (!currentPlatformModel) return
    setStagedModels(prev =>
      prev.includes(modelId) ? prev.filter(m => m !== modelId) : [...prev, modelId],
    )
  }

  const handleClearAllFilters = () => {
    setCurrentPlatformModel(null)
    setStagedCategories([])
    setStagedModels([])
    // 적용 버튼과 무관하게 즉시 필터 해제 적용
    onFilterChange?.({
      categories: [],
      platforms: [],
      models: [],
    })
  }

  const hasSelectedModelsForPlatform = (platformId: string) => {
    return stagedModels.some(modelId => {
      const model = models.find(m => m.id.toString() === modelId)
      return model && model.platform?.toString() === platformId
    })
  }

  const isAllPlatformsSelected = () => {
    if (platforms.length === 0) return false
    const allPlatformModels = models.map(model => model.id.toString())
    return allPlatformModels.length > 0 && stagedModels.length === allPlatformModels.length
  }

  const isAllModelsSelected = () => {
    if (!currentPlatformModel || models.length === 0) return false
    const platformModels = models.filter(
      model => model.platform?.toString() === currentPlatformModel,
    )
    const selectedPlatformModels = stagedModels.filter(modelId => {
      const model = models.find(m => m.id.toString() === modelId)
      return model && model.platform?.toString() === currentPlatformModel
    })
    return platformModels.length > 0 && selectedPlatformModels.length === platformModels.length
  }

  const isAllCategoriesSelected = () => {
    return categories.length > 0 && stagedCategories.length === categories.length
  }

  const handleToggleAllPlatforms = () => {
    if (isAllPlatformsSelected()) {
      setStagedModels([])
    } else {
      const allModelIds = models.map(model => model.id.toString())
      setStagedModels(allModelIds)
    }
  }

  const handleToggleAllModels = () => {
    if (!currentPlatformModel || models.length === 0) return

    if (isAllModelsSelected()) {
      const remainingModels = stagedModels.filter(modelId => {
        const model = models.find(m => m.id.toString() === modelId)
        return model && model.platform?.toString() !== currentPlatformModel
      })
      setStagedModels(remainingModels)
    } else {
      const platformModels = models.filter(
        model => model.platform?.toString() === currentPlatformModel,
      )
      const newModelIds = platformModels.map(model => model.id.toString())
      const otherModels = stagedModels.filter(modelId => {
        const model = models.find(m => m.id.toString() === modelId)
        return model && model.platform?.toString() !== currentPlatformModel
      })
      setStagedModels([...otherModels, ...newModelIds])
    }
  }

  const handleToggleAllCategories = () => {
    if (isAllCategoriesSelected()) {
      setStagedCategories([])
    } else {
      const allCategoryIds = categories.map(c => c.id.toString())
      setStagedCategories(allCategoryIds)
    }
  }

  const handleApplyFilters = () => {
    onFilterChange?.({
      categories: stagedCategories,
      platforms: selectedPlatforms,
      models: stagedModels,
    })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SortSelector value={sortBy} onValueChange={handleSortChange} />
          <CustomButton
            color="flat"
            border="gray"
            shape="square"
            size="responsive"
            icon={<Filter className="h-4 w-4" />}
            className={`h-10 rounded-xl ${showFilters ? 'border-blue-300 bg-blue-50 text-blue-700' : ''}`}
            onClick={() => setShowFilters(!showFilters)}>
            <span className="ml-2 hidden sm:inline">필터 보기</span>
          </CustomButton>
        </div>
        <CustomButton
          color="gradient"
          border="none"
          shape="square"
          size="responsive"
          icon={<Plus className="h-4 w-4" />}
          className="h-10 rounded-xl"
          onClick={onCreatePost}>
          <span className="ml-2">리뷰 공유하기</span>
        </CustomButton>
      </div>

      <FilterPanel
        showFilters={showFilters}
        selectedCategories={stagedCategories}
        selectedPlatforms={selectedPlatforms}
        selectedModels={stagedModels}
        currentPlatformModel={currentPlatformModel}
        onToggleCategory={handleToggleCategory}
        onTogglePlatform={handleTogglePlatform}
        onToggleModel={handleToggleModel}
        onClearAllFilters={handleClearAllFilters}
        onClose={() => setShowFilters(false)}
        onApplyFilters={handleApplyFilters}
        onSelectAllPlatforms={handleToggleAllPlatforms}
        onSelectAllModels={handleToggleAllModels}
        onSelectAllCategories={handleToggleAllCategories}
        isAllPlatformsSelected={isAllPlatformsSelected}
        isAllModelsSelected={isAllModelsSelected}
        isAllCategoriesSelected={isAllCategoriesSelected}
        hasSelectedModelsForPlatform={hasSelectedModelsForPlatform}
        platforms={platforms}
        categories={categories}
        models={models}
        loadingFilters={loadingFilters}
      />
    </div>
  )
}
