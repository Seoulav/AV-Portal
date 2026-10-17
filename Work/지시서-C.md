# 세션 C 진행 기록

## W-20261017-003 1부 — Analog Way 레이어 연출 기준 정리

- 상태: MERGED·DEPLOYED (PR #609, SHA `625f3f7fa1eea84568227d2fccd67569addfa34a`; 배포 시험 수정 PR #611, SHA `0cc48f80a481b217537dacd5c08cf38b10c68b86`)
- 명세: `Work/작업/W-20261017-003.md` · 명세 확인 main `598757af700c961a4caf0888a5f5ce3dcde79c08`
- 브랜치: `codex/W-20261017-003-aw-layer-rules` · 전용 워크트리 `../codex-c-w003-aw-layer-rules`
- 시작 main `598757af700c961a4caf0888a5f5ce3dcde79c08`; 최신 `origin/main` `08d255b7c42faf2f10ba74b2b37a38b453ea09ad` 통합 완료(merge `c38c160f50c955ea4fb41771dae3101f831020b5`).
- 범위: 15종 상세 공용 레이어 기준 카드와 `Work/기획/AnalogWay-레이어연출기준.md`. XDM-WOS100 기존 문구 및 제품 JSON·layerPlan/videoLayerPlan 값은 변경하지 않는다.
- [x] W-019·W-011 근거표와 명세를 읽고 Aquilon RS·C, Alta 4K, Midra 4K의 검증된 기준을 통합하기 시작했다.
- [x] 제품 JSON 계획에서 15개 모델 수치를 정규화하는 모듈과 4개 데이터 기반 예시를 작성했다.
- [x] 기존 해설 카드에서 공통 규칙 문구를 새 카드로 옮기는 구현을 시작했다. 기존 XDM 비교 DOM 코드는 보존했다.
- [x] 카드 렌더링·15종 JSON 수치·기존 XDM 비교 DOM 보존 단위 테스트 통과. `verify-pages`, 검색 인덱스 `--check` 통과.
- [x] 전체 테스트 875건 실행: 872 pass, 2 fail, 1 skip. 실패 2건은 기존 `rtcom-sync.test.mjs`의 임시 디렉터리 `rename` EPERM으로, W-003 변경과 무관함.
- [x] 세션 D가 만든 대표 3종·RC400T 1280px·390px 캡처를 Work가 확인했다. 390px `scrollWidth` 390, RC400T 카드 미표시 확인. 이 세션의 브라우저 호스트는 여전히 `screenshot_no_frame`이라 Midra 표 수정 후 캡처 1장은 세션 D에 재요청이 필요하다.
- [x] Work 중간 검토에 따라 Midra 표를 Matrix(최대 2화면) 화면당 1(분할 2)과 Mixer(한 화면) 2(분할 4) 열로 분리했다. 값은 기존 `videoLayerPlan`에서 읽으며 시험으로 두 행을 확인했다.
- [x] 수정 후 `npm.cmd test`: 876건 중 875 pass, 1 skip, 0 fail. `node beta/verify-pages.mjs`와 `node beta/build-search-index.mjs --check` 통과. `node beta/build-detail-assets.mjs`로 공개 사본 재생성.
- [x] Work 2026-10-17 독립 검증: 인용·쪽 오기 0, 표 15종·예시 4개와 제품 JSON 값 일치, 15종 한정·RC400T 제외 확인. 조건부 병합 승인 후 문서 §1·§5의 `출력` 8개 기준, §7 PiP 표현과 §6 추론 표기를 정정했다. 공용 카드 하단에 계산 근거·미확인 사항 접기 절을 복원하고 BTO 뜻·Pulse 조사도 바로잡았다.
- [x] Work 2026-10-17 승인: 기존 모델별 해설 카드의 레이어 다이어그램·계산 예시 콜아웃 제거. 공용 카드와 새 접기 절로 대체한다.
- [x] 수정 후 전체 876건을 순차 실행: 875 pass, 1 skip, 0 fail. 일반 병렬 실행의 `rtcom-sync.test.mjs` 임시 디렉터리 rename `EPERM`은 Windows 간헐 오류이며, 같은 시험 단독 및 전체 순차 실행은 통과. `verify-pages`, 검색 인덱스 `--check`, 공개 상세 자산 재생성 통과.
- [x] Draft PR #609 생성: https://github.com/Seoulav/AV-Portal/pull/609. 본문에 원문 인용·쪽·검증 결과·시각 검토 차단 사유를 기록했다.
- [x] 수정 커밋의 Builder CI 초록, 새 카드 1280px(접기 절 펼침)·390px 캡처를 Work가 확인한 뒤 Draft 해제·병합했다.
- [x] 세션 D의 수정본 캡처 `../codex-d/outputs/w003-preview2/`를 Work가 확인했고, 390px `scrollWidth` 390과 새 열·접기 절을 승인했다. Builder CI 초록 뒤 PR #609를 병합했다.
- [x] Pages run `38984725694`는 얕은 CI 체크아웃에서 `git show`를 호출한 시험 때문에 실패했다. 승인 기준 코드 블록 SHA-256을 검사하는 PR #611로 수정했다. Pages run `38985400147` 성공(전체 시험·Builder·CPQ·배포). 공개 Pulse 4K·Aquilon RS6에서 카드·접기 절·Midra 열과 390px 가로 넘침 없음을 DOM으로 확인했다. C 브라우저 캡처는 `screenshot_no_frame`이므로 공개 PNG는 만들지 않았으며, 병합 전 캡처는 세션 D가 제공했다.

## W-20261017-003 2부 — Analog Way 설계 가이드 보완

- 상태: REVIEW (PR #612, Work의 수정본 화면 확인 후 병합 대기)
- 명세: `Work/작업/W-20261017-003.md` 2부 · 확인 main `0cc48f80a481b217537dacd5c08cf38b10c68b86`
- 브랜치: `codex/W-20261017-003-aw-layer-guide` · 전용 워크트리 `../codex-c-w003-aw-layer-rules`
- 범위: 화면 해상도에서 출력 수·용량을 변환하는 입력층, HD 레이어 미확인 판정, 공식 시뮬레이터 연결, 텍스트 내보내기. W-019 판정·제품 JSON 불변.
- [x] Aquilon User Manual v6.2 61·66·69쪽과 Midra·Alta 한글 기준 문서의 원문 및 로컬 공식 PDF를 재확인했다.
- [x] 문서에 있는 해상도·타일 배치를 4K60 기존 판정에 전달하고, HD·혼합·용량 4·미기재 해상도는 미확인으로 분기했다.
- [x] 5개 단위 시험과 W-019 회귀 시험 통과. 대표 RS2·Zenith 200·C+ 로컬 1280px·390px 캡처 각 1장, 여섯 화면 모두 `scrollWidth`가 뷰포트와 일치했다. HD 레이어 입력 시 4K 전용 추천 카드가 사라지는 것도 확인했다. 캡처와 측정값을 `Work/기록/W-20261017-003-preview2/`에 복사했다.
- [x] 전체 순차 검사 881건: 880 pass·0 fail·기존 skip 1. 생성 상세 자산 17개 갱신, `verify-pages` 289 장비·286 상세·529 이미지·167 PDF 통과, 검색 인덱스 `--check` 712807 bytes 일치.
- [x] #610 포함 최신 main `8600522740b84ed0390065e968251f498b1af718`을 merge `392577df71e57acfa09bdce902aced165c03ec98`로 통합했다. 상세 17개·검색 인덱스·스냅샷·읽기용 카탈로그를 재생성했고 추가 데이터 변경은 없었다. 통합 후 전체 검사 884건: 883 pass·0 fail·기존 skip 1; `verify-pages`와 검색 인덱스 `--check` 통과.
- [x] PR #612에 근거 인용·쪽을 기록하고, 최초 head `fc62a152`의 Builder CI를 확인했다. Work 독립 검증에서 병합 차단 문제는 없으며 Ready 전 수정 4건을 받았다.
- [x] Aquilon User Manual v6.2 80쪽의 7680×1080@60 = 1080p 출력 4개·합계 용량 4를 등록했다. HD 안내에는 Aquilon 전용·출력 링크 4개 이하 영역 조건을 명시했다. HD 레이어 음수·소수 입력은 계산과 복사 텍스트에서 거부하고, 2560×1600 라벨 중복을 없앴다.
- [x] 760px 미리보기에서 입력 패널의 라벨이 좁게 찌그러지는 현상을 재현하고, 900px 이하에서 패널을 한 열로 배치했다. 대표 RS2·Zenith 200·C+의 1280px·760px·390px PNG와 `scrollWidth` 측정값을 `Work/기록/W-20261017-003-preview2/`에 갱신했다. 모든 폭에서 페이지 가로 넘침이 없고 760px 입력 패널은 한 열이다.
- [x] 수정 뒤 v2·W-019 집중 시험 25/25, 전체 순차 시험 887건(886 pass·0 fail·기존 skip 1), `verify-pages`(289 장비·286 상세·529 이미지·167 PDF), 검색 인덱스 `--check` 통과. 상세 자산 17개를 재생성했다.
- [ ] 수정본 commit·push, PR Ready, 새 CI 확인. Work가 760px·390px 캡처를 직접 확인하고 병합 신호를 줄 때까지 병합하지 않는다. 최신 `origin/main`은 W-005 명세 PR #613의 `e7f4c5b2`; 병합 직전 통합·파생물 재생성을 다시 수행한다.

## W-20261016-010 — Aquilon 레이어 해설·브로슈어 문서 버튼

- 상태: MERGED (PR #576 병합·Pages 배포·공개 검증 완료)
- 명세: `Work/작업/W-20261016-010.md` · 인계서 `Work/기록/W-20261016-010-Codex-인계.md`
- 명세 확인 기준: main `5932cf1c643ba6599fbdc9f89dc8816593778669`
- 브랜치: `codex/W-20261016-010-aquilon-layers` · 전용 워크트리 `../codex-c-w010`
- 기존 사용자 작업 FT101-U/FR101-U는 PR #335·#337 병합, #338 배포 기록으로 이미 공개 완료됨을 확인했다. 로컬 RTCOM 브랜치 초안은 사용자 후속 결정 이전 값이어서 게시하지 않았다. `npm test` 100/100, 브라우저 E2E 239/239 통과.
- [x] 공용 Aquilon User Manual v6.2를 공식 URL에서 받아 확인했다(221쪽, SHA-256 `7578752f65ce92616a8d430245cebeed924e683e97f8406c16a5d403967f3779`). 레이어 자원 근거는 매뉴얼 인쇄 61–69쪽·71쪽, 분할·배경·소스는 63–66쪽·100쪽이다.
- [x] 매뉴얼 v6.2 계산을 정정했다. 2×2 4K60은 4개 출력×용량 2=8 출력 링크이며 VPU 1개의 8개 소스 링크를 쓴다. 용량 2 믹싱 레이어는 2링크를 써 화면 전체 최대 4개, 분할 레이어는 8개다(66·79쪽). 모든 모델의 화면당 상한은 4(분할 8)이며 큰 모델은 같은 화면 구성을 더 많이 만들 수 있다. 화면 전체 레이어와 출력 안 PiP는 같은 자원을 써 PiP로 링크가 줄지 않는다(67–68쪽). 4링크 경계에서 추가 링크를 계산하던 앞 설명은 제거했다.
- [x] 모델표 선두에 2×2 화면 수·화면당 레이어·장비 전체 레이어를 두었다. 화면 수는 매뉴얼 71쪽의 4K60 PGM 출력 수를 4로 나눴고, 출력 커넥터 수는 브로슈어 7쪽 값으로 별도 표기했다. 휴대폰용 좌우 스크롤 안내를 추가했다.
- [x] XDM-WOS100 비교에는 RTCOM 원본 `beta/site/rtcom/raw/products/xdm.json`의 4 출력 및 “커맨드 중첩(레이어를 쓰면 4포트 모두 같은 화면)”만 넣었다. 원본에 없는 출력당 레이어 수는 삭제했다.
- [x] Region Captive PiP는 RS1 데이터시트 3쪽 용어와 매뉴얼 83쪽 Screen region 설명을 분리 기록했고 절감 산식은 미확인으로 유지했다. 매뉴얼 101쪽 배경 비확대·축소 및 화면 출력별 4K60 소스 요구, RS2 이상 8링크 이하 화면의 VPU 분산 여부와 용량 1 HD PiP 비용 미확인을 추가했다.
- [x] 7종 `layerPlan`, 검증기, 나란히 비교 렌더, 되감기 해시 검사를 수정했다. 제품별 4번째 빠른 문서의 데이터 기반 “브로슈어” 전환과 업로드 매니페스트 중복 방지는 유지했다.
  - [x] 사용자 제공 브로슈어를 원본 바이트로 `beta/site/manuals/analog-way-aquilon-brochure-april-2026.pdf`에 게시했다(5,271,507 bytes, SHA-256 `124c2fb363afec992027d02e7db14c7612666ad38ce69bbdab2fc276701f75ff`). 모델별 브로슈어 표는 7쪽이다. RS6 데이터시트는 2026-07-03 모델 자료와 같은 파일명·판으로 확인했고 제품 연결은 바꾸지 않았다.
  - [x] 최신 계산 반영 RS1·RS6 1280px·390px 캡처 재검토: `tmp/w010-preview/aquilon-rs1-1280.png`, `aquilon-rs1-390.png`, `aquilon-rs6-1280.png`, `aquilon-rs6-390.png`.
  - [x] 전체 `npm.cmd test`: 769개 중 768 통과, 실패 0, 기존 skip 1. 선택 관련 시험 22/22 통과.
  - [x] 최신 `origin/main` `2694ab2c2b99d6f0303aef51bcd1e72a229eed4d` 통합 후 search-index·readable catalog·public snapshot 재생성; `build-search-index --check`, `sync-rtcom --check`, `verify-pages` 통과(카탈로그 285, 상세 282, 사진 515, 업로드 PDF 163).
  - [x] PR #576 갱신, 최종 Builder CI 통과(run 38886817492). 이후 #578까지 통합한 갱신 커밋 CI도 통과(run 38886817492 기준 최종 push는 `5aea7524`; 확인 결과 pass).
  - [x] Work가 #571 다음 #576 병합을 승인했고, 최신 main 통합 후 PR #576을 병합했다(병합 SHA `ea8ce10ef167cf7b4804eacd7ff70a78dabe5122`).
  - [x] Pages run `38889793893` 성공. 공개 RS1·RS6 1280px·390px에서 페이지 가로 넘침 없이 표 내부 좌우 스크롤을 확인했고, 브로슈어 열기·내려받기 및 게시 PDF SHA-256 일치를 확인했다.

## W-20261016-011 — Midra 4K · Zenith(Alta 4K) 공용 레이어 해설

- 상태: REVIEW
- 명세: `Work/작업/W-20261016-011.md` · 인계서 `Work/기록/W-20261016-011-Codex-인계.md`
- 명세 확인 커밋: `6063ab4afcb239cc7a5a9609117fa9353600934f` · 구현 시작 main: `ea8ce10ef167cf7b4804eacd7ff70a78dabe5122`
- 브랜치: `codex/W-20261016-011-midra-zenith` · 전용 워크트리 `../codex-c-w011`
- 범위: Pulse 4K·Eikos 4K·Zenith 100·Zenith 200 네 제품의 공용 기술 해설, 검증기·상세 렌더러·테스트. Port Map 및 기존 VERIFIED 사양은 수정하지 않는다.
- [x] 공식 공용 매뉴얼·모델별 데이터시트 규칙을 확인하고 모델별 적용 여부를 대조했다. Zenith 100·200은 Alta 4K 계열임을 확인했다.
- [x] Work 독립 검토 수정 반영: 최대 화면 수일 때 화면당 레이어와 한 화면만 쓸 때 최대 레이어를 별도 열·카드로 표시했다. Zenith 100/200 화면별 배분 예와 최대 화면 수 구성의 Aux 수(각 1·2개)를 AM 43쪽에 맞췄다.
- [x] 배경·전경 및 Aux 설명을 바로잡았다. 라이브 화면마다 배경 1개와 전경 1개가 있고 배경은 라이브 입력 또는 정지 이미지다. Midra 1080p Aux는 크기 조절 불가 레이어 1개, Alta Aux는 레이어 자원을 쓰지 않는다. 출력 경계 추가 비용과 4K/HD 혼합 비용만 미확인이다.
- [x] 사용자 친화 용어, XDM 접힌 원문, Eikos 블렌딩 출처(MM 42쪽), 2×2 비교(Zenith 200은 4개 출력에 레이어 4/분할 8, Zenith 100은 PGM 출력 3개라 불가)를 반영했다. 4개 JSON의 `models` 구조도 일치시켰다.
- [x] 네 제품 JSON에 계열 공유 `videoLayerPlan`과 제품별 결론 문장을 추가했다. XDM-WOS100 레이어 수는 RTCOM 원본에 없어 숫자 비교를 하지 않는다.
- [x] 공용 상세 검증기·화면 렌더를 연결하고 선택적 되감기 SHA 검사와 모델 구조·문구 검증을 갱신했다. 과거 스타일 되감기 함수와 캐시 버전 시험도 업데이트했다.
- [x] W-017 (`8845d808`), #582 (`0d7bd46a`), #584 (`2f5c455b`), #585 (`2e4bc54c`), #586 (`8ca862e3fa0b5ffa45a810652ab9e0a3624ff2d5`)를 포함한 최신 `origin/main`을 통합했다. `search-index`, readable catalog, public snapshot, 상세 정적 자산을 재생성했다. merge conflict는 파생 인덱스 재생성으로 해결했다.
- [x] 네 제품의 1280px·390px 캡처를 다시 만들고 눈으로 확인했다. 390px `document.documentElement.scrollWidth`는 네 제품 모두 390이다. 1280px 캡처 파일과 390px 파일: `tmp/w011-preview/{pulse-4k,eikos-4k,zenith-100,zenith-200}-{1280,390}.png`.
- [x] 최신 main 기준 직렬 전체 테스트 802건 중 801 통과·1 스킵·실패 0. 검색 인덱스 `--check`, RTCOM `--check`, `verify-pages` 통과(285 장비·282 상세·515 이미지·163 PDF). PDF.js canvas/font 관련 환경 경고는 있으나 해당 검사와 테스트는 통과했다.
- [x] PR #583을 Work 검토 수정과 최신 main 통합 내용으로 갱신했다. Builder CI run `38899749586` 통과.
- [ ] Work 독립 재검토·승인 대기. 승인 전 병합하지 않는다.
- 근거표: `Work/기록/W-20261016-011-근거표.md` · Work 인계: `Work/기록/W-20261016-011-Work-인계.md`

## W-20261015-005 — DCi 4|600DA 후면 사진 공용 좌표 재점검

- 상태: IN_PROGRESS (02 제품사진 전수 점검의 2차 확인 오류)
- 승인 근거: 사용자의 “전 장비 02 제품사진 제대로 뒷면 설명이 맞는지 검수해줘” 지시.
- 브랜치: `codex/W-20261015-005-photo-audit-followup` · 전용 워크트리 `codex-c` · 기준 main `da1e1464df661ebd0353735f231f1250eda9ee0c`
- [x] Crown DCi 4|300DA와 4|600DA 공식 모델별 사진 파일이 게시 해시·크기까지 같음을 확인했다. 두 제품의 번호 지도를 확대한 결과 4|600DA의 입력 ①·②, 출력 ③·④ 괄호가 실제 단자보다 왼쪽이었다.
- [x] 같은 사진에서 단자 전체를 가리키는 4|300DA의 ①~④ 좌표를 4|600DA에 적용했다. 번호·라벨·설명·다른 좌표는 유지했다.
- [x] 수정 전후 확대 화면과 선택적 되감기 함수·기존 W-001 과거 해시 연결을 확인했다.
- [ ] 전체 검사·파생 산출물·PR·CI·Pages 공개 확인.

[2차 점검·인계](기록/W-20261015-005-C-Work-인계.md)

## W-20261015-002 — 02 제품사진·포트맵 전수 점검 (1차 수정)

- 상태: IN_PROGRESS (1차 수정은 검증·PR 준비, Analog Way 및 나머지 단자별 전수 판정은 계속)
- 사용자 직접 지시: “TOGGLE DOCK 2×1 02 제품 사진에 화살표의 의미를 모르겠어”, “번호를 가르키는 부분이 안맞아”, “전 장비 02 제품사진 제대로 뒷면 설명이 맞는지 검수해줘”. Analog Way 10종의 후면 사진·번호 누락도 직접 지적했다.
- 브랜치: `codex/W-20261015-002-photo-portmap-audit` · 전용 워크트리 `codex-c` · 최신 main 통합 기준 `5e337ff001e4dbbd1c465ee7229da4761ec63d03`
- [x] 기존 W-20261012-001 점검 이력과 현재 281개 상세 중 지도 156개·번호 1,275개, 지도 없는 제품 125개를 목록화했다. 새 지도 72개는 대표 원본 44개로 묶어 화면 시트 11장과 렌더 결과를 만들었다.
- [x] TOGGLE DOCK 공식 연결도에서 후면 단자만 보이도록 크롭했다. 색 화살표는 외부 장비의 연결 예시이며 후면 포트 번호와 섞이지 않게 제외했다. 공식 그림의 인쇄 라벨과 번호 ①~⑨를 확대 대조했다.
- [x] Epson EB-PQ2213B·2216B의 HDMI 2 괄호가 단자 왼쪽 일부만 가리키는 것을 발견했다. 동일 이미지 해시를 쓰는 PQ2220B의 확인된 범위 `x1=483, x2=511, y=66`으로 두 모델만 바로잡고 수정 후 화면을 확인했다.
- [x] 두 변경의 선택적 되감기 함수를 과거 해시 검사에 연결했다. 검색 인덱스·스냅샷을 재생성하고 Pages 검증(284장비·281상세·502 이미지·143 uploads)을 통과했다.
- [ ] 전체 직렬 검사 최종 통과, 1차 PR·CI·병합·Pages 공개 확인.
- [ ] Analog Way 누락 10종과 나머지 포트맵의 단자별 심층 판정. 근거 없는 지도는 만들지 않는다.

[1차 점검·인계](기록/W-20261015-002-C-Work-인계.md)

## W-20261015-003 — HDF-CCF 허브 USB-PD 전원 시작점 보완

- 상태: REVIEW (사용자 직접 지시, 기존 W-20261015-001 플로우의 후속 정정)
- 승인 근거(사용자 원문): “USB-C허브는 USB-PD전원 공급받아서 입력 노트북을 충전하는거 이 부분을 그렇게 해석해서 수정해”
- 브랜치: `codex/W-20261015-003-hdfccf-pd-source` · 전용 워크트리 `codex-c`
- [x] 허브 연동 그림에 외부 USB-PD 전원 → 허브 입력 경로를 주황색 화살표로 표시하고, 허브 → HDF-CCF → 입력 노트북 충전 문구를 추가했다.
- [x] 제품 설명·접이식 단계에서 외부 전원의 출발점을 분명히 했다. PD 출력 수치 충돌과 직결 시나리오는 유지했다.
- [x] 선택적 되감기 함수를 이전 W-001 해시 검사에 연결했다. 일반 signalFlow 화면과 다른 제품 데이터가 유지되는지 검사했다.
- [x] 로컬 1280px·390px 화면에서 두 시나리오·전원 입력 화살표·모바일 가로 이동·브라우저 오류 0건을 확인했다.
- [x] 전체 직렬 검사 712건(711 pass·기존 skip 1·fail 0), 검색 인덱스 `--check`, Pages 검증(284장비·281상세·502 이미지·143 uploads) 통과.
- [ ] PR·CI·최신 main 통합·병합·Pages 배포·공개 화면 확인.

[Work 인계](기록/W-20261015-003-C-Work-인계.md)

## W-20261015-001 — HDF-CCF 시그널 플로우

- 상태: MERGED (PR #515 병합·Pages 공개 검증 완료)
- 명세: `Work/작업/W-20261015-001.md` (읽은 main `915e4bd4f6b2dcd032965853d68035a02643cbce`) · 브랜치 `codex/W-20261015-001-hdfccf-signalflow` · 전용 워크트리 `codex-c`
- 승인 근거(사용자 원문): “hdf-ccf 이 케이블 관련해서 시그널 플로우를 그려 줘. USB-C 허브를 통해서 이 제품을 사용했을 때 노트북 쪽에도 전원을 공급하고 HDMI 출력을 빼는 신호 흐름. XDM-CTR100 / XDM-CTR100 PSE 조합에서 신호가 흘러가는 시그널 플로우를 그린 적이 있는데, 그걸 참고해서 똑같은 스타일로 여기에 그려 줘.”
- [x] 매뉴얼 인쇄 4·5쪽(PDF 5·6쪽), 기존 I/O·PD 충돌 사양, 공개 XDM-CTR100 PSE Signal Flow 화면을 대조했다.
- [x] 직결과 허브 연동 두 줄을 만들었다. 영상·USB는 SOURCE→DISPLAY, 주황 점선 PD는 DISPLAY→SOURCE로 표시했다. 4-lane/USB 2.0과 2-lane/USB 3.2 10G을 각각 해당 줄에만 적었다.
- [x] 허브·스위치는 외부 장비 예시로 표시했다. SOURCE/DISPLAY 방향, 길이 5·10·15m, PD 수치 충돌과 사양표 참조 문구를 유지했다.
- [x] 기존 extender 타입을 사용하고 HDF 전용 레이아웃만 확장했다. 일반 signalFlow 렌더 경로와 다른 제품 JSON 불변을 해시·되감기 함수로 검사했다.
- [x] 로컬 1280px·390px 브라우저에서 두 시나리오, 역방향 화살표, 가로 이동, 크게 보기, 브라우저 오류·문서 가로 넘침 없음을 확인했다.
- [x] 전체 직렬 검사 710건(709 pass·기존 skip 1·fail 0) 통과. 검색 인덱스·스냅샷 재생성, 검색 인덱스 --check와 Pages 검증(284장비·281상세·502 이미지·143 uploads) 통과.
- [x] PR #515 Builder CI run 38651756863 성공. Work 승인 순서에 따라 최신 main 통합(이미 최신)·파생 재생성 후 병합 SHA bb9d9f1e34a762841a24b8b5252aeac3f6fa35e9 확인.
- [x] Pages run 38652158111 성공. 공개 version revision bb9d9f1. 1280px·390px에서 두 시나리오·역방향 PD·줌·모바일 좌우 이동을 확인했고 브라우저 오류와 문서 가로 넘침은 없었다. [공개 검증](기록/W-20261015-001-C-공개검증.md).

[근거표](기록/W-20261015-001-C-근거표.md) · [Work 인계](기록/W-20261015-001-C-Work-인계.md)
## W-20261014-008 — INOGENI 신설·TOGGLE DOCK 2×1·U-BRIDGE 3 등록

- 상태: MERGED (PR #507 병합·Pages 공개 검증 완료)
- 명세: `Work/작업/W-20261014-008.md` (읽은 main `aca29d5da0f89a95c10492c4c900d966d9c893ef`) · 브랜치 `codex/W-20261014-008-inogeni` · 전용 워크트리 `codex-c`
- 승인 근거(사용자 원문): “https://inogeni.com/product/toggle-dock-2x1/ , https://inogeni.com/product/u-bridge-3-0/ 2제품도 추가해줘” + “제품의 특징은 홈페이지 참고해”. 명세의 세션 B 표기보다 최신 사용자 배정인 세션 C를 따른다.
- [x] 공식 Overview·Tech specs·Resources·Compatible Devices를 확인했다. 명세 작성 시 빠졌던 Tech specs의 본체별 크기·무게와 공식 원격 PDF 링크를 발견해 근거표에 기록했다. PDF 사본은 게시하지 않았다.
- [x] 두 제품의 모델명 인쇄를 공식 원본 사진에서 읽고 Main·Diagram 4개를 등록했다. TOGGLE 호스트 1 USB-C와 호스트 2 USB-B+HDMI, U-BRIDGE PC HOST·DEVICE 단자를 별도 I/O로 작성했다.
- [x] 공식 연결 그림에 TOGGLE 9개, U-BRIDGE 11개 번호를 게시 픽셀로 좌표화했다. `portMap` 유효성 오류 0건, 로컬 1280px·390px 지도 눈 확인, 브라우저 오류·가로 넘침 0건. Python 명령이 없어 `portmap-audit.py` 대신 실제 렌더러 SVG와 원본을 대조했다.
- [x] 제조사 허용 호스트·이미지 매니페스트·카탈로그·검색 인덱스·읽기용 카탈로그·스냅샷을 갱신했다. 선택적 W-008 되감기를 기존 이력 검사에 연결했다.
- [x] Builder 파생 라이브러리에서 TOGGLE 9행·12단자, U-BRIDGE 7행·12단자를 확인했다. 두 제품 모두 확인 필요 I/O 행 0건이다.
- [x] 전체 검사 697건(696 pass·0 fail·기존 skip 1), `verify-pages` 283장비·280상세·501 이미지·142 uploads, 검색 인덱스 `--check` 통과.
- [x] Work 지정 순서에 따라 #506 병합 뒤 최신 main을 통합하고 충돌 난 검색 인덱스를 원본에서 재생성했다. 추가 #508 문서 병합도 통합했다. 전체 직렬 검사 700건(699 pass·0 fail·기존 skip 1), 검색 인덱스 검사, Pages 검증(283장비·280상세·501 이미지·142 uploads) 통과.
- [x] PR #507의 최종 Builder CI run `38577993536` 성공 뒤 병합 SHA `8d6b5cadf1ee5583315bf0c0e2c143f535fe6550`을 확인했다.
- [x] Pages run `38578538504` 성공. 공개 version revision `8d6b5ca`. TOGGLE DOCK 2×1과 U-BRIDGE 3을 각각 1280px·390px에서 확인했다(HTTP 200, 지도 9·11개, 브라우저 오류·문서 가로 넘침 없음). 모바일 양쪽 스크롤과 INOGENI 칩의 2제품 필터도 눈으로 확인했다. [공개 검증](기록/W-20261014-008-C-공개검증.md).

[제품별 근거표](기록/W-20261014-008-C-근거표.md) · [Work 인계](기록/W-20261014-008-C-Work-인계.md)

## W-20261014-002·003·004 — 제품 문구 및 Port Map 표시

- 상태: MERGED (PR #496 병합·Pages 공개 화면 확인)
- 기준 main: `c5b91698670c789219bf6d6d1b3effbfee1ed054` · 브랜치 `codex/W-20261014-002-wording` · 전용 워크트리 `codex-c`
- 승인 근거(W-002, 사용자 원문): “미러, 복제 이 용어의 통일이 필요해 보입니다. 중복으로 쓸 필요까진 없어 보입니다.” / “저희가 주로 쓰는 제품들 중에는 큰 편이고, 일체형 프로젝터에는 콤팩트라는 표현이 없어서 빠지는 게 나을 것 같습니다.”
- 승인 범위: W-002 NovaStar 한 제품과 Epson 7종 문구, W-003 X100 Pro 2U·4U·7U 후면 지도, W-004 PT-MZ11K·14K·17K 도면 표식 위치. PT-MZ20K는 현 카탈로그에 없음. Analog Way 및 다른 Epson 제품은 제외.
- [x] NovaStar 공식 H2 사양서 V1.17.0 인쇄 39쪽의 커넥터 2 출력 “copy”와 인쇄 38쪽의 4xHDMI 이미지 “mirroring”을 대조했다. H_1xHDMI2.0의 출력 기능은 “복제”로 통일하고 4xHDMI의 서로 다른 두 기능은 유지했다.
- [x] Epson 7종의 한글·영문 설명에서 콤팩트/compact 표현을 제거하고 밝기·해상도·크기 비교·무게 등의 수치를 보존했다.
- [x] X100 Pro 3종의 실제 Rear 사진에서 녹색 INPUT와 파란색 OUTPUT 슬롯 묶음을 확인하고, 위 여백의 번호 2개와 각 가로 범위 괄호를 추가했다.
- [x] PT-MZ11K·14K·17K 공용 도면의 파란 표식을 위 1–5 / 아래 6–10 여백으로 배치했다. 기존 인쇄 번호와 도면 단자 위치는 유지했다.
- [x] 제품별 선택적 되감기와 이전 해시 검사 연결, 검색 인덱스·스냅샷·읽기용 카탈로그 재생성, 전체 테스트 686건 중 685 pass·기존 skip 1·실패 0, Pages 검증 통과.
- [x] 로컬 1280px·390px 화면에서 NovaStar·Epson 대표와 X100 Pro 3종·Panasonic 3종을 확인했다. 브라우저 오류·문서 가로 넘침 없음. 모바일 지도는 기존 가로 스크롤 방식이다.
- [x] 최신 main `299f291a51e34b793c6be0bb3ec054cc2d66f304`의 Logitech·PixelFit 변경을 통합했다. 검색 인덱스는 통합 원본에서 재생성하고 지도 수량 검사는 151 map / 99 fallback으로 대조했다. 전체 테스트 689건 중 688 pass·기존 skip 1·실패 0.
- [x] Work가 #496 선병합을 확인했다. 필수 Builder CI run `38545779608` 성공 후 PR #496을 병합했다(병합 SHA `91e20767fc838bbe6eeacb2c1a12362ebfdbaecd`).
- [x] Pages run `38546183127` 성공. 공개 `version.json` revision `91e2076`. NovaStar·Epson EB-PQ2220B·X100 Pro-2U·PT-MZ11K의 공개 1280px·390px 캡처를 눈으로 확인했다(HTTP 200, 오류·페이지 가로 넘침 없음). X100·Panasonic의 390px 오른쪽 스크롤도 확인했다.

[작업 근거표](기록/W-20261014-002-004-C-근거표.md) · [공개 검증](기록/W-20261014-002-004-C-공개검증.md) · [Work 인계](기록/W-20261014-002-004-C-Work-인계.md)

## W-20261013-007 — BEHX-H 비즈니스 TV 6종 연결 범례 지도

- 상태: MERGED (BEHHL 6종 배포·공개 화면 확인)
- 명세: `Work/작업/W-20261013-007.md` (읽은 main `4958f9c008dd988415ccf110d7581ae78aac0116`)
- 브랜치: `codex/W-20261013-007-behhl-guide-c`; 전용 워크트리 `codex-c`
- 범위: 사용자 제공 BEHX-H 설치가이드 1쪽에 보이는 다섯 단자 표시를 여섯 제품의 Diagram·Port Map으로 등록. 기존 I/O 사양, 다른 제품, 렌더러, 검증기 변경 없음.
- [x] 재개 시 미커밋 변경을 확인하고 사용자 제공 PDF SHA-256과 기존 게시본의 바이트 동일성을 검증했다.
- [x] 1쪽 범례의 USB·LAN·HDMI(eARC)·ANT·HDMI를 지도화하고 2쪽 BE43HX-**~BE85HX-** 적용 표를 대조했다. 6종에 동일 픽셀 공유 도면을 사용했다.
- [x] HDMI 범례 2개와 공식 사양 3개의 차이 및 세 번째 위치 미표기를 Diagram 설명과 근거표에 적었다. 기존 사양과 RF 단자 수는 유지했다.
- [x] 제품별 선택적 이력 되감기와 새 지도 검사를 연결했다.
- [x] 번호·지시선 다섯 개를 대표 1280px와 390px 좌우 스크롤 캡처로 눈 확인했다. 로컬 브라우저 오류·문서 가로 넘침 없음.
- [x] 대표 LH55BEHHLBFXKR 공개 1280px·390px 캡처를 눈으로 확인했다. HTTP 200, 지도와 다섯 설명·HDMI 충돌 문구 표시, 가로 넘침·브라우저 오류 없음.
- [x] 전체 직렬 검사 659건(658 pass·0 fail·기존 skip 1), 검색 인덱스 `--check`, Pages 검증(280장비·277상세·490 WebP·139 uploads)을 통과했다.
- [x] 최신 main `7db7b99d23fc0e948676728fff455acfadeaab3e`의 RTCOM 동기화 변경을 통합했다. 검색 인덱스 충돌은 통합 원본에서 재생성하여 해소했다.
- [x] 통합 후 전체 직렬 검사 659건(658 pass·0 fail·기존 skip 1), 검색 인덱스 `--check`, RTCOM 동기화 `--check`(32/32), Pages 검증(280장비·277상세·490 WebP·139 uploads), `git diff --check origin/main...HEAD`를 통과했다.
- [x] Work가 현재 #449와 파일이 겹치지 않으며 이 PR을 CI 통과 후 먼저 병합해도 된다고 확인했다.
- [x] PR #484의 필수 Builder CI run `38502573689` 성공 후 병합 SHA `80b092bb13c8ef694748af471c25578a407a73a7`을 확인했다.
- [x] Pages run `38502854175` 성공. 공개 `version.json` revision `80b092b`, 대표 제품 JSON HDMI 3·지도 5개를 확인했다. [공개 1280px 캡처](기록/W-20261013-007-C-BEHHL-public-1280.png) · [390px 캡처](기록/W-20261013-007-C-BEHHL-public-390.png).

[지도 근거표](기록/W-20261013-007-C-BEHHL-지도-근거표.md) · [Work 인계](기록/W-20261013-007-C-BEHHL-지도-Work-인계.md)

## W-20261012-013 3차 — 영상·기타 제조사 Builder 단자 재검토

- 상태: MERGED (배포·공개 Builder 확인)
- 명세: `Work/작업/W-20261012-013.md` (읽은 main `12c1e607ddd6d9c9d176f1b7ff0d884686c7366e`)
- 브랜치: `codex/W-20261012-013-phase3-video-c`; 전용 워크트리 `codex-c`
- 범위: Samsung·Sony·Panasonic·AVer·Roland·Analog Way·AMX·기타의 확인 필요 행. 세션 A 소유 오디오·TR315/TR335·`pt-*` 파일은 변경하지 않는다.
- [x] 시작 report: 305제품·I/O 1,573행·단자 2,836개·확인 필요 119행·I/O 있으나 단자 0 제품 4개. 이전 A2/B2 보류 사유를 읽었다.
- [x] AMX 1행의 공식 수량 보강, AJA 1행 중복 해소, Roland 4행 전이중 RS-232 override, TR535 1행 해소와 제어 행의 허위 4개 포트 교정을 공식 자료로 검증했다.
- [x] 확인 필요 112행·단자 2,842개·I/O 있으나 단자 0 제품 4개. 신규 검사 RED→GREEN 및 선택적 제품 되감기 검사를 확인했다.
- [x] 전체 직렬 검사 646건(645 pass·0 fail·기존 skip 1), Pages 검증(276 장비·273 상세·479 WebP·134 uploads), 검색 인덱스·읽기용 카탈로그·빌더 라이브러리 `--check`를 통과했다.
- [x] Builder 타입 검사, 단위 검사 101건, 스키마 검사, 빌드, E2E 39건을 통과했다.
- [x] 로컬 Builder 대표 TR535 1280px·390px 화면에서 영상 출력과 제어 단자, 사진, 가로 넘침 없음, 브라우저 오류 없음을 확인했다.
- [x] Work가 #472 선병합 순서를 확정했다. 병합 직전 `origin/main`은 시작 SHA `12c1e607`과 같아 재통합·파생 재생성이 불필요했다. PR diff 범위·`git diff --check origin/main...HEAD`를 확인하고 필수 Builder CI run `38396120370` 성공 후 PR #472를 병합했다(병합 SHA `b15fea7d6f70780b7ce8f07e2ce7fd7ffb5c272e`).
- [x] Pages run `38396545856` 성공. [공개 Builder](https://seoulav.github.io/AV-Portal/builder/)에서 TR535를 1280px·390px로 확인했다(HTTP 200, 사진·HDMI Out 2개·SDI Out 1개·RS-232/RS-422 양방향 단자 표시, 가로 넘침·브라우저 오류 없음). [1280px 캡처](기록/W-20261012-013-C3-public-1280.png) · [390px 캡처](기록/W-20261012-013-C3-public-390.png).

[근거표](기록/W-20261012-013-C3-근거표.md) · [Work 인계](기록/W-20261012-013-C3-Work-인계.md)

## W-20261013-007 — 호텔 TV U800F · 비즈니스 TV BEHHL

- 상태: MERGED (U800F 6종 배포 확인, BEHHL 6종 근거 부족으로 보류)
- 명세: `Work/작업/W-20261013-007.md` (읽은 main `0bda1d5a9ebc344d164383c538724b22d88bd66a`)
- 브랜치: `codex/W-20261013-007-displays-c`; 전용 워크트리 `codex-c`
- 범위: 호텔 TV U800F 6종의 Diagram·Port Map, BEHHL 6종 후면 자료 대조와 보류 기록. 비디오월·WMF·LED 및 세션 A/B 진행 파일은 변경하지 않는다.

- [x] 삼성 국내 한글 매뉴얼 12쪽의 U800F 전용 도면과 적용 모델 6종을 확인했다. HP-ID·HEADPHONE·SERVICE는 U800F 지도에서 제외했다.
- [x] U800F 후면 도면을 Diagram으로 등록하고 6종에 동일한 10개 번호 지도를 적용했다. 공식 그림과 기존 I/O가 확인하는 단자만 표시했다.
- [x] 도면 위 좌표 점검 이미지와 대표 1280px·390px 캡처를 눈으로 확인했다.
- [x] BEHHL 설치가이드 그림의 HDMI 2개와 국내 스펙의 HDMI 3개 충돌을 확인했다. 글로벌 공식 자료도 조사했으나 국내 6종의 정확한 후면 도면·사진을 확인하지 못해 지도 생성을 보류했다.
- [x] 제품별 이력 되감기와 공유 도면 계약 검사를 연결했다.
- [x] 비디오월 #461 병합 main `aa335df4d485deca8c36ccae7dd283ef2f9cef36` 통합 후 파생 산출물을 재생성했다. 전체 직렬 검사 636건(635 pass·0 fail·기존 skip 1), 검색·읽기용 카탈로그 검사, Pages 검증(276장비·273상세·477 WebP·132 PDF 항목)을 통과했다.
- [x] Work가 지정한 순서(#461 다음)로 PR #462를 진행했다. 필수 Builder CI run `38380129587` 성공 후 병합 SHA `4de07abbd4ff4c4924daeaec8fb8805d19c8c35c`를 확인했다.
- [x] Pages run `38380523810` 성공. 공개 HG55U800FNFXKR 화면을 1280px·390px에서 확인했다(HTTP 200, 지도와 설명 10개, 가로 넘침·브라우저 오류 없음).

[근거와 보류 사유](기록/W-20261013-007-C-근거표.md) · [Work 인계](기록/W-20261013-007-C-Work-인계.md)

## W-20261013-007 — WMF 2종 · BEHHL 매뉴얼 재조사

- 상태: MERGED (WMF 2종 배포 확인, BEHHL 6종 근거 부족으로 보류)
- 명세: `Work/작업/W-20261013-007.md` (읽은 main `aee3364d45c33c9a8d251908eb3e024bb2526910`)
- 브랜치: `codex/W-20261013-007-wmf-c`; 전용 워크트리 `codex-c`
- 범위: WMF 두 모델의 공식 한글 매뉴얼 Diagram·Port Map 및 BEHHL 여섯 모델의 추가 매뉴얼 조사. LED·BEHHL 제품 JSON·세션 A/B 진행 파일은 변경하지 않는다.
- [x] 한글 사용설명서 BN81-28453F-02 표지의 WM55FX·WM75FX 적용 모델과 13·14쪽의 별도 후면 도면을 확인했다.
- [x] WMF 두 모델에 각자의 Diagram과 후면 7개 표식을 등록했다. 기존 I/O 9행 중 도면에 위치가 없는 USB-C 허브·RS-232C는 지도에 넣지 않았다.
- [x] 두 모델의 점검 이미지를 열어 표식 1–7의 단자 정체·범위를 눈으로 확인했다. 대표 55형 로컬 1280px·390px 캡처에서 가로 넘침과 브라우저 오류가 없음을 확인했다.
- [x] BEHHL 국내 공용 사용설명서 276쪽, 설치가이드 2쪽, 간단 사용설명서 2쪽, 글로벌 공용 사용설명서 333쪽을 재조사했다. HDMI 3개를 보여 주는 정확 모델 후면 도면은 찾지 못해 기존 보류를 유지한다.
- [x] 선택적 되감기 함수·제품별 검사 및 전체 직렬 검사 638건(637 pass·0 fail·기존 skip 1)을 통과했다.
- [x] 최신 main `f7766a37bed10f9873c51364ab5dae45b94479b0` 통합 후 검색 인덱스·스냅샷·읽기용 카탈로그를 재생성했다. 전체 직렬 검사 638건(637 pass·0 fail·기존 skip 1), 검색 인덱스 `--check`, Pages 검증(276 장비·273 상세·479 WebP·132 PDF 항목), `git diff --check origin/main...HEAD`를 통과했다.
- [x] Work가 지정한 순서(#468 먼저)로 PR #468을 진행했다. 필수 Builder CI run `38385565965` 성공 후 병합 SHA `9edaaa095b448961524898bb9c28e7a789689b5b`를 확인했다.
- [x] Pages run `38385924163` 성공. 공개 LH55WMFWBGCXKR 화면을 1280px·390px에서 확인했다(HTTP 200, Diagram과 지도·설명 7개, 가로 넘침·브라우저 오류 없음).

[WMF 근거표](기록/W-20261013-007-C-WMF-근거표.md) · [BEHHL 재조사](기록/W-20261013-007-C-BEHHL-재조사.md)

### BEHHL 사용자 제공 BEFX-H 가이드 추가 판정

- [x] 사용자 제공 BN68-23476A-01 PDF SHA-256 일치·2쪽 원본 시각 확인. 1쪽 범례는 HDMI(eARC)+HDMI의 2개, 2쪽 적용 표기는 BE43/50/55/65/75/85FX-**다.
- [x] 기존 BEHX-H BN68-26620A-01과 다른 시리즈의 가이드이며, 국내 BEHHL HDMI 3개와의 불일치도 해소하지 못해 6종 Port Map 보류를 유지했다. 제품 JSON과 PDF 게시 목록은 변경하지 않았다.

## W-20261015-006 — Analog Way 후면 사진·Port Map 점검

- 상태: MERGED (PR #521·#522 병합, Pages 배포·공개 검수 완료)
- 승인 근거: 2026-10-15 사용자가 이 세션에 직접 지시한 Analog Way 10종 후면 사진·번호 누락 및 전 장비 02 제품사진 검수. Work가 세션 A·B 미배정, C가 Analog Way 계속 담당이라고 확인했다. 별도 `Work/작업/W-20261015-006.md`는 현재 main에 없으므로 직접 지시 범위만 수행한다.
- 기준 main: `72a95aee8f06d2002986102bd99e6dff7d1be569` · 브랜치 `codex/W-20261015-006-analogway-rear` · 전용 워크트리 `codex-c`.
- 범위: 지적된 10종 및 동일 사진 구조의 Aquilon RS6. 그 외 제조사 제품 JSON·렌더러·검증기는 변경하지 않는다.
- [x] 사용자 제공 모델별 후면 JPG 6장을 열어 후면 모델 인쇄 또는 카드 배열을 대조하고 WebP·사진 메타데이터를 등록했다.
- [x] 기존 RS alpha·RS3–6 후면 사진과 새 6장을 기준으로 11종, 총 148개의 단자 묶음 번호 지도를 작성했다. 카드 장착 예시와 사진에 없는 옵션을 구분했다.
- [x] 11종의 확대 렌더에서 번호·괄호·단자 몸체를 눈으로 확인했다. 대표 RS1·RS5·Eikos 4K·Zenith 200 로컬 1280px·390px에서 HTTP 200, 일치하는 번호 수, 390px 가로 스크롤, 브라우저 오류·페이지 가로 넘침 0을 확인했다.
- [x] 제품별 지도·새 사진 메타데이터만 되감는 함수를 옛 해시 검사에 연결했다. 다른 제품의 과거 해시 기준은 유지했다.
- [x] 검색 인덱스·스냅샷·읽기용 카탈로그를 재생성했다. 전체 직렬 검사 720건 중 719 pass·0 fail·기존 skip 1, Pages 검증(284 장비·281 상세·508 이미지·143 uploads), 검색 인덱스 `--check` 통과.
- [x] PR #521 Builder CI 통과, 최신 main `72a95aee` 선행 확인 후 병합 SHA `f01d78cff68f232714422d45bb79df53f7a90b82` 확인. Pages run `38667127796` 성공, 공개 revision `f01d78c`와 RS1·RS5·Eikos 4K·Zenith 200의 1280px·390px 표시 확인.
- [x] 공개 검수에서 Aquilon RS1–6의 1·4 / 2·5 / 3·6 번호가 상단 여백에서 가까이 붙는 현상을 발견. `codex/W-20261015-006-analogway-labels`에서 카드 괄호 좌표를 보존하고 두 번째 줄 번호만 분리했다. PR #522 Builder CI 통과 후 병합 SHA `3b07b459e08788a85562c86801709baf1c206f93`, Pages run `38668674519` 성공. 공개 revision `3b07b45`에서 RS1·RS5·RS6 1280px·390px 화면 확인.

[근거표](기록/W-20261015-006-C-근거표.md) · [Work 인계](기록/W-20261015-006-C-Work-인계.md)

## W-20261015-007 · Epson EB-PQ2213B·PQ2216B 후면 표식 보완

- 상태: MERGED (PR #524 병합, Pages 배포·공개 확인)
- 승인 근거: 2026-10-15 사용자 지시: “W-20261015-007 사용을 승인합니다(EB-PQ2213B·PQ2216B REMOTE·AC 입력 번호 보완).” 작업 명세는 아직 main에 없으므로 직접 승인된 두 제품만 처리.
- 기준 main: `dc14e22cb16bf5348e96e26210bcbc0b44239698` · 브랜치: `codex/W-20261015-007-epson-pq-portmap` · 전용 워크트리 `codex-c`.
- [x] 세 모델의 제조사 공식 후면 사진 SHA-256 일치와 Epson 공용 매뉴얼(EB-PQ2213B·2216B·2220B 적용)에서 REMOTE·AC inlet을 확인했다.
- [x] EB-PQ2213B·2216B에 각 13번 REMOTE와 14번 AC 전원 입력을 추가했다. 기존 표식 1–12 및 나머지 제품은 유지했다.
- [x] `portmap-audit` 두 제품 각 14개, 위치 오류 0. 공용 사진 `SHARED_WITH` 알림만 각 1건. 1280px·390px 로컬 화면에서 14개 표식·가로 이동·오류 없음을 확인했다.
- [x] 변경 지도의 선택적 되감기와 기존 Epson 이력 검사를 연결했다. 해당 검사 6건 통과.
- [x] 검색 인덱스·스냅샷·읽기용 카탈로그 재생성. 전체 직렬 검사 722건(721 pass·0 fail·기존 skip 1), Pages 검증 284 장비·281 상세·508 이미지·143 uploads, 검색 인덱스 `--check` 및 `git diff --check` 통과.
- [x] PR #524 필수 Builder CI run `38670788343` 통과. 최신 main `dc14e22c` 통합 및 파생 재생성 결과 변경 없음; PR 범위·`git diff --check origin/main...HEAD` 확인 후 병합 SHA `c67a8112285d10f8faafc8d425a14799dbab2dda`.
- [x] Pages run `38671217691` 성공. 공개 revision `c67a811`에서 EB-PQ2213B·PQ2216B 모두 1280px·390px HTTP 200, 번호 14개, 오류·페이지 가로 넘침 0, 모바일 지도 가로 이동 확인. 사진의 REMOTE 잭·AC 소켓과 새 지시선 일치.

[근거·시각 점검](기록/W-20261015-007-C-근거표.md) · [Work 인계](기록/W-20261015-007-C-Work-인계.md)

## W-20261015-008 · Sony BRC-AM7·RM-IP10·RM-IP500 후면 지도

- 상태: MERGED (PR #527 병합·Pages 공개 확인)
- 승인 근거: 2026-10-15 사용자 직접 답변: “W-20261015-008로 진행하십시오(Sony BRC-AM7·RM-IP10·RM-IP500, 보이는 단자만 지도화, 공식 후면 사진·모델별 단자 자료 근거).” JBL 14종은 세션 A, AMX Varia 4종은 세션 B가 담당하므로 C는 그 JSON을 수정하지 않는다.
- 기준 main SHA `cd3b58149b5c3f93a4a5ec7c7147646fb53f35ee` · 브랜치 `codex/W-20261015-008-sony-rear-maps` · 전용 워크트리 `codex-c`. 별도 W-008 명세는 착수 시 main에 없으므로 직접 승인 범위만 처리한다.
- [x] 미지도 Rear 사진 21종(Shure 제외)의 접촉 시트 4장과 제조사별 사진 적합성·미확정 사항을 [점검 기록](기록/W-20261015-008-C-photo-audit.md)에 공유했다.
- [x] Sony 세 모델의 정확한 사진·공식 후면 설명을 대조해 보이는 단자만 지도화했다(BRC-AM7 17개, RM-IP10·500 각 5개). 스위치·표시등·도난 방지 구멍 제외.
- [x] portmap-audit 세 제품 좌표 경고 0 및 단자별 확대 이미지 눈 확인. 선택적 되감기 함수와 기존 Sony 이력 해시 검사 연결. 로컬 1280px·390px 모두 HTTP 200·번호 17/5/5·오류·페이지 넘침 0.
- [x] 검색 인덱스·스냅샷·읽기용 카탈로그 재생성. 전체 직렬 검사 724건(723 pass·0 fail·기존 skip 1), Pages 검증 284 장비·281 상세·508 이미지·143 uploads, 검색 인덱스 `--check` 통과.
- [x] Work가 #527 선병합 순서를 확인했다. 필수 Builder CI run `38673654111` 성공, 최신 main `c9fef4cc` 통합·파생 재생성·검증 후 병합 SHA `c0c528ad7fa4b23346fe7317a6c68734d94393bc`.
- [x] Pages run `38674061595` 성공. 공개 revision `c0c528a`에서 Sony 세 제품 모두 1280px·390px HTTP 200, 번호 17/5/5·브라우저 오류·페이지 가로 넘침 0 및 모바일 가로 이동 확인. [공개 캡처](기록/W-20261015-008-C-근거표.md#병합-후-공개-확인).

[Sony 근거표](기록/W-20261015-008-C-근거표.md) · [사진 전수 점검](기록/W-20261015-008-C-photo-audit.md) · [Work 인계](기록/W-20261015-008-C-Work-인계.md)

## W-20261016-001 · INOGENI 2종 시그널 플로우

- 상태: MERGED (PR #536 병합·Pages 공개 확인)
- 승인 근거: 사용자 원문 “toggle-dock-2x1과 u-bridge-3 2가지 제품도 hdf-ccf 나오는 것처럼 시그널 플로우 만들어줘”. READY 명세 `Work/작업/W-20261016-001.md`, 인계 `Work/기록/W-20261016-001-Codex-인계.md`를 main 커밋 `9a9beb98`에서 읽었다(PR #535).
- 기준 main SHA: `9a9beb98` · 브랜치 `codex/W-20261016-001-inogeni-signalflow` · 워크트리 `../codex-c`.
- 범위: TOGGLE DOCK 2×1 및 U-BRIDGE 3 제품 JSON의 `signalFlow`, 두 제품 전용 렌더, 원본/생성 상세 자산, 선택적 되감기 함수, 파생 산출물. 다른 제품 데이터·포트맵은 불변.
- [x] 공식 INOGENI 제품 페이지·기술 사양 및 기존 W-20261014-008 근거표와 io 인덱스를 대조했다.
- [x] TOGGLE 호스트 1 USB-C와 호스트 2 USB-B+HDMI, 선택된 한 쪽의 HDMI·USB 공유, DC 24V 입력과 호스트 1 PD를 서로 다른 선으로 그렸다.
- [x] U-BRIDGE PC HOST—CAT6A U/FTP 100m—DEVICE의 USB 데이터와 전원 주입 쪽별 PoC 방향 두 경우를 그렸다.
- [x] 기존 HDF-CCF와 다른 제품 검증·렌더 결과를 보존했다. 공유 `validFlow` 수정은 자동 승인 검토가 기존 제품 영향 우려로 거부하여 시도하지 않았고, 기존 규약에 맞는 데이터와 모델 두 개에 한정한 렌더 경로를 사용했다.
- [x] 변경 JSON과 렌더의 선택적 되감기를 기존 해시 검사에 연결했다. 대상 검사 및 데스크톱/모바일 로컬 화면을 확인했다.
- [x] 전체 검사 734건 중 733 pass·0 fail·기존 skip 1, 검색 인덱스 `--check`, Pages 검증 284 제품·281 상세·508 사진·143 uploads, `git diff --check` 통과. 로컬 1280px·390px 캡처에서 두 시나리오·전원 방향·가로 스크롤 확인.
- [x] 병합 직전 main `9a9beb98` 통합(추가 변경 없음), 파생 파일 재생성·검증, PR #536 Builder CI run `38814385797` 성공, 병합 SHA `e50f372ad71f6f873e27567a2f8eb1faa490c0bc`.
- [x] Pages run `38814876129` 성공. 공개 `version.json` revision `e50f372`. TOGGLE DOCK·U-BRIDGE 3 모두 1280px·390px에서 HTTP 200, 시나리오 2개, JS 오류 0. 390px에서는 좌우 834px 스크롤로 양끝 경로 확인. [근거·Work 인계](기록/W-20261016-001-C-Work-인계.md).

## W-20261016-002 · U-BRIDGE 3 차폐 케이블 필수 조건

- 상태: MERGED (PR #539 병합·Pages 공개 확인)
- 승인 근거: 사용자 2026-10-16 “U-BRIDGE 3는 반드시 U/FTP CAT6A 이상 S/FTP 케이블을 사용해야 해”. READY 명세 `Work/작업/W-20261016-002.md`와 `Work/기록/W-20261016-002-Codex-인계.md`를 main `49725e5aa851aef5ccf6f5ebe066f631262c280e`에서 읽었다.
- 기준 main `49725e5a`, 브랜치 `codex/W-20261016-002-ubridge-shielded-cable`, 전용 워크트리 `../codex-c`.
- 범위: `u-bridge-3`의 사양·특징·사용자 확인 근거·시그널 플로우 케이블 문구, 필요한 두 제품 전용 렌더 알약 텍스트만. 다른 제품·수치·Port Map 불변.
- [x] 사용자 확인(U) 출처·INFO 이슈·Link 사양, 한눈에 보기·기능·시그널 플로우에 차폐형 필수 조건 반영.
- [x] 선택적 되감기, 전체 검사·파생 산출물·Pages 검증, 로컬 1280px·390px 확인.
- [x] PR CI, 최신 main 재통합, 병합 순서 확인, 병합·Pages 배포·공개 확인.

- 검증: 전체 737건 중 736 pass·0 fail·기존 skip 1. 검색 인덱스 `--check`, `verify-pages`(284 제품·281 상세·508 이미지·143 PDF), `feature-wording --check`, 로컬 1280px·390px 두 시나리오와 가로 스크롤 통과. 신규 feature 행은 변경 전후 문장 비교용 `feature-wording --diff` 범위 밖이며, 기존 feature 보존과 명사형은 작업 전용 검사로 확인.
- [근거표](기록/W-20261016-002-C-근거표.md) · [Work 인계](기록/W-20261016-002-C-Work-인계.md)
- PR [#539](https://github.com/Seoulav/AV-Portal/pull/539): Builder CI [run 38824947674](https://github.com/Seoulav/AV-Portal/actions/runs/38824947674) 통과. 최신 main `49725e5a`와 파생 산출물을 재확인한 뒤 병합 SHA `2c2dd179a90a617886687885ad0f0de0785aafb6`.
- Pages [run 38825292302](https://github.com/Seoulav/AV-Portal/actions/runs/38825292302) 성공. 공개 `version.json` revision `2c2dd17`. [U-BRIDGE 3 공개 페이지](https://seoulav.github.io/AV-Portal/detail/?product=u-bridge-3) 1280px·390px HTTP 200, 두 시나리오 필수 케이블 알약 표시·한눈에 보기·사양 문구 확인, JS 오류 0. 390px은 기존 좌우 스크롤로 전체 그림 확인. 캡처는 로컬 `tmp/w16002-public-*`에 보관(비커밋).

## W-20261016-011 · Work 재검토 2차 수정

- Work가 확인한 빈 “2×2 격자 화면 비교 · 출력 4개 가정” 카드 원인은 제품 slug(`zenith-100` 등)와 데이터 키(`zenith100`) 불일치 및 Alta 전용 렌더 조건이었다.
- [x] 네 제품 모두 카드가 렌더되도록 하고 slug 키로 제품별 문구를 불러오게 수정했다. Pulse·Eikos는 출력 최대 2개, Zenith 100은 최대 3개라 4출력 구성 불가를 매뉴얼/모델 데이터시트 쪽수와 함께 표시했다. Zenith 200은 AM 52쪽의 2×2 지원, 레이어 자원 4개를 한 화면에 배정하는 가정, 믹싱 4개 또는 분할 8개를 표시했다.
- [x] 모든 네 제품의 1280px·390px 미리보기를 새로 캡처했다. 390px에서 네 제품 모두 `document.documentElement.scrollWidth=390`, 비교 카드 제목과 본문 표시를 확인했다. 캡처는 `tmp/w011-preview/`에 보관했다.
- [x] 최신 `origin/main` `4daad18d98fc079ff8388ffa53b2247e42b7e223`를 통합하고 상세 생성 자산·검색 인덱스·공개 스냅샷을 재생성했다.
- [x] 전체 테스트 803건 중 802 pass·0 fail·기존 skip 1. 검색 인덱스 `--check`, RTCOM `--check`, `verify-pages`(285 장비·282 상세·515 이미지·163 uploads)와 `git diff --check` 통과.
- [ ] 수정본 커밋·push 및 새 CI 확인 후, 사용자가 승인한 자동 병합 절차에 따라 병합·배포·공개 확인 예정.

## W-20261016-019 · Analog Way 화면·레이어 설계 가이드

- 상태: REVIEW (기존 초안 PR #594에 계산·표시 결함 수정 중)
- 명세·인계: `Work/작업/W-20261016-019.md`, `Work/기록/W-20261016-019-Codex-인계.md`, 기준 main `54d0693c`에서 확인.
- 브랜치: `codex/W-20261016-019-aw-layer-guide` · 전용 워크트리 `codex-c-w019`.
- 범위: Analog Way 프로세서 15종 계산 가이드(Midra 2·Alta 2·Aquilon RS 7·Aquilon C 4). 제품 JSON·공개 스냅샷·검색 인덱스 불변.
- [x] Aquilon·Alta·Midra 규칙으로 입력 계산과 3개 예시를 검증하는 순수 계산 모듈·시험 구현. 포털 `layerPlan`·`videoLayerPlan` 및 I/O 행의 모델별 입력 수와 대조.
- [x] 카드가 공용 보조 카드 가시성 필터에서 숨겨지는 문제와 2×2 예시의 출력 선택값 변환 오류를 고쳤다.
- [x] prototype 원본과 생성 beta 자산을 동기화하고 검증기 파일 허용 목록을 갱신했다. 과거 스타일 검사에는 W-019 추가분만 되감는 함수를 연결했다.
- [x] 11개 모델 상세에서 카드 표시·11개 모델 결과를 확인했다. 390px `scrollWidth=390`; 예시 3개, 키보드 행 추가·삭제 동작과 브라우저 오류 0 확인.
- [x] 전체 직렬 테스트 821건(820 pass·0 fail·기존 skip 1), `verify-pages`(285 장비·282 상세·515 이미지·0 미리보기·163 사용자 PDF), 검색 인덱스 `--check`, `git diff --check` 통과.
- [x] RS2 가이드 전용 1280px·390px 캡처를 `%TEMP%\w019-preview\guide-rs2-{1280,390}.png`에 저장. 세 대표 제품 전체 페이지 캡처도 같은 폴더에 보관.
- [x] 기존 PR #594(Claude 초안)를 이어 받아 최신 main과 통합하고, Work 재검토 수정·매뉴얼 원문/쪽수·새 시험·화면 증거를 PR 본문에 기록했다. 최신 수정 head의 Builder CI run `38931624999` 통과.
- 근거 확인: Aquilon User Manual v6.2 66쪽 “Each VPU contains 8 source links and 8 outputs links.” 및 “4 mixer layers (or 4 pairs of split layers)”; 68쪽 “A Screen using more than 8 outputs uses another VPU.”; 69쪽 “An Optimized mode is enabled for the whole VPU when one Screen uses at least 5 outputs links and at least one layer of capacity 2.”; Alta 4K User Manual 42쪽 “One Layer resource = one Mixing layer or one pair of Split layers allocated to a Screen.”; Zenith 100·200 데이터시트 각 6쪽 입력 상한 11·14; Midra 4K User Manual 42쪽 Mixer·Matrix·Blend 모드 규칙.
### W-20261016-019 재검증 (2026-10-16)

- #594는 Claude 작성 초안(3eceaf2)을 이어받았다. 추가 PR 없이 기존 브랜치를 보완했다. 계산/가시성 수정 570bc407, PR 브랜치 통합 1eb270ea, 최신 main 통합 f3afad77.
- supplemental 카드 가시성 목록 누락과 2×2 출력 조합 select 매핑 오류를 고쳤다. prototype 원본·beta 생성 자산·역사 되감기 검사를 함께 맞췄다.
- 전체 직렬 검사 824건: 823 pass, 0 fail, 기존 skip 1. W-019 전용 9/9. verify-pages 285·282·515·0·163, 검색 인덱스 --check 704524 bytes, git diff --check origin/main...HEAD 통과.
- Headless Chromium: 11개 승인 모델 각각 가이드 1개·비교 결과 11개, RC400T·EC-4BV 0개. 모든 대상 제품에서 scrollWidth=390. 예시 추천 Zenith 200 / Aquilon RS2 / Pulse 4K. 키보드 Enter 행 추가·삭제 2→1, JS 오류 0.
- 미리보기: %TEMP%\w019-preview\guide-aquilon-rs2-{1280,390}.png, guide-zenith-200-{1280,390}.png, guide-pulse-4k-{1280,390}.png; 전체 상세는 같은 폴더의 aquilon-rs2·zenith-200·pulse-4k 각 {1280,390}.png.
- 세부 매뉴얼 원문·쪽·캡처·독립 검증 요청은 Work/기록/W-20261016-019-Work-인계.md에 기록. #594는 Draft 상태로 두고 Work 승인 전 병합하지 않는다.

### W-20261016-019 Work 검토 반영 (2026-10-17)

- [x] 최신 main `0645b86c`를 통합하고, Aquilon VPU 배분을 전수탐색으로 바꿨다. [1,2,2,3] 레이어 입력 순서의 24개 순열이 모두 RS2를 2 VPU로 가능·추천 처리한다.
- [x] 레이어 0인 화면은 Aquilon 처리 링크를 소비하지 않지만 PGM·커넥터 수에는 포함한다. 분할 레이어는 쌍 단위 자원 규칙을 적용했다(Work 2026-10-17 결정, 매뉴얼 66쪽).
- [x] 초과한 한도만 사유로 쓰고 불가 모델의 VPU 사용량·Optimized mode를 감췄다. 표시를 쉬운 말로 바꾸고 불가 모델을 모바일 접기 목록으로 분리했다.
- [x] Aquilon Cmini·C·C+·Cmax를 추가하고 커넥터 수에 “BTO 최대 구성”을 표시했다. 가능 모델 우선, 불가 모델 접기, 추천 시리즈 순서와 “가격 비교가 아님” 안내를 넣었다.
- [x] Prototype 원본을 수정하고 beta 사본 15개를 `node beta/build-detail-assets.mjs`로 생성했다. 공개 제품 JSON은 바꾸지 않았다.
- [x] RS2·Zenith 200·C+ 시나리오 2 미리보기: `%TEMP%\w019-preview\review-{aquilon-rs2,zenith-200,aquilon-cplus}-{1280,390}.png`. 각 1280px·390px에서 결과 15종, 가능 8·불가 7, `scrollWidth=390`; 모바일은 불가 7종 접힘, 브라우저 오류 0.
- [x] 전체 직렬 테스트 846 pass·0 fail, W-019 16/16, `verify-pages`(289 equipment·286 details·525 images·0 preview·167 user PDFs), 검색 인덱스 `--check`(712807 bytes), `git diff --check` 통과. PR #594 최신 head `898f2f91` Builder CI run `38931624999` 통과.
- [ ] Work 독립 재검토 대기. 승인 전 병합하지 않는다.


### W-20261016-019 Work recheck #2 (2026-10-17)

- [x] Updated the C-series note to "입출력 수: BTO maximum configuration". Screen-output inputs now accept 1?4 outputs, matching the UI. Midra overflow wording now uses "4K 화면 출력".
- [x] Updated prototype sources and regenerated beta assets; added boundary and wording regression assertions. W-019 focused tests: 17/17 pass.
- [x] Full serial suite: 848 tests, 847 pass, 0 fail, 1 skipped. Concurrent mode reproduced the existing Windows RTCOM temp-directory rename EPERM; serial mode passed. Pages verification and search-index check passed.
- [ ] PR #597 remains open; latest origin/main is 0645b86c. Integrate if #597 merges before W-019 merge.

### W-20261016-019 post-#597 integration (2026-10-17)

- [x] #597 is merged at 1ebee612c72228529af00d0455fa0a6846c89c77. Integrated into this branch as merge commit eb4c19cc; resolved the shared history test while retaining both W-014 and W-019 inverse checks.
- [x] Regenerated detail assets, search-index (712807 bytes), and readable catalog after main integration.
- [x] Post-integration serial suite: 855 tests, 854 pass, 0 fail, 1 skipped. verify-pages and search-index --check pass.
- [ ] Push integration, update PR text, confirm CI, then mark ready and merge.

## W-20261017-003 2부 종료 · W-20261017-005 착수 (2026-10-17)

- W-003 2부 PR #612는 Work의 화면·코드 검토 승인 후 최신 main을 통합하고 파생물을 재생성했다. 전체 직렬 시험 887건(886 통과·기존 건너뜀 1), `verify-pages`, 검색 인덱스 검사, Builder CI를 통과했다.
- PR #612 병합 SHA `13dbadb3d8064c2ccdf2948758678b0bbf9c11a0`; Pages run `39006252653` 성공, 공개 revision `13dbadb`. Aquilon RS2 공개 화면을 1280px·390px에서 확인했다. 두 폭에서 페이지 가로 넘침과 JS 오류가 없고, 7680×1080@60의 출력 4개 및 Aquilon HD 주의 문구가 보인다.
- W-20261017-005 상태: MERGED (PR #614 병합·Pages 공개 확인). 명세 `Work/작업/W-20261017-005.md`, 인계 `Work/기록/W-20261017-005-Codex-인계.md`, 실측 원본 `Work/기록/W-20261017-003-시뮬레이터실측.md`를 기준 main `13dbadb3d8064c2ccdf2948758678b0bbf9c11a0`에서 읽었다. 브랜치 `codex/W-20261017-005-aw-simulator`, 전용 워크트리 `codex-c-w005-aw-sim`.
- [x] Aquilon 가이드 판정의 VPU 분산·장비 전체 자원 기준을 실측에 맞게 보정하고 회귀 시험을 갱신했다. RS1은 2×2 믹싱 6개 불가, RS2·C+는 가능하며 소스 링크 12개·출력 링크 8개·VPU 2개로 계산한다.
- [x] 기준 문서와 공용 카드의 Aquilon 근거·미확인 문구를 실측 4건으로 갱신했다. Alta·Midra, 제품 JSON과 렌더 기능·스타일은 수정하지 않았다. 상세 JS import와 HTML script의 캐시 버전만 갱신했다.
- [x] 15종 노출 회귀 시험 및 RS2·C+·Zenith 200 카드의 760px·390px 펼침 화면을 확인했다. 여섯 화면의 `scrollWidth`는 각 760·390이며 `outputs/w005-preview/`에 PNG와 측정값을 저장했다.
- [x] 전체 직렬 시험 890건(889 통과·0 실패·기존 건너뜀 1), `verify-pages`(289·286·529·167), 검색 인덱스 `--check`(712867 bytes), 파생 산출물 재생성, `git diff --check` 완료.
- [x] Draft PR [#614](https://github.com/Seoulav/AV-Portal/pull/614)를 열고 실측 근거·검사·로컬 미리보기 경로를 본문에 적었다.
- [x] PR #614 첫 필수 Builder CI run `39007709069` 통과. Work가 실측 수치·약 20만 건 판정 비교·760px/390px 화면을 독립 검증해 병합 차단 문제가 없다고 확인했다.
- [x] Work의 Ready 전 보완 2건을 반영했다: 여러 화면 합산으로 출력 배치 VPU보다 더 많은 소스 VPU가 필요할 때도 실측 배지를 표시하고, 여러 화면 간 남는 소스 링크 공유는 미실측임을 기준 문서와 인계서에 기록했다. 새 회귀 시험을 포함한 전체 직렬 시험 891건(890 통과·0 실패·기존 건너뜀 1), Pages·검색 검사 통과.
- [x] 수정 head Builder CI [run 39008526741](https://github.com/Seoulav/AV-Portal/actions/runs/39008526741) 통과. 최신 main `13dbadb3`와 작업 브랜치의 차이 0, 작업 트리 깨끗함, 상세 자산·검색 인덱스·스냅샷·읽기용 카탈로그 재생성, `git diff --check origin/main...HEAD` 통과를 확인하고 PR #614를 병합했다. 병합 SHA `481765446c5b8cf692402e42aa9f670650def7e8`.
- [x] Pages [run 39008781631](https://github.com/Seoulav/AV-Portal/actions/runs/39008781631) 성공, 공개 `version.json` revision `4817654`. [Aquilon C+ 공개 상세](https://seoulav.github.io/AV-Portal/detail/?product=aquilon-cplus)를 1280px·390px에서 확인했다. 두 폭 모두 실측 출처·용량 4 믹싱 6개 APPLY·Region 24/12 문구가 보이고 `scrollWidth`가 창 너비와 일치한다. 공개 캡처는 로컬 `%TEMP%/w005-public-check/aquilon-cplus-{1280,390}.png`에 있다.

## W-20261017-011 1단계 — Aquilon 슬롯 중심 Rear 시안 (2026-10-17)

- 상태: REVIEW (RS2·C+ 두 종의 Draft PR 시안). Work·사용자 확인 전 병합 및 나머지 9종 적용 보류.
- 명세: `Work/작업/W-20261017-011.md`, 읽은 기준 main `23bc6b289eef66020e2397015e398075e052547c`.
- 브랜치·워크트리: `codex/W-20261017-011-aquilon-slots`, `../codex-c-w011-aquilon-slots`.
- [x] RS2·C+ Rear 원본 사진과 제조사 제품 페이지를 대조하여 슬롯별 카드 예시, 최하단 덮개, 고정부 위치를 확인했다.
- [x] RS2 8슬롯+고정부 8개, C+ 11슬롯+고정부 8개를 슬롯 우선 번호로 재배치했다. 사진·io·사양·렌더러·다른 9종은 수정하지 않았다.
- [x] 과거 지도 해시를 좁은 되감기 함수로 연결하고, 기존 W-014·W-015 역사적 시험의 대상 지도를 먼저 되감았다.
- [x] `portmap-audit` 시트와 760px·390px 전후·좌우 확대 캡처를 `Work/기록/W-20261017-011-preview/`에 저장했다. 브라우저 scrollWidth 760·390, 사진 영역만 가로 이동. 번호별 점검은 `Work/기록/W-20261017-011-점검표.md`.
- [x] 전체 직렬 Node 시험 913건: 912 pass, 0 fail, 기존 skip 1. `node beta/verify-pages.mjs`: 289 장비·286 상세·529 이미지·167 업로드. `node beta/build-search-index.mjs --check`: 통과. `git diff --check`: 통과.
- [x] 최신 main `7534846e`를 통합하고 검색 인덱스·스냅샷·읽기용 카탈로그를 재생성했다. 통합 뒤 전체 직렬 시험 913건(912 pass·기존 skip 1·0 fail), Pages·검색 검사·커밋 diff 검사를 다시 통과했다.
- [x] 검토용 Draft PR [#634](https://github.com/Seoulav/AV-Portal/pull/634)을 열고 전후 760px·390px 확대 비교를 제출했다.
- [x] Work·사용자 시안 확인 완료. 승인 전까지 Ready·병합·나머지 9종 적용을 하지 않았다.
- 승인 갱신(2026-10-17): 사용자가 시안을 보고 "둘다 진행"으로 RS2·C+ 시안 및 나머지 9종 동일 기준 적용을 승인했다. Work도 RS2 전후 760px·390px 확대 좌·우 캡처를 직접 확인했다. 1단계 PR #634는 최신 main·CI를 다시 확인하고 병합하며, 2단계는 별도 Draft PR로 제출한다.
- 참고: main에는 이 ID의 별도 Codex 인계서가 없지만 READY 명세와 Work의 직접 배정이 있어 1단계 시안을 진행했다.
