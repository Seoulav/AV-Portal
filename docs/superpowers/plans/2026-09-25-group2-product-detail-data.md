# Group 2 Product Detail Data Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 공식 조사 결과만 사용해 Group 2 8개 제품의 검토 가능한 Product Detail Markdown 데이터 패키지를 만든다.

**Architecture:** Group 1 Markdown 구조를 공통 계약으로 재사용하되 제품군별 Specification과 I/O 그룹은 독립적으로 구성한다. 앱과 공개 JSON은 건드리지 않고, 패키지 검토가 끝난 뒤 별도 renderer 연결 작업으로 넘긴다.

**Tech Stack:** Markdown, PowerShell 검색, Git diff 검증

**Spec:** `Work/작업/W-20260925-008.md`

## Global Constraints

- 새 웹 조사를 하지 않는다.
- Product Detail renderer, 공개 JSON, 이미지 파일과 Pages 아티팩트를 변경하지 않는다.
- Quick Documents는 Manual, 시방서, 사양서, 기술문서 4종만 사용한다.
- 확인되지 않은 값은 `MISSING` 또는 `REVIEW REQUIRED`로 유지한다.
- 내부 메모·공급처·로컬 경로·비공개 원본을 공유 문서에 포함하지 않는다.
- Variant, Region, 주파수 Band와 Family 문서 적용 범위를 자동 병합하지 않는다.

## Review Focus

- 유사 모델: V-02HD와 V-02HD MK II, AVIO USB C와 다른 AVIO Adapter가 섞이지 않아야 한다.
- 제품군 자료: MXCW, M4250, Aquilon Family 자료가 정확 모델 전용값으로 과장되지 않아야 한다.
- 옵션 차이: Mezzo 322 AD의 Dante/AES67을 다른 Mezzo Variant와 혼동하지 않아야 한다.
- 이미지: URL 확보, 모델 일치, 역할, 재사용 가능 여부를 별도 상태로 유지해야 한다.
- 공개 경계: 회사 PC 경로, 공급처와 내부 검토 메모가 Markdown에 나타나지 않아야 한다.

---

### Task 1: Group 2 인덱스와 공통 섹션 고정

**Files:**
- Create: `Work/기획/group2/GROUP2_PRODUCT_DETAIL_DATA_INDEX.md`
- Reference: `Work/기획/BRC-AM7_PRODUCT_DETAIL_CONTENT.md`
- Reference: `Work/기획/DM7_PRODUCT_DETAIL_CONTENT.md`

**Interfaces:**
- Consumes: Group 1 Header, Gallery, Quick Documents, Overview, Features, Specifications, I/O 구조
- Produces: 8개 패키지 상태를 집계하는 인덱스 표

- [ ] **Step 1: Group 1 섹션 이름을 대조한다**

Run: `rg -n "^#|^##|Quick Documents|Specifications|I/O" Work/기획/BRC-AM7_PRODUCT_DETAIL_CONTENT.md Work/기획/DM7_PRODUCT_DETAIL_CONTENT.md`

Expected: Header, Gallery, Quick Documents, Overview, Features, Specifications, I/O 구조를 확인한다.

- [ ] **Step 2: 인덱스에 정확한 8개 행을 작성한다**

순서는 Mezzo 322 AD, V-02HD MK II, UVC-01, EB-L530U, AVIO USB C, MXCW640, GSM4248PX, Aquilon RS1이다. 열은 Manufacturer, Model, Header, Gallery, Quick Documents, Overview, Features, Specifications, I/O, Remaining Review, Codex 연결 가능 여부다.

- [ ] **Step 3: 제품 수와 중복을 확인한다**

Run: `rg -n "^\| [1-8] \|" Work/기획/group2/GROUP2_PRODUCT_DETAIL_DATA_INDEX.md`

Expected: 8행이며 Manufacturer/Model 조합 중복이 없다.

- [ ] **Step 4: 변경을 커밋한다**

Commit message: `docs: define Group 2 product detail index`

### Task 2: Audio·Conference·Network 패키지 작성

**Files:**
- Create: `Work/기획/group2/MEZZO_322_AD_PRODUCT_DETAIL_DATA.md`
- Create: `Work/기획/group2/AVIO_USB_C_PRODUCT_DETAIL_DATA.md`
- Create: `Work/기획/group2/MXCW640_PRODUCT_DETAIL_DATA.md`
- Create: `Work/기획/group2/GSM4248PX_PRODUCT_DETAIL_DATA.md`
- Modify: `Work/기획/group2/GROUP2_PRODUCT_DETAIL_DATA_INDEX.md`

**Interfaces:**
- Consumes: 명세에 기록된 공식 제품·문서 근거와 Resource Register 상태
- Produces: Amplifier, Audio Interface, Conferencing Endpoint, Network Switch 패키지

- [ ] **Step 1: Mezzo 322 AD 패키지를 작성한다**

AD Variant에만 Dante/AES67을 적용한다. 공식 Product Page, Mezzo Datasheet, Mezzo User Guide를 기록하고 이미지·시방서·기술문서는 기존 확인 상태에 따라 표시한다.

- [ ] **Step 2: AVIO USB C 패키지를 작성한다**

USB-C 모델만 다루고 다른 AVIO Adapter를 배제한다. 공식 제품군 페이지와 AVIO USB Datasheet의 적용 범위를 기록하며, 모델 전용성이 불명확한 항목은 검토 상태로 유지한다.

