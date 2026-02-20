# PromptHub 핵심기능 코드 + 포트폴리오 문장

아래 6개는 실제 코드에서 바로 설명 가능한 기능만 추렸습니다.  
각 항목은 `문제/해결`, `핵심 코드`, `설명`, `성과 중심 문장`으로 구성했습니다.

## 1) 이메일 로그인 + 세션 메타데이터 기록

**코드 위치**  
- `backend/users/views.py` (`UserLoginView.post`)

**문제/해결**  
- 문제: 유저 프로필 위치 자동 설정과 활성 세션 관리 기능을 위해서는 로그인 시점의 IP/기기 정보가 필요했습니다.  
- 해결: 로그인 성공 시 토큰 발급과 함께 `UserSession`을 생성하고 IP/기기/브라우저/OS 정보를 저장하도록 구성했습니다.

**핵심 코드**
```python
serializer = UserLoginSerializer(data=request.data, context={'request': request})
if serializer.is_valid():
    user = serializer.validated_data['user']

    token, _ = Token.objects.get_or_create(user=user)

    raw_ua = request.META.get('HTTP_USER_AGENT', '')
    ua = parse_ua(raw_ua) if raw_ua else None
    ip = (request.META.get('HTTP_X_FORWARDED_FOR') or '').split(',')[0] or request.META.get('REMOTE_ADDR')

    session = UserSession.objects.create(
        user=user,
        key=token_urlsafe(32),
        user_agent=raw_ua,
        ip_address=ip,
        device=ua.device.family if ua else None,
        browser=ua.browser.family if ua else None,
        os=ua.os.family if ua else None,
    )
```

**설명(면접에서 이렇게 말하면 됨)**  
- 인증 성공 직후 토큰과 세션 엔터티를 동시에 생성해 인증과 접속 이력을 분리 관리했습니다.  
- `X-Forwarded-For` 우선으로 실제 클라이언트 IP를 잡아 운영 환경(리버스 프록시)도 고려했습니다.

**이력서/포트폴리오 문장**  
- DRF Token 인증에 세션 엔터티를 결합해 `디바이스/브라우저/IP 단위 로그인 추적`을 구현, 계정 보안 운영성을 높였습니다.  
- 로그인 시점 메타데이터를 구조화해 다중기기 세션 관리 기능(개별/전체 로그아웃)의 기반을 구축했습니다.

## 2) Google OAuth 로그인 검증 + 기본 사용자 생성

**코드 위치**  
- `backend/users/views.py` (`GoogleLoginView.post`)

**문제/해결**  
- 문제: 프론트에서 전달한 ID 토큰만 믿으면 잘못된 토큰이 들어와도 구분하기 어렵습니다.  
- 해결: 백엔드에서 Google `tokeninfo`를 호출해 토큰 상태를 확인하고, 필요한 값(email, aud)을 검사한 뒤 로그인 처리했습니다.

**핵심 코드**
```python
id_token = request.data.get('id_token')
resp = requests.get('https://oauth2.googleapis.com/tokeninfo', params={'id_token': id_token}, timeout=5)
if resp.status_code != 200:
    return Response({'message': '유효하지 않은 Google 토큰입니다.'}, status=400)

data = resp.json()
email = data.get('email')
email_verified = str(data.get('email_verified')).lower() == 'true'
expected_client_id = os.environ.get('GOOGLE_CLIENT_ID') or os.environ.get('NEXT_PUBLIC_GOOGLE_CLIENT_ID')
audience = data.get('aud')

if expected_client_id and audience != expected_client_id:
    return Response({'message': '허용되지 않은 클라이언트에서 발급된 토큰입니다.'}, status=400)
if not email or not email_verified:
    return Response({'message': '이메일 확인에 실패했습니다.'}, status=400)

user = CustomUser.objects.filter(email=email).first()
if not user:
    user = CustomUser.objects.create_user(email=email, password=None, is_active=True)
    UserSettings.objects.get_or_create(user=user)
```

**설명(면접에서 이렇게 말하면 됨)**  
- 소셜 로그인 버튼만 붙이는 수준에서 끝내지 않고, 서버에서 토큰 검증 과정을 한 번 더 넣었습니다.  
- 신규 사용자면 기본 계정과 설정을 같이 만들어서 바로 서비스를 사용할 수 있게 했습니다.

