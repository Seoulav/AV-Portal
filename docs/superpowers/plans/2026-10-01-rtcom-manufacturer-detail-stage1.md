# W-20261001-001 RTCOM형 제조사 상세 1단계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 이 세션에서 순차 실행하며 에이전트 병렬 위임은 하지 않는다.

**Goal:** 기존 사진·단자 정보를 보존하면서 하나의 공통 상세 템플릿과 근거 기반 시범 5종을 만든다.

**Architecture:** 현재 prototype 원본 → 공유 변환 → beta 생성물 구조를 유지한다. 선택 필드의 검증·표시용 준비와 DOM 카드는 작은 모듈로 분리하고 기존 제품 객체를 변경하지 않는다. 유효한 Port Map/Signal Flow가 없으면 현재 02 제품 사진/03 연결 단자 렌더링을 그대로 사용한다.

**Tech Stack:** Node.js 24, vanilla JavaScript ESM, HTML/CSS, node:test, 기존 Playwright/Chromium 화면 검증 도구. 새 프레임워크·DB·런타임 의존성은 도입하지 않는다.

**Spec:** [READY 명세](../../../Work/작업/W-20261001-001.md), [Codex 인계서](../../../Work/기록/W-20261001-001-Codex-인계.md)

**병합 근거:** [PR #136](https://github.com/Seoulav/AV-Portal/pull/136) MERGED, `c046bc81191ea04cf69552c85934ab2d6b378fca`, 2026-10-01 01:17:16 UTC. 명세·인계서의 OPEN/미병합 문구는 병합 전 스냅샷이다. 사용자 보완 3건을 포함한 READY 명세가 main에 존재한다.

**현재 단계:** 파일별 계획 제시. 아래 체크박스는 아직 수행 결과가 아니다. 템플릿·시범 데이터 구현은 이 문서 작성 중 시작하지 않았다.

## Global Constraints

- 02: 유효한 portMap이 없으면 기존 제품 사진의 역할 전환·확대를 보존한다.
- 03: 유효한 signalFlow가 없으면 기존 연결 단자 카드와 전체 단자 표를 보존한다.
- 04: 영문 대문자 그룹 소제목 줄 없이 행마다 분류 색 점. 출처 코드는 하단 기록으로 이동한다.
- 기존 사양·I/O·검증 상태·이미지·문서·공개 catalog 값을 바꾸지 않는다.
- 시범은 H5, ULXD4D, DCi 4|600DA, EB-PQ2220B, Aquilon RS1의 정확한 5종이다.
- 템플릿 PR과 시범 데이터 PR을 나눈다. Windows 줄바꿈 수정은 둘보다 앞선 작은 선행 PR이다.
- RTCOM 원본·어댑터의 제품별 의미를 확장하지 않는다. RTCOM 데이터 공통화는 3단계다.
- 새 웹 조사·다른 모델 대입·최종 Schema/DB/Storage 결정은 하지 않는다.
- 1280×850, 390×850에서 실제 화면을 비교하고 가로 넘침·콘솔 오류·정보 소실을 검사한다.
- 2단계·3단계는 별도 승인 전 시작하지 않는다.

## Review Focus

1. 선택 필드가 없거나 손상된 제품에서도 사진 전환·확대·모든 단자 행이 남아야 한다 → Task 2/4.
2. 이미지 좌표와 실제 픽셀 크기가 다르거나 이미지 로딩이 실패하면 잘못된 포트 번호를 그리지 않아야 한다 → Task 2/3.
3. 서로 다른 해상도·채널·카드 구성 조건을 단순한 물리 포트 총수로 표시하면 안 된다 → Task 2/5.
4. 06/07 설정을 넣어도 기존 관련 제품·문서 및 해시 진입이 사라지면 안 된다 → Task 3/4.
5. 원본 자산 재생성·snapshot 갱신이 시범 외 JSON이나 승인된 기준 해시를 바꾸면 안 된다 → Task 3/5/6.

## PR 순서와 파일별 책임

| 순서 | 브랜치 | 파일 | 변경 목적 |
|---|---|---|---|
| 선행 PR | `codex/W-20261001-001-pdf-bytes` | `.gitattributes` | PDF.js 배포 파일 4개의 원본 바이트를 OS와 무관하게 보존 |
| 선행 PR | 동일 | `Work/지시서.md`, `Work/기록/W-20261001-001-PDF-검증.md` | Linux/Windows 결과와 원인·수정 범위 |
| 템플릿 PR | `codex/W-20261001-001-detail-template` | `prototype/brc-am7/detail-enhancements.mjs` 신규 | 선택 필드 검증, 좌표 비율, 카드 선택을 위한 순수 함수 |
| 템플릿 PR | 동일 | `prototype/brc-am7/detail-enhancement-view.mjs` 신규 | lead·수치·Port Map·흐름·설정 DOM 생성. 기술 값 추론 금지 |
| 템플릿 PR | 동일 | `prototype/brc-am7/app.js` | 기존 갤러리/단자 기능을 재사용하면서 선택 카드 연결·hash·레이아웃 통합 |
| 템플릿 PR | 동일 | `prototype/brc-am7/index.html`, `styles.css` | 선택 카드 호스트, 행별 색 점, 2×2 수치, 반응형, 자산 버전 |
| 템플릿 PR | 동일 | `prototype/brc-am7/product-detail-model.mjs` | 기존 prepareProductDetail와 visibleDetailCards에 검증된 선택 데이터 연결 |
| 템플릿 PR | 동일 | `beta/detail-asset-transforms.mjs` | 두 신규 원본/생성물 쌍 등록 |
| 템플릿 PR | 동일 | `beta/build-detail-assets.mjs` 신규 | 제품 JSON을 건드리지 않는 상세 자산 전용 생성 명령 |
| 템플릿 PR | 동일 | `beta/site/detail/`의 대응 HTML/JS/CSS/MJS | 위 공용 변환으로 생성. 수동 편집 금지 |
| 템플릿 PR | 동일 | `beta/verify-pages.mjs` | 승인된 선택 키·새 MJS 두 파일의 정확 목록과 중첩 값 검증. 기존 해시 검사 유지 |
| 템플릿 PR | 동일 | `tests/detail-enhancements.test.mjs` 신규, `tests/detail-cards.test.mjs`, `tests/detail-assets.test.mjs`, `tests/product-detail-template.test.mjs` | fallback·좌표·흐름·설정·생성물 동기화 회귀 |
| 템플릿 PR | 동일 | `scripts/verify-w20261001-detail.cjs` 신규 | baseline/after 캡처와 실제 DOM·동작 비교 |
| 시범 데이터 PR | `codex/W-20261001-001-pilot-data` | `beta/site/detail/data/{novastar-h5,ulxd4d,dci-4-600da,eb-pq2220b,aquilon-rs1}.json` | 선택 필드와 기존 sources의 page만 근거 확인 후 추가 |
| 시범 데이터 PR | 동일 | `beta/public-snapshot.json`, `beta/site/search-index.json` | 재생성에 필요한 차이만 반영 |
| 시범 데이터 PR | 동일 | `tests/detail-pilot-data.test.mjs` 신규 | 5종만 변경·기존 값 불변·근거 매핑·선택 필드 계약 |
| 두 구현 PR | 각 브랜치 | `Work/지시서.md`, `Work/기록/W-20261001-001-Work-인계.md` 및 단계별 검증·캡처 | 실제 검증과 후속 단계 인계 |

## Task 1: PDF.js 원본 바이트 보존 — 작은 선행 PR

확인된 근거: Linux [Run 36579034646](https://github.com/Seoulav/AV-Portal/actions/runs/36579034646)의 Ubuntu 24.04에서 PDF.js 테스트 포함 145 pass / 0 fail / 1 skip. 같은 SHA의 Windows 파일은 네 파일 모두 CRLF를 LF로 되돌리면 Git blob과 동일하다. 테스트 첫 실패가 LICENSE라 뒤 세 파일 검사가 실행되지 않았을 뿐, 네 파일 모두 동일 원인이 있다.

**Files:** `.gitattributes`, Work 진행·검증 기록. `tests/pdf-vendor.test.mjs`와 vendor 파일은 수정하지 않는다.

- [ ] 최신 main의 독립 Codex 워크트리에서 `node --test tests/pdf-vendor.test.mjs` 실패를 재현한다.
- [ ] `.gitattributes`에 아래 정확 파일 규칙을 추가한다. vendor 사본은 외부 원본 SHA를 유지해야 하므로 임의 개행 정규화 대신 `-text`를 사용한다.

```gitattributes
beta/site/vendor/pdfjs/LICENSE -text
beta/site/vendor/pdfjs/VERSION.txt -text
beta/site/vendor/pdfjs/pdf.min.mjs -text
beta/site/vendor/pdfjs/pdf.worker.min.mjs -text
```

- [ ] 새로운 임시 체크아웃에서 `core.autocrlf=true`를 명시하고 네 파일의 SHA와 기존 기대값이 일치하는지 검사한다. 기존 다른 작업자의 파일은 덮어쓰지 않는다.
- [ ] 기존 테스트와 `npm test`, Pages·검색 인덱스 검사를 실행한다. test skip/해시 수정/vendor diff가 0임을 확인한다.
- [ ] 자체 리뷰와 최신 main 통합 후 작은 PR을 병합하고 Linux Pages 테스트 결과도 확인한다.

## Task 2: 선택 필드와 fallback 계약

**Files:** `detail-enhancements.mjs`, `product-detail-model.mjs`, `tests/detail-enhancements.test.mjs`, `tests/detail-cards.test.mjs`.

**Interfaces:**

```js
prepareEnhancements(product)
// => { lead: string|null, subtitle: string|null, keyFacts: [],
//      portMap: object|null, signalFlow: object|null, settings: [] }
selectCardModes(product, enhancements)
// => { gallery: 'port-map'|'gallery'|null, io: 'signal-flow'|'io'|null }
portMarkerPercent(item, naturalWidth)
// => { left: number, width: number } | null
```

- [ ] 먼저 실패하는 테스트를 작성한다. 유효한 선택 필드가 없는 경우 기존 사진/I/O 경로를 고른다.

```js
const p = { images: [{ role: 'Rear', file: 'rear.webp' }], io: [{ connector: 'XLR' }] };
assert.deepEqual(selectCardModes(p, prepareEnhancements(p)), { gallery: 'gallery', io: 'io' });
assert.deepEqual(selectCardModes({ ...p, portMap: { image: 'Rear', items: [] } }, prepareEnhancements(p)), { gallery: 'gallery', io: 'io' });
assert.equal(portMarkerPercent({ x1: 110, x2: 90 }, 200), null);
assert.deepEqual(portMarkerPercent({ x1: 20, x2: 60 }, 200), { left: 10, width: 20 });
```

- [ ] `node --test tests/detail-enhancements.test.mjs`로 실패를 확인한 뒤 순수 함수 구현. 문자열·배열·숫자·유한값·역할·중복 번호·좌표 범위를 검사한다.
- [ ] settings는 승인된 네 kind만 받는다. table/edid/dip은 columns/rows, modes는 name/summary/detail 항목을 검증한다. 빈/부정확한 설정을 표시하지 않는다. 06/07을 넘는 세 번째 설정은 명세 밖이므로 데이터 검증에서 거부한다.
- [ ] `keyFacts`가 5개 이상이거나 숫자가 아닌 좌표·외부 이미지 경로·알 수 없는 signalFlow type이 있으면 공개 검사에서 실패하고 브라우저에서는 해당 선택 카드만 fallback한다.
- [ ] `structuredClone` 사본과 `deepEqual`로 준비 함수가 입력·기존 배열을 변경하지 않음을 검사한다. 한 개의 keyFact만 있으면 기존 2개 이상 표시 규칙에 따라 fact 타일을 만들지 않는다.
- [ ] 단위 테스트 통과 후 커밋한다.

## Task 3: 카드 렌더링과 자산 생성

**Files:** `detail-enhancement-view.mjs`, 기존 app/index/styles, 자산 변환·생성 명령, `beta/verify-pages.mjs`, 상세 테스트.

**Interfaces:** `renderLead(text) → DocumentFragment`, `renderKeyFacts(facts) → HTMLElement`, `renderPortMap(items, image) → HTMLElement`, `renderSignalFlow(flow, model) → HTMLElement`, `renderSetting(setting, number) → HTMLElement`.

- [ ] lead의 사용자 텍스트는 Text node로 만들고 첫 `**…**` 한 쌍만 `strong` node로 변환한다. `<img onerror=…>` 같은 입력을 테스트해 실행되지 않게 한다.
- [ ] 01은 선택 lead/subtitle/keyFacts가 있으면 사용하고 없으면 기존 요약·수치를 유지한다. 원래 overview 전문은 기존 펼침에서 계속 접근한다.
- [ ] 02는 기존 selectImage/확대 다이얼로그에 Port Map overlay만 추가한다. Front/Rear 전환 시 번호가 해당 role 사진에만 붙고, 다른 사진·로딩 실패·범위 밖 좌표에서는 번호를 지운다. 마커 계산은 실제 표시 파일 naturalWidth를 사용한다. 압축 전 원본과 픽셀 크기가 다르면 측정 기준을 기록하고 검증된 변환 없이는 마커를 표시하지 않는다.
- [ ] 03은 여섯 type의 의미를 구분한 도식을 렌더링한다. 분배=한 소스 분기, matrix=출력별 독립 선택, switcher=선택, extender=전송 경로, amplifier-channel=채널 처리, projector-display-input=투사/화면 처리로 표현한다. 숫자·처리 기능은 JSON에 있는 것만 사용하고 도식은 개념도임을 표시한다.
- [ ] flow가 있어도 기존 전체 단자 표를 기록 영역의 접힘으로 유지한다. `#io`는 03으로 이동하고 모든 I/O 원문에 접근할 수 있어야 한다. flow가 없으면 현재 port-grid와 io-table-details 동작을 그대로 둔다.
- [ ] 04의 spec-group-row 생성과 그룹 헤더 토글 코드를 제거하고 각 사양 이름 옆에 색 점과 접근 가능한 그룹명을 넣는다. source는 하단 행별 기록에 이동하고 condition·검토 상태·전체 사양 펼침은 유지한다.
- [ ] 05의 features 전문과 펼침 기능을 보존한다. 06/07 설정은 선택 데이터만 렌더링한다. 기존 related-products/documents를 번호 없는 자료 영역으로 옮기되 ID·문서 뷰어·관련 링크는 유지한다.
- [ ] 1280px 카드 배치 계산에 새 설정 카드를 포함하고 이미지 decode/확대/접힘/resize 뒤 겹침이 없도록 ResizeObserver 기반 기존 배치를 보완한다. 390px은 DOM 순서대로 쌓는다.
- [ ] 상단의 기존 ID·슬러그 오류·해시 복원 코드를 유지한다. `#source-XX` 처리도 기존 fallback을 유지한다.
- [ ] 두 신규 모듈을 detailAssetPairs와 verify-pages의 정확 파일 목록에 등록한다. 파일 목록 제한을 제거하지 않는다. 기존 RTCOM adapter 테스트의 전역 문자열 금지 단언은 RTCOM 준비 객체에서 선택 필드가 자동 유입되지 않는 동작 검사로 대체한다.
- [ ] 선택 최상위 키 6개를 verify-pages 허용 목록에 추가하고 중첩 구조를 공통 검증한다. snapshot·Group 1 고정 해시·비공개 값 검사와 URL 호스트 검사는 유지한다.
- [ ] `beta/build-detail-assets.mjs`는 아래처럼 공유 변환만 실행한다. 기존 build-group1-pages.mjs 전체 실행은 과거 로컬 패키지로 제품 데이터를 재생성할 수 있어 이 작업에 사용하지 않는다.

```js
for (const [source, target, kind] of detailAssetPairs) {
  const text = await readFile(new URL(source, root), 'utf8');
  await writeFile(new URL(target, root), transformDetailAsset(text, kind), 'utf8');
}
```

- [ ] index의 app/styles와 app의 선택 모듈 import에 같은 신규 자산 버전을 사용한다. `node beta/build-detail-assets.mjs` 후 상세 자산 테스트를 실행하고 커밋한다.

## Task 4: 템플릿 PR의 정보 보존·화면 검증

**Files:** `scripts/verify-w20261001-detail.cjs`, `Work/기록/W-20261001-001-템플릿검증.md`, `Work/기록/W-20261001-001-screens/`.

- [ ] 구현 전 기준 SHA와 구현 후 SHA를 분리해 1280×850·390×850 캡처와 JSON 계측을 저장한다. 기존 scripts/verify-stage2-browser.cjs의 루프백 정적 서버·Playwright 구조를 재사용한다.
- [ ] 대표 3종은 BRC-AM7(사진 4·I/O 14), DM7(사진 3·I/O 15), UA874XA(사진 1·I/O 2)다. 사진 역할·모든 썸네일 전환·확대/Esc/포커스 복귀·단자 카드·전체 단자 표의 행별 값이 전후 동일한지 확인한다.
- [ ] 현재 240개 모두 images가 있어 '이미지 없는 실제품 1종'을 고를 수 없다. 실제품을 비우지 않고 브라우저 요청 가로채기 테스트에 `images: []` fixture를 주입해 빈 상태를 추가 검증한다. 이 차이는 보고서에 명시한다.
- [ ] 아래 전후 계측을 비교한다. 표 행 수뿐 아니라 행의 값 배열도 저장하고 비교한다.

```js
const state = await page.evaluate(() => ({
  overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
  roles: [...document.querySelectorAll('#thumbnails button')].map(x => x.textContent),
  ioRows: [...document.querySelectorAll('#connector-table-body tr')].map(x => x.textContent),
  specs: [...document.querySelectorAll('.spec-data-row')].map(x => x.textContent),
  imageCount: document.querySelectorAll('#thumbnails button').length
}));
assert.equal(state.overflow, 0);
assert.deepEqual(after.roles, before.roles);
assert.deepEqual(after.ioRows, before.ioRows);
```

- [ ] 240개 제조사 상세의 기본 로드·사진 오류·사양/I/O/features 수를 검사하고 RTCOM 대표 QMS-88UX의 기존 경로도 확인한다. RTCOM raw SHA 불변을 확인한다.
- [ ] Library 검색·카테고리·제조사·뒤로 가기, 직접 URL/새로고침, 모든 기존 주요 해시, 키보드 기능을 검사한다.
- [ ] `npm test`, `node beta/verify-pages.mjs`, `node beta/build-search-index.mjs --check`, `git diff --check origin/main...HEAD` 통과와 240개 JSON Git blob 불변을 확인한다.
- [ ] 진행 기록과 Work 인계를 포함해 Draft PR을 만들고, 최신 main 통합·리뷰·필수 검사를 확인한다. 대표 3종 전후 캡처와 문서 보기·내려받기 동작을 사용자에게 제시하고 병합하지 않고 멈춘다. 사용자 별도 병합 지시 뒤 Task 5를 시작한다.

## Task 5: 시범 5종 근거 대조·선택 데이터 작성

**Files:** 시범 JSON 5개, `Work/기록/W-20261001-001-근거대조.md`, `tests/detail-pilot-data.test.mjs`.

시범 자료는 파일 이름이 아니라 manifest의 원본 URL 일치로 찾는다. 공유 문서는 다른 제품 이름으로 저장되어 있을 수 있다.

| 모델 | 확인된 저장소 자료 | 주의/빈칸 처리 |
|---|---|---|
| H5 | `beta/site/docs/novastar-h5-specification-89119003fed1.pdf`; `h5-front.webp`, `h5-rear.webp` | 장착 카드와 섀시 상한을 구별. 가변 카드 포트를 고정 포트로 표시 금지 |
| ULXD4D | `ulxd2-beta58-user-manual-0f7e3d579e93.pdf`(ULXD-DQ 공용), `ulxd1-specification-30a99b044dde.pdf`(ULX-D 공용) | 파일명과 실제 적용 모델이 다르므로 본문 ULXD4D 전용 행·그림 확인 |
| DCi 4\|600DA | `beta/site/manuals/crown-dci-install-da-series-manual.pdf`(docs/manifest uploads 등록) | 실제 저장 위치는 docs/가 아님. 저장소에 이미 공개된 DA Series 매뉴얼만 읽고 4채널 600DA 범위 확인 |
| EB-PQ2220B | 현재 JSON에 공식 한국 페이지·글로벌 브로셔 URL만 존재, docs/manifest에는 해당 PDF 사본 없음 | 저장소의 기존 조사 기록으로 뒷받침되는 부분만 사용. PDF 페이지·좌표 식별이 필요한 값은 비움. EB-L530U PDF 값 대입 금지 |
| Aquilon RS1 | `aquilon-rs1-specification-69f9f2e914b4.pdf`, `aquilon-rs1-user-manual-763541fa361a.pdf`, `aquilon-rs1-technical-document-2623151a666a.pdf` | 사진은 Front 1장. Rear 지도·Rear 전환을 가짜 생성하지 않음 |

- [ ] PDF 본문과 해당 표·그림을 읽고 파일 SHA, PDF 물리 페이지(1부터), 인쇄 쪽 번호, 모델·revision·적용 조건을 근거표에 기록한다. 확인 전 쪽 번호를 채우지 않는다.
- [ ] 각 제품의 field path → source code → PDF/기존 근거 → 페이지 → 조건을 일대일 대조한다. 새 외부 근거를 찾지 않는다. 기존 sources에 대응이 없고 page 추가만으로 표현할 수 없는 새 근거는 무리하게 추가하지 않고 미충족으로 기록한다.
- [ ] 원본 이미지에서 실제 영역을 측정하고 파일명·SHA·픽셀 폭/높이·x1/x2·번호·역할을 근거표에 저장한다. 읽을 수 없는 단자는 마커를 생략한다. Aquilon Front에 명확한 단자 근거가 없으면 Port Map을 비워 사진 fallback을 사용한다.
- [ ] lead는 실제 근거를 두 문장으로 요약하고 핵심 의미 한 곳만 강조한다. keyFacts는 포트·채널·카드 슬롯·최대치의 조건을 label/value/unit에 구별해 넣는다.
- [ ] signalFlow는 확인된 장비 유형·입력·출력·조건만 사용한다. ULXD4D 무선 수신을 전력 증폭으로 표시하지 않는다. 처리 상자는 모델 이름/채널 처리처럼 중립적으로 표시한다.
- [ ] EDID/DIP/modes/table은 실제 해당 모델 표가 있는 경우만 작성한다. 문서 부재나 다른 모델의 표는 MISSING 근거로 남긴다.
- [ ] 기존 값 보존 검사를 작성한다. 새 선택 키 여섯 개와 sources의 새 page만 제거해 기준 객체와 깊은 비교한다. 기존 page가 있었다면 바뀌면 실패한다.

```js
const addedKeys = ['lead', 'subtitle', 'keyFacts', 'portMap', 'signalFlow', 'settings'];
for (const key of addedKeys) delete comparison[key];
comparison.sources.forEach((source, i) => {
  if (!Object.hasOwn(baseline.sources[i], 'page')) delete source.page;
});
assert.deepEqual(comparison, baseline);
```

- [ ] 검토 상태와 기존 수량을 변경하지 않는다. 근거 부족 시 카드 fallback을 사용하고 '5종 모두 01~05 신규 데이터 완성'으로 보고하지 않는다.

## Task 6: 시범 PR 통합 검증·보고·병합

**Files:** `beta/public-snapshot.json`, `beta/site/search-index.json`, Work 근거·검증·작업량·인계, 비교 PNG.

- [ ] `node beta/update-snapshot.mjs` → `node beta/build-search-index.mjs` 실행. snapshot은 해당 5종 SHA만 바뀌고 기존 features/specifications/io 수, catalog 기준 25개 해시는 유지한다. 검색 내용이 같아도 source hash 변경은 정상 생성 결과로 기록한다.
- [ ] readable catalog를 다시 생성해야 하는지 기존 검사로 확인한다. catalog 값이나 기존 문서 목록이 안 바뀌었다면 무변경이어야 하며, 불필요한 catalog/llms diff는 포함하지 않는다.
- [ ] 5종 각각 1280×850·390×850 전체 캡처 10개, 실제 RTCOM QMS-88UX 같은 뷰포트 캡처 2개, 시범 외 3종 전후 캡처를 저장한다. 나란히 비교한 결과도 PNG로 내보내며 캡처 시 URL·SHA·날짜를 기록한다. 제품 이미지 자체를 합성·변형하지 않는다.
- [ ] 마커 위치·Front/Rear 전환·이미지 확대, 여섯 flow type 테스트 fixture, 설정 펼침, 04 분류 점과 소제목 부재, source 기록·페이지 접근을 실제 화면에서 확인한다.
- [ ] 모든 필수 명령을 실행하고 실패 0을 확인한다. Git diff에서 시범 외 235종, RTCOM raw, Group 1 고정 JSON·해시, catalog 값과 이미지 바이너리 불변을 확인한다.
- [ ] 제조사별 235종 실제 수를 JSON에서 집계한다. pilot을 제외한 manufacturer별 제품 수와 보유 PDF/이미지를 바탕으로 S/M/L 구분, 1단계 실제 작업시간 기반 범위 추정, 자료 부족을 보고한다. 2단계는 제조사별 작은 데이터 PR 순서를 제안만 한다.
- [ ] 최신 main 통합 후 테스트·검증·비공개 값 검사·자체 리뷰를 마치고 데이터 PR을 병합한다. 실제 PR 상태·SHA와 Pages CI 결과를 기록한다.

## 데이터 부족과 명세 차이

- 240개 제조사 상세 모두 현재 이미지가 있어 '실제품 무이미지'는 fixture로 검증한다. 대표 3종 전후 정보 보존 검사는 실제품으로 수행한다.
- Crown 매뉴얼은 docs/manifest에서 가리키는 `beta/site/manuals/`에 있다. 파일 이동·새 다운로드 없이 기존 공개 근거를 사용한다.
- Epson EB-PQ2220B PDF 사본이 없고 Aquilon RS1 Rear 사진이 없다. 기존 공식 링크만으로 PDF 쪽 번호나 사진 좌표가 검증된 것으로 쓰지 않는다. 요청한 RTCOM 수준까지 채우지 못한 카드는 비운 목록으로 보고한다. 다른 Epson 모델로 바꾸지 않는다.
- 소스 페이지 근거가 충분하지 않은 값은 자료 부족으로 남긴다. 이 제한은 공통 템플릿 구현·기존 정보 보존을 막지 않는다.

## 되돌리는 방법

데이터 PR을 먼저 revert하면 선택 데이터만 제거되고 사진·단자 fallback이 그대로 표시된다. 템플릿 PR을 그 다음 revert하면 종전 렌더러와 자산으로 돌아간다. PDF.js 바이트 보존 PR은 데이터/UI와 독립이므로 유지할 수 있다. main 직접 reset·force push는 사용하지 않는다.

## 계획 자체 검토

- 보완 1: Task 2·3·4에서 02/03 fallback과 정보/동작 전후 비교를 다룬다.
- 보완 2: Task 3에서 그룹 소제목 삭제·색 점·하단 출처 대응을 다룬다.
- 보완 3: 실제 Linux 로그와 네 파일 Git blob 비교로 원인을 확인했고 Task 1 별도 PR로 분리했다.
- 06/07과 기존 문서·관련 제품 번호 충돌, 생성물이 제품 JSON을 덮는 위험을 각각 Task 3에 명시했다.
- 신규 optional 구조는 화면용이며 최종 Product Schema 확정이 아니다.
- 이 문서는 계획이며 제품 구현·화면 검증이 이미 끝났다는 의미가 아니다.

## 2026-10-01 실행 승인과 병합 단계

사용자는 이 계획을 승인했다. 계획 문서와 검증을 통과한 PDF.js 선행 PR은 main에 병합한다. 템플릿 PR은 BRC-AM7·DM7·UA874XA의 1280px·390px 전후 캡처, 정보 보존, 기존 07 문서의 번호 없는 자료 영역 전환 및 보기·내려받기 검증 결과를 보여준 뒤 사용자 병합 지시를 기다린다. Task 5·6은 템플릿 병합 뒤 시작한다. 시범 5종은 유지하며 Aquilon RS1 후면 지도와 EB-PQ2220B의 PDF 근거가 없는 값은 자료 부족으로 남긴다. 2단계는 제안만 한다.