- [ ] **Step 3: MXCW640 패키지를 작성한다**

단말 전용 기능과 MXCW 시스템 공통 기능을 구분한다. 공식 제품 페이지와 MXCW System Guide를 기록하고 이미지 직접 링크·해상도는 검토 상태로 둔다.

- [ ] **Step 4: GSM4248PX 패키지를 작성한다**

정확 모델의 Port Count, Port Type, PoE Budget, Uplink, Speed와 관리 기능만 기록한다. 다른 M4250 모델의 값을 사용하지 않는다.

- [ ] **Step 5: 네 패키지의 Quick Documents 슬롯을 확인한다**

Run: `rg -n "^### (Manual|시방서|사양서|기술문서)$" Work/기획/group2/MEZZO_322_AD_PRODUCT_DETAIL_DATA.md Work/기획/group2/AVIO_USB_C_PRODUCT_DETAIL_DATA.md Work/기획/group2/MXCW640_PRODUCT_DETAIL_DATA.md Work/기획/group2/GSM4248PX_PRODUCT_DETAIL_DATA.md`

Expected: 각 파일에 네 제목이 각각 한 번 존재한다.

- [ ] **Step 6: 변경을 커밋한다**

Commit message: `docs: add Group 2 audio and network data packages`

### Task 3: Video·Display 패키지 작성

**Files:**
- Create: `Work/기획/group2/V-02HD_MK_II_PRODUCT_DETAIL_DATA.md`
- Create: `Work/기획/group2/UVC-01_PRODUCT_DETAIL_DATA.md`
- Create: `Work/기획/group2/EB-L530U_PRODUCT_DETAIL_DATA.md`
- Create: `Work/기획/group2/AQUILON_RS1_PRODUCT_DETAIL_DATA.md`
- Modify: `Work/기획/group2/GROUP2_PRODUCT_DETAIL_DATA_INDEX.md`

**Interfaces:**
- Consumes: 명세에 기록된 공식 제품·문서·이미지 후보 근거
- Produces: Video Switcher, Capture, Projector, Video Processor 패키지

- [ ] **Step 1: V-02HD MK II 패키지를 작성한다**

MK II 정확 모델의 Video, Audio, USB, Control, Power, Physical과 I/O를 기록한다. V-02HD 자료는 사용하지 않는다.

- [ ] **Step 2: UVC-01 패키지를 작성한다**

Roland 정확 모델의 Capture·USB·Video·Audio 구조를 기록한다. 전면 이미지 후보의 원본 해상도가 미확인이면 Gallery에서 검토 상태를 유지한다.

- [ ] **Step 3: EB-L530U 패키지를 작성한다**

V11HA27040 정확 모델 근거만 사용한다. 밝기 기준, 렌즈·투사 조건, Video/Control/Network I/O를 서로 다른 필드로 보존한다.

- [ ] **Step 4: Aquilon RS1 패키지를 작성한다**

RS1의 Processing, Input/Output, Control, Network, Power, Physical을 기록한다. RS2 값은 배제하고 전후면 이미지 후보의 파일 접근·재사용 상태를 검토 상태로 유지한다.

- [ ] **Step 5: 네 패키지의 모델 금지어를 점검한다**

Run: `rg -n "V-02HD(?! MK II)|Aquilon RS2|EB-L690U|AVIO USB-A" Work/기획/group2 --pcre2`

Expected: 다른 모델 값을 적용하는 본문이 없고, 비교·금지 설명 외 결과가 없다.

- [ ] **Step 6: 변경을 커밋한다**

Commit message: `docs: add Group 2 video and display data packages`

### Task 4: 공개 경계와 상태 일관성 검증

**Files:**
- Modify: `Work/기획/group2/GROUP2_PRODUCT_DETAIL_DATA_INDEX.md`
- Modify: `Work/지시서.md`
- Create: `Work/기록/W-20260925-008-Work-인계.md`

**Interfaces:**
- Consumes: 완성된 8개 패키지와 인덱스
- Produces: 후속 renderer 연결 작업이 읽을 검증 결과와 남은 Review 목록

- [ ] **Step 1: 비공개 표식을 검사한다**

Run: `rg -n "C:\\\\|Users\\\\|supplier|공급처|내부 메모|local_reference" Work/기획/group2`

Expected: 결과 0건.

- [ ] **Step 2: 앱·공개 데이터 무변경을 검사한다**

Run: `git diff --name-only origin/main...HEAD`

Expected: Work 문서와 docs 계획 문서만 나타나며 `beta/site`, `prototype`, `app/public` 파일은 없다.

- [ ] **Step 3: 인덱스 상태를 패키지와 대조한다**

각 제품의 Gallery, Quick Documents, Specifications, I/O 상태가 해당 패키지와 일치하고 READY WITH REVIEW FLAGS 제품의 Remaining Review가 비어 있지 않은지 확인한다.

- [ ] **Step 4: 후속 인계서를 작성한다**

인계서에는 각 제품의 READY/READY WITH REVIEW FLAGS, 문서·이미지 상태, 공개 데이터에서 제외할 필드, renderer 연결 시 필요한 테스트를 기록한다.

- [ ] **Step 5: 문서 diff를 검사한다**

Run: `git diff --check origin/main...HEAD`

Expected: 출력 없이 종료 코드 0.

- [ ] **Step 6: 최종 변경을 커밋한다**

Commit message: `docs: validate Group 2 product detail packages`
