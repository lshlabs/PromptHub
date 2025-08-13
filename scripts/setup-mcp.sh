#!/bin/bash

# MCP 서버 설치 및 설정 스크립트
echo "🚀 MCP 서버 설치 시작..."

# 프로젝트 루트로 이동
cd "$(dirname "$0")/.."

# MCP 서버 저장소 클론 (이미 있으면 스킵)
if [ ! -d "servers" ]; then
    echo "📥 MCP 서버 저장소 다운로드 중..."
    git clone https://github.com/modelcontextprotocol/servers.git
fi

# File System 서버 빌드
echo "🔨 File System 서버 빌드 중..."
cd servers/src/filesystem
npm install
npm run build

# 프로젝트 루트로 돌아가기
cd ../../..

# .claude 디렉토리 생성
mkdir -p .claude

# MCP 설정 파일 생성
echo "⚙️ MCP 설정 파일 생성 중..."
cat > .claude/mcp.json << EOF
{
  "servers": {
    "filesystem": {
      "command": "node",
      "args": ["$(pwd)/servers/src/filesystem/dist/index.js"],
      "env": {
        "MCP_FILESYSTEM_ROOT": "$(pwd)",
        "MCP_FILESYSTEM_ALLOWED_PATHS": "$(pwd)/frontend,$(pwd)/backend"
      }
    }
  }
}
EOF

echo "✅ MCP 서버 설치 완료!"
echo "📁 설정 파일 위치: $(pwd)/.claude/mcp.json"
echo ""
echo "🔧 다음 단계:"
echo "1. Claude Code 재시작"
echo "2. 'claude mcp list' 명령어로 서버 확인"
echo "3. 파일 생성/수정 테스트" 