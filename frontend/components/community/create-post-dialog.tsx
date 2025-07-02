"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Star, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const categories = ["마케팅", "개발", "창작", "분석", "교육", "기타"]
const models = ["GPT-4", "GPT-3.5", "Claude-3.5", "Gemini", "기타"]
const difficulties = ["초급", "중급", "고급"]

interface CreatePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    model: "",
    difficulty: "",
    prompt: "",
    response: "",
    tags: [] as string[],
    ratings: {
      accuracy: 0,
      usefulness: 0,
      creativity: 0,
    },
  })

  const [newTag, setNewTag] = useState("")

  const handleRatingChange = (type: keyof typeof formData.ratings, rating: number) => {
    setFormData((prev) => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [type]: rating,
      },
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 여기서 실제 제출 로직 구현
    console.log("제출된 데이터:", formData)
    onOpenChange(false)
    // 폼 초기화
    setFormData({
      title: "",
      category: "",
      model: "",
      difficulty: "",
      prompt: "",
      response: "",
      tags: [],
      ratings: { accuracy: 0, usefulness: 0, creativity: 0 },
    })
  }

  const StarRating = ({
    rating,
    onRatingChange,
    label,
  }: {
    rating: number
    onRatingChange: (rating: number) => void
    label: string
  }) => {
    const [hoverRating, setHoverRating] = useState(0)

    const handleStarClick = (starIndex: number, isLeftHalf: boolean) => {
      const newRating = starIndex + (isLeftHalf ? 0.5 : 1)
      onRatingChange(newRating)
    }

    const handleStarHover = (starIndex: number, isLeftHalf: boolean) => {
      const newHoverRating = starIndex + (isLeftHalf ? 0.5 : 1)
      setHoverRating(newHoverRating)
    }

    const getStarFill = (starIndex: number) => {
      const currentRating = hoverRating || rating
      const starValue = starIndex + 1

      if (currentRating >= starValue) {
        return "full" // 완전히 채워진 별
      } else if (currentRating >= starValue - 0.5) {
        return "half" // 반만 채워진 별
      }
      return "empty" // 빈 별
    }

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((starIndex) => {
            const fillType = getStarFill(starIndex)

            return (
              <div key={starIndex} className="relative cursor-pointer group" onMouseLeave={() => setHoverRating(0)}>
                {/* 별 배경 */}
                <Star className="w-6 h-6 text-gray-300" />

                {/* 반별 (왼쪽 절반) */}
                {(fillType === "half" || fillType === "full") && (
                  <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  </div>
                )}

                {/* 완전별 (전체) */}
                {fillType === "full" && <Star className="absolute inset-0 w-6 h-6 fill-yellow-400 text-yellow-400" />}

                {/* 클릭 영역 - 왼쪽 절반 */}
                <div
                  className="absolute inset-0 w-1/2 h-full z-10"
                  onClick={() => handleStarClick(starIndex, true)}
                  onMouseEnter={() => handleStarHover(starIndex, true)}
                  title={`${starIndex + 0.5}점`}
                />

                {/* 클릭 영역 - 오른쪽 절반 */}
                <div
                  className="absolute inset-0 left-1/2 w-1/2 h-full z-10"
                  onClick={() => handleStarClick(starIndex, false)}
                  onMouseEnter={() => handleStarHover(starIndex, false)}
                  title={`${starIndex + 1}점`}
                />

                {/* 호버 효과를 위한 오버레이 */}
                <div className="absolute inset-0 rounded-full group-hover:bg-yellow-100 group-hover:bg-opacity-20 transition-colors duration-150" />
              </div>
            )
          })}
          <span className="ml-3 text-sm text-gray-600 font-medium min-w-[40px]">
            {rating > 0 ? `${rating}/5` : "0/5"}
          </span>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">프롬프트 공유하기</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="프롬프트 제목을 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">사용 모델 *</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, model: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="모델 선택" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">난이도</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="난이도 선택" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 프롬프트 */}
          <div className="space-y-2">
            <Label htmlFor="prompt">프롬프트 *</Label>
            <Textarea
              id="prompt"
              value={formData.prompt}
              onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
              placeholder="사용한 프롬프트를 입력하세요"
              className="min-h-[120px]"
              required
            />
          </div>

          {/* 응답 */}
          <div className="space-y-2">
            <Label htmlFor="response">AI 응답 *</Label>
            <Textarea
              id="response"
              value={formData.response}
              onChange={(e) => setFormData((prev) => ({ ...prev, response: e.target.value }))}
              placeholder="AI가 생성한 응답을 입력하세요"
              className="min-h-[120px]"
              required
            />
          </div>

          {/* 평가 */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">응답 평가 (0.5점 단위)</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
              <StarRating
                rating={formData.ratings.accuracy}
                onRatingChange={(rating) => handleRatingChange("accuracy", rating)}
                label="정확도"
              />
              <StarRating
                rating={formData.ratings.usefulness}
                onRatingChange={(rating) => handleRatingChange("usefulness", rating)}
                label="유용성"
              />
              <StarRating
                rating={formData.ratings.creativity}
                onRatingChange={(rating) => handleRatingChange("creativity", rating)}
                label="창의성"
              />
            </div>
          </div>

          {/* 태그 */}
          <div className="space-y-2">
            <Label htmlFor="tags">태그</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="태그 입력 후 추가 버튼 클릭"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                추가
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              프롬프트 공유하기
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
