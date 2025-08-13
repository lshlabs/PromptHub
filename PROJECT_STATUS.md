### PromptHub 프로젝트 진행상황 (요약)

- **백엔드**: Django 5.2.4, DRF 3.15.2, TokenAuthentication 기반, SQLite 개발 DB
- **프론트엔드**: Next.js 15, TypeScript, Tailwind, axios API 클라이언트
- **인증**: DRF 토큰 인증 사용(Authorization: `Token <key>`) [[DRF 토큰 기반 인증]]

### 백엔드 상태

- 설정: `REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES = TokenAuthentication`, 기본 권한 `IsAuthenticated` (뷰 별로 퍼미션/데코레이터로 완화)
- 앱 및 엔드포인트
  - Users (`/api/auth/`)
    - POST `register/` 회원가입 → 토큰 발급, 프로필 응답
    - POST `login/` 로그인 → 토큰 발급, 프로필 응답
    - POST `logout/` 로그아웃(토큰 삭제)
    - GET/PUT `profile/` 내 프로필 조회/수정
    - POST `profile/password/` 비밀번호 변경
    - GET `info/` 간단 사용자 정보
    - 참고: JWT `token/refresh/`는 비활성화됨 (DRF 토큰 인증 사용)
  - Posts (`/api/posts/`)
    - GET `` (목록 + 서버사이드 필터/검색/정렬/페이지네이션)
    - POST `create/` 생성 (인증 필요)
    - GET `<id>/` 상세(조회수 +1)
    - PUT/PATCH `<id>/update/` 수정 (작성자 본인, 인증 필요)
    - DELETE `<id>/delete/` 삭제 (작성자 본인, 인증 필요)
    - POST `<id>/like/`, POST `<id>/bookmark/` 토글
    - GET `liked/`, `bookmarked/`, `my/` 사용자별 목록 (인증 필요)
    - 메타데이터:
      - GET `platforms/` (플랫폼 목록)
      - GET `models/` (모델 목록)
      - GET `platforms/<platform_id>/models/` (플랫폼별 모델 + 기본값)
      - GET `categories/` (카테고리 목록)
      - GET `tags/` (태그 + 사용 빈도)
  - Core (`/api/core/`)
    - GET `search/` 통합 검색
      - 파라미터: `q`, `search_type`(all|title|content|tags|author|weighted|multi_word|fuzzy),
        `categories`, `platforms`, `models`, `sort`(latest|oldest|popular|satisfaction|views), `page`, `page_size`
    - GET `sort-options/`, GET `filter-options/`
  - Stats (`/api/stats/`)
    - GET `dashboard/` 대시보드 통계
    - GET `user/` 사용자별 통계 (인증 필요)

### 프론트엔드 상태

- 구조: App Router(`app/`), 페이지 `home/`, `community/`, `profile/`, `trending/`, `extension/`, `post/[id]/`, `edit-post/[id]/` 등 구성
- API 클라이언트: `axios` 인스턴스 + 요청 인터셉터로 `Authorization: Token <key>` 자동 주입
- 사용 중 API 객체
  - `authApi`: 회원가입/로그인/로그아웃/프로필/비번변경
  - `postsApi`: 목록/상세/생성/수정/좋아요/북마크/메타데이터(플랫폼, 모델, 카테고리, 태그)
  - `coreApi`: 검색/정렬옵션/필터옵션
  - `statsApi`: 대시보드/사용자 통계 (활성화)
  - `userDataApi`: 내 게시글/좋아요/북마크 목록 (활성화)
- 환경변수: `API_BASE_URL`이 `process.env.NEXT_PUBLIC_API_BASE_URL`를 참조

### 최근 변경 (프론트 타입 정리)

- `tsconfig.json` 정리: `components/ui/**`(shadcn UI), `sampledata/**`, `components/common/post-card_backup.tsx`를 타입체크 제외로 설정
- 샘플타입 ambient 선언 추가: `types/datatype_sample.d.ts`에서 `@/types/datatype_sample`을 `any` 기반으로 선언해 샘플 의존 파일의 TS 오류 방지
- 트렌딩 페이지 유지: `app/trending/page.tsx`는 백엔드 구현 전까지 `sampledata/trending-data`를 임시 사용(샘플데이터 사용 허용 범위는 트렌딩으로 제한)
- UI 라이브러리: `components/ui/**`는 shadcn UI 원본을 유지하며 수정하지 않음(타입체크 제외)
- 기타: `components/common/post-list.tsx`에서 더 이상 사용하지 않는 `platformsData/modelsData/categoriesData` 프롭 제거
- 현재 상태: `npx tsc --noEmit` 기준 TypeScript 오류 0건

