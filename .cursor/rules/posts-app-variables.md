# Posts 앱 변수명 및 반환 타입 가이드

## 🗂️ Platform 모델
- `id`: int (AutoField)
- `name`: str (CharField, max_length=50, unique=True)

## 🤖 Model 모델  
- `id`: int (AutoField)
- `platform`: Platform 객체 (ForeignKey)
- `name`: str (CharField, max_length=100)

## 📂 Category 모델
- `id`: int (AutoField) 
- `name`: str (CharField, max_length=50, unique=True)

## 📝 Post 모델 (메인)
### 기본 정보:
- `id`: int (AutoField)
- `title`: str (CharField, max_length=200, 최소 3자)
- `author`: CustomUser 객체 (ForeignKey)

### AI 관련 정보:
- `platform`: Platform 객체 (ForeignKey)
- `model`: Model 객체 또는 None (ForeignKey, null=True, blank=True)
- `model_etc`: str (CharField, max_length=100, blank=True)

### 분류 정보:
- `category`: Category 객체 (ForeignKey)
- `category_etc`: str (CharField, max_length=100, blank=True)
- `tags`: str (TextField, blank=True, 쉼표로 구분)

### 게시글 내용:
- `prompt`: str (TextField, 최소 5자)
- `ai_response`: str (TextField, 최소 10자)
- `additional_opinion`: str (TextField, blank=True)

### 평가 정보:
- `satisfaction`: Decimal (DecimalField, 0.5~5.0, 0.5단위, null=True, blank=True)

### 통계 정보:
- `view_count`: int (PositiveIntegerField, default=0)
- `like_count`: int (PositiveIntegerField, default=0)
- `bookmark_count`: int (PositiveIntegerField, default=0)

### 메타 정보:
- `created_at`: datetime (DateTimeField, auto_now_add=True)
- `updated_at`: datetime (DateTimeField, auto_now=True)

## 👥 PostInteraction 모델
- `id`: int (AutoField)
- `user`: CustomUser 객체 (ForeignKey)
- `post`: Post 객체 (ForeignKey)
- `is_liked`: bool (BooleanField, default=False)
- `is_bookmarked`: bool (BooleanField, default=False)
- `created_at`: datetime (DateTimeField, auto_now_add=True)
- `updated_at`: datetime (DateTimeField, auto_now=True)

## 🔄 시리얼라이저별 API 응답 타입

### PlatformSerializer:
```json
{
  "id": int,
  "name": str
}
```

### ModelSerializer:
```json
{
  "id": int,
  "name": str,
  "platform": int,
  "platformName": str
}
```

### CategorySerializer:
```json
{
  "id": int,
  "name": str
}
```

### PostCardSerializer (카드 목록):
```json
{
  "id": int,
  "title": str,
  "author": str,           // username
  "authorInitial": str,    // 첫 글자 대문자
  "avatarSrc": str,        // 이미지 경로
  "createdAt": str,        // ISO datetime
  "views": int,
  "satisfaction": Decimal,
  "platformId": int,
  "modelId": int,
  "modelEtc": str,
  "categoryId": int,
  "categoryEtc": str,
  "tags": List[str],
  "likes": int,
  "isLiked": bool,
  "bookmarks": int,
  "isBookmarked": bool
}
```

### PostDetailSerializer (상세 보기):
PostCardSerializer + 다음 필드들:
```json
{
  "prompt": str,
  "aiResponse": str,
  "additionalOpinion": str,
  "isAuthor": bool
}
```

### PostCreateSerializer (작성용 입력):
```json
{
  "title": str,
  "platform": int,           // ID
  "model": int,              // ID 또는 null
  "model_etc": str,
  "category": int,           // ID
  "category_etc": str,
  "tags": List[str],
  "satisfaction": Decimal,
  "prompt": str,
  "ai_response": str,
  "additional_opinion": str
}
```

### PostEditSerializer (편집용):
#### 읽기 전용 (편집 페이지 로드):
```json
{
  "id": int,
  "title": str,
  "platformId": int,
  "modelId": int,
  "modelEtc": str,
  "categoryId": int,
  "categoryEtc": str,
  "tags": List[str],
  "satisfaction": Decimal,
  "prompt": str,
  "aiResponse": str,
  "additionalOpinion": str
}
```

