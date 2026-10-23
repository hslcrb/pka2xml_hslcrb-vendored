# pka2xml · 투명한 데스크톱 작업실

Packet Tracer 파일을 로컬에서 열고, 이해하고, 다시 저장하는 Electron 앱입니다. 파일과 변환 결과를 서버에 전송하지 않습니다. 밝은 유리 패널, 공유 패킷 로고, 로컬 한글 서체를 사용합니다.

## 실행과 확인

저장소 루트의 [설치 안내](../readme.md)에 따라 네이티브 엔진과 제공된 Electron 실행 파일을 먼저 준비하세요. 현재 데스크톱 실행·패키징 대상은 **Linux x64**입니다. 다른 플랫폼에서는 앱이 지원 상태와 대안을 안내합니다.

```sh
# 저장소 루트: 네이티브 엔진 준비
make

cd gui
npm run dev            # Vite + Electron 개발 창
npm run lint
npm test               # 8개 프로세스·IPC 정책 회귀 테스트
npm run build          # 타입 검사 + renderer + main + preload 빌드
```

기존 `node_modules`와 Yarn 오프라인 페이로드는 의도적으로 추적합니다. 검증할 때 전체 의존성 재설치로 이 파일들을 대량 변경하지 마세요. 네이티브 엔진은 개발 중 `../pka2xml`에서 찾습니다. 원본 파일과 저장할 폴더에 대한 파일 시스템 권한이 필요합니다.

### 화면만 확인하기

```sh
npm run dev:renderer
npm run build:renderer
npm run preview
```

브라우저 미리보기에는 Electron 연결이 없습니다. 화면은 이를 안내하고 파일 작업을 비활성화합니다. 실제 브라우저 변환 앱은 저장소의 별도 `web/` 프로젝트입니다.

## 작업 흐름

1. **XML로 열기**, **다시 묶기**, **버전 조정** 중 하나를 고릅니다.
2. 원본 파일을 고르고 네이티브 저장 대화상자에서 새 파일의 위치를 정합니다. 대화상자를 취소하면 이전 선택이 유지됩니다.
3. 작업을 시작합니다. 진행 중에는 취소할 수 있고, 실패 후 같은 화면에서 다시 시도할 수 있습니다. 성공하면 결과 폴더를 열 수 있습니다.

추가 도구의 **Nets 읽기**와 **로그 읽기**는 해석된 텍스트를 표시하고 전체 결과를 복사합니다. **인증 파일**은 기존 CLI `--forge` 기능을 제공합니다. 토폴로지 그래프는 별도 `graph.py` 도구를 사용합니다. 존재하지 않는 `GRAPH_MODE` 명령을 보내지 않습니다.

| 화면 작업 | 실제 CLI | 결과 |
| --- | --- | --- |
| XML로 열기 | `-d <in> <out>` | XML 파일 |
| 다시 묶기 | `-e <in> <out>` | PKA / PKT 파일 |
| 버전 조정 | `-f <in> <out>` | 버전 정보를 조정한 별도 파일 |
| Nets 읽기 | `-nets <in>` | 텍스트 |
| 로그 읽기 | `-logs <in>` | 텍스트 |
| 인증 파일 | `--forge <out>` | 인증 파일 |

버전 정보를 조정해도 모든 Packet Tracer 기능의 하위 버전 호환을 보장하지는 않습니다.

## 실행 경계와 결과 보호

- 렌더러는 여섯 개의 타입 지정 기능만 사용합니다. Node와 원시 `ipcRenderer`는 노출하지 않습니다. `contextIsolation`, `sandbox`, `webSecurity`를 켜고 `nodeIntegration`을 끕니다.
- IPC는 현재 창의 지정된 메인 프레임만 허용합니다. 경로는 절대 경로로 검증하고, 허용된 작업만 `execFile`의 인자 배열로 전달합니다. 셸을 사용하지 않아 한글·공백·따옴표·셸 특수문자도 파일명 그대로 처리합니다.
- 원본과 결과가 같은 파일이거나 심볼릭 링크·하드 링크로 같은 파일을 가리키면 거부합니다. 기존 결과의 교체는 확인한 뒤 진행합니다.
- 결과는 대상 폴더의 임시 파일에 먼저 생성하고 성공한 뒤 이름을 바꿉니다. 일반적인 오류·취소·시간 초과 시 기존 결과를 보존하고 임시 작업 폴더를 정리합니다. 앱 자체가 강제 종료되면 임시 폴더가 남을 수 있습니다.
- 작업은 한 번에 하나, 기본 제한 시간은 120초입니다. 프로세스 stdout/stderr 버퍼는 각각 4 MiB로 제한합니다. 긴 텍스트 미리보기는 64,000자까지 표시하고 전체 결과는 복사할 수 있습니다.
- 프로덕션 CSP는 네트워크 연결과 외부 리소스를 차단합니다. 클립보드는 신뢰한 메인 프레임의 쓰기만 허용합니다. 별도 읽기 권한은 허용하지 않습니다.

## 패키징

```sh
npm run package
```

이 명령은 빌드, Linux x64 ELF 실행 파일 확인, Electron Builder를 순서대로 실행합니다. 엔진은 ASAR 바깥의 `resources/bin/pka2xml`에 포함됩니다. 빌드와 패키징을 분리했으므로 단순 타입·UI 확인에 패키지를 만들 필요가 없습니다. `dist/`, `dist-electron/`, `.test-build/`, `release/`는 커밋하지 않습니다.

현재 작업에서 **AppImage 제작·설치·배포는 검증하지 않았습니다.** 호스트 라이브러리와 배포 환경의 호환성, 설치 및 실행은 실제 배포 전에 확인해야 합니다. Windows/macOS용 바이너리나 설치 파일은 제공한다고 주장하지 않습니다.

## 실제 Electron 검증

`tests/electron-smoke.mjs`는 선택적 Playwright 통합 검사입니다. 추가 제품 의존성 없이, 준비된 Playwright와 Electron을 사용합니다.

```sh
# Playwright가 이 환경에서 import 가능한 경우
npm run build
npm run test:electron

# 별도 설치된 검증 도구를 사용하는 예시
PKA_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
PKA_ELECTRON_PATH=/absolute/path/to/electron \
xvfb-run -a npm run test:electron
```

검증 내용: 실제 네이티브 엔진으로 저장소 XML fixture를 암호화·복호화한 뒤 바이트 비교, 특수문자 경로, 손상 입력과 기존 결과 보존, 오류 후 재시도, 대화상자 취소 응답, 기록 복사, 안내서, 키보드 포커스, 390px 레이아웃, 네트워크 요청과 렌더러 예외 확인. OS 대화상자의 응답만 제어하며 renderer → preload → IPC → native 실행은 실제 경로를 사용합니다.

2026-10-23 Linux x64/Xvfb에서 8개 단위 검사, lint, TypeScript 및 전체 빌드와 위 통합 흐름이 통과했습니다. 컨테이너의 root 실행 때문에 검증용으로만 `PKA_ELECTRON_NO_SANDBOX=1`을 사용했습니다. 앱의 sandbox 설정은 `true`지만 이 실행으로 OS 수준 sandbox 강제를 검증한 것은 아닙니다. 일반 실행·패키징에는 해당 플래그를 추가하지 마세요.

서체는 [Workshop Sans UI](public/fonts/README.md)입니다. Pretendard 1.3.9를 기반으로 현재 데스크톱·웹 UI 글자를 함께 포함하고 이름을 바꾼 OFL 서브셋입니다. 포함하지 않은 파일명·결과 글자는 시스템 글꼴로 표시합니다.
