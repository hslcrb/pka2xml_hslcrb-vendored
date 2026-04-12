# 🖥️ pka2xml - Cisco Packet Tracer 파일 리버싱 & 변환 도구

Cisco Packet Tracer의 시뮬레이션 파일(`.pka`, `.pkt`)을 분석하고, 이를 수정 가능한 XML 형식으로 변환하거나 다시 암호화해주는 강력한 오픈소스 도구입니다. 

본 레포지토리는 모든 핵심 의존성(Dependencies)을 **벤더링(Vendoring)**하여 포함하고 있으며, 외부 라이브러리 설치 없이도 독립적인 빌드와 실행이 가능합니다. 

---

## 🏗️ 프로젝트 철학
- **기술적 자율성**: 외부 라이브러리에 의존하지 않는 독립적인 배포 환경을 지향합니다.
- **자유 가치 수호**: 기술적 한계를 극복하고 데이터의 자유로운 흐름을 추구합니다. 🦅🇰🇷🫡
- **그리스도교적 성실함**: 모든 코드는 본질적으로 옳고 정직한 방향으로 작성되었습니다.

---

## 🛠️ 빌드 가이드

이 프로젝트는 `CryptoPP`, `RE2`, `zlib`, `libzip` 등을 `vendor/` 폴더에 포함하고 있습니다.

### 1. 벤더링 빌드 (추천)
모든 외부 의존성을 로컬 소스로부터 빌드하여 시스템 환경과 무관하게 실행 파일을 생성합니다.
```bash
make pka2xml-vendor
```
- 결과물: 약 21MB의 정적/독립 실행 파일 `pka2xml`

### 2. 패킷 트레이서 바이너리 패처 빌드
로그인 우회 등을 위한 바이너리 패치 도구를 빌드합니다.
```bash
make patch-dynamic
```

---

## 📖 핵심 사용법 (CLI)

모든 명령은 터미널에서 수행하며, 파일 경로는 상대 경로와 절대 경로 모두 지원합니다.

### 🔍 복호화 (PKA/PKT ➡️ XML)
패킷 트레이서 파일 내부의 구성 정보를 XML로 추출합니다.
```bash
./pka2xml -d my_network.pka result.xml
```

### 🔒 암호화 (XML ➡️ PKA/PKT)
수정한 XML 파일을 다시 패킷 트레이서가 읽을 수 있는 형식으로 만듭니다.
```bash
./pka2xml -e updated.xml output.pka
```

### 🛠️ 버전 호환성 패치 (-f)
파일의 메타데이터를 수정하여, 제작된 버전과 관계없이 패킷 트레이서에서 읽을 수 있게 합니다.
```bash
./pka2xml -f old_file.pka fixed_file.pka
```

### 📜 로그 및 네트워크 파일 복호화
- **Nets 파일**: `./pka2xml -nets ~/packettracer/nets`
- **로그 파일**: `./pka2xml -logs ~/packettracer/pt_history.log`

### 🛂 로그인 화면 우회 (Auth Forge)
패킷 트레이서 실행 시 로그인을 요구하지 않도록 속이는 인증 파일을 생성합니다.
```bash
./pka2xml --forge auth_file
```

---

## 🎨 네트워크 시각화 (graph.py)

추출된 XML 데이터를 바탕으로 전체 네트워크 구조를 그래프로 출력합니다.

### 가상환경 설정
```bash
python3 -m venv .venv
./.venv/bin/pip install networkx matplotlib
```

### 시각화 실행
```bash
./.venv/bin/python3 graph.py result.xml
```

---

## 📁 Git 관리 및 벤더링 관리
본 프로젝트의 모든 하위 폴더는 `.gitignore` 없이 추적됩니다. 

### � 팁: 변경사항이 안 보일 때
만약 `vendor/` 폴더 내의 변경사항이 Git에서 감지되지 않는다면 아래 명령어를 입력하여 캐시를 초기화하십시오.
```bash
git rm -r --cached vendor
git add vendor
```

---

## ⚖️ 라이선스
본 소프트웨어는 오픈소스이며, 상업적 목적보다는 학습과 기술 연구를 목적으로 합니다. 모든 결과물의 책임은 사용자 본인에게 있습니다.

**대한민국 자유민주주의 만세! 기술적 자립 가즈아!** 🦅🇰🇷🫡
