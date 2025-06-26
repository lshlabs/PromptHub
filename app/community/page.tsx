"use client"

import { useState } from "react"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { CommunityHeader } from "@/components/community/community-header"
import { CommunityFilters } from "@/components/community/community-filters"
import { PostList } from "@/components/community/post-list"
import { CreatePostDialog } from "@/components/community/create-post-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [selectedModel, setSelectedModel] = useState("전체")
  const [sortBy, setSortBy] = useState("인기순")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CommunityHeader />

        {/* Filters and Create Button Container */}
        <div className="mb-8 space-y-6">
          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:items-start lg:gap-6">
            <div className="flex-1">
              <CommunityFilters
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                sortBy={sortBy}
                setSortBy={setSortBy}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
              />
            </div>
            <div className="flex-shrink-0 pt-1">
              <Button
                onClick={() => setIsCreatePostOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Plus className="w-5 h-5" />새 리뷰 작성
              </Button>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-4">
            <CommunityFilters
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              sortBy={sortBy}
              setSortBy={setSortBy}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
            />
            <div className="flex justify-center">
              <Button
                onClick={() => setIsCreatePostOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto"
              >
                <Plus className="w-5 h-5" />새 리뷰 작성
              </Button>
            </div>
          </div>
        </div>

        <PostList
          selectedCategory={selectedCategory}
          selectedModel={selectedModel}
          sortBy={sortBy}
          searchQuery={searchQuery}
        />

        <CreatePostDialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen} />
      </main>

      <Footer />
    </div>
  )
}
