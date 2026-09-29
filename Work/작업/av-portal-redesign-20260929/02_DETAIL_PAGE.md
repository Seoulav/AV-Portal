# 2단계 — 제품 상세 화면 개편 (탭 → 번호 카드)

- 선행: 1단계 완료·사용자 확인
- 바꾸는 것: `detail/index.html`, `detail/styles.css`, `detail/app.js`(그리기 부분)
- 가능하면 그대로 재사용: `detail/product-detail-model.mjs`의 `prepareProductDetail`, `selectKeySpecifications`, `prepareConnectorGroups`, `connectorPresentation`, `summarizeQuickDocuments`
- 바꾸지 않는 것: `detail/data/*.json`, `detail/images/`, 주소
- 참고: `ref/screens/goal-rtcom-hd-210u.png`, `ref/screens/now-avportal-tr315.png`, `ref/screens/now-avportal-novastar-h5-io.png`

## 1. 전체 배치

```
[사이트 머리 바]
[제품 머리: 아이콘 타일 · 제품명 · 부제 ········ 알약 버튼들]
┌ 왼쪽 360px ─────────┐ ┌ 오른쪽 1fr ──────────────────┐
│ 01 한눈에 보기       │ │ 02 제품 사진                  │
│ 04 제품 사양         │ │ 03 연결 단자                  │
│ 05 주요 기능         │ │ 06 관련 제품 (데이터 있을 때) │
└─────────────────────┘ │ 07 문서                       │
                         └──────────────────────────────┘
[제조사 한 줄]
[▸ 자료 출처·검증 기록 (N건)]  ← 기본 접힘
```

- `grid-template-columns:360px 1fr; gap:22px; align-items:start`. 1000px 이하에서는 1열
- 휴대폰(720px 이하): 01 → 02 → 03 → 04 → 05 → 06 → 07 → 제조사 → 기록 순서(CSS `order`)
- 카드 번호는 카드 종류를 뜻합니다. 카드를 숨겨도 번호를 다시 매기지 않습니다.
- 배경에 `.pg-orbs`, 본문은 `.pg-wrap` 안에 둡니다.

## 2. 사이트 머리 바

- 흰 반투명 바(`rgba(255,255,255,.72)` + `backdrop-filter:saturate(180%) blur(20px)`, 모서리 24px, 글래스 카드 그림자, 위·좌우 여백 12px)
- 왼쪽: 작은 AV Portal 아이콘 타일(36px) + "AV PORTAL" / 오른쪽: 알약 검색칸(`--pg-field-fill`, "다른 제품 검색") + `제품 탐색` 알약 버튼
- 휴대폰에서는 기존처럼 돋보기 버튼으로 검색칸을 여닫습니다(동작 유지).
- 기존 이동 경로(Equipment Library / 제조사 / 제품) 줄은 머리 바 아래 12px 글자로 유지합니다.

## 3. 제품 머리

| 위치 | 내용 | 데이터 |
|---|---|---|
| 왼쪽 | `.pg-swatch` 안에 분류 아이콘(아래 표) | `categories` 마지막 항목 |
| 제목 | 제품명 | `productName` |
| 부제 | `제조사 · 영문 한 줄 요약` | `manufacturer`, `english` |
| 오른쪽 | `← 제품 탐색` → 문서 버튼(`.pg-doc`) → `공식 제품 페이지 ↗` → `인쇄 / PDF` | `documents` 중 열 수 있는 것(`url`이 있고 `status`가 FOUND 또는 VERIFIED), 공식 링크는 기존 `officialLink` |

- 문서 버튼은 종류별로 하나씩, 최대 3개(매뉴얼 → 사양서·데이터시트 → 기타 순). 나머지는 07 카드에서 봅니다.
- 없애는 것: 46~66px 초대형 제목, SERIES·TYPE 알약 줄(→ 04 표 맨 위로), "문서 바로가기" 4칸 패널(→ 07 카드와 기록 영역으로), 머리의 상태 배지(→ 기록 영역으로)

분류 아이콘(흰 선, 26px, 선 굵기 1.8)

