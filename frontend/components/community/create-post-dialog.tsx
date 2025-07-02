"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Star, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const platforms = [
  { id: "chatgpt", name: "ChatGPT" },
  { id: "claude", name: "Claude" },
  { id: "gemini", name: "Gemini" },
  { id: "other", name: "기타" },
]

const models = {
  chatgpt: ["GPT-4o", "GPT-4", "GPT-3.5 Turbo"],
  claude: ["Claude 3.5 Sonnet", "Claude 4 Opus", "Claude 3 Haiku"],
  gemini: ["Gemini 2.5 Pro", "Gemini 1.5 Pro", "Gemini 1.0 Pro"],
  other: ["기타 모델"],
}

const categories = [
  "마케팅",
  "개발/프로그래밍",
  "창작/글쓰기",
  "분석/리서치",
  "교육/학습",
  "번역",
  "요약",
  "기획/아이디어",
  "직접 입력",
]

interface ReviewFormData {
  platform: string
  model: string
  promptTopic: string
  promptText: string
  aiResponse: string
  satisfaction: number
  additionalComments: string
  category: string
  customCategory: string
  tags: string[]
}

interface CreateReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateReviewDialog({ open, onOpenChange }: CreateReviewDialogProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ReviewFormData>({
    platform: "",
    model: "",
    promptTopic: "",
    promptText: "",
    aiResponse: "",
    satisfaction: 0,
    additionalComments: "",
    category: "",
    customCategory: "",
    tags: [],
  })
  const [newTag, setNewTag] = useState("")

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    console.log("리뷰 제출:", formData)
    // 실제 제출 로직 구현
    onOpenChange(false)
    setCurrentStep(1)
    setFormData({
      platform: "",
      model: "",
      promptTopic: "",
      promptText: "",
      aiResponse: "",
      satisfaction: 0,
      additionalComments: "",
      category: "",
      customCategory: "",
      tags: [],
    })
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

  const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => {
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
        return "full"
      } else if (currentRating >= starValue - 0.5) {
        return "half"
      }
      return "empty"
    }

    return (
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const fillType = getStarFill(starIndex)

          return (
            <div key={starIndex} className="relative cursor-pointer group" onMouseLeave={() => setHoverRating(0)}>
              <Star className="w-8 h-8 text-gray-300" />

              {(fillType === "half" || fillType === "full") && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                  <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                </div>
              )}

              {fillType === "full" && <Star className="absolute inset-0 w-8 h-8 fill-yellow-400 text-yellow-400" />}

              <div
                className="absolute inset-0 w-1/2 h-full z-10"
                onClick={() => handleStarClick(starIndex, true)}
                onMouseEnter={() => handleStarHover(starIndex, true)}
              />

              <div
                className="absolute inset-0 left-1/2 w-1/2 h-full z-10"
                onClick={() => handleStarClick(starIndex, false)}
                onMouseEnter={() => handleStarHover(starIndex, false)}
              />
            </div>
          )
        })}
        <span className="ml-3 text-lg font-medium">{rating > 0 ? `${rating}/5` : "0/5"}</span>
      </div>
    )
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.platform && formData.model
      case 2:
        return formData.promptTopic && formData.promptText
      case 3:
        return formData.aiResponse
      case 4:
        return formData.satisfaction > 0
      case 5:
        // 카테고리 선택이 필수 - 직접 입력인 경우 customCategory도 필요
        if (formData.category === "직접 입력") {
          return formData.customCategory.trim() !== ""
        }
        return formData.category !== ""
      default:
        return false
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>어떤 모델을 이용하셨나요?</CardTitle>
              <CardDescription>사용하신 AI 플랫폼과 모델을 선택해주세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>플랫폼 선택</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, platform: value, model: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="플랫폼을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.platform && (
                <div className="space-y-2">
                  <Label>모델 선택</Label>
                  <Select
                    value={formData.model}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="모델을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {models[formData.platform as keyof typeof models]?.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>어떤 질문을 하셨나요?</CardTitle>
              <CardDescription>프롬프트의 주제와 전체 내용을 입력해주세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="promptTopic">프롬프트 주제</Label>
                <Input
                  id="promptTopic"
                  value={formData.promptTopic}
                  onChange={(e) => setFormData((prev) => ({ ...prev, promptTopic: e.target.value }))}
                  placeholder="예: 마케팅 카피 작성, 코드 리뷰, 창작 아이디어 등"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promptText">프롬프트 전문</Label>
                <Textarea
                  id="promptText"
                  value={formData.promptText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, promptText: e.target.value }))}
                  placeholder="AI에게 입력한 프롬프트 전체를 입력해주세요"
                  className="min-h-[150px]"
                />
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>어떤 답변을 받았나요?</CardTitle>
              <CardDescription>AI가 생성한 응답을 입력해주세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="aiResponse">AI 응답 전문</Label>
                <Textarea
                  id="aiResponse"
                  value={formData.aiResponse}
                  onChange={(e) => setFormData((prev) => ({ ...prev, aiResponse: e.target.value }))}
                  placeholder="AI가 생성한 응답을 입력해주세요"
                  className="min-h-[200px]"
                />
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>AI의 응답이 만족스러웠나요?</CardTitle>
              <CardDescription>응답의 만족도를 5점 만점으로 평가해주세요. (0.5점 단위)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <StarRating
                  rating={formData.satisfaction}
                  onRatingChange={(rating) => setFormData((prev) => ({ ...prev, satisfaction: rating }))}
                />
                <p className="text-sm text-gray-600">별을 클릭하여 평가해주세요</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalComments">추가 의견 (선택사항)</Label>
                <Textarea
                  id="additionalComments"
                  value={formData.additionalComments}
                  onChange={(e) => setFormData((prev) => ({ ...prev, additionalComments: e.target.value }))}
                  placeholder="응답에 대한 추가적인 의견이나 개선점을 작성해주세요"
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        )

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>카테고리 및 태그 입력</CardTitle>
              <CardDescription>
                질문의 카테고리를 선택해주세요. 리뷰를 쉽게 찾을 수 있도록 관련 태그도 추가할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 카테고리 선택 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>질문 카테고리</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: value,
                        customCategory: value !== "직접 입력" ? "" : prev.customCategory,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리를 선택하세요" />
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

                {formData.category === "직접 입력" && (
                  <div className="space-y-2">
                    <Label htmlFor="customCategory">카테고리 직접 입력</Label>
                    <Input
                      id="customCategory"
                      value={formData.customCategory}
                      onChange={(e) => setFormData((prev) => ({ ...prev, customCategory: e.target.value }))}
                      placeholder="카테고리를 직접 입력하세요"
                    />
                  </div>
                )}
              </div>

              {/* 태그 입력 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>태그 (선택사항)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="태그를 입력하세요"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      추가
                    </Button>
                  </div>
                </div>

                {formData.tags.length > 0 && (
                  <div className="space-y-2">
                    <Label>추가된 태그</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          #{tag}
                          <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">새 리뷰 작성</DialogTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                단계 {currentStep} / {totalSteps}
              </span>
              <span>{Math.round(progress)}% 완료</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </DialogHeader>

        <div className="py-4">{renderStep()}</div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>

            {currentStep < totalSteps ? (
              <Button type="button" onClick={handleNext} disabled={!canProceed()} className="flex items-center gap-2">
                다음
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                리뷰 작성 완료!
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
