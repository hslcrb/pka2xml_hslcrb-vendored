# pka2xml - 패킷 트레이서 파일 변환기

시스코 패킷 트레이서(Packet Tracer)의 `.pka`, `.pkt` 파일과 XML 간의 상호 변환을 지원하는 강력한 리버싱 도구입니다. 이 프로젝트는 모든 의존성이 벤더링(Vendoring)되어 있어, 외부 라이브러리 설치 없이도 독립적으로 빌드 및 실행이 가능합니다.

대한민국의 자유민주주의와 기술적 자립을 위해 본 프로젝트를 관리합니다. 🦅🇰🇷🫡

---

## 🚀 주요 기능

- **복호화 (Decrypt)**: 암호화된 `pka/pkt` 파일을 읽기 쉬운 `xml`로 변환합니다.
- **암호화 (Encrypt)**: 수정된 `xml` 파일을 다시 패킷 트레이서 형식인 `pka/pkt`로 변환합니다.
- **버전 패치 (Fix)**: 낮은 버전의 패킷 트레이서 파일을 최신 버전 혹은 다른 버전에서 읽을 수 있도록 패치합니다.
- **인증 우회 (Forge)**: 패킷 트레이서의 로그인 화면을 우회할 수 있는 인증 파일을 생성합니다.
- **네트워크 시각화 (Graph)**: 네트워크 구성 정보를 담은 XML을 바탕으로 전체 토폴로지를 그래프로 그려줍니다.

---

## 🛠 빌드 방법

이 프로젝트는 `CryptoPP`, `RE2`, `zlib`, `libzip` 소스코드를 `vendor/` 디렉토리에 포함하고 있습니다.

### 벤더링 빌드 (권장)
시스템 라이브러리에 의존하지 않고 로컬 소스로 직접 빌드합니다.
```bash
make pka2xml-vendor
```
빌드가 완료되면 약 21MB 크기의 독립 실행 파일 `pka2xml`이 생성됩니다.

### 일반 빌드
시스템에 설치된 라이브러리(`libcrypto++-dev`, `zlib1g-dev`, `libre2-dev`, `libzip-dev`)를 사용하여 빌드합니다.
```bash
# 동적 라이브러리 빌드
make dynamic-install

# 정적 라이브러리 빌드
make static-install
```

---

## 📖 사용 방법

모든 명령어는 터미널에서 실행합니다.

### 1. 패킷 트레이서 파일을 XML로 변환 (복호화)
```bash
./pka2xml -d 원본파일.pka 결과파일.xml
```

### 2. XML을 패킷 트레이서 파일로 변환 (암호화)
```bash
./pka2xml -e 수정파일.xml 결과파일.pka
```

### 3. 모든 버전에서 읽을 수 있게 파일 패치
```bash
./pka2xml -f 원본파일.pka 패치된파일.pka
```

### 4. nets 및 log 파일 복호화
```bash
# nets 파일 복호화
./pka2xml -nets ~/packettracer/nets

# log 파일 복호화
./pka2xml -logs ~/packettracer/pt_history.log
```

### 5. 로그인 우회 파일 생성
```bash
./pka2xml --forge auth_file
```

---

## 📊 그래프 시각화 (graph.py)

프로젝트 내부에 격리된 Python 가상환경(`.venv`)을 사용하여 안전하게 실행합니다.

### 가상환경 설정 (최초 1회)
```bash
python3 -m venv .venv
./.venv/bin/pip install networkx matplotlib
```

### 그래프 생성
```bash
./.venv/bin/python3 graph.py 결과파일.xml
```
실행 결과로 네트워크 토폴로지가 시각화된 창이 뜹니다.

---

## 📁 프로젝트 구조

- `vendor/`: 모든 외부 라이브러리 소스코드 (zlib, cryptopp, re2, libzip)
- `include/`: 프로젝트 헤더 파일
- `main.cpp`: 메인 로직 및 CLI 인터페이스
- `patch.c`: 패킷 트레이서 바이너리 패치 도구
- `graph.py`: 네트워크 시각화 스크립트

---

## ⚠️ 주의사항

- `.gitignore`가 모두 제거되었습니다. 벤더링된 라이브러리 소스와 빌드 결과물을 모두 Git으로 관리할 수 있습니다.
- 빌드 도중 에러가 발생하면 `vendor/` 내의 라이브러리들이 정상적으로 컴파일되었는지 확인하십시오.

대한민국의 자유와 성장을 지지합니다. 예수 그리스도의 복음 안에서 건승하십시오! 🦅🇰🇷🫡
