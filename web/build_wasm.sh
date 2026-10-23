#!/usr/bin/env bash
# Build the browser engine without overwriting native archives.
set -euo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_ROOT="${PKA2XML_VENDOR_ROOT:-$PROJECT_ROOT/vendor}"
BUILD_ROOT="${PKA2XML_WASM_BUILD_ROOT:-$PROJECT_ROOT/.build/wasm}"
OUT_DIR="$PROJECT_ROOT/web/public"
JOBS="${JOBS:-2}"

for tool in em++ emar emranlib make python3; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    printf 'Missing build tool: %s. Install Emscripten (tested with 6.0.13), then source emsdk_env.sh.\n' "$tool" >&2
    exit 1
  fi
done
for source in cryptopp/GNUmakefile re2/Makefile; do
  if [[ ! -f "$VENDOR_ROOT/$source" ]]; then
    printf 'Missing pinned source: %s. Run git submodule update --init --recursive first.\n' "$source" >&2
    exit 1
  fi
done
mkdir -p "$BUILD_ROOT/sources" "$OUT_DIR"

# Source fingerprinting keeps native and WASM object files separate.
python3 - "$VENDOR_ROOT" "$BUILD_ROOT/sources" <<'PY'
import hashlib
import pathlib
import shutil
import sys

vendor, target = map(pathlib.Path, sys.argv[1:])
for name in ("cryptopp", "re2"):
    source, dest = vendor / name, target / name
    ignored = shutil.ignore_patterns(".git", "*.o", "*.a", "*.so*", "*.exe", "obj", ".build")
    digest = hashlib.sha256()
    for item in sorted(source.rglob("*")):
        relative = item.relative_to(source)
        if ".git" in relative.parts or "obj" in relative.parts or ".build" in relative.parts:
            continue
        if item.is_file() and not item.is_symlink() and not any(item.name.endswith(ext) for ext in (".o", ".a", ".so", ".exe")):
            digest.update(str(relative).encode())
            digest.update(item.read_bytes())
    fingerprint = digest.hexdigest()
    stamp = dest / ".source-sha256"
    if not stamp.exists() or stamp.read_text() != fingerprint:
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(source, dest, ignore=ignored)
        stamp.write_text(fingerprint)
PY

FLAGS="-O2 -g0 -DNDEBUG -std=c++17 -sDISABLE_EXCEPTION_CATCHING=0"
printf 'Building isolated Crypto++ and RE2 archives (%s jobs).\n' "$JOBS"
make -C "$BUILD_ROOT/sources/cryptopp" -f GNUmakefile \
  CXX=em++ AR=emar RANLIB=emranlib \
  CXXFLAGS="$FLAGS -DCRYPTOPP_DISABLE_ASM" \
  libcryptopp.a -j"$JOBS"
make -C "$BUILD_ROOT/sources/re2" \
  CXX=em++ AR=emar \
  CXXFLAGS="$FLAGS" \
  RE2_CXXFLAGS="-Wall -Wextra -Wno-unused-parameter -Wno-missing-field-initializers -I." \
  obj/libre2.a -j"$JOBS"

printf 'Linking the browser engine with exception handling and worker support.\n'
em++ "$PROJECT_ROOT/main.cpp" \
  -I"$PROJECT_ROOT" -I"$BUILD_ROOT/sources" -I"$BUILD_ROOT/sources/re2" \
  "$BUILD_ROOT/sources/cryptopp/libcryptopp.a" \
  "$BUILD_ROOT/sources/re2/obj/libre2.a" \
  -std=c++17 -O2 -g0 -sUSE_ZLIB=1 -sDISABLE_EXCEPTION_CATCHING=0 \
  -sMODULARIZE=1 -sEXPORT_NAME=createPka2xml \
  -sEXPORTED_FUNCTIONS='["_main"]' \
  -sEXPORTED_RUNTIME_METHODS='["FS","callMain"]' \
  -sALLOW_MEMORY_GROWTH=1 -sMAXIMUM_MEMORY=536870912 \
  -sINVOKE_RUN=0 -sEXIT_RUNTIME=0 -sENVIRONMENT=web,worker \
  -o "$OUT_DIR/pka2xml.js"

python3 - "$OUT_DIR" <<'PY'
import hashlib
import pathlib
import sys
for name in ("pka2xml.js", "pka2xml.wasm"):
    data = (pathlib.Path(sys.argv[1]) / name).read_bytes()
    print(f"{name}: {len(data):,} bytes; SHA-256 {hashlib.sha256(data).hexdigest()}")
PY
