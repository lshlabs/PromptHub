# 리팩토링 규칙 추가
  You are an expert in TypeScript, Node.js, Next.js App Router, React, Shadcn UI, Radix UI and Tailwind.
  
  Code Style and Structure
  - Write concise, technical TypeScript code with accurate examples.
  - Use functional and declarative programming patterns; avoid classes.
  - Prefer iteration and modularization over code duplication.
  - Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
  - Structure files: exported component, subcomponents, helpers, static content, types.
  
  Naming Conventions
  - Use lowercase with dashes for directories (e.g., components/auth-wizard).
  - Favor named exports for components.
  
  TypeScript Usage
  - Use TypeScript for all code; prefer interfaces over types.
  - Avoid enums; use maps instead.
  - Use functional components with TypeScript interfaces.
  
  Syntax and Formatting
  - Use the "function" keyword for pure functions.
  - Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
  - Use declarative JSX.
  
  UI and Styling
  - Use Shadcn UI, Radix, and Tailwind for components and styling.
  - Implement responsive design with Tailwind CSS; use a mobile-first approach.
  
  Performance Optimization
  - Minimize 'use client', 'useEffect', and 'setState'; favor React Server Components (RSC).
  - Wrap client components in Suspense with fallback.
  - Use dynamic loading for non-critical components.
  - Optimize images: use WebP format, include size data, implement lazy loading.
  
  Key Conventions
  - Use 'nuqs' for URL search parameter state management.
  - Optimize Web Vitals (LCP, CLS, FID).
  - Limit 'use client':
    - Favor server components and Next.js SSR.
    - Use only for Web API access in small components.
    - Avoid for data fetching or state management.
  
  Follow Next.js docs for Data Fetching, Rendering, and Routing.
  

# 프로젝트 진행상황

본 파일은 리팩토링 진행상황을 기록합니다. 항목마다 완료 시각과 변경 요약을 남깁니다.

## 2025-08-13

- [x] 아키텍처 점검 및 결정: `@/components`를 페이지 기반 구조로 정리하고, 도메인별 컴포넌트는 해당 페이지 하위로 배치. 공통 컴포넌트는 `@/components/common`, UI 원자 컴포넌트는 `@/components/ui` 유지. `features`는 호환성 유지를 위해 배럴(index)만 남기고 점진적으로 페이즈아웃.
- [x] 1차 리팩토링(프로필 도메인): `features/profile/components/*`를 `components/profile/*`로 이동. 배럴(`features/profile/index.ts`)은 신규 경로를 재노출하도록 수정. 중복 파일 제거 완료.
- [x] 품질개선: `ProfileStatsSection`의 `contained` 동작이 반영되지 않던 문제를 수정(Wrapper 적용).
- [x] 2차 리팩토링(트렌딩/커뮤니티/포스트 도메인): `features/*/components/*`를 `components/*/*`로 이관하고 배럴 갱신. 앱 페이지 import를 `@/components/*`로 교체. 빌드·타입체크·린트 통과.
  - [x] 레거시 `features/*/components/*` 파일 제거 완료
- [x] 3차 리팩토링(인증/레이아웃): `features/auth` 의 배럴을 `@/components` 경로로 재노출하고, 전역 `AuthProvider/useAuthContext` 사용 경로를 `@/components/layout/auth-provider`로 통일. `Header`에서 `AuthForm` import를 `@/components/auth/auth-form`로 교체. 빌드·타입체크·린트 통과.
- [x] 정리: `@/features/*` import 전부 제거 확인. 빈 폴더(`features/*/components`) 정리.
- [x] 타입/유틸 참조 정리: `app/profile/page.tsx`의 `PostCard` 타입을 `@/types/api`로, `bookmarks/page.tsx`의 인증 유틸을 `@/lib/api/client`로, 샘플 데이터의 `PostWrite` 타입을 `@/types/api`의 `PostCreateRequest`로 업데이트. 전체 빌드 통과.

검증
- [x] eslint, typecheck, build 모두 통과

다음 작업 예정
- [x] ESLint 규칙 재점검: Next.js 권장 규칙 및 React 권장 규칙 통합, 경고 최소화 설정 반영
- [x] API 계층(`lib/api/*`) 타입 주석 보강: posts/auth/core/stats/metadata/trending API에 JSDoc 추가
- [ ] dead code 제거 자동화 스크립트 추가(선택)