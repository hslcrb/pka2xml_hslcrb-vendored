#!/bin/bash
# pka2xml WASM Build Script
# 이 스크립트는 Emscripten 툴체인을 사용하여 pka2xml C++ 코어를 WebAssembly로 컴파일합니다.
# 사전 요구사항: emsdk가 설치되어 있어야 합니다.
#   git clone https://github.com/emscripten-core/emsdk.git
#   cd emsdk && ./emsdk install latest && ./emsdk activate latest && source ./emsdk_env.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$PROJECT_ROOT/web"
VENDOR="$PROJECT_ROOT/vendor"
OUT_DIR="$WEB_DIR/public"

echo "=== pka2xml WASM Build ==="
echo "프로젝트: $PROJECT_ROOT"
echo "출력:     $OUT_DIR/pka2xml.js + pka2xml.wasm"
echo ""

# emsdk 체크
if ! command -v emcc &> /dev/null; then
    echo "[ERROR] emcc(Emscripten)를 찾을 수 없습니다."
    echo "  설치 방법:"
    echo "    git clone https://github.com/emscripten-core/emsdk.git"
    echo "    cd emsdk && ./emsdk install latest && ./emsdk activate latest"
    echo "    source ./emsdk_env.sh"
    exit 1
fi

echo "[1/3] vendor 라이브러리 WASM 재컴파일 중..."
echo "  ⚠ 주의: 기존 리눅스 .a 파일은 WASM 미지원입니다."
echo "  Emscripten으로 CryptoPP를 재컴파일합니다 (시간 소요)."

cd "$VENDOR/cryptopp"
if [ ! -f libcryptopp_wasm.a ]; then
    echo "  📦 CryptoPP 컴파일 중..."
    # CryptoPP는 기본 GNUmakefile을 시스템 변수 주입으로 빌드 가능
    emmake make -f GNUmakefile \
        CXXFLAGS="-DNDEBUG -g2 -O3" \
        libcryptopp.a -j4 2>&1 | tail -5
    mv libcryptopp.a libcryptopp_wasm.a
    echo "  ✓ CryptoPP WASM 컴파일 완료"
else
    echo "  ✓ libcryptopp_wasm.a 이미 존재 (skip)"
fi

cd "$VENDOR/re2"
if [ ! -f obj/libre2_wasm.a ]; then
    echo "  📦 RE2 (2022-12-01) 컴파일 중..."
    # 최신 RE2는 Abseil 의존성이 강하므로, 2022년도 버전 사용 권장
    emmake make CXXFLAGS="-O3 -DNDEBUG" obj/libre2.a -j4 2>&1 | tail -5
    mkdir -p obj
    cp obj/libre2.a obj/libre2_wasm.a
    echo "  ✓ RE2 WASM 컴파일 완료"
else
    echo "  ✓ libre2_wasm.a 이미 존재 (skip)"
fi

echo ""
echo "[2/3] pka2xml.wasm 컴파일 중..."
mkdir -p "$OUT_DIR"
cd "$PROJECT_ROOT"

emcc main.cpp \
    -I. \
    -I./vendor \
    -I./vendor/re2 \
    "$VENDOR/cryptopp/libcryptopp_wasm.a" \
    "$VENDOR/re2/obj/libre2_wasm.a" \
    -s USE_ZLIB=1 \
    -std=c++17 \
    -O3 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME=createPka2xml \
    -s EXPORTED_FUNCTIONS='["_main"]' \
    -s EXPORTED_RUNTIME_METHODS='["FS","callMain","stringToUTF8","UTF8ToString"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INVOKE_RUN=0 \
    -s EXIT_RUNTIME=0 \
    -s ENVIRONMENT=web \
    -o "$OUT_DIR/pka2xml.js"

echo ""
echo "[3/3] 출력 확인..."
ls -lh "$OUT_DIR/pka2xml.js" "$OUT_DIR/pka2xml.wasm" 2>/dev/null && \
    echo "✅ 빌드 성공! 이제 'npm run dev'로 앱을 시작하세요." || \
    echo "❌ 빌드 실패. 위 오류를 확인하세요."