### 기능 폴더 전환 (완전 이전)

 - `features/` 도입 및 배럴/구현 이전 진행 상황
  - `features/posts/components/`로 `PostList`, `PostHeader`, `PostContentSections`, `PostActions` 이전 완료
  - `features/posts/components/create-post-dialog.tsx` 본문 완전 이전(단계 이관 완료) — 메타데이터 로딩 → 플랫폼/모델 → 카테고리/태그 → 저장 로직 순으로 소단위 적용 완료
  - `features/profile/components/`로 `ProfileInfoCard`, `ProfileStatsSection`, `ProfilePostsSection` 이전 완료
  - `features/community/components/`로 `CommunityHeader`, `CommunityAction`, `FilterPanel` 이전 완료
  - `features/trending/components/`로 `TrendingHero`, `PostsList`, `CategoryRankings` 이전 완료
  - `features/auth` 배럴 구성 완료: `features/auth/components/{auth-form,auth-provider}.tsx` 추가 및 배럴에서 노출
 - 주요 페이지 import 경로 정리
  - `app/profile/page.tsx` → `@/features/profile`
  - `app/community/page.tsx` → `@/features/community`, `@/features/posts`
  - `app/post/[id]/page.tsx` → `@/features/posts`
  - `app/trending/page.tsx` → `@/features/trending`
 - 결과: 기능 배럴 적용 후 타입 에러 없음 (`tsc` 통과)

### 확인된 미스매치/수정 필요 사항

- 프로필 수정 메서드 불일치
  - 프론트: `authApi.updateProfile()`이 JSON 시 `PATCH`, 파일 포함 시 `POST multipart` 호출
  - 백엔드: `PUT`만 허용(APIView: put). 결과적으로 405 가능 → 둘 중 하나로 정렬 필요
    - 권장: 프론트에서 `PUT` JSON/`PUT multipart`로 통일하거나, 백엔드에 `PATCH` 및 `POST` 허용 추가
- 프로필 조회 응답 형태 불일치
  - 백엔드: `{ user: { ... } }`
  - 프론트: `useAuth` 초기화는 `{user: ...}` 고려, `refreshUser`는 객체 본문 그대로 사용 → 일관화 필요
    - 권장: 프론트에서 응답을 항상 `user`로 매핑해 상태 업데이트
- 통계/사용자별 목록 API 미연결
  - 백엔드에 `/api/stats/dashboard/`, `/api/stats/user/`, `/api/posts/liked/`, `/api/posts/bookmarked/`, `/api/posts/my/` 존재
  - 프론트 `statsApi`, `userDataApi` 주석 처리됨 → 연결 및 UI 연동 필요
- 환경변수 키 불일치 가능성
  - 프론트 코드: `NEXT_PUBLIC_API_BASE_URL`
  - 문서/환경 예시: `NEXT_PUBLIC_API_URL` 표기 사례 존재 → 한쪽으로 통일 필요
- JWT 관련 잔존 코드
  - `users/urls.py`의 `token/refresh/` 및 `requirements.txt`의 simplejwt는 현재 토큰 인증 전략과 불일치 → 정리 또는 명확한 주석 필요

### 진행 체크리스트

- [x] `authApi.updateProfile`를 `PUT`(JSON/multipart)로 통일
- [x] `authApi.getProfile` 응답 매핑 일관화(`{ user }` 형태로 통일)
- [x] `statsApi`, `userDataApi` 활성화 및 엔드포인트 연결(페이지 UI 연동 일부 남음)
- [x] 환경변수 키 통일(`NEXT_PUBLIC_API_BASE_URL`) 및 README 반영
- [x] JWT refresh 라우트 비활성화(패키지 제거는 검토 항목으로 유지)
- [x] 검색/정렬/필터 서버 주도 정책 확정(문서 반영)
- [ ] 핵심/통합 테스트 추가(게시글 CRUD, 상호작용, 검색/필터, 통계)

### 참고 코드 위치

- 백엔드 URL 매핑: `backend/config/urls.py`
- Users API: `backend/users/views.py`, `backend/users/urls.py`
- Posts API: `backend/posts/views.py`, `backend/posts/urls.py`
- Core(검색/정렬/필터): `backend/core/views.py`
- Stats: `backend/stats/views.py`
- 프론트 API 클라이언트: `frontend/lib/api.ts`
- 인증 훅: `frontend/hooks/use-auth.ts`
 - 기능 배럴: `frontend/features/{posts,profile,community,trending,auth}/index.ts`
 - 기능 컴포넌트: `frontend/features/<domain>/components/*`

### 검색/정렬/필터 서버 주도 정책 확정

