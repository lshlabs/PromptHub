#!/bin/bash

# PromptHub 포트포워딩 설정 관리 스크립트
# 공인 IP 하드코딩 부분을 환경변수로 관리하여 적용/삭제 가능

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정 파일 경로들
BACKEND_SETTINGS="backend/config/settings/base.py"
FRONTEND_API="frontend/lib/api.ts"
FRONTEND_REVIEWS_API="frontend/lib/api/reviews.ts"
PORTFORWARD_SCRIPT="scripts/start-dev-portforward.sh"

# 기본 공인 IP (변경 가능)
DEFAULT_PUBLIC_IP="61.84.96.94"

# 함수: 도움말 출력
show_help() {
    echo -e "${BLUE}PromptHub 포트포워딩 설정 관리 스크립트${NC}"
    echo ""
    echo "사용법:"
    echo "  $0 [옵션] [공인IP]"
    echo ""
    echo "옵션:"
    echo "  apply    - 포트포워딩 설정 적용 (공인IP 하드코딩)"
    echo "  remove   - 포트포워딩 설정 제거 (로컬 설정으로 복원)"
    echo "  status   - 현재 설정 상태 확인"
    echo "  help     - 도움말 출력"
    echo ""
    echo "예시:"
    echo "  $0 apply 61.84.96.94    # 특정 공인IP로 포트포워딩 설정"
    echo "  $0 apply                # 기본 공인IP로 포트포워딩 설정"
    echo "  $0 remove               # 포트포워딩 설정 제거"
    echo "  $0 status               # 현재 설정 상태 확인"
    echo ""
}

# 함수: 현재 설정 상태 확인
check_status() {
    echo -e "${BLUE}현재 포트포워딩 설정 상태:${NC}"
    echo ""
    
    # 백엔드 설정 확인
    if grep -q "$DEFAULT_PUBLIC_IP" "$BACKEND_SETTINGS" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} 백엔드: 포트포워딩 설정됨 (ALLOWED_HOSTS에 $DEFAULT_PUBLIC_IP 포함)"
    else
        echo -e "  ${YELLOW}○${NC} 백엔드: 로컬 설정 (포트포워딩 미설정)"
    fi
    
    # 프론트엔드 API 설정 확인
    if grep -q "$DEFAULT_PUBLIC_IP" "$FRONTEND_API" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} 프론트엔드 API: 포트포워딩 설정됨"
    else
        echo -e "  ${YELLOW}○${NC} 프론트엔드 API: 로컬 설정 (포트포워딩 미설정)"
    fi
    
    # 프론트엔드 Reviews API 설정 확인
    if grep -q "$DEFAULT_PUBLIC_IP" "$FRONTEND_REVIEWS_API" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} 프론트엔드 Reviews API: 포트포워딩 설정됨"
    else
        echo -e "  ${YELLOW}○${NC} 프론트엔드 Reviews API: 로컬 설정 (포트포워딩 미설정)"
    fi
    
    # 포트포워딩 스크립트 확인
    if [ -f "$PORTFORWARD_SCRIPT" ]; then
        echo -e "  ${GREEN}✓${NC} 포트포워딩 스크립트: 존재함"
    else
        echo -e "  ${YELLOW}○${NC} 포트포워딩 스크립트: 미존재"
    fi
    
    echo ""
}

# 함수: 백업 파일 생성
create_backup() {
    local file="$1"
    local backup_file="${file}.backup.$(date +%Y%m%d_%H%M%S)"
    
    if [ -f "$file" ]; then
        cp "$file" "$backup_file"
        echo -e "  ${GREEN}✓${NC} 백업 생성: $backup_file"
    fi
}

