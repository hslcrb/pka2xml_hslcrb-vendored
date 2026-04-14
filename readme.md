# pka2xml: Ultra-Vendored Reversing Kit

이 프로젝트는 Cisco Packet Tracer의 `.pka`, `.pkt` 파일을 리버싱하여 XML로 변환 및 암호화해주는 오프라인 자립형 패키지 툴킷입니다. 인터넷 환경이 없는 폐쇄망에서도 빌드 및 실행이 가능하도록 모든 의존성 패키징 기술(울트라 벤더링)이 적용되어 있습니다.

---

## 🌟 프로젝트 아키텍처

### 📊 구성도 (Mermaid)
```mermaid
graph TD
    User([사용자]) --> |스크립트 실행| Runner[Runner Scripts]
    Runner --> |run_gui.sh| GUI[Electron GUI Application]
    Runner --> |run_cli.sh| CLI[pka2xml C++ Binary]
    
    GUI --> |IPC 통신 / 내부 터미널| CLI
    
    CLI --> |압축 해제 및 복호화| Crypto[CryptoPP & zlib & libzip]
    CLI --> |정규표현식 파싱| Parsing[RE2]
    
    CLI --> |Python 스크립트 호출| PythonGraph[graph.py & Python Wheels]
    
    Crypto --> Result((변환된 XML 파일))
    Parsing --> Result
    PythonGraph --> Viz((네트워크 토폴로지 시각화))

    classDef cli fill:#0ff,color:#000,stroke:#000
    classDef gui fill:#f90,color:#fff,stroke:#fff
    class CLI cli
    class GUI gui
```

### 📂 주요 디렉터리 기하 구조
```text
pka2xml/
├── run_cli.sh          # CLI 전용 실행 스크립트
├── run_gui.sh          # GUI 전용 실행 스크립트
├── setup.sh            # Git 대용량 분할 파일 병합 스크립트 (초기 구동 시 필수)
├── Makefile            # C++ 바이너리 및 벤더링 라이브러리 빌드 파이프라인
│
├── gui/                # Electron/TS/React 기반 GUI (Zero-Install 적용)
│   ├── src/            # 리액트 프론트엔드 파트
│   ├── electron/       # 메인 & IPC 브릿지
│   └── node_modules/   # 완전 벤더링된 JS 패키지군
│
├── include/            # C++ 헤더
├── main.cpp            # pka2xml 진입점 소스코드
│
└── vendor/             # 벤더링 저장소
    ├── cryptopp/       # 암/복호화 모듈
    ├── re2/            # 정규표현식 엔진
    ├── libzip/         # ZIP 아카이브 처리 모듈
    ├── zlib/           # 데이터 입출력 압축 모듈
    └── python_wheels/  # graph 연동을 위한 Python 오프라인 휠
```

---

## 🚀 사용 요강

### 1단계: 초기 환경 셋업 (최초 1회 필수)
100MB 크기 제한을 준수하기 위해 Git 상에 분리된 대용량 인프라 파일(`electron`, `CryptoPP`)을 조립합니다.
```bash
./setup.sh
```

### 2단계: 애플리케이션 실행

#### **옵션 A: GUI 환경 실행**
직관적인 터미널 내장 GUI 유저 인터페이스를 통한 환경을 엽니다.
```bash
./run_gui.sh
```
- **지원 기능**: 파일 드래그 앤 드롭 지원, 터미널 로그 실시간 출력, 네트워크 시각화 분석 연동

#### **옵션 B: 명령어 인터페이스 (CLI) 실행**
```bash
# 복호화 (PKA/PKT -> XML)
./run_cli.sh -d [원본파일.pka] [결과파일.xml]

# 암호화 (XML -> PKA/PKT)
./run_cli.sh -e [원본.xml] [결과.pka]

# 패킷 트레이서 버전 고정 (패치)
./run_cli.sh -f [원본.pkt] [결과.pkt]

# 인증 토큰 생성/우회
./run_cli.sh --forge [인증파일.txt]
```

---

## 🛠 크로스 플랫폼 지원 요약
- **Linux**: 동봉된 컴파일 바이너리 및 `.a` 정적 파일들은 Ubuntu/Mint (x86_64) 규격으로 사전 컴파일되어 있습니다.
- **Windows / macOS**:
  - 소스코드는 OS에 무관하게 완전히 호환됩니다.
  - 리눅스 벤더링 바이너리를 삭제 후 (`rm -rf vendor/*/*.a`) 로컬 환경의 `make` 또는 C++ 컴파일러를 통해 다시 정적 라이브러리로 빌드해야 정상 동작합니다. 파이썬 `.whl` 또한 로컬 OS 환경에 맞춘 패키지로 재설치가 필요합니다.

---

## 🛡 울트라 벤더링 (Ultra-Vendored) 상세 명세
이 리포지토리는 GitHub LFS를 사용하지 않고도 대용량 모듈들을 보존할 수 있도록 오프라인 Zero-Install 벤더링 기법이 탑재되어 있습니다.
1. **바이너리 분할**: `app-builder-bin`, `electron` 및 C++ 컴파일 데이터를 50MB 단위로 분할하여 추적 처리합니다.
2. **Yarn Zero-Installs 적용**: GUI 종속성을 담당하는 `node_modules` 전체를 Git 내부에 직접 압축 색인하여 분할 커밋 푸시를 완료했습니다. 외부 레지스트리 호출 과정(`npm install`)을 완전 생략합니다.
3. **오프라인 Python Wheels**: `requirements.txt`에 기재된 파이썬 의존체계(`matplotlib`, `networkx` 등)를 전부 로컬상에 보관합니다.