- 서버(백엔드) 책임
  - 검색/필터/정렬/페이지네이션: `core.views.search_posts`, `core/search.py`의 `SearchManager`, `core/sorting.py`의 `SortManager`에서 수행
  - 목록 API(`posts.views.posts_list`)도 동일 원칙을 준수
- 클라이언트(프론트) 책임
  - UI 렌더링과 상태 관리, 파라미터 구성(정렬/필터 UI)
  - 서버 제공 옵션(`sort-options`, `filter-options`)을 그대로 사용
- 중복 제거
  - 프론트 내 `Array.sort`/수기 필터는 샘플/로컬 데이터일 때만 제한적으로 사용. 실제 API 연동 경로에서는 서버 주도만 사용

### TODO (수용 및 진행)

- [x] 프론트 `authApi.updateProfile`를 `PUT`로 통일, 파일 포함 시 multipart PUT 적용
- [x] `useAuth.refreshUser` 응답 `{user: ...}` 매핑 일관화
- [x] `userDataApi`, `statsApi` 활성화 및 엔드포인트 연결
- [x] 환경변수 키를 `NEXT_PUBLIC_API_BASE_URL`로 통일 (`frontend/env.example`, `README.md` 반영)
- [x] JWT refresh 라우트 비활성화 (`backend/users/urls.py`), simplejwt는 추후 제거 검토
- [x] 프론트 타입 에러 정리(샘플/UILayer 제외 설정, ambient 선언, 트렌딩 샘플 유지) 및 컴파일 에러 0건 달성
- [x] 기능 폴더 전환(완전 이전) 1차 완료: 실제 구현 파일 이전 및 배럴 정리, `auth` 배럴 신설
 - [x] `CreatePostDialog` 본문을 `features/posts/components/create-post-dialog.tsx`로 점진 이전(완료)
- [ ] 프로필 페이지에서 사용자별 목록/통계 섹션 UI 연동 (API 적용)
- [ ] 백엔드 `users.views.UserProfileView`에 PATCH 허용 검토 또는 프론트 PUT 유지 가이드 문서화
- [ ] 통합 테스트 추가 (프로필 갱신, 게시글 CRUD, 상호작용, 검색/필터, 통계)

> 주: 본 프로젝트는 DRF 토큰 인증을 사용합니다. JWT 리프레시 엔드포인트는 현재 전략과 맞지 않아 비활성화했습니다 [[DRF 토큰 기반 인증]].



### 전체 기능 목록(요약)

- 사용자
  - 회원가입/로그인/로그아웃(토큰), 내 프로필 조회/수정(PUT/PATCH), 비밀번호 변경, 간단한 사용자 정보
- 게시글
  - 목록(서버사이드 검색/필터/정렬/페이지네이션), 상세(조회수 증가), 생성/수정/삭제, 좋아요/북마크 토글, 사용자별 목록(내 글/좋아요/북마크)
  - 메타데이터: 플랫폼/모델/카테고리/태그 조회, 플랫폼별 모델 + 기본값
- 검색/정렬/필터(Core)
  - 검색 타입: all, title, content, tags, author, weighted, multi_word, fuzzy
  - 정렬: 최신/오래된/인기/만족도/조회수, 필터: 카테고리/모델
- 통계(Stats)
  - 대시보드 전체 통계, 사용자별 개인 통계(인증 필요)
- 프론트 페이지
  - `/home`, `/trending`, `/community`, `/profile`, `/profile/settings`, `/post/[id]`, `/edit-post/[id]`, `/bookmarks`, `/extension`
  - 루트 `/`는 `/home` 리다이렉트
- 개발 스크립트
  - `scripts/` 내 초기설정/실행/마이그레이션/DB 리셋/포트포워딩 관리 스크립트

### 아키텍처/디렉토리 구조 개편 가이드 (포트폴리오 지향)

- 목표: 주니어 수준에서 유지보수/확장이 쉬운 구조, 기능(Feature) 단위로 응집. 프론트와 백엔드의 책임 경계를 명확히 하여 코드 증가에도 복잡도가 선형 증가하도록 설계.

- 백엔드(제안)
  - 유지: `backend/` 최상위에 도메인 앱(`core`, `users`, `posts`, `stats`) 배치
  - 개선:
    - 네이밍 충돌 제거: `posts.models.Model` → `AiModel`로 리네임 (Django `Model`과 혼동 방지)
    - 공통 유틸 모듈: `backend/common/` 신설(순수 함수, 헬퍼, 상수)
    - 설정 분리: 필요 시 `config/settings/{base,local,prod}.py`로 환경 분리(현재 단일 settings 유지 가능)
  - 테스트: 각 앱별 `tests.py` → 필요 시 `tests/` 폴더로 세분화(`test_views.py`, `test_serializers.py`, `test_models.py`)

