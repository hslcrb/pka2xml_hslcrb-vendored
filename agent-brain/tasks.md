# 작업 기록 / Task ledger

2026-10-23 · 검증된 통합 기준: [9fba2563](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/9fba256324cee155bb9d88b0c56d3d7e77e0c136) · 시작 기준: [bb58d79b](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/bb58d79bbf8c331d58ee212e950acc903efa5c3c)

이 문서는 완료한 변경을 실제 Git 커밋과 검증 근거에 연결한다. 설계는 [Glass workshop 명세](../docs/superpowers/specs/2026-10-23-glass-workshop.md), 실행 순서는 [구현 계획](../docs/superpowers/plans/2026-10-23-glass-upgrade.md)을 따른다. 각 작은 커밋은 영어 접두사와 한국어 제목으로 작성하고, 다음 커밋 전에 GitHub에 게시했다. 아래 SHA는 게시 후 확인한 원격 커밋이며 임시 로컬 SHA를 사용하지 않는다.

**현재 상태:** core·desktop·web의 모든 브랜치 끝점이 integration에 포함되어 있다. 기능 구현과 아래 최종 검증은 완료했다. 이 기록 작성 시점에는 마무리 문서 게시와 master 대상 PR이 남아 있다. 브랜치별 정확한 상태는 [branches.md](branches.md)를 참고한다.

## 1. 설계·브랜드·문서 기반

| 순서 | 원자적 작업 | 게시된 커밋 | 결과와 근거 |
| --- | --- | --- | --- |
| 1 | 현황 분석과 구현·검증 계획 확정 | [07a038e4](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/07a038e452ab271205a8ccbc8f70ecd771e48caa) | 실제 변환, 실패 복구, 의존성 재현, 로컬 처리 경계를 명세와 계획에 기록. |
| 2 | 번개 모티프를 투명한 패킷 로고로 정리 | [46c30c8c](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/46c30c8c1c1159e339267aaa4bd9485b23b2e277) | `brand/` SVG와 색상 체계. “Transparent workshop / Open the file. Understand the network.” 진입점 구성. |
| 3 | 철학·기여·보안·저작권 문서 정리 | [68eb4597](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/68eb45976a3c7e59ac48641d1c7e7fcfbc87f453) | `PHILOSOPHY.md`, `CONTRIBUTING.md`, `SECURITY.md`, `NOTICE.md`, `AGENTS.md`. 원저작자와 GPL 계보를 보존. |
| 4 | 로컬 처리 구조와 문서 진입점 정리 | [ce28d028](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/ce28d028cdaed300f2c297cf9df560f46c028d6f) | `docs/architecture.md`와 문서 안내. 사용 경로와 과거 업로드 경로를 명확히 구분. |
| 5 | 실제 설치·실행·지원 범위를 README에 반영 | [b27337b0](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/b27337b017c80ff68f3a857f9aed8500b618951c) | `readme.md`에 소스 빌드, 6개 CLI 연산, 웹·데스크톱 실행, 오프라인 조건과 플랫폼 한계 명시. |

## 2. 네이티브 엔진·빌드·토폴로지

