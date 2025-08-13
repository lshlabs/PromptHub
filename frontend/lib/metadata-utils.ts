/**
 * 메타데이터 변환 유틸리티
 *
 * 플랫폼, 모델, 카테고리의 ID와 Name 간 변환을 처리하는 공통 로직
 * 백엔드에서는 ID로 처리하지만 프론트엔드에서는 Name으로 표시
 */

import type { Platform, Model, Category } from '@/types/api'

// 메타데이터 매니저 클래스
export class MetadataManager {
  private platforms: Platform[] = []
  private models: Model[] = []
  private categories: Category[] = []

  // 데이터 설정
  setPlatforms(platforms: Platform[]) {
    this.platforms = platforms
  }

  setModels(models: Model[]) {
    this.models = models
  }

  setCategories(categories: Category[]) {
    this.categories = categories
  }

  // 모든 데이터 한번에 설정
  setAllMetadata(platforms: Platform[], models: Model[], categories: Category[]) {
    this.setPlatforms(platforms)
    this.setModels(models)
    this.setCategories(categories)
  }

  // ID → Name 변환
  getPlatformName(id: number): string {
    const platform = this.platforms.find(p => p.id === id)
    return platform?.name || '알 수 없는 플랫폼'
  }

  getModelName(id: number): string {
    const model = this.models.find(m => m.id === id)
    return model?.name || '알 수 없는 모델'
  }

  getCategoryName(id: number): string {
    const category = this.categories.find(c => c.id === id)
    return category?.name || '알 수 없는 카테고리'
  }

  // Name → ID 변환
  getPlatformId(name: string): number | null {
    const platform = this.platforms.find(p => p.name === name)
    return platform?.id || null
  }

  getModelId(name: string): number | null {
    const model = this.models.find(m => m.name === name)
    return model?.id || null
  }

  getCategoryId(name: string): number | null {
    const category = this.categories.find(c => c.name === name)
    return category?.id || null
  }

  // 특정 플랫폼의 모델들 가져오기
  getModelsByPlatformId(platformId: number): Model[] {
    return this.models.filter(m => m.platform === platformId)
  }

  getModelsByPlatformName(platformName: string): Model[] {
    const platformId = this.getPlatformId(platformName)
    return platformId ? this.getModelsByPlatformId(platformId) : []
  }

  // 게터 메서드
  getAllPlatforms(): Platform[] {
    return this.platforms
  }

  getAllModels(): Model[] {
    return this.models
  }

  getAllCategories(): Category[] {
    return this.categories
  }

  // 모델 표시명 결정 (기타 모델 처리 포함)
  getModelDisplayName(modelId: number | null, modelEtc: string): string {
    if (!modelId) {
      return modelEtc || '기타'
    }

    const modelName = this.getModelName(modelId)

    // 모델명이 '기타'이고 modelEtc가 있으면 modelEtc 사용
    if (modelName === '기타' && modelEtc) {
      return modelEtc
    }

    return modelName
  }

  // 카테고리 표시명 결정 (기타 카테고리 처리 포함)
  getCategoryDisplayName(categoryId: number, categoryEtc: string): string {
    const categoryName = this.getCategoryName(categoryId)

    // 카테고리명이 '기타'이고 categoryEtc가 있으면 categoryEtc 사용
    if (categoryName === '기타' && categoryEtc) {
      return categoryEtc
    }

    return categoryName
  }
}

// 싱글톤 인스턴스
export const metadataManager = new MetadataManager()

// Hook 스타일 함수들 (React 컴포넌트에서 사용)
export const useMetadataUtils = () => {
  return {
    // ID → Name 변환
    getPlatformName: (id: number) => metadataManager.getPlatformName(id),
    getModelName: (id: number) => metadataManager.getModelName(id),
    getCategoryName: (id: number) => metadataManager.getCategoryName(id),

    // Name → ID 변환
    getPlatformId: (name: string) => metadataManager.getPlatformId(name),
    getModelId: (name: string) => metadataManager.getModelId(name),
    getCategoryId: (name: string) => metadataManager.getCategoryId(name),

    // 표시명 결정
    getModelDisplayName: (modelId: number | null, modelEtc = '') =>
      metadataManager.getModelDisplayName(modelId, modelEtc),
    getCategoryDisplayName: (categoryId: number, categoryEtc = '') =>
      metadataManager.getCategoryDisplayName(categoryId, categoryEtc),

    // 데이터 설정
    setMetadata: (platforms: Platform[], models: Model[], categories: Category[]) =>
      metadataManager.setAllMetadata(platforms, models, categories),

    // 관련 데이터 가져오기
    getModelsByPlatformId: (platformId: number) =>
      metadataManager.getModelsByPlatformId(platformId),
    getModelsByPlatformName: (platformName: string) =>
      metadataManager.getModelsByPlatformName(platformName),
  }
}

// 편의 함수들
export const convertIdsToNames = (
  platformId: number,
  modelId: number | null,
  categoryId: number,
  modelEtc = '',
  categoryEtc = '',
) => {
  return {
    platformName: metadataManager.getPlatformName(platformId),
    modelName: metadataManager.getModelDisplayName(modelId, modelEtc),
    categoryName: metadataManager.getCategoryDisplayName(categoryId, categoryEtc),
  }
}

export const convertNamesToIds = (
  platformName: string,
  modelName: string,
  categoryName: string,
) => {
  return {
    platformId: metadataManager.getPlatformId(platformName),
    modelId: metadataManager.getModelId(modelName),
    categoryId: metadataManager.getCategoryId(categoryName),
  }
}
