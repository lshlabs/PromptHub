"use client"

import { Button } from "@/components/ui/button"
import { Filter, Search } from "lucide-react"

const categories = ["전체", "마케팅", "개발", "창작", "분석", "교육", "기타"]
const models = ["전체", "GPT-4", "GPT-3.5", "Claude-3.5", "Gemini", "기타"]
const sortOptions = ["인기순", "최신순", "평점순"]

interface CommunityFiltersProps {
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  sortBy: string
  setSortBy: (sort: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  showFilters: boolean
  setShowFilters: (show: boolean) => void
}

export function CommunityFilters({
  selectedCategory,
  setSelectedCategory,
  selectedModel,
  setSelectedModel,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
}: CommunityFiltersProps) {
  return (
    <div className="space-y-4 w-full">
      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="프롬프트 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex justify-start">
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          필터 {showFilters ? "숨기기" : "보기"}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs px-3 py-1 h-8"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Model Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">모델</label>
            <div className="flex flex-wrap gap-2">
              {models.map((model) => (
                <Button
                  key={model}
                  variant={selectedModel === model ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedModel(model)}
                  className="text-xs px-3 py-1 h-8"
                >
                  {model}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">정렬</label>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <Button
                  key={option}
                  variant={sortBy === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(option)}
                  className="text-xs px-3 py-1 h-8"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