**이력서/포트폴리오 문장**  
- Google OAuth 로그인 시 ID 토큰을 서버에서 재검증(`tokeninfo`, `aud`, `email_verified`)하도록 구현했습니다.  
- 신규 OAuth 사용자는 계정/기본 설정을 자동 생성해 첫 로그인 이후 바로 서비스 이용이 가능하도록 구성했습니다.

## 3) 다중 세션 종료 API(개별 종료/전체 종료)

**코드 위치**  
- `backend/users/views.py` (`UserSessionsView.delete`)

**문제/해결**  
- 문제: 다른 기기 로그인 기록이 남아 있을 때 사용자가 직접 정리하기 어려웠습니다.  
- 해결: 특정 세션만 종료하거나, 현재 세션을 제외한 나머지 세션을 한 번에 종료할 수 있게 만들었습니다.

**핵심 코드**
```python
key = request.query_params.get('key')
end_all = request.query_params.get('all') == 'true'
current_key = request.headers.get('X-Session-Key')

if end_all:
    qs = UserSession.objects.filter(user=request.user)
    if current_key:
        qs = qs.exclude(key=current_key)
    updated = qs.update(revoked_at=timezone.now())
    return Response({'message': '다른 모든 세션을 종료했습니다.', 'count': updated}, status=200)

if not key:
    return Response({'message': '세션 키가 필요합니다.'}, status=400)

session = UserSession.objects.get(user=request.user, key=key)
session.revoked_at = timezone.now()
session.save()
return Response({'message': '세션이 종료되었습니다.'}, status=200)
```

**설명(면접에서 이렇게 말하면 됨)**  
- 세션을 바로 지우기보다 `revoked_at` 시각을 기록해서 종료 상태를 확인할 수 있게 했습니다.  
- `X-Session-Key`를 받아 현재 로그인한 기기는 유지하고 다른 기기만 로그아웃할 수 있게 했습니다.

**이력서/포트폴리오 문장**  
- 세션 키 기반으로 `개별 종료`와 `현재 기기 제외 전체 종료` 기능을 구현했습니다.  
- 세션 종료 시점을 `revoked_at`으로 기록해 세션 상태를 확인할 수 있도록 했습니다.

## 4) 리뷰(게시글) CRUD API (생성/조회/수정/삭제 + 권한 검사)

**코드 위치**  
- `backend/posts/views.py` (`posts_list`, `post_detail`, `post_create`, `post_update`, `post_delete`)

**문제/해결**  
- 문제: 커뮤니티 핵심 도메인인 리뷰 콘텐츠를 안전하게 생성/수정/삭제하려면 인증, 권한, 유효성 검증이 함께 필요합니다.  
- 해결: 목록/상세(읽기)와 생성/수정/삭제(쓰기)를 분리하고, 쓰기 요청에 토큰 인증 + 작성자 권한 검사를 적용했습니다.

**핵심 코드**
```python
@require_http_methods(["POST"])
@token_required
def post_create(request):
    data = json.loads(request.body)
    serializer = PostCreateSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        post = serializer.save()
        return JsonResponse({'status': 'success', 'data': PostDetailSerializer(post).data}, status=201)
    return JsonResponse({'status': 'error', 'errors': serializer.errors}, status=400)

@require_http_methods(["PUT", "PATCH"])
@token_required
def post_update(request, post_id):
    post = Post.objects.get(id=post_id)
    if post.author != request.user:
        return JsonResponse({'status': 'error', 'message': '게시글을 수정할 권한이 없습니다.'}, status=403)
    data = json.loads(request.body)
    serializer = PostEditSerializer(post, data=data, partial=(request.method == 'PATCH'), context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error', 'errors': serializer.errors}, status=400)

@require_http_methods(["DELETE"])
@token_required
def post_delete(request, post_id):
    post = Post.objects.get(id=post_id)
    if post.author != request.user:
        return JsonResponse({'status': 'error', 'message': '게시글을 삭제할 권한이 없습니다.'}, status=403)
    with transaction.atomic():
        post.delete()
```