#### 쓰기 가능 (수정 제출):
```json
{
  "platform": int,           // ID
  "model": int,              // ID 또는 null
  "model_etc": str,
  "category": int,           // ID
  "category_etc": str,
  "tags_input": List[str],
  "ai_response": str,
  "additional_opinion": str
}
```

### TagSerializer:
```json
{
  "name": str,
  "count": int
}
```

### PostInteractionSerializer:
```json
{
  "is_liked": bool,
  "is_bookmarked": bool
}
```

## 🔗 관계형 필드 (Related Names)
- `platform.models` → QuerySet[Model]
- `platform.posts` → QuerySet[Post]
- `model.posts` → QuerySet[Post]
- `category.posts` → QuerySet[Post]
- `post.interactions` → QuerySet[PostInteraction]
- `user.posts` → QuerySet[Post]
- `user.post_interactions` → QuerySet[PostInteraction]
- `interaction.user` → CustomUser 객체
- `interaction.post` → Post 객체

## 📊 유효성 검사 규칙
- `title`: 최소 3자, 최대 200자
- `prompt`: 최소 5자
- `ai_response`: 최소 10자
- `model_etc`: 최대 100자
- `category_etc`: 최대 100자
- `tags`: 최대 10개, 각 태그 최대 50자
- `satisfaction`: 0.5~5.0, 0.5단위

## ⚠️ 프론트엔드 연동 시 주의사항
1. **API 응답은 모두 카멜케이스** (platformId, modelId, categoryId)
2. **입력 시에는 스네이크케이스** (platform, model, category)
3. **PostEditSerializer는 읽기/쓰기 이중 역할**
4. **태그는 읽기 시 List[str], 쓰기 시 List[str] (tags_input)**
5. **ID 기반 필드는 프론트엔드에서 표시명으로 변환 필요**
6. **만족도는 Decimal 타입** (0.5, 1.0, 1.5, ...)
7. **날짜는 ISO 형식 문자열로 반환**
8. **상호작용 상태는 isLiked, isBookmarked로 확인**

## 🔧 주요 메서드
### Post 모델:
- `get_tags_list()`: List[str] - 쉼표로 구분된 태그를 리스트로 변환
- `get_absolute_url()`: str - 상세 페이지 URL

### PostInteraction 모델:
- `Meta.unique_together`: (user, post) - 사용자당 게시글 하나씩만 상호작용 가능

---

# 🔧 Core 앱 기능 가이드

## 📄 페이지네이션 (Pagination)
### CustomPagination:
- **기본 페이지 크기**: 12개
- **최대 페이지 크기**: 50개
- **페이지 파라미터**: `page`
- **페이지 크기 파라미터**: `page_size`

### 응답 형식:
```json
{
  "count": int,
  "next": str,
  "previous": str,
  "results": List[PostCardSerializer],
  "current_page": int,
  "total_pages": int,
  "has_next": bool,
  "has_previous": bool
}
```

### 전용 페이지네이션:
- `PostPagination`: 12개 (카드 형태 최적화)
- `UserPagination`: 20개
- `CommentPagination`: 10개

## 🔍 필터링 (Filtering)
### PostFilter 사용법:
```python
# URL 파라미터 예시
?platform=1&category=2&satisfaction_min=3.0&search=AI
```

### 지원 필터:
- `search`: 제목, 프롬프트, AI 응답, 추가 의견, 태그 검색
- `platform`: 플랫폼 ID
- `model`: 모델 ID
- `category`: 카테고리 ID
- `created_after/created_before`: 날짜 범위
- `satisfaction_min/satisfaction_max`: 만족도 범위
- `tags`: 쉼표로 구분된 태그들
- `min_views/min_likes/min_bookmarks`: 최소값 필터

### 고급 필터:
- `popular`: 인기 게시글 (좋아요+북마크 ≥ 10)
- `recent`: 최근 7일 내 게시글
- `high_rated`: 고평가 게시글 (만족도 ≥ 4.0)