# 함수: 포트포워딩 설정 적용
apply_portforward() {
    local public_ip="${1:-$DEFAULT_PUBLIC_IP}"
    
    echo -e "${BLUE}포트포워딩 설정을 적용합니다...${NC}"
    echo -e "  공인 IP: ${GREEN}$public_ip${NC}"
    echo ""
    
    # 파일 존재 확인
    for file in "$BACKEND_SETTINGS" "$FRONTEND_API" "$FRONTEND_REVIEWS_API"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}❌ 파일이 존재하지 않습니다: $file${NC}"
            exit 1
        fi
    done
    
    # 백업 생성
    echo "백업 파일 생성 중..."
    create_backup "$BACKEND_SETTINGS"
    create_backup "$FRONTEND_API"
    create_backup "$FRONTEND_REVIEWS_API"
    echo ""
    
    # 1. 백엔드 설정 업데이트
    echo "백엔드 설정 업데이트 중..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '[^']*')/ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0,$public_ip')/g" "$BACKEND_SETTINGS"
        sed -i '' "s/\"http:\/\/[0-9.]*:3000\",  # 외부 IP/\"http:\/\/$public_ip:3000\",  # 외부 IP/g" "$BACKEND_SETTINGS"
    else
        # Linux
        sed -i "s/ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '[^']*')/ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0,$public_ip')/g" "$BACKEND_SETTINGS"
        sed -i "s/\"http:\/\/[0-9.]*:3000\",  # 외부 IP/\"http:\/\/$public_ip:3000\",  # 외부 IP/g" "$BACKEND_SETTINGS"
    fi
    echo -e "  ${GREEN}✓${NC} 백엔드 설정 완료"
    
    # 2. 프론트엔드 API 설정 업데이트
    echo "프론트엔드 API 설정 업데이트 중..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/if (hostname === \"[0-9.]*\" || hostname === \"0.0.0.0\") {/if (hostname === \"$public_ip\" || hostname === \"0.0.0.0\") {/g" "$FRONTEND_API"
        sed -i '' "s/return \"http:\/\/[0-9.]*:8000\/api\"/return \"http:\/\/$public_ip:8000\/api\"/g" "$FRONTEND_API"
    else
        # Linux
        sed -i "s/if (hostname === \"[0-9.]*\" || hostname === \"0.0.0.0\") {/if (hostname === \"$public_ip\" || hostname === \"0.0.0.0\") {/g" "$FRONTEND_API"
        sed -i "s/return \"http:\/\/[0-9.]*:8000\/api\"/return \"http:\/\/$public_ip:8000\/api\"/g" "$FRONTEND_API"
    fi
    echo -e "  ${GREEN}✓${NC} 프론트엔드 API 설정 완료"
    
    # 3. 프론트엔드 Reviews API 설정 업데이트
    echo "프론트엔드 Reviews API 설정 업데이트 중..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/if (hostname === \"[0-9.]*\" || hostname === \"0.0.0.0\") {/if (hostname === \"$public_ip\" || hostname === \"0.0.0.0\") {/g" "$FRONTEND_REVIEWS_API"
        sed -i '' "s/return \"http:\/\/[0-9.]*:8000\"/return \"http:\/\/$public_ip:8000\"/g" "$FRONTEND_REVIEWS_API"
    else
        # Linux
        sed -i "s/if (hostname === \"[0-9.]*\" || hostname === \"0.0.0.0\") {/if (hostname === \"$public_ip\" || hostname === \"0.0.0.0\") {/g" "$FRONTEND_REVIEWS_API"
        sed -i "s/return \"http:\/\/[0-9.]*:8000\"/return \"http:\/\/$public_ip:8000\"/g" "$FRONTEND_REVIEWS_API"
    fi
    echo -e "  ${GREEN}✓${NC} 프론트엔드 Reviews API 설정 완료"
    
    echo ""
    echo -e "${GREEN}🎉 포트포워딩 설정이 성공적으로 적용되었습니다!${NC}"
    echo ""
    echo -e "${YELLOW}다음 단계:${NC}"
    echo "  1. 서버 재시작: ./scripts/start-dev-portforward.sh"
    echo "  2. 외부 접속 확인: http://$public_ip:3000"
    echo "  3. API 접속 확인: http://$public_ip:8000/api"
    echo ""
}

# 함수: 포트포워딩 설정 제거
remove_portforward() {
    echo -e "${BLUE}포트포워딩 설정을 제거합니다...${NC}"
    echo ""
    
    # 파일 존재 확인
    for file in "$BACKEND_SETTINGS" "$FRONTEND_API" "$FRONTEND_REVIEWS_API"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}❌ 파일이 존재하지 않습니다: $file${NC}"
            exit 1
        fi
    done
    
    # 백업 생성
    echo "백업 파일 생성 중..."
    create_backup "$BACKEND_SETTINGS"
    create_backup "$FRONTEND_API"
    create_backup "$FRONTEND_REVIEWS_API"
    echo ""
    
    # 1. 백엔드 설정 복원
    echo "백엔드 설정 복원 중..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '[^']*')/ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0')/g" "$BACKEND_SETTINGS"
        sed -i '' "s/\"http:\/\/[0-9.]*:3000\",  # 외부 IP/\"http:\/\/localhost:3000\",  # 외부 IP/g" "$BACKEND_SETTINGS"
    else
        # Linux
        sed -i "s/ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '[^']*')/ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0')/g" "$BACKEND_SETTINGS"
        sed -i "s/\"http:\/\/[0-9.]*:3000\",  # 외부 IP/\"http:\/\/localhost:3000\",  # 외부 IP/g" "$BACKEND_SETTINGS"
    fi
    echo -e "  ${GREEN}✓${NC} 백엔드 설정 복원 완료"
    
    # 2. 프론트엔드 API 설정 복원 (환경변수 기반으로 변경)
    echo "프론트엔드 API 설정 복원 중..."
    cat > "$FRONTEND_API" << 'EOF'