| 순서 | 원자적 작업 | 게시된 커밋 | 재현한 문제 → 변경 및 근거 |
| --- | --- | --- | --- |
| 1 | 고정된 의존성 소스 복원 | [ec8f9369](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/ec8f9369443e7f783c1cf812ca27e07d260de489) | 비어 있는 gitlink와 누락된 `.gitmodules`로 깨끗한 체크아웃이 빌드되지 않음 → 실제 고정 커밋의 upstream을 확인하고 서브모듈 경로·출처 복원. `docs/dependencies.md`. |
| 2 | CLI 인자와 종료 상태 검증 | [98861e12](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/98861e12b3af5bfbb99df76188bca9a95d992a61) | 도움말 실패 코드, 추가·잘못 배치된 인자 수용 → 기존 플래그를 유지하며 정확한 연산 위치·개수 검사, 도움말 0·잘못된 사용 2. |
| 3 | 실패 시 원본과 출력 보존 | [632d8203](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/632d82037187231d40d362b3289d8c793d18808d) | 잘못된 복호화 입력이 기존 출력을 먼저 지우고 종료함 → 바이너리 I/O, 임시 파일 후 원자적 교체, 입력 별칭 거부, 예외 처리. 제한된 출력 크기로 쓰기 실패도 검증. |
| 4 | 암호화·압축 해제 경계 보강 | [1331bc6b](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/1331bc6b7a09f54f09e67a7a5396704e3bc28c5a) | 짧은 헤더, 잘못된 Base64, 과장된 길이, 정수 오버플로 재현 → 크기·형식·압축 소비 길이를 검사하고 오류 코드 반환. 128 MiB 평문/압축 해제 한도. |
| 5 | 소스 빌드와 실행 스크립트 복구 | [b8c9fb81](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/b8c9fb81c03f75de214d32160cd8b3c4d6660916) | 작업 디렉터리 의존, 실패한 준비 상태와 오래된 실행 파일 → 기본 로컬 빌드, 체크섬 기반 준비 상태, 공백 경로, 실패 전파, 제한된 병렬 빌드. `tests/test_launchers.py`. |
| 6 | 한글과 헤드리스 토폴로지 지원 | [6f8568c9](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/6f8568c98a5f7b5b76acb654b20c5d4faaafc36c) | 비 ASCII 이름 손실, 알 수 없는 포트·누락 링크 예외 → Unicode DOT 이스케이프, ID/인덱스 해석, 표준 `ipaddress`, Graphviz 종료 상태 검사, `--dot`·`--no-render`. |
| 7 | 실행 산출물의 추적·출처 분리 | [63594d38](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/63594d38a0ad36c1aa491a1dd2a21a294706a619) | 과거 네이티브 실행 파일 추적 제거, `/pka2xml` 빌드 산출물 제외. 실제 소스 빌드와 브라우저 JS/WASM 크기·해시를 `docs/runtime-artifacts.md`에 기록. |
| 8 | Electron 런타임 누락 사전 안내 | [bc9c28ef](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/bc9c28efb880e894131d0d20c56fa97ed1fa5e8c) | 데스크톱 시작 전에 실행에 필요한 런타임을 확인하고 복구 방법 안내. 실행 스크립트 회귀 검사 추가. |

## 3. 브라우저 엔진·웹 작업실

| 순서 | 원자적 작업 | 게시된 커밋 | 결과와 근거 |
| --- | --- | --- | --- |
| 1 | 변환 엔진을 취소 가능한 워커로 격리 | [fb441660](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/fb441660dd20a18413e6f7065d4527e2ccdfb6ac) | 지연 로딩, 직렬 작업, 고정 가상 경로, 정리·오류 복구·취소·시간 제한. 브라우저 입력 32 MiB, 요청 60초. `web/lib/wasmLoader.ts`, `web/public/converter.worker.js`. |
| 2 | 네이티브/WASM 의존성 빌드 분리 | [66d693c4](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/66d693c4835cb3b388c9186c438f60b5e6b13ee6) | `.build/wasm/`에 별도 소스·오브젝트를 두고 Emscripten 빌드의 C++ 예외 처리를 활성화. `web/build_wasm.sh`. |
| 3 | 실제 반복 변환 스택 오류 복구 | [f7cd0cb6](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/f7cd0cb6dbdb00d93ef0af9e458b5714cadb066a) | 기본 64 KiB WASM 스택에서 64 KiB 파일 읽기 버퍼로 반복 변환이 `table index out of bounds`에 도달함을 재현. 스택을 1 MiB로 설정하고 오버플로 검사 활성화. 이후 실제 엔진 워커 4개 검사 통과. |
| 4 | 소개 페이지와 작업실 진입점 구성 | [4d5b3c33](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/4d5b3c33d2d829c20bd3ea4ca59224da445303c6) | 랜딩에서 엔진을 요청하지 않고 작업실로 안내. 작은 화면·키보드 진입을 포함한 정적 소개 경험. |
| 5 | 실제 변환 UI와 접근성 콘솔 완성 | [e588e32f](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/e588e32f70768022d59c9983da0a5c5472ab582c) | 입력·옵션 변경 시 오래된 결과 정리, 출력 없는 연산/forge 인자 처리, 한글 인용 파일명, 로그·다운로드·취소·복구. 콘솔 명령 편집이 결과를 초기화해 `download`를 막던 문제도 수정. |
| 6 | 실제 Chromium 회귀 검증 고정 | [9fba2563](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/9fba256324cee155bb9d88b0c56d3d7e77e0c136) | `web/tests/workshop.spec.ts` 7개: 랜딩 지연 로딩, 실제 워커, 키보드 진입, 바이트 일치 다운로드, forge/nets, 시작 취소 후 재시도, 콘솔 `ls` 후 `download`와 `clear`. |