| `categories` 마지막 값(대소문자·한글 무시하고 포함 여부로 판정) | 아이콘 |
|---|---|
| Amplifier, 앰프 | 파형이 커지는 모양 |
| Loudspeaker, Speaker, 스피커 | 스피커 |
| Microphone, 마이크, 무선 시스템 | 마이크 |
| Audio Processor, DSP, Audio Interface, Mixer, 믹싱 | 페이더 3개 |
| Projector, 프로젝터 | 프로젝터 |
| Digital Signage, Display, 사이니지, LED | 화면 |
| Camera, 카메라 | 카메라 |
| Video Processor, Signal Switcher, Converter, Matrix | 교차 화살표 |
| Video Conferencing, 화상회의 | 화면 + 사람 |
| Network Switch, 네트워크 | 연결된 점 3개 |
| Control, 제어 | 조절 다이얼 |
| 그 외 | AV 글자 |

## 4. 카드별 명세

### 01 한눈에 보기 (id `overview`)

- 요약: `korean` 전문, 15px/1.6 `--pg-ink-2`
- 분류 알약: `categories`를 `.pg-pill`로 한 줄
- 핵심 수치: `selectKeySpecifications` 결과 앞 4개를 `.pg-facts`로. 라벨은 `name`, 값은 `value`, 단위는 `unit`. 값이 20자를 넘으면 그 칸은 값 글자를 14px/700으로 줄입니다.
- 펼침: `.pg-more` "전체 설명 보기" → `overview` 전문(줄바꿈 유지)

### 02 제품 사진 (id `gallery`)

- 이미지가 2장 이상이면 위쪽에 `.pg-seg`(버튼 이름은 `images[].role`: Main·Front·Rear·Perspective·Other)
- `.pg-photo`에 선택 사진, 오른쪽 아래에 "확대 보기" 작은 알약(기존 확대 대화상자·돋보기 그대로)
- 사진 아래 12px `--pg-muted` 캡션: `images[].note` 또는 `alt`
- 이미지가 없으면 카드를 숨깁니다(240개 모두 1장 이상 있음).
- 기존 "공개 사용 권한 미확인" 배지와 "이미지별 확인 상태 보기"는 기록 영역으로 옮깁니다.

### 03 연결 단자 (id `io`)

- 후면 사진이 있으면(`images` 중 role Rear) `.pg-photo`로 먼저 보여 줍니다. 제목 보조 설명 `— 후면`
- 단자 카드 `.pg-port` 격자: PC 4열, 1000px 이하 3열, 720px 이하 2열
  - 제목 줄: 신호 색 점 + 커넥터 이름(`connectorPresentation`의 이름)
  - 둘째 줄: `IN 2` / `OUT 4` / `IN/OUT 1` 작은 알약(방향 `direction`, 수량 `quantity`)
  - 셋째 줄: 신호·규격 한 줄(`signal`, `protocol`), 12px `--pg-ink-2`, 두 줄 넘으면 말줄임
- 신호 색 점은 그룹·커넥터 이름으로 정합니다: HDMI → `--pg-sig-hdmi`, DisplayPort·DP → `--pg-sig-dp`, SDI·BNC → `--pg-sig-sdi`, RJ-45·HDBaseT·Ethernet·Network → `--pg-sig-cat`, 광·SFP·Fiber → `--pg-sig-fiber`, Audio·XLR·Phoenix·Dante → `--pg-sig-audio`, Control·RS-232·USB·GPIO → `--pg-sig-control`, Power·AC·DC → `--pg-sig-power`, 그 외 `--pg-muted`
- 카드 아래 `.pg-more` "전체 단자 표 보기" → 기존 표를 `.pg-table`로(조건·가용성 열 포함)
- `io`가 비어 있으면(14개) 카드를 숨깁니다.
- 단자 번호표(RTCOM Port Map의 번호)는 좌표 데이터가 없으므로 만들지 않습니다. 기존 안내 문구 "위치 번호는 정확한 근거가 없어…"도 지웁니다.

### 04 제품 사양 (id `specifications`)

