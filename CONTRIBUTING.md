# Contributing to pka2xml

작은 수정도 환영합니다. 재현할 수 있는 설명과 검증 결과를 함께 남겨 주세요.

## Start here

1. Read [the architecture](docs/architecture.md) and [dependency provenance](docs/dependencies.md).
2. Clone with `git clone --depth 1 https://github.com/hslcrb/pka2xml_hslcrb-vendored.git`.
3. Create a focused branch, for example `chatgpt/fix/unicode-paths` or `feature/topology-export`.
4. For native source builds, initialize the pinned sources with `git submodule update --init --recursive`.
5. Keep changes within one independently reviewable behavior. Explain observed failures before changing code.

## Commit and review

Use an English prefix and a Korean subject: `fix: 손상 파일 처리 후 재시도 복구`, `feat: 결과 미리보기 추가`, `docs: 오프라인 준비 절차 명시`.

Commit small, coherent changes and push each commit. Do not squash away useful bug reproduction or merge history unless the maintainer asks. A PR should explain the original problem, the resulting behavior, the exact verification command, and remaining limits. Do not claim a platform was tested unless it was.

## Verification

| Area | Check |
| --- | --- |
| Native engine | `make test` after preparing the pinned dependencies |
| Browser engine | `node --test tests/wasm-worker.test.cjs` |
| Browser UI | `cd web && npm ci && npm run lint && npm run build` |
| Browser flows | `cd web && npx playwright install chromium && npm run test:e2e` |
| Desktop | `cd gui && npm run lint && npm test && npm run build` |

The browser-engine tests use the actual checked-in WASM engine. In environments that restrict Node's child-process test runner, use Node 24 and add `--test-isolation=none`. Native tests must run against a binary rebuilt from the source under review.

## Boundaries

- Preserve binary bytes and original input files. A failed conversion must leave existing output intact.
- Never interpolate a filename into a shell command.
- Keep conversion data local. Do not add telemetry or a remote conversion API without an explicit product decision.
- New formats need a small, redistributable fixture and a regression test. Do not commit private network configurations.
- Keep WASM and native build directories separate. Never overwrite native dependency archives with WASM objects.
- Keep generated caches and local worktrees out of commits. The historical vendored GUI dependencies are an intentional payload; update them as a deliberate dependency change rather than incidental install noise.
- Retain GPL and third-party license notices. See [NOTICE](NOTICE.md) and [brand guidance](brand/README.md).

## UI contributions

Use visible keyboard focus, text labels for status, reduced-motion support, and responsive layouts. A glass surface must remain readable when blur is unavailable. Test empty, busy, cancelled, success, and error states; include at least one Korean filename with a space.