- 프론트엔드(제안)
  - 기능 우선 구조 병행 도입(현 구조 유지하면서 점진적 전환)
    - `frontend/features/` 신설: `posts/`, `profile/`, `auth/`, `stats/` 등 기능별로 컴포넌트/훅/서브-API를 응집
    - `frontend/lib/api/` 분리: `client.ts`, `auth.ts`, `posts.ts`, `core.ts`, `stats.ts`로 모듈화(현 `lib/api.ts`를 점진 분할)
    - `frontend/types/` 유지하되, 도메인별 파일로 분리: `types/users.ts`, `types/posts.ts` 등
  - App Router 라우트 그룹(선택):
    - `app/(public)/home`, `app/(public)/trending`
    - `app/(app)/profile`, `app/(app)/community`, `app/(app)/post/[id]`
  - 네이밍 정리: UI 프리미티브는 `components/ui/`, 도메인 컴포넌트는 `features/<domain>/components/`

- 공통 원칙
  - 비즈니스 로직/검증/권한/데이터 일관성: 백엔드(DRF Serializer/Model/Service)
  - 표시/서식/경량 필터/페이지네이션 상태: 프론트(React)
  - 데이터 집계/카운트/통계: 백엔드(`stats`)
  - 날짜 포맷/상대시간/텍스트 표시 변환: 프론트
  - API 계약은 백엔드에서 단일 진실 공급원으로 문서화(OpenAPI/README)

### 네이밍/모델 정비 (중요)

- `posts.models.Model` → `AiModel`로 리네임 권장
  - 이유: Django의 `Model` 클래스와 혼동/가독성 저하
  - 영향 범위: `posts/models.py`, `serializers.py`, `views.py`, `filters.py`, `core/views.py`, `frontend/types/api.ts`, `frontend/lib/api.ts` 등 참조 전반
  - 절차: Django 마이그레이션 생성(필드/FK 영향 검토), 전체 참조 일괄 변경 → 테스트

### 기능 배치 가이드(무엇을 어디에 둘 것인가)

- 백엔드에 둘 것
  - 인증/권한(토큰 검증), 입력 검증(DRF Serializer), 데이터 일관성(trx), 통계/집계 쿼리, 목록 필터/정렬(쿼리셋 레벨: 서버 주도 정책 확정)
  - 활동 로그/감사(선택), 파일 업로드 처리(이미지 저장 경로/유효성)

- 프론트에 둘 것
  - UI 상태/페이지네이션 상태 관리, 포맷팅(날짜/숫자/텍스트), 가벼운 클라이언트 필터(이미 조회된 작은 리스트)
  - UX 상호작용, Optimistic UI(선택), 대응 에러 메시지 매핑

### 점진적 리팩터링 플랜(안)

1) 네이밍/계약 정리 (0.5~1일)
   - [ ] `Model` → `AiModel` 리네임(백/프론트 전역 변경, 마이그레이션 포함)
   - [ ] OpenAPI 스키마 생성 및 `README`에 링크(선택)

 2) API 클라이언트 모듈화 (0.5~1일)
   - [x] `frontend/lib/api.ts` → `lib/api/{client,auth,posts,core,stats}.ts` 분할
   - [x] `features/<domain>/` 하위에서 해당 모듈만 import 하도록 정리 (주요 사용처 반영)

 3) 기능 폴더 전환(점진) (1~2일)
   - [x] `features/posts`/`features/profile`/`features/community`/`features/trending` 배럴 생성 및 페이지 import 경로 전환
   - [x] 실제 컴포넌트 파일을 `features/<domain>/components`로 이동(이관 2차) 완료
   - [x] `features/auth` 배럴 및 관련 훅/컴포넌트 정리 완료
   - [x] `CreatePostDialog` 본문 전체 이전(대형 컴포넌트를 분할 이관, 완료)

4) 업로드/미디어 (0.5일)
   - [ ] 프로필 이미지 업로드 실제 저장(멱등/사이즈 제한/확장자 검증) 및 프론트 연동

5) 테스트/품질 (1일)
   - [ ] 백엔드 테스트 추가(시리얼라이저/권한/에지케이스)
   - [ ] (선택) Playwright/Cypress로 핵심 E2E 시나리오 작성

### 코딩 규약(간단)

- 백엔드: Serializer에 핵심 검증 집약, View는 얇게. 트랜잭션 경계 명확히. 모델 메서드는 의미있는 도메인 행위만.
- 프론트: 기능 모듈화, 컴포넌트/훅/서비스(API) 분리. 타입 우선(Typescript), 의미 있는 이름, 토큰 처리 단일화.
- 네이밍: 약어 지양, 도메인 의미가 드러나는 이름 사용(AiModel 등).
