#!/bin/bash
# pka2xml Project Setup & Dependency Reassembly Script
# 이 스크립트는 분할된 대용량 벤더링 라이브러리들을 하나로 합쳐줍니다.

echo "🦅 pka2xml Ultra-Vendored Setup 시작..."

# 1. CryptoPP reassembly
if [ -f vendor/cryptopp/libcryptopp.a.part_aa ]; then
    echo "📦 CryptoPP 라이브러리 재조립 중..."
    cat vendor/cryptopp/libcryptopp.a.part_* > vendor/cryptopp/libcryptopp.a
    echo "✅ CryptoPP 완료."
fi

# 2. Electron binary reassembly (GUI)
ELECTRON_PATH="gui/node_modules/electron/dist/electron"
if [ -f "${ELECTRON_PATH}.part_aa" ]; then
    echo "📦 Electron 바이너리(GUI) 재조립 중..."
    cat "${ELECTRON_PATH}.part_"* > "${ELECTRON_PATH}"
    chmod +x "${ELECTRON_PATH}"
    echo "✅ Electron 완료."
fi

# 3. pka2xml CLI Build (Statically linked)
if [ ! -f pka2xml ]; then
    echo "🛠️ pka2xml 바이너리 빌드 중..."
    make pka2xml-vendor
    echo "✅ pka2xml 빌드 완료."
fi

# 4. Finalize
touch .setup_done
echo "🚀 모든 준비가 끝났다! 이제 GUI나 CLI를 마음껏 즐겨라! (Eagle fly free! 🦅)"
