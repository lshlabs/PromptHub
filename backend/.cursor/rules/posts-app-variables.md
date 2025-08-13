# Posts App Variables - Cursor Rule

## 📋 개요
이 문서는 `backend/posts` 앱의 모든 변수명과 반환타입을 정리한 Cursor Rule입니다.
프론트엔드 연동 시 변수명과 반환타입을 정확히 참조하세요.

## 🗄️ Models (데이터베이스 스키마)

### Platform
```python
class Platform(models.Model):
    id: int (AutoField, Primary Key)
    name: str (CharField, max_length=50, unique=True)
    
    Meta:
        ordering = ['id']
```

### Model
```python
class Model(models.Model):
    id: int (AutoField, Primary Key)
    name: str (CharField, max_length=100)
    platform: Platform (ForeignKey)
    
    Meta:
        ordering = ['platform__id', 'id']
```

### Category
```python
class Category(models.Model):
    id: int (AutoField, Primary Key)
    name: str (CharField, max_length=50, unique=True)
    
    Meta:
        ordering = ['id']
```

### Post
```python
class Post(models.Model):
    id: int (AutoField, Primary Key)
    title: str (CharField, max_length=200)
    author: CustomUser (ForeignKey)
    platform: Platform (ForeignKey)
    model: Model (ForeignKey, null=True, blank=True)
    model_etc: str (CharField, max_length=100, blank=True)
    category: Category (ForeignKey)
    category_etc: str (CharField, max_length=100, blank=True)
    tags: str (TextField, blank=True)  # JSON 문자열로 저장
    prompt: str (TextField)
    ai_response: str (TextField)
    additional_opinion: str (TextField, blank=True)
    satisfaction: float (FloatField, null=True, blank=True)
    view_count: int (IntegerField, default=0)
    like_count: int (IntegerField, default=0)
    bookmark_count: int (IntegerField, default=0)
    created_at: datetime (DateTimeField, auto_now_add=True)
    updated_at: datetime (DateTimeField, auto_now=True)
    
    Meta:
        ordering = ['-created_at']
```

### PostInteraction
```python
class PostInteraction(models.Model):
    id: int (AutoField, Primary Key)
    user: CustomUser (ForeignKey)
    post: Post (ForeignKey)
    is_liked: bool (BooleanField, default=False)
    is_bookmarked: bool (BooleanField, default=False)
    created_at: datetime (DateTimeField, auto_now_add=True)
    updated_at: datetime (DateTimeField, auto_now=True)
    
    Meta:
        unique_together = ['user', 'post']
```

## 🔄 Serializers (API 응답 타입)

### PlatformSerializer
```python
{
    "id": int,
    "name": str
}
```

### ModelSerializer
```python
{
    "id": int,
    "name": str,
    "platform": int,  # Platform ID
    "platformName": str  # Platform name
}
```

### CategorySerializer
```python
{
    "id": int,
    "name": str
}
```

### PostCardSerializer
```python
{
    "id": int,
    "title": str,
    "author": str,  # username
    "authorInitial": str,  # username[0].upper()
    "avatarSrc": str | null,  # 아바타 이미지 소스
    "createdAt": str,  # ISO datetime string
    "relativeTime": str,  # 상대적 시간 (예: "5분 전", "2시간 전")
    "views": int,
    "satisfaction": float,
    
    # ID 기반 필드들
    "platformId": int,
    "modelId": int | null,
    "modelEtc": str,
    "categoryId": int,
    "categoryEtc": str,
    
    # 상호작용 필드들
    "likes": int,
    "isLiked": bool,
    "bookmarks": int,
    "isBookmarked": bool,
    "tags": list[str]
}
```

### PostDetailSerializer
```python
{
    "id": int,
    "title": str,
    "author": str,  # username
    "authorInitial": str,  # username[0].upper()
    "avatarSrc": str | null,  # 아바타 이미지 소스
    "createdAt": str,  # ISO datetime string
    "relativeTime": str,  # 상대적 시간 (예: "5분 전", "2시간 전")
    "views": int,
    "satisfaction": float,
    
    # ID 기반 필드들
    "platformId": int,
    "modelId": int | null,
    "modelEtc": str,
    "categoryId": int,
    "categoryEtc": str,
    
    # 상호작용 필드들
    "likes": int,
    "isLiked": bool,
    "bookmarks": int,
    "isBookmarked": bool,
    "tags": list[str],
    
    # 게시글 내용
    "prompt": str,
    "aiResponse": str,
    "additionalOpinion": str,
    
    # 권한 필드
    "isAuthor": bool
}
```