/**
 * API 유틸리티 함수들
 *
 * 백엔드 API와의 통신을 담당하는 재사용 가능한 함수들을 제공합니다.
 */

// 환경변수 기반 API 주소 결정
const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
}

const API_BASE_URL = getApiBaseUrl()

/**
 * 인증 토큰을 localStorage에서 가져옵니다.
 * @returns {string|null} 인증 토큰 또는 null
 */
export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token')
  }
  return null
}

/**
 * 인증 토큰을 localStorage에 저장합니다.
 * @param {string} token - 저장할 인증 토큰
 */
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token)
  }
}

/**
 * 인증 토큰을 localStorage에서 제거합니다.
 */
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
  }
}

/**
 * API 요청을 위한 기본 헤더를 생성합니다.
 * @returns {object} 요청 헤더 객체
 */
export const getApiHeaders = () => {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Token ${token}`
  }
  
  return headers
}

/**
 * API 요청을 수행합니다.
 * @param {string} endpoint - API 엔드포인트 (예: '/auth/login/')
 * @param {object} options - fetch 옵션
 * @returns {Promise<Response>} fetch 응답 Promise
 */
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    ...getApiHeaders(),
    ...options.headers,
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  return response
}

/**
 * 사용자 정보를 가져옵니다.
 * @returns {Promise<object>} 사용자 정보 객체
 */
export const fetchUserData = async () => {
  const response = await apiRequest('/auth/me/')
  
  if (!response.ok) {
    throw new Error('사용자 정보를 가져오는데 실패했습니다.')
  }
  
  return response.json()
}

/**
 * 사용자 로그아웃을 수행합니다.
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await apiRequest('/auth/logout/', {
      method: 'POST',
    })
  } catch (error) {
    console.error('로그아웃 요청 실패:', error)
  } finally {
    removeAuthToken()
  }
}

export { API_BASE_URL }
EOF
    echo -e "  ${GREEN}✓${NC} 프론트엔드 API 설정 복원 완료"
    
    # 3. 프론트엔드 Reviews API 설정 복원
    echo "프론트엔드 Reviews API 설정 복원 중..."
    cat > "$FRONTEND_REVIEWS_API" << 'EOF'
/**
 * 리뷰 시스템 API 클라이언트
 * 
 * 백엔드 API와 통신하는 함수들을 제공합니다.
 */

// 환경변수 기반 API 주소 결정
const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
}

const API_BASE_URL = getApiBaseUrl()

/**
 * 인증 토큰을 localStorage에서 가져옵니다.
 */
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token')
  }
  return null
}

/**
 * API 요청을 위한 기본 헤더를 생성합니다.
 */
const getApiHeaders = () => {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Token ${token}`
  }
  
  return headers
}

/**
 * 모든 리뷰를 가져옵니다.
 */
export const fetchReviews = async () => {
  const response = await fetch(`${API_BASE_URL}/api/reviews/`, {
    method: 'GET',
    headers: getApiHeaders(),
  })
  
  if (!response.ok) {
    throw new Error('리뷰를 가져오는데 실패했습니다.')
  }
  
  return response.json()
}

/**
 * 새로운 리뷰를 생성합니다.
 */
export const createReview = async (reviewData: any) => {
  const response = await fetch(`${API_BASE_URL}/api/reviews/`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify(reviewData),
  })
  
  if (!response.ok) {
    throw new Error('리뷰 생성에 실패했습니다.')
  }
  
  return response.json()
}

/**
 * 리뷰를 수정합니다.
 */
export const updateReview = async (reviewId: number, reviewData: any) => {
  const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/`, {
    method: 'PUT',
    headers: getApiHeaders(),
    body: JSON.stringify(reviewData),
  })
  
  if (!response.ok) {
    throw new Error('리뷰 수정에 실패했습니다.')
  }
  
  return response.json()
}

/**
 * 리뷰를 삭제합니다.
 */
export const deleteReview = async (reviewId: number) => {
  const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/`, {
    method: 'DELETE',
    headers: getApiHeaders(),
  })
  
  if (!response.ok) {
    throw new Error('리뷰 삭제에 실패했습니다.')
  }
}

