import Link from 'next/link'
import { ArrowRight, TrendingUp, Users, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="relative isolate min-h-[100dvh] overflow-hidden bg-gradient-to-b from-white via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      {/* 배경 장식 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.25),rgba(255,255,255,0))] blur-3xl dark:bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.12),rgba(0,0,0,0))]" />
        <div className="absolute left-[10%] top-[40%] h-56 w-56 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.18),rgba(255,255,255,0))] blur-2xl dark:bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.12),rgba(0,0,0,0))]" />
        <div className="absolute right-[8%] top-[30%] h-64 w-64 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.14),rgba(255,255,255,0))] blur-2xl dark:bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.1),rgba(0,0,0,0))]" />
      </div>

      {/* 히어로 */}
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-28 md:pt-36">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mt-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-4xl font-bold leading-tight text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 md:text-6xl">
            프롬프트의 진짜 가치, 한 눈에
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-lg">
            실제 사용자 리뷰와 데이터 기반 트렌딩으로 더 빠르게 선택하세요. 커뮤니티가 쌓은
            인사이트를 깔끔하게 보여드립니다.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg transition-transform hover:scale-[1.02] hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
              <Link href="/community">
                지금 시작하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link href="/trending">트렌드 바로 보기</Link>
            </Button>
          </div>

          {/* 하이라이트 */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 py-1.5 backdrop-blur-md dark:border-white/10 dark:bg-white/10">
              <Users className="h-4 w-4" /> 커뮤니티 리뷰
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 py-1.5 backdrop-blur-md dark:border-white/10 dark:bg-white/10">
              <TrendingUp className="h-4 w-4" /> 실시간 트렌드
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 py-1.5 backdrop-blur-md dark:border-white/10 dark:bg-white/10">
              <Bookmark className="h-4 w-4" /> 북마크 & 정리
            </div>
          </div>
        </div>

        {/* 프리뷰 카드 */}
        <div className="mx-auto mt-12 max-w-5xl">
          <div className="rounded-2xl border border-black/10 bg-white/60 p-1 shadow-xl ring-1 ring-black/5 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
            <div className="rounded-[14px] border border-black/5 bg-gradient-to-b from-white/70 to-white/40 p-6 dark:border-white/10 dark:from-white/10 dark:to-white/5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-black/5 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
                    <Users className="h-4 w-4" /> 커뮤니티
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    프롬프트 경험담과 팁을 공유하고, 좋은 사례를 쉽게 찾으세요.
                  </p>
                </div>
                <div className="rounded-xl border border-black/5 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
                    <TrendingUp className="h-4 w-4" /> 트렌딩
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    플랫폼별 인기 프롬프트와 모델 변화를 한눈에 비교합니다.
                  </p>
                </div>
                <div className="rounded-xl border border-black/5 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
                    <Bookmark className="h-4 w-4" /> 정리/북마크
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    관심 프롬프트를 저장하고 나만의 컬렉션으로 관리하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 하단 간결 카피 */}
      <div className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mx-auto max-w-3xl text-center text-xs text-zinc-500 dark:text-zinc-400">
          오픈소스 • Next.js + Django REST • 데이터 중심 커뮤니티
        </div>
      </div>
    </main>
  )
}
