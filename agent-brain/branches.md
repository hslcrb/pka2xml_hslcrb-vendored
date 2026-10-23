# 브랜치 기록 / Branch inventory

2026-10-23 · 원격 확인 기준: [9fba2563](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/9fba256324cee155bb9d88b0c56d3d7e77e0c136)

`git ls-remote --heads origin`으로 원격 브랜치 **5개**를 확인했다. 아래는 이 시점의 원격 HEAD이며, 같은 이름의 로컬 브랜치와 일치한다. 이후 문서·PR 작업으로 integration HEAD가 바뀔 수 있으므로 이 문서를 실시간 상태로 해석하지 않는다.

| 브랜치 | 확인한 HEAD | 담당 범위 | 통합 상태 |
| --- | --- | --- | --- |
| [`master`](https://github.com/hslcrb/pka2xml_hslcrb-vendored/tree/master) | [bb58d79b](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/bb58d79bbf8c331d58ee212e950acc903efa5c3c) | 기존 공개 기준 스냅샷 | 변경하지 않음. integration 검증 완료; PR #1에서 병합 검토 중. |
| [`chatgpt/glass/core`](https://github.com/hslcrb/pka2xml_hslcrb-vendored/tree/chatgpt/glass/core) | [6f8568c9](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/6f8568c98a5f7b5b76acb654b20c5d4faaafc36c) | 네이티브 엔진, 고정 의존성, 빌드·실행, 토폴로지 | 최종 HEAD 전체가 integration의 조상. |
| [`chatgpt/glass/desktop`](https://github.com/hslcrb/pka2xml_hslcrb-vendored/tree/chatgpt/glass/desktop) | [68183b68](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/68183b686386f74632073392423b570806cf7c9a) | Electron 변환·보안 경계·화면·검사 | 최종 HEAD 전체가 integration의 조상. |
| [`chatgpt/glass/web`](https://github.com/hslcrb/pka2xml_hslcrb-vendored/tree/chatgpt/glass/web) | [e588e32f](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/e588e32f70768022d59c9983da0a5c5472ab582c) | 웹 소개·작업실·콘솔·접근성 | 최종 HEAD 전체가 integration의 조상. |
| [`chatgpt/glass/integration`](https://github.com/hslcrb/pka2xml_hslcrb-vendored/tree/chatgpt/glass/integration) | [9fba2563](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/9fba256324cee155bb9d88b0c56d3d7e77e0c136) | 워커/WASM, 공통 브랜드·문서, 병합·최종 검증 | 모든 구성 브랜치 통합 완료. master 반영은 PR 단계로 남음. |

## 확인한 관계

- 세 구성 브랜치는 공통 설계 커밋 [07a038e4](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/07a038e452ab271205a8ccbc8f70ecd771e48caa) 이후 병렬로 작업했다.
- core는 [1df7e569](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/1df7e56938edde7c47ad6ad5972ddc05c0b1083c), [0c41507a](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/0c41507a6da8c7488730ca5b3ea89b7803f2f9fb), [9edbcc9d](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/9edbcc9dcbddd9a83353e928a7cea0c63eb629a4)에서 단계적으로 합쳐졌다.
- desktop은 [3cb1e1d0](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/3cb1e1d00c62adc6c3c0a4eede3e0951a1b0b6ea), [76a7f9dc](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/76a7f9dc2f03f3045a8b256b2f310e1e2cd18d8f)에서 합쳐졌다.
- web은 [51916b32](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/51916b32c476c92e2f392c16528532e027b6912c), [fda47695](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/fda4769541a9fe06caa63a92df644da7f626169c)에서 합쳐졌다.
- 세 구성 브랜치 각각에 대해 `git merge-base --is-ancestor <branch> chatgpt/glass/integration`의 종료 코드 0을 확인했다. 작업별 커밋과 테스트 근거는 [tasks.md](tasks.md)에 있다.
- `origin` 및 `origin/master` 같은 원격 추적 이름·별칭을 별도 작업 브랜치로 세지 않았다. 위 5개 외의 원격 브랜치를 가정하지 않는다.

## 게시 규칙과 남은 작업

작업 브랜치는 `chatgpt/` 아래에 두었다. 각 원자적 변경은 영어 접두사와 한국어 제목으로 커밋한 직후 GitHub에 게시했다. API 게시 후 커밋 메타데이터에 따라 SHA가 달라지는 경우, 원격 트리 일치를 확인하고 로컬 브랜치를 게시된 커밋에 맞췄다. 이 기록은 게시 전 임시 SHA 대신 원격 SHA를 연결한다.

구현·통합·최종 검증을 완료했다. 스냅샷 이후 문서를 게시하고 [PR #1](https://github.com/hslcrb/pka2xml_hslcrb-vendored/pull/1)을 생성했다. PR은 master 대상으로 열려 있으며 master 병합과 브랜치 삭제는 수행하지 않았다.

## 역사 분석 한계

`git rev-parse --is-shallow-repository`는 `true`였다. 처음 받은 depth 1 기준은 [bb58d79b](https://github.com/hslcrb/pka2xml_hslcrb-vendored/commit/bb58d79bbf8c331d58ee212e950acc903efa5c3c)이며, 기준 이전 전체 이력은 이 체크아웃에 없다. 확인한 범위는 기준 스냅샷과 이후 integration의 31개 커밋이다. 과거 전체 브랜치 수나 삭제된 브랜치·커밋의 부재까지 증명하지 않는다.