/**
 * 플랫폼 목록을 가져옵니다.
 */
export const fetchPlatforms = async () => {
  const response = await fetch(`${API_BASE_URL}/api/platforms/`, {
    method: 'GET',
    headers: getApiHeaders(),
  })
  
  if (!response.ok) {
    throw new Error('플랫폼 목록을 가져오는데 실패했습니다.')
  }
  
  return response.json()
}

/**
 * 모델 목록을 가져옵니다.
 */
export const fetchModels = async () => {
  const response = await fetch(`${API_BASE_URL}/api/models/`, {
    method: 'GET',
    headers: getApiHeaders(),
  })
  
  if (!response.ok) {
    throw new Error('모델 목록을 가져오는데 실패했습니다.')
  }
  
  return response.json()
}

export { API_BASE_URL }
EOF
    echo -e "  ${GREEN}✓${NC} 프론트엔드 Reviews API 설정 복원 완료"
    
    echo ""
    echo -e "${GREEN}🎉 포트포워딩 설정이 성공적으로 제거되었습니다!${NC}"
    echo ""
    echo -e "${YELLOW}다음 단계:${NC}"
    echo "  1. 환경변수 설정: frontend/.env.local에서 NEXT_PUBLIC_API_URL 확인"
    echo "  2. 서버 재시작: ./scripts/start-dev.sh"
    echo "  3. 로컬 접속 확인: http://localhost:3000"
    echo ""
}

# 함수: 인터랙티브 메뉴 표시
show_menu() {
    clear
    echo -e "${BLUE}🚀 PromptHub 포트포워딩 설정 관리${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "다음 중 원하는 작업을 선택하세요:"
    echo ""
    echo -e "  ${GREEN}1${NC}. 현재 설정 상태 확인"
    echo -e "  ${GREEN}2${NC}. 포트포워딩 설정 적용"
    echo -e "  ${GREEN}3${NC}. 포트포워딩 설정 해제"
    echo -e "  ${GREEN}4${NC}. 도움말 보기"
    echo -e "  ${RED}0${NC}. 종료"
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 함수: 사용자 입력 받기
get_user_choice() {
    echo -n "선택 (0-4): "
    read choice
    echo ""
}

# 함수: 공인 IP 입력 받기
get_public_ip() {
    echo -e "${BLUE}포트포워딩 설정 적용${NC}"
    echo ""
    echo -e "공인 IP 주소를 입력하세요."
    echo -e "기본값: ${GREEN}$DEFAULT_PUBLIC_IP${NC}"
    echo -e "그대로 사용하려면 엔터를 누르세요."
    echo ""
    echo -n "공인 IP: "
    read input_ip
    
    if [ -z "$input_ip" ]; then
        echo -e "기본 IP ${GREEN}$DEFAULT_PUBLIC_IP${NC}를 사용합니다."
        echo ""
        apply_portforward "$DEFAULT_PUBLIC_IP"
    else
        echo -e "입력한 IP ${GREEN}$input_ip${NC}를 사용합니다."
        echo ""
        apply_portforward "$input_ip"
    fi
}

# 함수: 계속 진행 여부 확인
press_enter_to_continue() {
    echo ""
    echo -e "${YELLOW}계속하려면 엔터를 누르세요...${NC}"
    read
}

# 함수: 인터랙티브 모드 실행
run_interactive_mode() {
    while true; do
        show_menu
        get_user_choice
        
        case $choice in
            1)
                echo -e "${BLUE}현재 설정 상태를 확인합니다...${NC}"
                echo ""
                check_status
                press_enter_to_continue
                ;;
            2)
                get_public_ip
                press_enter_to_continue
                ;;
            3)
                echo -e "${BLUE}포트포워딩 설정을 해제합니다...${NC}"
                echo ""
                remove_portforward
                press_enter_to_continue
                ;;
            4)
                clear
                show_help
                press_enter_to_continue
                ;;
            0)
                echo -e "${GREEN}프로그램을 종료합니다. 안녕히 가세요! 👋${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ 잘못된 선택입니다. 0-4 사이의 숫자를 입력하세요.${NC}"
                sleep 2
                ;;
        esac
    done
}

# 메인 로직
if [ $# -eq 0 ]; then
    # 인수가 없으면 인터랙티브 모드 실행
    run_interactive_mode
else
    # 인수가 있으면 기존 방식으로 실행
    case "${1}" in
        "apply")
            apply_portforward "$2"
            ;;
        "remove")
            remove_portforward
            ;;
        "status")
            check_status
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo -e "${RED}❌ 알 수 없는 옵션: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
fi 