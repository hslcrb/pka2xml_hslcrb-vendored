# pka2xml Glass Upgrade Implementation Plan

> **For agentic workers:** Use isolated branches for independent components and review the complete integrated branch before handoff.

**Goal:** Deliver reliable local conversion with a distinctive desktop/web experience and maintainable open-source documentation.

**Architecture:** Existing C++ engine, Electron desktop, and Next.js browser interface. A worker owns the browser runtime; UI receives a structured result. Landing content must not download the conversion engine.

**Tech Stack:** C++, Crypto++, zlib, RE2, TypeScript, React, Next.js, Electron, Vite, WebAssembly.

**Spec:** `docs/superpowers/specs/2026-10-23-glass-workshop.md`.

## Global constraints

- Branches start with `chatgpt/`; commit subjects follow `type: 한국어 설명`; push every commit.
- Preserve the pka2xml identity and local conversion model.
- Keep native flags compatible; explain unsupported operations explicitly.
- All brand colors and interface requirements follow the spec.
- Generated local test/build output must not enter commits accidentally.

## Review focus

- Truncated input and decompression sizes must fail predictably.
- Existing output must survive invalid input or an interrupted conversion.
- Unicode filenames and paths with spaces must work without shell interpolation.
- A failed/cancelled browser job must not poison the next job or leave stale downloads.
- Desktop packaging and network-free browser processing must match the documentation.

## Task 1: Native engine and launchers

**Files:** `main.cpp`, `include/pka2xml.hpp`, `Makefile`, `setup.sh`, `run_cli.sh`, `run_gui.sh`, and `tests/`.

- [x] Reproduce baseline CLI, malformed input, and build failures.
- [x] Add focused regression tests for argument parsing, truncated input, round trips, and output preservation.
- [x] Fix root causes and verify with a source-built binary.
- [x] Document build requirements, run tests, commit and push each coherent fix.

## Task 2: Desktop

**Files:** `gui/src/`, `gui/electron/`, desktop configuration and tests.

- [x] Verify baseline TypeScript/build and inspect IPC/resource resolution.
- [x] Fix process execution, dialogs, state recovery, and packaging paths.
- [x] Apply the glass workshop interface with keyboard access and clear status.
- [x] Run build/lint and focused integration checks, commit and push incrementally.

## Task 3: Browser runtime

**Files:** `web/lib/wasmLoader.ts`, `web/public/converter.worker.js`, `web/build_wasm.sh`, runtime tests.

**Interface:** Preserve `runPka2xml(inputData: Uint8Array, args: string[]): Promise<ConvertResult>` with `{ success, output?, logs, exitCode }`; `loadWasm()` becomes the worker readiness operation.

- [x] Reproduce engine startup, first conversion, repeated conversion, and error recovery.
- [x] Isolate compilation/conversion in a lazy worker and bound job lifetime and input size.
- [x] Ensure validated arguments, correct input/output paths, cleanup, and explicit failures.
- [x] Verify real WASM results against native fixtures and record measurements.

## Task 4: Browser experience and introduction

**Files:** `web/app/`, `web/components/`, UI-specific helpers/assets and frontend checks.

- [x] Read local Next.js documentation and baseline frontend errors.
- [x] Build `/` introduction and `/workbench` with coherent brand and functional conversion/terminal flows.
- [x] Add responsive layouts, useful validation, keyboard focus, and reduced motion.
- [x] Run production build, lint/type checks, browser flows and screenshots; commit and push incrementally.

## Task 5: Open-source handoff and integration

**Files:** root documentation, `docs/`, `brand/`, `.github/`, `agent-brain/`.

- [x] Record factual dependency provenance and upstream license attribution.
- [x] Explain setup, supported platforms, contribution process, structure and philosophy.
- [x] Merge component branches with merge commits, pushing every merge.
- [x] Run integrated checks and independent review; record exact results and limitations.
- [ ] Open a reviewable pull request with branch/commit links and verification evidence.
