from django.db import migrations
from django.contrib.auth.hashers import make_password


DUMMY_USERS = [
    {
        "email": "sample.alpha@prompthub.test",
        "username": "sample-alpha",
        "password": "SamplePass123!@#",
        "avatar_color1": "#4F46E5",
        "avatar_color2": "#22D3EE",
        "bio": "백엔드 구조화와 API 리팩토링 실험을 주로 올리는 테스트 계정입니다.",
        "location": "Seoul, South Korea",
        "github_handle": "sample-alpha",
    },
    {
        "email": "sample.bravo@prompthub.test",
        "username": "sample-bravo",
        "password": "SamplePass123!@#",
        "avatar_color1": "#2563EB",
        "avatar_color2": "#60A5FA",
        "bio": "문서 자동화, 요약, 업무 생산성 프롬프트를 테스트하는 계정입니다.",
        "location": "Busan, South Korea",
        "github_handle": "sample-bravo",
    },
    {
        "email": "sample.charlie@prompthub.test",
        "username": "sample-charlie",
        "password": "SamplePass123!@#",
        "avatar_color1": "#0EA5E9",
        "avatar_color2": "#A78BFA",
        "bio": "운영/모니터링/디버깅 시나리오 테스트용 계정입니다.",
        "location": "Incheon, South Korea",
        "github_handle": "sample-charlie",
    },
    {
        "email": "sample.delta@prompthub.test",
        "username": "sample-delta",
        "password": "SamplePass123!@#",
        "avatar_color1": "#7C3AED",
        "avatar_color2": "#F472B6",
        "bio": "멀티모달 입력과 이미지 기반 프롬프트 테스트용 계정입니다.",
        "location": "Daegu, South Korea",
        "github_handle": "sample-delta",
    },
    {
        "email": "sample.echo@prompthub.test",
        "username": "sample-echo",
        "password": "SamplePass123!@#",
        "avatar_color1": "#DC2626",
        "avatar_color2": "#F59E0B",
        "bio": "비즈니스 보고서/실적 발표 자료 관련 게시글 테스트용 계정입니다.",
        "location": "Daejeon, South Korea",
        "github_handle": "sample-echo",
    },
    {
        "email": "sample.foxtrot@prompthub.test",
        "username": "sample-foxtrot",
        "password": "SamplePass123!@#",
        "avatar_color1": "#059669",
        "avatar_color2": "#34D399",
        "bio": "채용/커리어/면접 프롬프트 샘플 검증용 계정입니다.",
        "location": "Gwangju, South Korea",
        "github_handle": "sample-foxtrot",
    },
    {
        "email": "sample.golf@prompthub.test",
        "username": "sample-golf",
        "password": "SamplePass123!@#",
        "avatar_color1": "#EA580C",
        "avatar_color2": "#F97316",
        "bio": "오픈 웨이트 모델 비교 및 비용 검토 게시글 테스트용 계정입니다.",
        "location": "Suwon, South Korea",
        "github_handle": "sample-golf",
    },
    {
        "email": "sample.hotel@prompthub.test",
        "username": "sample-hotel",
        "password": "SamplePass123!@#",
        "avatar_color1": "#0891B2",
        "avatar_color2": "#22C55E",
        "bio": "트렌딩/랭킹 연동 게시글 샘플 검증용 계정입니다.",
        "location": "Ulsan, South Korea",
        "github_handle": "sample-hotel",
    },
    {
        "email": "sample.india@prompthub.test",
        "username": "sample-india",
        "password": "SamplePass123!@#",
        "avatar_color1": "#BE185D",
        "avatar_color2": "#FB7185",
        "bio": "고객 응대/번역/정책 문구 생성 테스트용 계정입니다.",
        "location": "Jeonju, South Korea",
        "github_handle": "sample-india",
    },
    {
        "email": "sample.juliet@prompthub.test",
        "username": "sample-juliet",
        "password": "SamplePass123!@#",
        "avatar_color1": "#4338CA",
        "avatar_color2": "#2DD4BF",
        "bio": "커뮤니티 UX 및 프로필 기능 통합 테스트용 계정입니다.",
        "location": "Jeju, South Korea",
        "github_handle": "sample-juliet",
    },
]


def seed_dummy_users(apps, schema_editor):
    User = apps.get_model("users", "CustomUser")
    UserSettings = apps.get_model("users", "UserSettings")

    for row in DUMMY_USERS:
        user, created = User.objects.get_or_create(
            email=row["email"],
            defaults={
                "username": row["username"],
                "password": make_password(row["password"]),
                "avatar_color1": row["avatar_color1"],
                "avatar_color2": row["avatar_color2"],
                "bio": row["bio"],
                "location": row["location"],
                "github_handle": row["github_handle"],
                "is_active": True,
            },
        )

        # 기존 레코드가 있어도 테스트 계정 데이터는 최신 템플릿으로 맞춰둠 (비밀번호는 유지)
        if not created:
            changed = False
            for key in ("avatar_color1", "avatar_color2", "bio", "location", "github_handle"):
                if getattr(user, key) != row[key]:
                    setattr(user, key, row[key])
                    changed = True
            if not user.username:
                user.username = row["username"]
                changed = True
            if changed:
                user.save(update_fields=[
                    "username",
                    "avatar_color1",
                    "avatar_color2",
                    "bio",
                    "location",
                    "github_handle",
                ])

        UserSettings.objects.get_or_create(user=user)


def unseed_dummy_users(apps, schema_editor):
    User = apps.get_model("users", "CustomUser")
    emails = [row["email"] for row in DUMMY_USERS]
    User.objects.filter(email__in=emails).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0005_usersession"),
    ]

    operations = [
        migrations.RunPython(seed_dummy_users, unseed_dummy_users),
    ]

