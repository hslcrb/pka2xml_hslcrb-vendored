#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -x "$PROJECT_DIR/pka2xml" || ! -f "$PROJECT_DIR/.setup_done" ]]; then
    echo "Native build is not ready. Run setup.sh in: $PROJECT_DIR" >&2
    exit 1
fi
current_state="$(cd "$PROJECT_DIR" && cksum main.cpp include/pka2xml.hpp Makefile setup.sh pka2xml)"
if [[ "$current_state" != "$(cat "$PROJECT_DIR/.setup_done")" ]]; then
    echo "Native sources or binary changed. Rebuild with setup.sh in: $PROJECT_DIR" >&2
    exit 1
fi

# Keep the caller's directory so relative input/output paths retain their meaning.
exec "$PROJECT_DIR/pka2xml" "$@"
