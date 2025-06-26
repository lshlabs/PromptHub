"use client"

import { useRef } from "react"
import Header from "@/components/layout/header"
import HeroSection from "@/components/sections/hero-section"
import ChartsSection from "@/components/sections/charts-section"
import { PromptComparison } from "@/components/sections/prompt-comparison"
import { PromptOptimizer } from "@/components/sections/prompt-optimizer"
import { PromptCommunity } from "@/components/sections/prompt-community"
import Footer from "@/components/layout/footer"

export default function HomePage() {
  // 섹션 refs
  const heroRef = useRef<HTMLDivElement>(null)
  const chartsSectionRef = useRef<HTMLDivElement>(null)
  const promptComparisonRef = useRef<HTMLDivElement>(null)
  const optimizerRef = useRef<HTMLDivElement>(null)
  const communityRef = useRef<HTMLDivElement>(null)

  // 프롬프트 최적화 섹션으로 스크롤하는 함수
  const scrollToOptimizer = () => {
    optimizerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <Header />

      {/* Main Content with Scroll Snap */}
      <main className="pt-16 snap-y snap-mandatory overflow-y-auto h-screen">
        {/* Hero Section */}
        <section ref={heroRef} className="min-h-screen snap-start flex items-center justify-center">
          <div className="w-full">
            <HeroSection onScrollToOptimizer={scrollToOptimizer} />
          </div>
        </section>

        {/* Charts Section */}
        <section ref={chartsSectionRef} className="min-h-screen snap-start">
          <ChartsSection />
        </section>

        {/* Prompt Comparison Section */}
        <section ref={promptComparisonRef} className="min-h-screen snap-start flex items-center bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <PromptComparison />
          </div>
        </section>

        {/* Prompt Optimizer Section */}
        <section ref={optimizerRef} className="min-h-screen snap-start flex items-center bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <PromptOptimizer />
          </div>
        </section>

        {/* Community Section */}
        <section ref={communityRef} className="min-h-screen snap-start flex items-center bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <PromptCommunity />
          </div>
        </section>

        {/* Footer Section */}
        <section className="snap-start bg-gray-900">
          <Footer />
        </section>
      </main>
    </div>
  )
}