## 🔎 검색 (Search)
### 검색 타입:
- `all`: 모든 필드 검색 (기본값)
- `title`: 제목만 검색
- `content`: 내용만 검색 (프롬프트, AI 응답, 추가 의견)
- `tags`: 태그만 검색
- `author`: 작성자만 검색
- `weighted`: 가중치 검색 (제목 > 태그 > 내용)
- `multi_word`: 다중 단어 검색 (AND 조건)
- `fuzzy`: 유사 검색

### 통합 검색 API:
```
GET /api/core/search/
?q=검색어&search_type=weighted&sort=popular&platform=1&category=2
```

## 📊 정렬 (Sorting)
### 정렬 옵션:
- `latest`: 최신순 (기본값)
- `oldest`: 오래된순
- `popular`: 인기순 (좋아요+북마크)
- `satisfaction`: 만족도순
- `views`: 조회수순

### 고급 정렬:
- `sort_by_complex_criteria`: 복합 기준 정렬
- `sort_by_weighted_score`: 가중치 점수 정렬

## 🌐 Core 앱 API 엔드포인트

### 1. 통합 검색 API
```
GET /api/core/search/
```
**파라미터:**
- `q`: 검색어
- `search_type`: 검색 타입 (all, title, content, tags, author, weighted, multi_word, fuzzy)
- `sort`: 정렬 기준 (latest, popular, views, satisfaction 등)
- `platform`: 플랫폼 ID
- `category`: 카테고리 ID
- `satisfaction_min/max`: 만족도 범위
- `date_from/date_to`: 날짜 범위
- `page`: 페이지 번호
- `page_size`: 페이지 크기

**응답:**
```json
{
  "count": int,
  "next": str,
  "previous": str,
  "results": List[PostCardSerializer],
  "current_page": int,
  "total_pages": int,
  "has_next": bool,
  "has_previous": bool
}
```

### 2. 정렬 옵션 API
```
GET /api/core/sort-options/
```
**응답:**
```json
{
  "sort_options": {
    "latest": "최신순",
    "popular": "인기순",
    "views": "조회수순",
    "satisfaction": "만족도순"
  },
  "default": "latest"
}
```

### 3. 필터 옵션 API
```
GET /api/core/filter-options/
```
**응답:**
```json
{
  "platforms": [
    {"id": 1, "name": "ChatGPT"},
    {"id": 2, "name": "Claude"}
  ],
  "categories": [
    {"id": 1, "name": "프로그래밍"},
    {"id": 2, "name": "작문"}
  ],
  "satisfaction_range": {
    "min": 0.5,
    "max": 5.0,
    "step": 0.5
  }
}
```

## 💡 사용 예시

### 프론트엔드에서 검색 구현:
```javascript
// 통합 검색
const searchPosts = async (query, filters = {}) => {
  const params = new URLSearchParams({
    q: query,
    search_type: 'weighted',
    sort: 'popular',
    page: 1,
    page_size: 12,
    ...filters
  });
  
  const response = await fetch(`/api/core/search/?${params}`);
  return response.json();
};

// 정렬 옵션 가져오기
const getSortOptions = async () => {
  const response = await fetch('/api/core/sort-options/');
  return response.json();
};

// 필터 옵션 가져오기
const getFilterOptions = async () => {
  const response = await fetch('/api/core/filter-options/');
  return response.json();
};
```

### 백엔드에서 직접 사용:
```python
from core.pagination import PostPagination
from core.filters import PostFilter
from core.search import SearchManager
from core.sorting import SortManager

# 페이지네이션
paginator = PostPagination()
page = paginator.paginate_queryset(queryset, request)

# 필터링
post_filter = PostFilter(request.GET, queryset=Post.objects.all())
filtered_queryset = post_filter.qs

# 검색
search_results = SearchManager.search_posts(
    query="AI",
    search_type="weighted",
    filters={"platform": 1},
    sort_by="popular"
)

# 정렬
sorted_queryset = SortManager.sort_posts(queryset, sort_by="trending")
``` 