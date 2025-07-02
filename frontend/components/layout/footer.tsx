import Link from "next/link"
import { Star, Chrome, Github, MessageCircle, Twitter, Youtube, Zap, HelpCircle } from "lucide-react"

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white py-16">
      {/* 배경 그라데이션 효과 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>

      <div className="relative container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* 브랜드 섹션 */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  PromptHub
                </h3>
                <p className="text-xs text-gray-400">AI 프롬프트 리뷰 플랫폼</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              더 나은 프롬프트로 AI와 소통하세요.
              <br />
              커뮤니티와 함께 성장하는 프롬프트 플랫폼입니다.
            </p>

            {/* 소셜 링크 */}
            <div className="flex space-x-4">
              <Link
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Github className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 플랫폼 메뉴 */}
          <div>
            <h4 className="font-semibold mb-4 text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              플랫폼
            </h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors flex items-center gap-2">
                  홈
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-white transition-colors flex items-center gap-2">
                  커뮤니티
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors flex items-center gap-2">
                  트렌딩
                  <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">Hot</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors flex items-center gap-2">
                  북마크
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors flex items-center gap-2">
                  내 리뷰
                  <span className="text-xs bg-gray-600 text-white px-1.5 py-0.5 rounded-full">Soon</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* 도구 & 확장프로그램 */}
          <div>
            <h4 className="font-semibold mb-4 text-white flex items-center gap-2">
              <Chrome className="w-4 h-4 text-green-400" />
              도구
            </h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <Link href="#" className="hover:text-white transition-colors flex items-center gap-2">
                  크롬 확장프로그램
                  <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">New</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  프롬프트 분석
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  API 문서
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  개발자 도구
                </Link>
              </li>
            </ul>
          </div>

          {/* 지원 & 도움말 */}
          <div>
            <h4 className="font-semibold mb-4 text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              지원
            </h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  사용 가이드
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  문의하기
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  피드백
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  서비스 상태
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 크롬 확장프로그램 하이라이트 */}
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl border border-blue-500/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Chrome className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Chrome 확장프로그램</h4>
                <p className="text-gray-400 text-sm">ChatGPT에서 바로 프롬프트 추천을 받아보세요</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
                설치하기
              </button>
              <button className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                자세히 보기
              </button>
            </div>
          </div>
        </div>

        {/* 하단 저작권 */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">&copy; 2024 PromptHub. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="#" className="hover:text-white transition-colors">
                개인정보처리방침
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                이용약관
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                쿠키 정책
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
