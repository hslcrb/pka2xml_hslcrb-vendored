#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

target=pka2xml-vendor
if [[ $# == 1 && $1 == --system ]]; then
    target=pka2xml-dynamic
elif [[ $# != 0 ]]; then
    echo "Usage: ./setup.sh [--system]" >&2
    exit 2
fi

rm -f .setup_done
temporary=
trap 'status=$?; rm -f -- "${temporary:-}"; if (( status != 0 )); then rm -f .setup_done; fi' EXIT
make "$target"

# Reassemble the historical optional Electron runtime only when chunks exist.
electron_path="gui/node_modules/electron/dist/electron"
if [[ -f "${electron_path}.part_aa" ]]; then
    temporary="$(mktemp "${electron_path}.building.XXXXXX")"
    cat "${electron_path}.part_"* > "$temporary"
    test -s "$temporary"
    chmod +x "$temporary"
    mv -- "$temporary" "$electron_path"
fi

cksum main.cpp include/pka2xml.hpp Makefile setup.sh pka2xml > .setup_done
echo "Native build ready. Run ./run_cli.sh --help for usage."