- `.pg-table` 2열(구분 | 사양). 맨 위 두 줄: 시리즈(`series`, 있을 때만), 종류(`itemType`)
- 그다음 `specifications`를 `group`별로 묶고, 그룹이 바뀌는 줄 앞에 그룹 이름 소제목 행(10.5px/700 대문자 `--pg-muted`, 배경 `--pg-field-fill`)
- 값은 `value` + `unit`, 조건(`condition`)은 값 아래 11px 한 줄
- `verification`이 VERIFIED·FOUND가 아닌 행(약 85행)에만 값 옆에 작은 상태 배지
- 행이 12개를 넘으면 앞 12행만 보이고 `.pg-more` "사양 N개 더 보기"

### 05 주요 기능 (id `features`)

- `.pg-checks`, `features[].text`
- 6개를 넘으면 앞 6개만 보이고 "기능 N개 더 보기"
- 문장 끝 어미는 데이터 그대로 둡니다(어투 통일은 5단계 범위 밖, 별도 결정).

### 06 관련 제품 (id `related-products`)

- 관련 제품 데이터가 있을 때만 보입니다(현재 240개 모두 없음 → 모두 숨김).
- 모양: 작은 카드 격자(흰 사진 칸 64px + 제품명 13px/700 + 관계 11px `--pg-muted`)
- 해시 `#related-products`로 들어왔는데 카드가 숨겨져 있으면 01 카드로 이동합니다.

### 07 문서 (id `documents`)

- 열 수 있는 문서만 목록으로: 종류(11px 대문자 `--pg-muted`) / 제목(13px/700) / 언어 알약 / `열기 ↗`·`↓` 버튼
- `MISSING` 문서 칸은 여기 넣지 않고 기록 영역의 "없는 문서"로 옮깁니다.
- 열 수 있는 문서가 없으면 카드를 숨깁니다.

### 제조사 한 줄

- 얇은 글래스 띠: `MANUFACTURER` 10.5px 라벨 + 제조사명 15px/800 + 오른쪽 `제조사 공식 홈페이지 ↗`

### 자료 출처·검증 기록 (id `sources`, `.pg-details`)

- 기본 접힘. 제목 "자료 출처·검증 기록 (N건)", N은 `issues` 수 + 없는 문서 수 + 확인 필요 이미지 수
- 안에 순서대로: 패키지 상태 배지와 `verificationSummary` → `seriesNote` → 이미지 권리 문구(`presentation.galleryRightsBadge`·`galleryRights`) → 이미지별 확인 상태(`imageStatuses`) → 없는 문서(`documents` 중 MISSING) → 확인 사항(`issues`) → 출처(`sources`, 링크 포함) → 검증 상태 설명(범례)
- 해시가 `#sources`이거나 옛 출처 해시(`legacySourceHash`)이면 펼치고 스크롤합니다.

## 5. 해시와 스크롤

- 탭 코드(`activatePanel`, `revealActiveTab`, `role="tablist"`)는 지우고, 해시가 가리키는 카드로 부드럽게 스크롤합니다. 머리 바 높이만큼 `scroll-margin-top`을 줍니다.
- 뒤로 가기로 돌아오면 브라우저가 기억한 위치를 유지합니다(기존 `scrollRestoration` 동작 유지).

## 6. 인쇄

- `@media print`: 배경 번짐·머리 바·버튼 숨김, 카드는 흰 배경·연한 테두리, 기록 영역은 펼친 상태로 출력

## 7. 검증

1. 대표 4종을 1280px·390px로 캡처해 `ref/screens/goal-rtcom-hd-210u.png`와 나란히 비교합니다.
   - `tr315`(사진 1장, 카메라)
   - `novastar-h5`(후면 사진, 단자 많음)
   - 연결 단자가 없는 제품 1개(`io` 빈 제품 중 선택)
   - 주요 기능이 7개 이상이고 문서가 3개 이상인 제품 1개
2. 240개 상세 주소를 모두 여는 스크립트(Playwright 등)로 콘솔 오류 0, 깨진 이미지 0, 390px 가로 스크롤 없음을 확인합니다.
3. 해시 7개(`#overview` … `#sources`)로 각각 들어가 올바른 카드로 이동하는지 확인합니다.
4. 검색·확대 대화상자·뒤로 가기가 작업 전과 같게 동작하는지 확인합니다.
5. `git diff --stat -- detail/data detail/images catalog.json` 결과가 비어 있어야 합니다.
