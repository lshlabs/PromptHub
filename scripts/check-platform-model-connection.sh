#!/bin/bash

echo "🔍 PromptHub 플랫폼-모델 연결 관계 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1단계: 가상환경 활성화
echo "📋 1단계: 가상환경 활성화"
source backend/venv/bin/activate
if [ $? -eq 0 ]; then
    echo "   ✅ 가상환경 활성화 완료"
else
    echo "   ❌ 가상환경 활성화 실패"
    exit 1
fi

# 2단계: Django 셸에서 연결 관계 확인
echo "📋 2단계: 플랫폼-모델 연결 관계 확인"
python backend/manage.py shell << 'EOF'
from posts.models import Platform, Model

print("\n📱 플랫폼별 모델 연결 관계 확인")
print("=" * 50)

# 모든 플랫폼 조회
platforms = Platform.objects.all().order_by('name')

for platform in platforms:
    print(f"\n🔹 {platform.name} (ID: {platform.id})")
    print("-" * 30)
    
    # 해당 플랫폼의 모델들 조회
    models = Model.objects.filter(platform=platform).order_by('name')
    
    if models.exists():
        for model in models:
            print(f"  ✅ {model.name} (ID: {model.id})")
        print(f"  📊 총 {models.count()}개 모델")
    else:
        print("  ❌ 연결된 모델이 없습니다")
    
    # 연결 관계 검증
    for model in models:
        if model.platform != platform:
            print(f"  ⚠️  경고: {model.name}의 플랫폼이 {model.platform.name}로 잘못 연결됨")

print("\n" + "=" * 50)
print("🔍 전체 통계")
print("=" * 50)

total_platforms = Platform.objects.count()
total_models = Model.objects.count()
print(f"📱 총 플랫폼 수: {total_platforms}")
print(f"🤖 총 모델 수: {total_models}")

# 플랫폼별 모델 수 통계
print(f"\n📊 플랫폼별 모델 수:")
for platform in platforms:
    model_count = Model.objects.filter(platform=platform).count()
    print(f"  {platform.name}: {model_count}개")

# 연결되지 않은 모델 확인
orphaned_models = Model.objects.filter(platform__isnull=True)
if orphaned_models.exists():
    print(f"\n⚠️  연결되지 않은 모델: {orphaned_models.count()}개")
    for model in orphaned_models:
        print(f"  - {model.name}")
else:
    print(f"\n✅ 모든 모델이 플랫폼에 정상적으로 연결됨")

print("\n" + "=" * 50)
print("✅ 연결 관계 확인 완료")
EOF

echo "📋 3단계: 확인 완료"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 결과 해석:"
echo "   ✅ 각 모델이 올바른 플랫폼에 연결되어 있는지 확인"
echo "   📊 플랫폼별 모델 수가 예상과 일치하는지 확인"
echo "   ⚠️  연결되지 않은 모델이 있는지 확인" 