### PostCreateSerializer (POST 요청용)
```python
{
    "title": str,  # min_length=3
    "platform": int,  # Platform ID
    "model": int | null,  # Model ID (null 가능)
    "model_etc": str,  # 기타 모델명 (model이 null일 때)
    "category": int,  # Category ID
    "category_etc": str,  # 기타 카테고리명
    "tags": list[str],  # max 10개, 각각 max 50자
    "satisfaction": float | null,  # 0.5 단위
    "prompt": str,  # min_length=5
    "ai_response": str,  # min_length=10
    "additional_opinion": str  # optional
}
```

### PostEditSerializer (PUT/PATCH 요청용)
```python
# 읽기 전용 필드들 (편집 페이지 로드용)
{
    "platformId": int,
    "modelId": int | null,
    "modelEtc": str,
    "categoryId": int,
    "categoryEtc": str,
    "aiResponse": str,
    "additionalOpinion": str,
    "tags": list[str]
}

# 쓰기 가능 필드들 (수정 제출용)
{
    "platform": int,  # Platform ID
    "model": int | null,  # Model ID
    "model_etc": str,  # 기타 모델명
    "category": int,  # Category ID
    "category_etc": str,  # 기타 카테고리명
    "tags_input": list[str],  # 태그 입력용
    "ai_response": str,
    "additional_opinion": str
}
```

### PostInteractionSerializer
```python
{
    "is_liked": bool,
    "is_bookmarked": bool
}
```

## 🔗 Related Fields

### Post 모델의 Related Fields
- `post.platform` → Platform 객체
- `post.model` → Model 객체 (null 가능)
- `post.category` → Category 객체
- `post.author` → CustomUser 객체
- `post.interactions.all()` → PostInteraction QuerySet

### PostInteraction 모델의 Related Fields
- `interaction.user` → CustomUser 객체
- `interaction.post` → Post 객체

## ✅ Validation Rules

### PostCreateSerializer & PostEditSerializer
- `title`: 최소 3자 이상
- `prompt`: 최소 5자 이상
- `ai_response`: 최소 10자 이상
- `tags`: 최대 10개, 각각 최대 50자
- `satisfaction`: 0.5점 단위
- `platform`: 필수 선택
- `category`: 필수 선택
- `model`: platform이 선택된 경우 필수 (model 또는 model_etc 중 하나)

### Business Logic Validation
- 플랫폼이 선택되었지만 모델이 선택되지 않은 경우 → 모델 선택 또는 기타 모델명 입력 필수

## 🎨 Frontend Integration Notes

### 상대적 시간 변환
- 백엔드에서 `format_relative_time()` 함수로 계산
- 프론트엔드는 `relativeTime` 필드를 그대로 사용
- 예시: "방금 전", "5분 전", "2시간 전", "3일 전", "2주 전", "3개월 전", "1년 전"

### ID 기반 필터링
- 플랫폼, 모델, 카테고리는 ID로 필터링
- 프론트엔드에서 표시명 변환은 `getModelName()`, `getCategoryName()` 함수 사용

### 아바타 처리
- `avatarSrc`는 `null` 또는 이미지 URL
- 프론트엔드에서 `authorInitial`로 폴백 처리

## 🛠️ Core App Integration

### Pagination
- `PostPagination`: 페이지당 12개, 최대 50개
- 응답에 `count`, `next`, `previous`, `results`, `current_page`, `total_pages`, `has_next`, `has_previous` 포함

### Filtering
- `PostFilter`: Platform, Model, Category ID 기반 필터링
- 쉼표로 구분된 ID 문자열로 전송 (예: "1,2,3")

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

### Search
- `SearchManager`: 다양한 검색 방식 지원
- `search_posts(queryset, query, search_type)` 메서드 사용

## 📝 Utils Functions

### format_relative_time(date_obj)
```python
def format_relative_time(date_obj: datetime) -> str:
    """
    날짜 객체를 상대적 시간 문자열로 변환
    
    Returns:
        str: 상대적 시간 문자열 (예: "5분 전", "2시간 전", "3일 전")
    """
```

### Post 모델 메서드
```python
def get_tags_list(self) -> list[str]:
    """태그 JSON 문자열을 리스트로 변환"""
    
def get_display_model_name(self) -> str:
    """표시용 모델명 반환 (model_etc 우선)"""
    
def get_display_category_name(self) -> str:
    """표시용 카테고리명 반환 (category_etc 우선)"""
``` 