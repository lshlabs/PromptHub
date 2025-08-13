# PromptHub Backend

PromptHub의 Django 백엔드 프로젝트입니다.

## 설치 및 실행

### 1. 가상환경 활성화
```bash
source venv/bin/activate
```

### 2. 의존성 설치
```bash
pip install -r requirements.txt
```

### 3. 데이터베이스 마이그레이션
```bash
python3 manage.py makemigrations
python3 manage.py migrate
```

### 4. 서버 실행
```bash
python3 manage.py runserver
```

## 개발 환경

- Django 5.2.4
- SQLite (개발용) 