## 4. 데스크톱 작업실

| 순서 | 원자적 작업 | 게시된 커밋 | 결과와 근거 |
| --- | --- | --- | --- |
| 1 | 안전한 변환 실행과 출력 보호 | [c00dc032](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/c00dc032e028df2e0df6d08fadb1f839e2d473ad) | 셸 문자열 대신 분리된 인자 실행, 변환 실패 시 기존 출력 보존, 실행 경로·종료 상태 검사. |
| 2 | 격리된 브리지와 파일 대화상자 복구 | [725f2329](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/725f23298b4047efb7fe5c39c29ffb9036633051) | 제한된 typed preload/IPC, renderer Node 접근 제거, 대화상자 취소·경로 처리. |
| 3 | 한국어 중심 작업실 구현 | [95227198](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/95227198dc018888096b4f239decf59e71a7f19a) | 변환·결과·오류·로그·도움말 흐름, 유리빛 화면과 좁은 창 대응. |
| 4 | 실행 안내와 실제 Electron 검사 추가 | [7c675707](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/7c67570748187e09b2c1954afd4feef8b876aafc) | `gui/README.md`, `gui/tests/electron-smoke.mjs`. renderer→preload→IPC→네이티브 변환을 실제 실행. |
| 5 | 웹·데스크톱 한글 글리프 통합 | [68183b68](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/68183b686386f74632073392423b570806cf7c9a) | 로컬 글꼴의 최종 문구 범위를 통합하고 화면에서 로딩 확인. |

## 5. 통합 순서

병렬 작업의 커밋을 단일 실행 순서로 해석하지 않는다. integration의 첫 번째 부모 기준 병합 순서는 다음과 같다.

1. 엔진 경계·원본 보호: [1df7e569](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/1df7e56938edde7c47ad6ad5972ddc05c0b1083c) → core의 [1331bc6b](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/1331bc6b7a09f54f09e67a7a5396704e3bc28c5a) 포함.
2. 소스 빌드·실행 경로: [0c41507a](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/0c41507a6da8c7488730ca5b3ea89b7803f2f9fb) → core의 [b8c9fb81](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/b8c9fb81c03f75de214d32160cd8b3c4d6660916) 포함.
3. 토폴로지: [9edbcc9d](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/9edbcc9dcbddd9a83353e928a7cea0c63eb629a4) → 최종 core [6f8568c9](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/6f8568c98a5f7b5b76acb654b20c5d4faaafc36c) 포함.
4. 데스크톱 변환·UI: [3cb1e1d0](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/3cb1e1d00c62adc6c3c0a4eede3e0951a1b0b6ea) → desktop의 [95227198](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/95227198dc018888096b4f239decf59e71a7f19a) 포함.
5. 웹 소개: [51916b32](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/51916b32c476c92e2f392c16528532e027b6912c) → web의 [4d5b3c33](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/4d5b3c33d2d829c20bd3ea4ca59224da445303c6) 포함.
6. 데스크톱 안내·실제 검사·글꼴: [76a7f9dc](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/76a7f9dc2f03f3045a8b256b2f310e1e2cd18d8f) → 최종 desktop [68183b68](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/68183b686386f74632073392423b570806cf7c9a) 포함.
7. 웹 작업실: [fda47695](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/fda4769541a9fe06caa63a92df644da7f626169c) → 최종 web [e588e32f](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/e588e32f70768022d59c9983da0a5c5472ab582c) 포함.
8. 최종 브라우저 회귀 검사: [9fba2563](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/9fba256324cee155bb9d88b0c56d3d7e77e0c136).

