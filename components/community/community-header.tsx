import { Brain, Users, TrendingUp, Award } from "lucide-react"

export function CommunityHeader() {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Brain className="w-10 h-10 text-blue-600" />
        <h1 className="text-4xl font-bold text-gray-900">프롬프트 커뮤니티</h1>
      </div>
      <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        전문가들의 검증된 프롬프트를 발견하고, 당신의 경험을 공유하세요
      </p>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">2,847</span>
          </div>
          <p className="text-sm text-gray-600">활성 사용자</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">15,432</span>
          </div>
          <p className="text-sm text-gray-600">공유된 프롬프트</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="w-5 h-5 text-yellow-600" />
            <span className="text-2xl font-bold text-gray-900">4.7</span>
          </div>
          <p className="text-sm text-gray-600">평균 만족도</p>
        </div>
      </div>
    </div>
  )
}
