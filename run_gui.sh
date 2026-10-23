#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
"$PROJECT_DIR/run_cli.sh" --help >/dev/null
if ! command -v npm >/dev/null 2>&1 || [[ ! -x "$PROJECT_DIR/gui/node_modules/.bin/vite" ]]; then
    echo "Desktop dependencies are missing. See gui/README.md for installation instructions." >&2
    exit 1
fi
if [[ ! -x "$PROJECT_DIR/gui/node_modules/electron/dist/electron" ]]; then
    echo "Desktop runtime is missing. Run ./setup.sh to restore the bundled Electron runtime; see gui/README.md." >&2
    exit 1
fi
cd "$PROJECT_DIR/gui"
exec npm run dev -- "$@"