## 6. 최종 검증 근거 / Verification evidence

아래 결과는 통합 담당자가 실제 실행 후 확인한 최종 인계 결과다. 테스트 개수는 서로 다른 수준의 검사를 나타내며, 모든 Packet Tracer 버전 지원을 의미하지 않는다.

| 검사 | 결과 | 재현 진입점·검증 범위 |
| --- | --- | --- |
| 네이티브 CLI·실행 스크립트·그래프 Python 회귀 | **24 통과** | 루트 `make test`; `tests/test_native_cli.py`, `tests/test_launchers.py`, `tests/test_graph.py`. |
| 엔진 AddressSanitizer/UndefinedBehaviorSanitizer | **10 통과** | `ASAN_OPTIONS=detect_leaks=0 make test-sanitize`; `tests/native_engine.cpp`. 이 환경의 LeakSanitizer 제약으로 누수 검사는 제외하며, 의존성 정적 라이브러리는 별도 계측하지 않음. |
| 실제 JS/WASM 워커 | **4 통과** | `node --test --test-isolation=none tests/wasm-worker.test.cjs`; 반복 왕복, 손상 후 복구, 인자·경로·크기 제한, forge/nets 인자 수. |
| 데스크톱 변환 단위 검사 | **8 통과** | `cd gui && npm test`; 셸 없는 실행·인자·오류·출력 보호. |
| 실제 Electron 통합 흐름 | **11 통과** | `cd gui && npm run test:electron`; 디스플레이 없는 환경은 `gui/README.md`의 Xvfb 실행법. OS 대화상자 응답은 제어하며 renderer·preload·IPC·네이티브 실행은 실제 경로. |
| 실제 Chromium 웹 흐름 | **7 통과 (9.5초)** | `cd web && npm run test:e2e`; 실제 워커·다운로드·취소 후 재시도·한글 콘솔 포함. |
| 웹 정적 검사·프로덕션 빌드 | **통과, lint 경고 0** | `cd web && npm run lint` 및 `npm run build`; 정적 경로 3개 생성. |

실제 `B13_스7회.pka`를 소스에서 빌드한 엔진으로 해독하여 제공된 XML과 바이트 단위로 일치함을 확인했다. XML→PKA→XML 왕복, 공백·따옴표·한글 경로, 손상 입력 후 재시도, 기존 출력 보호를 검사했다. 그래프는 이 실제 fixture에서 6개 장치와 5개 링크를 생성했다. NETS/LOGS와 forge 경로 검증에는 합성 입력도 사용했다.

## 7. 남은 범위와 역사 분석 한계

- 이 기록의 기준 시점에는 master 반영과 PR 완료가 남아 있다. 최종 문서 게시 커밋은 이 문서 자체의 후속 기록이므로 위 31개 커밋 목록에 포함하지 않는다.
- Linux x86-64와 Chromium의 관측 결과다. Windows/macOS 네이티브 실행, 모든 Packet Tracer 버전, 배포용 설치 패키지의 설치 과정은 검증했다고 주장하지 않는다.
- 초기 저장소는 depth 1 체크아웃이었다. 기준 커밋 [bb58d79b](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/bb58d79bbf8c331d58ee212e950acc903efa5c3c) 이전의 전체 변경·저작 경위를 이 로컬 기록으로 복원할 수 없다. 분석 범위는 그 스냅샷과 이후 실제 31개 커밋(병합 7개)이다.
- 의존성은 커밋으로 고정된 Git 서브모듈이다. 오프라인 준비에는 서브모듈 소스·도구체인·패키지를 미리 확보해야 한다. [의존성](../docs/dependencies.md), [네이티브 빌드](../docs/native-build.md), [산출물 출처](../docs/runtime-artifacts.md)를 함께 참고한다.

## 8. 화면과 검증 기록

[51ae6a2d](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/51ae6a2daef76dab77ef68b418d93ab0605a1b94)에 실제 웹·Electron 화면 4장, 환경 버전, 통합 실패 원인과 수정, 시험 명령 및 한계를 게시했다. [최종 검증 보고서](../docs/verification-2026-10-23.md)에 수치와 재현 경로가 있다.