**설명(면접에서 이렇게 말하면 됨)**  
- 읽기 API(`posts_list`, `post_detail`)와 쓰기 API(`create/update/delete`)를 명확히 분리해 책임을 단순화했습니다.  
- 수정/삭제는 작성자 본인만 가능하도록 `post.author == request.user` 권한 체크를 강제해 무단 변경을 방지했습니다.

**이력서/포트폴리오 문장**  
- 리뷰 도메인 CRUD를 REST API로 구현하고, 생성/수정/삭제 경로에 토큰 인증과 작성자 권한 검사를 적용해 데이터 무결성을 강화했습니다.  
- Serializer 기반 유효성 검증과 표준 에러 응답 구조를 적용해 프론트-백 간 오류 처리 일관성을 높였습니다.

## 5) 통합 검색 API(검색/필터/정렬/페이지네이션) + N+1 완화

**코드 위치**  
- `backend/core/views.py` (`search_posts`)  
- `backend/posts/services/post_service.py` (`build_posts_page`)

**문제/해결**  
- 문제: 검색/필터/정렬 로직이 흩어져 있으면 기능 추가할 때 수정 포인트가 많아집니다.  
- 해결: 처리 순서를 고정(검색 -> 필터 -> 정렬 -> 페이지네이션)하고, 상호작용 데이터는 prefetch로 미리 조회했습니다.

**핵심 코드**
```python
queryset = Post.objects.all()

if query:
    queryset = SearchManager.search_posts(queryset, query)

if categories:
    queryset = queryset.filter(category_id__in=category_ids)
if platforms:
    queryset = queryset.filter(platform_id__in=platform_ids)
if models:
    queryset = queryset.filter(model_id__in=model_ids)

queryset = SortManager.sort_posts(queryset, sort_by)
page = paginator.paginate_queryset(queryset, request)
```

```python
if request.user.is_authenticated:
    queryset = queryset.prefetch_related(
        Prefetch("interactions", queryset=PostInteraction.objects.filter(user=request.user))
    )
```

**설명(면접에서 이렇게 말하면 됨)**  
- 목록 조회 로직을 한 흐름으로 정리해서 어떤 단계에서 문제가 나는지 확인하기 쉽게 만들었습니다.  
- 좋아요/북마크 여부를 함께 보여줄 때 prefetch를 사용해 불필요한 반복 쿼리를 줄였습니다.

**이력서/포트폴리오 문장**  
- 게시글 목록 API를 `검색/필터/정렬/페이지네이션` 흐름으로 통합해 기능 추가 시 수정 포인트를 줄였습니다.  
- 사용자 상호작용 prefetch를 적용해 목록 조회 시 반복 쿼리(N+1)를 완화했습니다.

## 6) 조회수 증가 로직 동시성 처리

**코드 위치**  
- `backend/posts/services/post_service.py` (`get_post_and_increment_views`)

**문제/해결**  
- 문제: 요청이 동시에 들어오면 조회수 값이 정확히 반영되지 않을 수 있습니다.  
- 해결: `transaction.atomic()`과 `F("view_count") + 1`을 사용해 DB에서 안전하게 증가 처리했습니다.

**핵심 코드**
```python
def get_post_and_increment_views(post_id: int) -> Optional[Post]:
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return None

    with transaction.atomic():
        Post.objects.filter(id=post_id).update(view_count=F("view_count") + 1)
        post.refresh_from_db()

    return post
```

**설명(면접에서 이렇게 말하면 됨)**  
- 값을 읽어서 파이썬에서 더한 뒤 저장하는 방식 대신, DB 증가 연산을 사용해 충돌 가능성을 줄였습니다.  
- 게시글이 없을 때는 바로 `None`을 반환해 이후 로직에서 404 처리하도록 했습니다.

**이력서/포트폴리오 문장**  
- 조회수 증가를 `transaction.atomic + F expression`으로 구현해 동시 요청에서도 값이 덜 틀어지도록 처리했습니다.  
- 단순 카운트 로직이라도 동시성 이슈를 고려해 데이터 정확도를 높였습니다.
