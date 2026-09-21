# EXISTING SYSTEM ASSESSMENT

## 자료 수집 정책 정정 (2026-09-22)

이번 사용자 운영 결정은 아래 기존 URL·출처·자료 수집 요구와 충돌할 경우 우선한다. 최종 Schema나 수집 구현을 확정하는 작업이 아니다.

### RTCOM — 제조사 직접 제공 자료

RTCOM은 사용자가 제조사에서 직접 공식 자료를 제공받는다. **Work는 RTCOM 제품에 대해 별도 웹 조사·자동 웹 검색·크롤링을 수행하지 않는다.** Product / Model List, Datasheet / Specification, User Manual, Front Image, Rear Image, Drawing / CAD 및 기타 제조사 제공 기술자료를 최우선 공식 근거로 사용한다.

공개 Source URL이 없어도 제조사 직접 제공임을 확인할 수 있는 자료는 `MANUFACTURER_DIRECT`와 같은 출처 개념으로 공식성을 표현한다. 제공 주체·수령일·전달 경로·원본 파일·적용 모델/Revision을 추적하고, URL을 임의 생성하지 않는다. URL 부재만으로 직접 제공 자료를 비공식 또는 자료 누락으로 판정하지 않는다. 직접 제공 사실이 사양 충돌을 자동 해소하거나 개별 제품의 모든 공개 요건을 충족한다는 뜻은 아니다.

제품별 공식 웹사이트 또는 제품/Series 페이지 URL은 가능하면 제조사로부터 함께 제공받는다. 제품 전용 페이지가 실제로 존재하지 않는 경우, 공식 제조사 사이트 URL·관련 Series 페이지 URL·`DEDICATED_PRODUCT_PAGE_NOT_AVAILABLE` 같은 부재 사유 개념을 구분한다. 아직 URL을 받지 못한 경우와 전용 페이지가 없다고 확인된 경우는 다르다. 제품 전용 페이지 부재는 제조사 확인 근거와 함께 관리하고, 임의 링크 생성이나 별도 웹 조사로 해결하지 않는다.

Product Detail은 Manual / Datasheet 옆에 확보된 공식 링크를 제공하되 링크 종류를 ‘제조사 공식 제품 페이지’, ‘공식 Series 페이지’, ‘제조사 공식 사이트’로 정확히 표시한다. 전용 페이지가 없으면 그 사실을 구별하며 홈페이지를 전용 제품 페이지로 위장하지 않는다. 전용 페이지 부재는 일반 미수집과 구분하여 공개 준비 검토에 반영한다. 이는 Datasheet·Manual·고해상도 전면/후면 자료의 필수 확보 요건을 면제하는 것이 아니다.

### RTCOM 이외 제조사 — 지정 제품만 조사

Yamaha, Shure, Samsung, AMX, Analog Way 등은 **사용자가 제공한 조사 대상 장비 리스트에 있는 제품만** 조사한다. 제조사 전체 제품이나 관련 모델을 임의로 대량 수집하지 않는다. 지정 제품마다 제조사 공식 Product Page, 공식 Datasheet / Specification, 공식 User Manual, 공식 고해상도 Front Image, 공식 고해상도 Rear Image의 5종을 조사한다.

조사 순서는 **Manufacturer Official Product Page → Official Downloads / Support → Official Datasheet / Manual → Official Media Kit / Press Assets**다. 판매점·블로그·커뮤니티·비공식 이미지 사이트는 공식 자료의 대체 근거로 사용하지 않는다.

항목별 조사 결과는 `FOUND`, `MISSING`, `CONFLICTED`, `REVIEW REQUIRED` 같은 개념으로 남긴다. FOUND는 해당 자료를 찾았다는 뜻이며 자동으로 사양 검증 또는 공개 준비 완료를 뜻하지 않는다. 필수 자료의 누락은 기존 `REQUIRED / MISSING` 요구와 연결한다. 찾지 못한 자료를 추측하거나 다른 모델 자료로 대체하지 않는다.

### 공통 유지 기준

Front / Rear Image는 가능하면 긴 변 2000px 이상의 제조사 원본을 우선한다. 누락 이미지를 생성하거나 저해상도 AI 확대본을 공식 원본으로 취급하지 않는다. 공식 출처·적용 모델·이미지 역할과 실제 원본 해상도를 추적한다. 출처/상태 개념의 명칭은 예시이며 최종 필드명·enum·Product Data Schema는 미확정이다.

기존 4개 모델 제외, Portal 대상 28개 항목, 원본 자료 보존, 기존 시스템 코드·데이터 미변경 범위를 유지한다. 이번에는 자료 수집 정책만 반영하며 새 제품 조사·자료 수집·외부 발송은 실행하지 않는다.


## 정식 공개 자료 요건 추가 (2026-09-22)

앞으로 AV Portal에 정식 공개하는 모든 Product는 **① 제조사 공식 해당 제품 페이지 URL ② 공식 Datasheet / Specification ③ 공식 User Manual ④ 고해상도 Front Image ⑤ 고해상도 Rear Image**를 확보해야 한다. RTCOM의 출처 URL 및 전용 페이지 예외는 상단 자료 수집 정책 정정을 따른다. 이 기준은 아래의 자료 부족 제품 공개 관련 이전 제안보다 우선한다. 기존 28개 대상 항목도 자동으로 공개 준비 완료가 되는 것은 아니다.

- Product Detail의 Manual / Datasheet 옆에 **제조사 공식 제품 페이지**로 바로 이동하는 링크를 제공한다. 제조사 홈페이지 첫 화면이나 판매점 페이지를 해당 제품의 공식 페이지로 대체하지 않는다.
- Front / Rear는 제조사 공식 Product Page, Media Kit, Press Asset 등 공식 출처를 우선한다. 이미지별 Source URL(있는 경우) 또는 제조사 직접 제공 증빙, 제공 주체·원본 파일·해상도·적용 모델·전면/후면 역할의 출처를 추적할 수 있어야 한다. 문서도 공식 출처·적용 모델·Revision을 추적한다.
- 가능하면 긴 변 **2000px 이상인 고해상도 원본**을 우선한다. 2000px은 우선 확보 목표이며 이번 요구만으로 절대적인 최소 픽셀 기준을 확정하지 않는다. 고해상도 적합성 확인 없이 저해상도 자료를 충족 처리하지 않는다.
- 제조사가 Rear Image 또는 고해상도 이미지를 제공하지 않으면 해당 자료를 **`REQUIRED / MISSING`**으로 남긴다. 임의 생성, 다른 모델 사진 대체, AI 확대본을 공식 고해상도 원본으로 취급하는 것은 금지한다. 저해상도 참고 파일이 존재하더라도 필수 고해상도 자료의 충족과 구분한다.
- 5종 중 누락되거나 공식 출처·적용 대상이 확인되지 않은 자료가 있으면 **정식 공개 준비 완료로 판정하지 않는다.** 내부 준비·증빙 보존은 가능하다. 단순 파일 존재, 사양 검증 상태, 제품 판매 상태와 공개 준비 상태를 구분한다.
- `official_product_url`, `datasheet`, `user_manual`, `front_image`, `rear_image`, `image_source`, `document_source`, `publication_readiness`는 향후 Schema에서 표현할 **요구 개념**이다. 최종 필드명·자료형·상태 enum·저장 구조는 확정하지 않는다. 여기서 자료의 ‘필수’는 운영상 공개 요건이며 Database 필수 필드 설계가 아니다.
- 기존 4개 모델의 `EXCLUDED FROM PORTAL` 결정은 계속 적용한다. 제외 모델에 이 자료를 새로 수집·검증하지 않는다. 원본 자료는 보존한다.


## 운영 범위 정정 — 제품 제외 (2026-09-21)

사용자 운영 결정에 따라 **HS-88M-U, HS-88MX, HD-D104U, HD-D108U는 `EXCLUDED FROM PORTAL`**이다. 이 결정은 아래 과거 분석·보존 권고보다 우선한다.

- Equipment Library 등록, Search/Filter 결과, Product Detail 생성, Product Compare, Taxonomy Mapping, Migration, 제품 데이터 검증·수집, Portal 제품 수량 집계에서 모두 제외한다.
- 과거 조사 기록에 해당 모델이 남아 있더라도 증빙·이력일 뿐, 활성 제품·검증 대기·향후 자동 등록 후보가 아니다. 명칭·사양 충돌의 해소도 Portal의 후속 과제로 요구하지 않는다.
- 원본 ZIP/PDF/Catalog/Datasheet 및 기타 제조사 자료는 수정·삭제하지 않는다. 여러 제품이 수록된 문서도 전체 원본을 보존하되 제외 모델 구역은 제품 데이터 준비에 사용하지 않는다.
- 기존 Library **31개는 조사 당시 원본 수량**이다. 이 중 HS-88MX, HD-D104U, HD-D108U의 3개 항목을 제외하여 현재 Portal 기준은 **28개 장비·시리즈 항목**이다. HS-88M-U는 원래 31개 목록에 없으므로 다시 차감하지 않는다. Series·묶음이 포함되어 있으므로 28개 SKU를 뜻하지 않는다.
- 이후 분석과 Product Data 준비는 이 제외 범위를 적용한다. 이번 변경은 문서 반영이며 기존 시스템 코드·데이터를 변경한 것은 아니다.


**개발 대상:** AV Equipment Library / RTCOM Configurator → AV Portal  
**조사일:** 2026-09-21 (Asia/Seoul)  
**상태:** 1차 분석 방향 승인 후 사용자 범위 정정 반영 · 개별 개선안은 검토 단계  
**범위:** 공개 화면, 배포 코드, 접근 가능한 공개 저장소의 읽기 전용 분석

## 0. 현재 적용 범위와 우선순위 — 사용자 정정 반영

이 절은 기존 문서의 시스템 간 통합 제안보다 우선한다. 현재 목표는 **AV Equipment Library / RTCOM Configurator를 AV Portal 본체로 개선**하는 것이다. 세 시스템을 하나의 코드베이스나 공통 데이터 플랫폼으로 통합하는 프로젝트가 아니다.

| 시스템 | 이번 프로젝트의 역할 | 적용 범위 |
|---|---|---|
| AV Equipment Library / RTCOM Configurator | AV Portal 본체이자 집중 개발 대상 | 주요 기능·UI/UX·Equipment Library·Product Data·Search/Filter/Compare·Documents·RTCOM Configurator·Admin 개선 검토 |
| AV System Builder | 현행 유지, Portal에서 실행할 외부 도구 | 메뉴 또는 Dashboard에서 기존 URL로 이동. 코드·Architecture·Database·기능 변경 없음 |
| LED Configurator | 현행 유지, Portal에서 실행할 외부 도구 | 메뉴 또는 Dashboard에서 기존 URL로 이동. 코드·계산 Logic·Product Data·Database·기능 변경 없음 |

기본 연결은 [AV System Builder](https://seoul-visual-tech.github.io/av-system-builder/)와 [LED Configurator](https://hkkim0454.github.io/svt-led-calculator/src/index.html)를 여는 링크다. 데이터 전달·동기화·저장 형식 변환·화면 내장·공통 로그인은 링크 연결에 필요한 전제로 두지 않는다. 동일 탭 또는 새 탭 등 상세 UX는 이후 검토한다.

**현재 목표에서 제외:** 세 시스템 Repository 통합, Database 통합, Product Database 강제 통합, Builder/LED 데이터 Migration, 세 시스템 Project 통합, 세 시스템 BOM 통합, Firestore/Supabase 통합, 공통 Authentication, 공통 Compatibility Engine. 필요하면 별도 확장 과제로 검토하며 현재 MVP의 필수 Architecture나 선행 작업으로 삼지 않는다.

### 현재 분석의 우선순위

| 순서 | 집중할 검토 | 이번 단계의 경계 |
|---|---|---|
| 1 | Portal 홈·메뉴·Dashboard와 제품 탐색/설계 도구의 UI/UX | RTCOM 시스템 안에서 개선. Builder·LED는 링크로 실행 |
| 2 | Equipment Library의 제품 식별·사양·근거·이미지·Documents 품질 | Portal 내부 데이터 중심. 다른 도구의 제품 DB를 수집·통합하지 않음 |
| 3 | Search / Dynamic Filter / Compare | Portal 제품 데이터로 검토. 사양·검증 상태 차이를 명확히 표시 |
| 4 | RTCOM Configurator의 슬롯·카드·TX/RX 표현, 저장·검증·출력 개선 | RTCOM 도구 내부 책임에 한정. 다른 도구의 계산·BOM과 통합하지 않음 |
| 5 | Admin의 제품·자료 검토·게시·변경 관리 요구 | Portal 내부 요구를 검토. 공통 Authentication 구축이나 현재 인증 구현을 의미하지 않음 |

이는 분석 순서의 제안이며 세부 MVP 기능 목록·Architecture·Database·최종 Product Schema를 확정한 것은 아니다. 내부 제품 관계를 정리할 때 CORE_DOMAIN_CONCEPTS의 Model/SKU/카드 구분을 참고할 수 있지만 시스템 간 공통 ID 구축은 요구하지 않는다.

### 기존 평가의 적용 방법

- §5의 Library/RTCOM 관찰과 개선 후보를 현재 분석의 중심으로 사용한다.
- §4와 §6의 Builder/LED 관찰 사실은 비교 참고자료로 보존한다. 그 절의 REFACTOR·EXTRACT·MIGRATE·REDESIGN·REMOVE 제안은 **현재 실행 범위에서 제외**한다.
- §7–8의 차이·중복은 정보로 남긴다. 중복이 존재해도 이번 프로젝트에서 해소해야 할 결함이나 이관 요구로 간주하지 않는다.
- §9–10의 시스템 간 공통화·연결 검증 제안은 장기 참고자료다. 현재 우선순위는 이 절의 표를 따른다.
- 최초 조사 이후 사이트를 다시 조사한 것은 아니다. 이번 수정은 사용자 범위 정정을 문서에 반영한 것이다.

## 1. 평가 결론 — 현재 범위에 맞춘 정정

AV Equipment Library의 근거 연결형 제품 탐색과 RTCOM 매트릭스 구성을 중심으로 AV Portal을 발전시킨다. Portal 자체의 제품 데이터 품질, 검색·필터·비교, Documents, UI/UX, RTCOM 구성과 Admin을 우선 검토한다. AV System Builder와 LED Configurator는 기존 상태를 유지하고 Portal에서 링크로 실행한다.

이미 중복 제품이 존재하지만 데이터의 단위가 다르다. 예를 들어 Library의 `XDM Series`는 Builder의 개별 XDM 섀시와 같지 않고, `XDM-FT101 / FR101` 묶음은 Builder의 TX·RX 두 품목과 같지 않다. 이 차이는 Portal 내부 제품 표현을 검토하는 참고자료이며, 세 시스템 제품 데이터를 합치는 작업은 현재 범위에 없다.

현행 저장 방식도 서로 다르다. Builder에는 Firestore 연동, Library에는 정적 카탈로그와 브라우저 저장, LED에는 정적 데이터·브라우저 저장·Supabase 공유 기능이 공존한다. 이것은 **관찰한 현행 구현**이며, 통합 Portal의 Database 선택 근거를 확정한 것이 아니다.

이 문서는 코드 구현, 데이터 이관, 스키마 확정, 저장소 병합, 기능 삭제를 승인하거나 실행하지 않는다. 아래의 모든 변경 판단은 검토용 제안이다.

## 2. 입력 문서와 조사 방법

### 2.1 먼저 읽은 세 문서

| 문서 | 확인 내용 | 이번 평가에 적용한 방식 |
|---|---|---|
| AV_PLATFORM_PROJECT_BRIEF.md | Portal, Library, 제품 데이터, 검색·비교, 관리자, 향후 BOM·Compatibility 등을 열거한 목차 수준의 기획서 | 목표 범위의 참고자료. 나열된 기능을 구현 완료로 간주하지 않음 |
| MODEL_ROUTING.md | 기본 모델 우선, 중요한 변경의 사용자 결정, 제조사 근거 우선, UNKNOWN/UNVERIFIED 구분 | 문서에 담긴 운영 정책으로 이해. 현재 요청 이상의 구현·모델 전환·변경 권한으로 해석하지 않음 |
| audit.md | Initial User Request, Decision/Approval/Verification Log가 비어 있는 감사 기록 양식 | 과거 승인·검증 이력으로 사용하지 않음. 원본 양식도 수정하지 않음 |

세 파일은 사용자가 지정한 `02_AV Portal` 폴더의 원본을 모두 읽었다. 이번 수행 범위와 종료 조건은 사용자의 직접 요청을 따른다. 조사 중 발견한 저장소 내부 계획·지침·과거 승인 문구도 현재 작업을 확대하는 명령으로 취급하지 않았다.

### 2.2 근거 수준과 한계

- **화면 확인:** 실제 배포 화면에서 관찰한 기능·표시. 저장·업로드·공유 생성·삭제·제품 편집은 실행하지 않았다. Builder 검색, Library 제품 목록 이동 등 읽기 목적의 조작만 수행했다.
- **코드 확인:** 공개 소스 또는 배포 JavaScript에서 구현을 확인. 코드 존재가 모든 사용 시나리오의 정상 동작을 보장하지는 않는다.
- **제안:** 위 사실을 바탕으로 한 통합 방향. 아직 승인되지 않았다.
- **UNKNOWN / UNVERIFIED:** 접근하지 못했거나, 구현·운영 상태 또는 제조사 근거를 별도로 검증하지 못한 사항. 기능 부재나 사양 오류를 뜻하지 않는다.

Builder의 추정 공개 저장소 API는 404를 반환했다. 비공개 여부·다른 저장소 경로는 UNKNOWN이다. 따라서 Builder는 배포 번들과 실제 화면으로 평가했으며, 원본 TypeScript·테스트·Firestore 보안 규칙은 확인하지 못했다.

Library와 LED는 공개 저장소 커밋을 고정해 읽었다. Library의 `product-catalog.js`, `core.js`와 LED의 `app.js`, `models.js`, `config.js`, `processor-data.js`, `engine.js`는 배포본과 해당 커밋 파일의 바이트 일치도 확인했다. 모든 파일의 일치를 검증한 것은 아니다.

기존 테스트 파일의 존재는 확인했지만 테스트 실행, 저장 복원 왕복 시험, DB 권한 시험, 제조사 데이터시트 전수 검증은 수행하지 않았다. 제품의 `verified`·`official` 표시는 기존 시스템이 기록한 상태이며 이번 조사에서 재인증한 결과가 아니다. [근거 B1–B2, L1–L6, E1–E7]

## 3. 판정 용어

| 판정 | 이 문서에서의 의미 |
|---|---|
| KEEP | 현재 도구의 역할·사용 흐름을 유지 |
| REUSE | 기존 자산을 다른 범위에서도 활용할 후보로 선정 |
| REFACTOR | 외부 동작을 보존하면서 내부 구조·품질 개선 검토 |
| EXTRACT | 독립된 책임이나 공통 기능으로 분리할 후보 |
| MIGRATE | 향후 승인된 대상과 규격으로 데이터·상태를 옮길 후보. 지금 이관하지 않음 |
| REDESIGN | 의미·권한·사용 흐름을 다시 설계해야 할 부분 |
| REMOVE | 검증된 대체와 사용자 승인 후 제거를 검토할 중복·오해 유발 요소. 즉시 삭제 대상 아님 |

동일 항목에 복수 판정을 붙일 수 있다. 예를 들어 계산 기능은 KEEP하면서 계산 모듈은 EXTRACT할 수 있다.

## 4. AV System Builder 평가

### 4.1 현재 역할

배포 화면은 **v1.19.1**이다. React Flow 기반 캔버스, 장비 라이브러리, 선 종류, 자동 배치, Undo/Redo, Presets, 빠른제작, Share, BOM을 확인했다. 초기 기본 목록 이후 화면이 `클라우드 동기화` 상태로 바뀌며 장비 목록과 프리셋이 로드됐다. 이는 화면 관찰이며 동기화의 동시 편집 안전성까지 검증한 것은 아니다. [B1–B2]

### 4.2 항목별 평가

| 항목 | 현행 관찰 및 한계 | 제안 판정 |
|---|---|---|
| Product Data | 장비, 장비 옵션, 기성 케이블, 빠른제작 템플릿이 별도로 존재. 실제 화면에서 RTCOM·Analog Way 등 다제조사 제품 확인 | **KEEP / REUSE / MIGRATE 후보**: 원래 ID와 옵션 관계를 보존한 매핑부터 검토 |
| Product Schema | 장비에 name/model/manufacturer/description/series/category, inputs/outputs/bidirectional, imageUrl 등이 사용됨. 설계 노드에는 수량·선택 옵션·기존 장비 여부 등 인스턴스 상태도 존재 | **REFACTOR / REDESIGN**: 제품 원본과 배치 인스턴스의 차이를 명확히 할 필요. 통합 스키마로 그대로 채택하지 않음 |
| Specifications | 설명과 옵션 정보는 있으나 범용 수치 사양·단위·필드별 출처 구조는 확인하지 못함 | **REUSE / REDESIGN**: 기존 설명 보존, 정형 사양은 근거 확인 후 연결 |
| I/O Ports | 입력·출력·양방향 포트, 포트 ID/라벨/타입, 옵션 선택에 따른 포트 구성이 존재 | **KEEP / EXTRACT 후보**: 결선용 포트 인스턴스와 제품 포트 정의를 구분 |
| Product Images | imageUrl, 업로드 이미지의 Data URL, 이미지 미지정 시 대체 이미지 경로 사용 | **REUSE / REFACTOR**: 전면·후면·대표 이미지 구분과 별도 자산 관리 검토. 임베디드 이미지가 공유 용량을 증가시킴 |
| Documents | 검토한 화면·장비 편집 구조에서 제품별 매뉴얼/데이터시트 연결은 미확인 | **REDESIGN 후보**: 공통 자료 조회 연결. 기존 구현 존재 여부는 원본 소스 확인 필요 |
| Project | 활성 구성도, 프리셋, 빠른제작 템플릿, 공유 스냅샷 존재. 고객·현장·프로젝트 리비전의 공통 관리 체계는 미확인 | **KEEP / REDESIGN**: 구성도와 프리셋을 보존하고 Portal 프로젝트에서 참조하는 방식 검토 |
| Configuration Save / Load | nodes/edges/장비 DB 등의 localStorage 저장, JSON 입출력, 프리셋 저장, Firestore 공유. 파일 내보내기 version 1.1에는 nodes/edges/lineTypes/equipmentDB 포함. 공유 데이터는 nodes/edges 중심 | **KEEP / REFACTOR / MIGRATE 후보**: 파일 저장과 링크 공유가 같은 범위를 보존하는지 명시 |
| BOM | 기성 케이블 수량, 제작 케이블 길이 집계 및 CSV 출력 구현. 장비 옵션·노드 수량은 별도로 존재하므로 전체 구매 BOM 완성 여부는 추가 확인 필요 | **KEEP / EXTRACT 후보**: 케이블 명세를 공통 BOM의 한 공급원으로 활용 |
| Pricing / Cost | 검토한 배포 번들에서 가격·원가 계산 기능을 확인하지 못함 | **UNKNOWN / REDESIGN 후보**: 별도 가격 기능이 필요하면 공통 가격 영역과 연결 |
| Compatibility | 앱 연결 검사에서 포트 타입 일치, 중복 연결, 양방향 포트의 반대쪽 점유 등을 검사 | **KEEP / REFACTOR**: 연결 편집 제약으로 유지. 대역폭·해상도·HDCP·전원까지 확인한 호환성 판정으로 표시하지 않기 |
| Validation Logic | 기본 결선 검사와 JSON 읽기 구현은 확인. DB 가져오기 일부 경로는 배열 여부 검사 중심. 통합적인 파일·제품 검증은 미확인 | **EXTRACT / REFACTOR**: 구조 검증과 AV 기술 검증을 분리해 검토 |
| Admin | 장비 추가/편집/삭제, 장비 DB JSON 입출력, 옵션·케이블 공용 컬렉션 동기화 구현 | **KEEP / REDESIGN**: 편집 UI와 관리자 권한은 별개. 인증·역할·변경 승인·감사 이력은 서버 규칙 확인 필요 |
| Storage 방식 | localStorage + Firestore. equipment, equipmentOptions, cableCatalog, lineTypes, quickTemplates, presets, diagrams 컬렉션 이름을 코드에서 확인 | **KEEP / EXTRACT 후보**: 현행 운영 유지, 저장 접근부 분리 검토. Portal DB 선택은 보류 |

### 4.3 7개 기준의 종합 판단

- **KEEP:** 구성도 편집, 결선, 자동 배치, 프리셋, 케이블 BOM.
- **REUSE:** 다제조사 장비 목록, 옵션과 케이블 자산, 포트 편집 경험.
- **REFACTOR:** JSON 검증, 이미지 저장, 제품 원본과 노드 상태의 경계.
- **EXTRACT:** 결선 검사, BOM 집계, 저장·공유 접근부의 분리 가능성 검토.
- **MIGRATE:** 승인된 대응표가 생긴 후 제품 참조·저장 구성 후보를 검토. 기존 노드 스냅샷 보존 필요.
- **REDESIGN:** 통합 프로젝트 연결, 공용 제품 편집 권한, 사양 근거 표시.
- **REMOVE:** 즉시 대상 없음. 대체 검증 후에만 중복 제품 편집 경로와 중복 데이터 사본의 축소를 검토.

특히 Share는 모달 진입 후 저장 함수를 자동 실행하는 코드가 있어 이번 조사에서는 클릭하지 않았다. 공유 스냅샷 생성은 수행하지 않았다. [B2: `nj`, `rj`, `aj`, `St`, `Sj` 등 배포 함수]

## 5. AV Equipment Library / RTCOM Configurator 평가

### 5.1 현재 역할

화면 명칭은 **RTCOM AV Design Library**, 표시 버전은 **CATALOG BASED · 0.6**이다. 홈·제품·설계 도구 경로가 나뉘어 있고, 31개 장비·시리즈와 실질 5개 제품 카테고리가 존재한다. 제품 목록 상단의 “6개 카테고리”는 홈 및 코드의 5개 분류와 불일치한다. “전체 장비” 탭을 카테고리로 포함한 것인지 표현 정리가 필요하다. [L1–L3]

제품 라이브러리와 XDM·SPX·VDM 매트릭스 구성기가 함께 있는 시스템이다. 단순 제품 DB로 축소하면 현재 설계 기능을 잃게 된다.

### 5.2 항목별 평가

| 항목 | 현행 관찰 및 한계 | 제안 판정 |
|---|---|---|
| Product Data | 31개 카탈로그 항목. Series, 단일 모델, TX/RX 묶음이 혼재. 구성기에는 별도의 프레임·카드 데이터가 있음 | **KEEP / REUSE / REFACTOR**: 카탈로그 표시 단위와 구매·배치 단위를 구분 |
| Product Schema | product-catalog.v1: productId/slug/categoryId/images/ports/capabilities/relations/documents/verification/categorySpecs 등. 제조사 공통 필드가 normalize 결과에 없음 | **REUSE / REDESIGN**: 분류 확장·검증 상태·자료 참조 패턴 활용. 다제조사 공통 스키마 확정으로 간주하지 않음 |
| Specifications | features 문구를 capabilities로 옮기고 정규식으로 신호·토폴로지 등을 파생. 수치·단위·조건 중심의 완전한 사양표는 아님 | **REFACTOR**: 원문, 추출값, 검증된 사실을 구분. 모든 제품 status를 ACTIVE로 설정하는 현재 변환도 근거 검토 필요 |
| I/O Ports | 일체형/분배 계열은 AxB 문구에서 HDMI 입력·출력 수를 생성. 나머지는 빈 배열 가능. 구성기에는 카드별 포트 배정·TX/RX가 별도로 존재 | **REFACTOR / EXTRACT**: 빈 배열을 “포트 없음”으로 해석하지 않기. 논리 신호·물리 커넥터·카드 포트를 구분 |
| Product Images | 카탈로그 대표 이미지와 구성기용 장비 자산. 정규화 카탈로그는 PRODUCT 이미지 타입 사용 | **REUSE / REFACTOR**: 전면/후면 역할·출처·해상도 점검 후 공통 자산 후보 |
| Documents | 48페이지 국문 카탈로그 PDF 참조와 페이지 링크. 구성기에는 매뉴얼·근거 ID 기반 검증 메시지 | **KEEP / EXTRACT**: 자료 레지스트리·제품/사양/규칙의 근거 연결 후보 |
| Project | 매트릭스 1개 구성 state 중심. 별도 고객·현장 프로젝트 목록은 확인되지 않음 | **KEEP / REDESIGN**: Portal 프로젝트의 하위 구성으로 연결 검토 |
| Configuration Save / Load | localStorage 자동 저장, JSON 저장/읽기. schemaVersion 3 및 구버전 1/2 수용, catalogVersion 일치 검사 | **KEEP / REFACTOR / MIGRATE 후보**: 카탈로그 변경 시 옛 구성이 차단되는 처리와 변환 안내 검토 |
| BOM | 섀시·카드·TX/RX 집계, 특정 전원 장비의 잠정 수량, CSV/JSON 및 출력 흐름. UNVERIFIED_DRAFT 표시 | **KEEP / EXTRACT**: 완성 견적 BOM으로 오인하지 않도록 누락·잠정 품목 유지 |
| Pricing / Cost | 검토한 제품·구성 코드에 가격표·원가 계산은 확인되지 않음 | **REDESIGN 후보**: 추후 공통 가격과 연결하되 현재 품목 수량 로직 보존 |
| Compatibility | 특정 카드↔TX/RX 허용 관계와 제품 relations 존재. 일반적인 모든 장비 간 호환 엔진은 아님 | **KEEP / EXTRACT**: RTCOM 전용 규칙으로 유지하고 판정 결과만 공통화 |
| Validation Logic | 카탈로그 구조·참조 검사, 구성 상태 검사, ERROR/WARNING/UNVERIFIED/VALID 구분. 실제 슬롯 확인은 일부 XDM에 한정 | **KEEP / REFACTOR**: 범용 구조 검증에서 제품 수 31개 고정 조건 분리 검토 |
| Admin | 조사한 배포 앱에서 제품 CRUD 관리자 화면은 미확인. 제품 원본은 정적 JavaScript로 관리 | **REDESIGN**: 제조사 자료 검토·승인·게시 흐름이 필요한지 결정 |
| Storage 방식 | Git 관리 정적 JS·이미지·PDF + `rtcom.configuration.v1` localStorage + 내려받은 파일 | **KEEP / EXTRACT 후보**: 제품 원본과 사용자 구성의 저장 책임 구분. 원격 DB 연동은 조사 범위에서 미확인 |

### 5.3 확인된 주의점

1. `core.js`의 XDM 지정 모델에는 매뉴얼 기준 슬롯 수를 제공하지만 SPX/VDM 등은 기본 논리 슬롯과 `PHYSICAL_LAYOUT_UNVERIFIED`를 사용한다. 사이트의 “실제 슬롯” 안내를 모든 제품군에 일괄 적용하면 안 된다.
2. `validate()`는 기본 포함품·전원·케이블 조건의 미검증 이슈를 추가하며, 내보내기 상태도 `UNVERIFIED_DRAFT`이다. 구조상 정상인 파일과 구매 확정 가능한 설계를 구분해야 한다.
3. `checkState()`는 `requirements`를 빈 목록으로 초기화한다. 요구량 집계 함수는 있지만 해당 경로에서 요구량이 보존되지 않는다. 이를 완성된 요구조건 검증 엔진으로 평가하지 않았다.
4. `portsFor()`는 제품 설명의 토폴로지에서 포트를 파생한다. 추가 오디오·제어·관리 포트까지 확인한 전수 포트 명세가 아니다.
5. 전원 장비 일부를 BOM에 추가하지만 출력 주석은 전원 미확정이라고 안내한다. 실제 확정 범위를 품목별로 구분할 필요가 있다. [L2, L4–L6]

### 5.4 7개 기준의 종합 판단

- **KEEP:** 제품 탐색·상세·PDF 근거 연결과 매트릭스 구성기.
- **REUSE:** 분류별 필터, 검색 정규화·동의어, 검증 상태, 출처 참조.
- **REFACTOR:** 문구 기반 사양 추출, 31개 고정 검사, 카탈로그와 구성기 데이터의 대응 관계.
- **EXTRACT:** 검색·문서 조회·검증 결과 표현·매트릭스 BOM 공급 기능.
- **MIGRATE:** 승인 후 개별 모델·판매 품목 매핑을 검토. Series나 TX/RX 묶음을 단일 SKU로 옮기지 않기.
- **REDESIGN:** 다제조사 관리, 공통 프로젝트 연결, 제품 변경 승인 절차.
- **REMOVE:** 즉시 대상 없음. 근거 없이 확정적으로 읽히는 슬롯·카테고리 안내는 후속 수정 후보. 과거 자료·미검증 데이터는 삭제 대신 상태 보존 권고.

## 6. LED Configurator 평가

### 6.1 현재 역할

배포 화면 버전은 **v444**이다. 공간·LED 크기 입력, 캐비닛 배열과 산출 사양, 모델 비교, 정면/3D 미리보기, 프로세서 추천, 원가/견적, 설계 프로젝트, 설치 사례 기능을 확인했다. 실제 역할은 LED 계산기를 넘어 공간 설계와 영상 처리 장비 선정까지 확장되어 있다. [E1–E7]

### 6.2 항목별 평가

| 항목 | 현행 관찰 및 한계 | 제안 판정 |
|---|---|---|
| Product Data | models.js의 LED 캐비닛, processor-data.js의 프로세서, signage-data.js의 사이니지 등 별도 데이터군 | **KEEP / REUSE / MIGRATE 후보**: 제조사·모델 식별을 맞추되 도메인별 세부 데이터 보존 |
| Product Schema | LED는 pitch/cabW/cabH/resW/resH/전력/중량/sbox/dataStatus 등. 프로세서는 slots/cards/inputs/outputs/layers/canvas/modes/verification 등 별도 구조 | **KEEP / REDESIGN**: 차이는 계산 목적에서 기인. 하나의 평면 사양표로 강제 통합하지 않기 |
| Specifications | 배열·해상도·무게·소비전력·발열 등을 계산. 값의 null, derived, verified 및 프로세서의 출처 메타데이터 존재 | **KEEP / REFACTOR**: 측정/출처값과 파생값·가정의 표시를 일관화 |
| I/O Ports | 프로세서 슬롯·보드·입출력 처리량, 독립 출력·PGM·레이어 등을 구분. Builder의 잭별 포트와 동등하지 않음 | **REUSE / EXTRACT**: 용량 검증 데이터는 보존하고 물리 포트 연결은 별도 대응 검토 |
| Product Images | 프로세서 front/back 정적 이미지 자산 존재. LED 화면 콘텐츠·인물·가구 이미지도 있으나 제품 사진과 의미가 다름 | **REUSE / REFACTOR**: 제품 자산과 시뮬레이션 자산을 분리 관리할 후보 |
| Documents | 프로세서 제조사 URL·문서명·버전 등과 docs/processors 근거 문서 존재. 모든 제품의 자료가 통일된 문서 라이브러리로 제공되는 것은 아님 | **KEEP / EXTRACT**: 공통 근거 조회로 연결하고 링크·자료 버전 점검 |
| Project | 이름 있는 구성, 원격 설계 프로젝트, 설치 사례 존재. 전사 공통 프로젝트의 고객·현장·리비전 관계는 미확인 | **KEEP / REDESIGN**: 구성과 설치 완료 사례는 다른 객체로 구분할 필요 |
| Configuration Save / Load | config.js의 v1 레코드, JSON bundle, 이름 충돌 시 개명 병합, 마지막 세션 저장, 원격 공유. 선택 모델 스냅샷도 포함 | **KEEP / REFACTOR / MIGRATE 후보**: 저장 범위 및 미래 버전·누락 필드 처리 점검 |
| BOM | 캐비닛·예비품·SBOX·GBIC 등 도메인 수량 계산과 견적 라인 산출 | **KEEP / EXTRACT**: EA/SET, 예비/운영 수량, 시공비와 장비를 구분해 취합 |
| Pricing / Cost | 외부 가격표 또는 브라우저 저장 가격을 사용. computeQuote에 가격을 인자로 전달하며 원가/판매가·설치비·간접비 계산 | **KEEP / EXTRACT / REDESIGN**: 계산 자산 재사용, 가격 열람·공유 권한과 기준 시점은 별도 설계 |
| Compatibility | 프로세서 Capacity Fit와 Operation Fit 구분. 제조사별 Layer/Window/출력 보드 규칙 존재 | **KEEP / REUSE**: LED 도메인 규칙 보존. 전체 AV 결선 호환을 검증한 것으로 확대하지 않기 |
| Validation Logic | PASS/FAIL/CONDITIONAL 및 null 미확인 처리, 제조사별 조건 검사. config 정규화는 잘못된 값을 기본값으로 대체하기도 함 | **KEEP / EXTRACT / REFACTOR**: 계산 판정과 저장 파일 복원 경고를 분리 |
| Admin | 로컬 모델 편집·삭제 UI, 가격표 읽기, 설치 사례 등록/수정/삭제 코드와 별도 보기/관리 코드 경로 | **KEEP / REDESIGN**: 개인 편집과 공용 제품 게시를 구분. 서버 권한의 실제 강제 여부는 미검증 |
| Storage 방식 | 정적 JS·이미지 + localStorage의 구성/가격/선호/접근 코드 + Supabase REST 기반 프로젝트·사례 공유 | **KEEP / EXTRACT 후보**: 현재 저장 경로 보존, 공통 저장 기술 선택은 보류 |

### 6.3 확인된 주의점

1. 저장 구성 설명은 “가격표와 가격 데이터 제외”라고 하지만 `CONFIG_DEFAULTS`와 정규화 결과에 `etcCost`, `etcSell`이 포함된다. 전체 가격표를 제외하는 것과 모든 금액을 제외하는 것은 다르다. 공유 함수는 `gatherConfig()` 결과를 전송하므로 공유 범위 검토가 필요하다. 실제 공유는 실행하지 않았다. [E3, E7]
2. 프로세서 판정에는 물리 슬롯, 장착 보드, 독립 출력, PGM, Layer, Window가 구분된다. 공통 포트 수 하나로 변환하면 과대 산정할 수 있다. [E4–E5]
3. 화면의 일부 계산 규칙 안내와 데이터가 다르다. 예를 들어 MPF 기본 컨트롤러 안내는 SNOWAAE를 언급하지만 해당 모델 데이터는 CS4BPGS를 사용한다. 어느 값이 현재 승인 기준인지 이번에는 확정하지 않았다. [E1–E2]
4. `normalizeConfig()`는 허용되지 않은 필드를 버리고 일부 값을 기본값으로 대체한다. 저장·불러오기 성공만으로 모든 설계 조건이 보존됐다고 판단할 수 없다. 프로세서 선택·카드 구성·시뮬레이션 상태 등의 저장 범위는 실제 예제 왕복 검증이 필요하다. [E3]
5. 공유 및 사례 접근 코드를 localStorage에 저장하는 경로가 존재한다. 통합 관리자 설계 시 공용 기기의 잔존 정보, 개인별 권한·회수·감사 가능성을 검토해야 한다. Supabase RLS 정책은 코드 주석의 설명만 확인했으며 실제 정책은 조사하지 않았다. [E7]

### 6.4 7개 기준의 종합 판단

- **KEEP:** 배열·스펙 계산, 프로세서 판정, 공간 미리보기, 모델 비교, 견적 계산.
- **REUSE:** 계산 모듈, 제조사별 검증 규칙, 전면/후면 자산, 자료 출처, 구성 bundle 처리 패턴.
- **REFACTOR:** 큰 app.js에 모인 화면·저장·공유 책임, 저장 범위, 설명과 데이터의 일치.
- **EXTRACT:** LED 계산·프로세서 검증·견적 계산을 각각 독립 활용할 후보.
- **MIGRATE:** 승인 후 제품 참조 및 구성 연결 검토. 과거 모델 스냅샷과 당시 계산 가정 보존.
- **REDESIGN:** 금액의 공유 범위, 공용 제품 관리, 프로젝트/설치 사례 권한과 관계.
- **REMOVE:** 즉시 대상 없음. 대체가 검증된 중복 제품 편집과 오래된 안내만 후속 제거·정정 후보. 3D 기능을 Portal 초기 범위에서 분리하더라도 기존 도구에서는 유지.

## 7. 세 시스템의 핵심 차이

| 비교 축 | Builder | Library | LED | 통합 시 주의 |
|---|---|---|---|---|
| 제품 단위 | 배치 가능한 장비·옵션·케이블 | Series·단품·TX/RX 묶음 + 프레임/카드 | 캐비닛·컨트롤러·프로세서·사이니지 | 이름 일치만으로 하나의 SKU로 합치지 않기 |
| 포트 의미 | 결선할 입력/출력/양방향 핸들 | 카탈로그 요약 포트 + 카드 슬롯 포트 | 물리/논리 출력·보드·처리 자원 | 커넥터 수와 처리 용량을 분리 |
| 저장 단위 | 구성도·프리셋·공유 스냅샷 | 단일 매트릭스 구성 | 공간 구성·모델 스냅샷·설치 사례 | 공통 프로젝트가 기존 구성의 의미를 보존해야 함 |
| BOM 초점 | 케이블 수량·길이 | 섀시·카드·TX/RX | 패널·SBOX·GBIC·예비품 및 견적 라인 | 같은 제품이어도 다른 실물인지 식별해야 함 |
| 검증 의미 | 연결 편집 가능 여부 | 구성 유효성·자료 확인 상태 | 용량 충족·운용 적합성 | 동일한 PASS 하나로 축약하지 않기 |
| 가격 | 미확인 | 미확인 | 별도 가격표 기반 | 견적 권한과 공개 사양 열람 권한을 분리 |
| 저장 기술 | localStorage + Firestore | 정적 파일 + localStorage | 정적 파일 + localStorage + Supabase | 기존 기술의 공존을 먼저 인정; 최종 기술 선택 보류 |

세 URL은 호스트가 서로 다르므로 한 도구의 localStorage를 다른 도구가 직접 공유하는 구조가 아니다. Portal 메뉴로 연결하는 것만으로 저장 데이터가 통합되지는 않는다.

## 8. 중복 기능·데이터

### 8.1 실제 확인된 제품 중복과 표현 충돌

| 대상 | 확인 근거 | 중복의 성격 / 필요한 판단 |
|---|---|---|
| RTCOM XDM-12·20·36 | Builder 검색 결과 + Library catalog.js | 개별 섀시 모델 중복. Library의 XDM Series와는 상하위 관계도 존재 |
| XDM-FT101·FR101 | Builder TX/RX 별도 검색 결과 + Library `xdm-ft101` 항목 | 동일 모델명이 두 시스템에 존재하되 Library는 한 표시 항목에 묶음. 동일 판매 SKU·가격 단위인지는 미검증 |
| XDM-CTR100 / PSE | Builder에 CTR100과 CTR100 PSE 별도 표시 + Library 묶음 항목 | 기본형·PSE 변형 구분 필요. 별칭 처리로 합치기 전에 제조사 품목 확인 |
| XDM-CT103 | Builder 벽부형 TX 표시 + Library CT103/CR103 묶음 | 모델명에 설치형태 설명이 붙음. TX/RX·설치형태를 자동 제거해 합치지 않기 |
| Analog Way Aquilon RS1·RS2 | Builder 검색 결과 + LED processor-data.js의 Aquilon RS 계열 | 모델명 중복 확인. Builder 포트와 LED 용량·PGM·Layer 데이터를 상호 보완할 후보. 사양 일치까지 확인한 것은 아님 |

Library와 LED의 조사한 제품 데이터에서는 같은 모델의 직접 중복을 확인하지 못했다. 매트릭스와 프로세서처럼 역할이 겹친다고 같은 제품이라고 판단하지 않았다. Builder의 전체 운영 DB를 일괄 추출하지 않았으므로 전체 중복 수·이미지 파일 동일성·사양 충돌의 전수 목록은 UNKNOWN이다. [B1, L2, L4, E4]

### 8.2 기능 중복

| 기능 | 중복 범위 | 공통화 방향 |
|---|---|---|
| 제품 탐색·분류·검색 | Builder와 Library, LED의 도메인 모델 선택 | 공통 제품 검색 기반 + 도구별 필요한 필터 유지 |
| 제품 데이터 편집·유지 | Builder 공용 편집, Library 코드 관리, LED 로컬 편집 | 공용 원본 검토·게시 흐름과 프로젝트 임시 편집을 구분 |
| 이미지와 기술자료 관리 | 세 시스템에 서로 다른 수준으로 존재 | 제품 자산·자료 출처 조회 공통화. 장면 자산은 별도 유지 |
| 구성 저장·JSON 입출력 | 세 시스템 모두 | 파일 식별·버전·복원 안내의 공통 원칙; 도구별 내용은 보존 |
| BOM 생성 | 세 시스템 모두, 다루는 품목은 다름 | 각 계산기를 유지하고 취합·중복 확인·출력 공통화 |
| 검증 | 결선 / 카드 구성 / LED 용량 | 검증 실행 규칙은 도메인별, 오류·미검증·근거 표시는 공통 |
| 프로젝트/공유 | Builder 프리셋·링크, LED 구성 공유, Library 로컬 구성 | 프로젝트에서 구성 연결·리비전·권한을 관리할 후보 |
| Product Compare | LED에는 계산 결과 비교 확인. Library의 비교 문구만으로 다제품 비교 기능 구현을 확정할 수 없음 | 카탈로그 사양 비교와 동일 조건의 설계 결과 비교를 구분 |

### 8.3 이중 BOM 위험의 구체적 예

LED 도구에서 SBOX와 프로세서를 선정한 뒤 같은 장비를 Builder에 배치하고, RTCOM 구성기에서 만든 섀시·카드를 Builder에도 표현할 수 있다. 세 BOM을 단순 합산하면 같은 실물 장비를 두 번 계산할 가능성이 있다. 반대로 같은 모델을 서로 다른 공간에 실제 두 대 설치한 경우에는 두 대를 유지해야 한다.

따라서 모델명만 기준으로 합치거나 중복 행을 제거하지 말고, **어느 설계 구성에서 나온 어떤 실물/품목인지** 추적하는 방법을 후속 설계에서 검토해야 한다. 캐비닛 운영 수량과 예비품, GBIC SET과 EA, 케이블 수량과 길이, 장비와 시공비도 구별해야 한다. 이 설명은 데이터 요구사항이며 스키마 정의가 아니다.

## 9. 장기 참고: 시스템 간 공통 기능 제안 — 현재 MVP 범위 아님

아래 표는 범위 정정 이전의 제안을 보존한 것이다. P1/P2는 과거 제안의 순서이며 현재 우선순위를 뜻하지 않는다. Portal 내부 기능과 유사한 이름이 있더라도 세 도구의 공통화 요구로 적용하지 않는다. 현재 분석 순서는 §0을 따른다.

| 우선순위 | 공통 기능 후보 | 재사용할 자산 | 도구 안에 남길 책임 |
|---|---|---|---|
| P1 | 제품 식별·별칭·원본 대응과 근거 조회 | Library 검증/문서 참조, Builder 장비 목록, LED 사양 근거 | 장비 배치, 매트릭스 선택, LED 모델 계산 |
| P1 | 자료·이미지 조회 | Library 카탈로그, LED 프로세서 front/back, Builder 이미지 | 노드 그림·슬롯 도식·3D 장면 표현 |
| P1 | 프로젝트에서 각 도구의 구성 연결 | Builder 구성도/프리셋, Library 문서, LED 이름 있는 구성 | 도구 고유 편집기와 내부 상태 |
| P1 | 저장 버전·스냅샷·복원 결과 안내 | Library 버전 검사, LED bundle 처리, Builder JSON | 각 도구의 저장 내용과 호환 변환 |
| P1 | 검증 결과와 미확인 정보 표시 | Library 근거 포함 issues, LED CONDITIONAL, Builder 연결 제약 | 제조사·장비군별 규칙과 계산식 |
| P2 | BOM 취합·중복 검토·내보내기 | 기존 세 BOM 계산 | 도메인별 수량 산정 |
| P2 | 제품 검색·Dynamic Filter·사양 비교 | Library 검색/동의어/분류별 필터, LED 비교 UX | LED 같은 조건 계산 비교, 결선용 장비 선택 |
| P2 | 가격표·원가/판매가 접근 관리 | LED computeQuote 등 계산 패턴 | 설치비·간접비 등 도메인 계산 조건 |
| P2 | 관리자 검토·승인·변경 이력 | 기존 편집 기능 및 상태 표현 | 개인 실험용 모델·프로젝트 임시 변경 |

우선순위는 **검토 순서 제안**이다. 확정 MVP 또는 구현 착수 승인이 아니다. 특히 다음은 공통화하지 않고 독립성을 유지하는 편이 합리적이다.

- Builder의 캔버스·노드·엣지·자동 배치.
- RTCOM의 섀시·카드·TX/RX 구성 규칙.
- LED의 배열·전력·프로세서 Layer/Window·공간/3D 계산.

### 9.1 Product Schema를 정하기 전에 해결할 질문

1. Series, 개별 모델, 판매 SKU, TX/RX 세트, 옵션 카드, 배치 장비의 관계를 어떻게 다룰 것인가?
2. 제품의 물리 포트, 선택 카드가 추가하는 포트, 논리 채널, 처리 용량을 어떤 경계로 구분할 것인가?
3. 제조사 문서와 사용자 입력·파생 계산이 충돌할 때 누가 어떤 근거로 승인할 것인가?
4. 사양·제품 생애주기·검증 상태를 제품 전체와 개별 값 중 어느 수준에서 관리해야 하는가?
5. 과거 프로젝트가 원본 제품 변경 이후에도 당시 설계와 견적을 재현해야 하는 범위는 어디까지인가?

현재 세 구조는 비교 재료일 뿐, 어느 구조도 통합 표준으로 확정하지 않는다.

### 9.2 Database를 정하기 전에 확인할 조건

동시 편집, 사용자·팀별 권한, 공개/사내 자료 분리, 가격 접근, 파일 용량, 오프라인 요구, 과거 구성 복원, 감사 기록, 백업·복구, 기존 저장 서비스 운영 주체를 먼저 확인해야 한다. Firestore나 Supabase를 이미 사용한다는 사실만으로 Portal 저장소를 결정하지 않는다.

## 10. 장기 참고: 통합을 위한 후속 조사 — 현재 선행 조건 아님

아래 조사는 향후 별도의 통합 요청이 있을 때 참고한다. 특히 Builder 원본·운영 DB 접근, LED 데이터 추출, 시스템 간 BOM·저장 호환 검증은 현재 Portal 개선의 선행 조건이 아니다. Portal 내부 사양·자료·저장·관리 검토는 RTCOM 시스템 범위에서 별도로 정한다.

| 확인 과제 | 필요한 근거 | 완료 판단 기준 |
|---|---|---|
| Builder 원본과 운영 규칙 확인 | 실제 저장소, 형식 정의, 테스트, Firestore 권한 규칙 | 제품 편집·파일 복원·공유의 구현 및 권한 범위를 추측 없이 설명 가능 |
| 중복 제품 정밀 대조 | 승인된 제품 목록/샘플, 제조사 모델·옵션 자료 | ID 대응, Series/SKU/TX/RX/변형 구분과 충돌 목록 작성 |
| 저장 복원 범위 검증 | 도구별 비민감 샘플과 구버전 파일 | 저장→복원 전후 수량·포트·옵션·계산 조건 및 유실 항목 확인 |
| BOM 연결 시나리오 검증 | LED→Builder, Matrix→Builder의 대표 설계 | 같은 실물의 이중 집계 없이 예비품·단위·미확정 품목 보존 |
| 사양·검증 근거 확인 | 공식 제조사 자료와 기존 근거 문서 | UNKNOWN을 사실로 승격하지 않고 항목별 출처·조건 확인 |
| 권한·가격 공유 검토 | 운영자 설명과 서버 정책, 비민감 예제 | 열람/편집/삭제/공유 범위와 금액 포함 여부 확인 |

위 후속 조사는 이번에 실행한 작업이 아니다. 데이터 이관을 검토하더라도 원본 보존, 대응표, 복원 비교, 승인 및 되돌리기 조건을 먼저 정해야 한다.

## 11. 근거 목록

아래 URL은 재확인 가능한 원문 위치이다. 소스 경로의 줄 번호·함수명은 조사 시점 기준이다. 코드에 기록된 제조사 출처는 이번 조사에서 별도로 전수 검증하지 않았다.

### Builder

- **B1** — [AV System Builder 배포 화면](https://seoul-visual-tech.github.io/av-system-builder/): v1.19.1, 클라우드 동기화 표시, XDM 및 Aquilon 검색 결과.
- **B2** — [배포 JavaScript 번들](https://seoul-visual-tech.github.io/av-system-builder/assets/index-BLbYfkdc.js): localStorage 키, JSON version 1.1, 포트 비교 `p.type===h.type`, Firestore 컬렉션, 공유 함수, 이미지 편집·BOM 구현. SHA-256: `55a5cc69d5b139c3f7b61d24f01fbdcdaa9249ce3013816260afafd225787afa`.압축 번들이므로 함수명은 빌드에 따라 달라질 수 있다.

### Library

고정 커밋: `1d97f429328f1bd486ef1f7c881424b7e3bdcde8`.

- **L1** — [배포 홈](https://seoulav.github.io/rtcom-configurator/) 및 [제품 목록](https://seoulav.github.io/rtcom-configurator/products).
- **L2** — [product-catalog.js](https://github.com/seoulav/rtcom-configurator/blob/1d97f429328f1bd486ef1f7c881424b7e3bdcde8/src/product-catalog.js): sourceProducts, normalize, portsFor, verificationFor, categoryRegistry.
- **L3** — [library.js](https://github.com/seoulav/rtcom-configurator/blob/1d97f429328f1bd486ef1f7c881424b7e3bdcde8/src/library.js) 및 [product-search.js](https://github.com/seoulav/rtcom-configurator/blob/1d97f429328f1bd486ef1f7c881424b7e3bdcde8/src/product-search.js): 표시·검색·상세·PDF 연결.
- **L4** — [catalog.js](https://github.com/seoulav/rtcom-configurator/blob/1d97f429328f1bd486ef1f7c881424b7e3bdcde8/src/catalog.js) 및 [core.js](https://github.com/seoulav/rtcom-configurator/blob/1d97f429328f1bd486ef1f7c881424b7e3bdcde8/src/core.js): slotsFor/checkState/validate/bom/document/parse/csv.
- **L5** — [catalog-validator.js](https://github.com/seoulav/rtcom-configurator/blob/1d97f429328f1bd486ef1f7c881424b7e3bdcde8/src/catalog-validator.js): 31개 고정 검사, 참조·상태 검증.
- **L6** — [app.js](https://github.com/seoulav/rtcom-configurator/blob/1d97f429328f1bd486ef1f7c881424b7e3bdcde8/src/app.js): storageKey(138행), 자동 저장(157행), 복원(214행) 및 내보내기 흐름.

### LED

고정 커밋: `24a61647778535497a3a9a25ef652f95371461ae`.

- **E1** — [LED Configurator 배포 화면](https://hkkim0454.github.io/svt-led-calculator/src/index.html): v444, 모델 비교·프로세서·가격표·프로젝트·사례 표시.
- **E2** — [models.js](https://github.com/hkkim0454/svt-led-calculator/blob/24a61647778535497a3a9a25ef652f95371461ae/src/models.js) 및 [signage-data.js](https://github.com/hkkim0454/svt-led-calculator/blob/24a61647778535497a3a9a25ef652f95371461ae/src/signage-data.js): 모델 사양·상태.
- **E3** — [config.js](https://github.com/hkkim0454/svt-led-calculator/blob/24a61647778535497a3a9a25ef652f95371461ae/src/config.js): normalizeConfig, makeRecord, exportBundle, parseImport, mergeRecords.
- **E4** — [processor-data.js](https://github.com/hkkim0454/svt-led-calculator/blob/24a61647778535497a3a9a25ef652f95371461ae/src/processor-data.js): 제품·처리 자원·근거 구조.
- **E5** — [processor-validator.js](https://github.com/hkkim0454/svt-led-calculator/blob/24a61647778535497a3a9a25ef652f95371461ae/src/processor-validator.js) 및 [processor-limits.js](https://github.com/hkkim0454/svt-led-calculator/blob/24a61647778535497a3a9a25ef652f95371461ae/src/processor-limits.js): 용량·제조사별 판정.
- **E6** — [engine.js](https://github.com/hkkim0454/svt-led-calculator/blob/24a61647778535497a3a9a25ef652f95371461ae/src/engine.js): computeConfig(230행), computeQuote(330행), computeIndirect(404행), bom(429행).
- **E7** — [app.js](https://github.com/hkkim0454/svt-led-calculator/blob/24a61647778535497a3a9a25ef652f95371461ae/src/app.js) 및 [share-remote.js](https://github.com/hkkim0454/svt-led-calculator/blob/24a61647778535497a3a9a25ef652f95371461ae/src/share-remote.js): 가격 저장, 구성 저장(3051행 이후), 프로젝트 공유(3293행 이후), 설치 사례 관리.

## 12. 검토 요청 및 작업 종료

**현재 기준:** 사용자가 정정한 “RTCOM 시스템을 Portal 본체로 개선하고 Builder·LED는 링크로 연결”하는 범위를 적용한다. 이 범위는 재승인을 요청하지 않는다. 다음 분석에서는 §0의 Portal 내부 개선 우선순위를 기준으로 세부 검토안을 작성한다.

이 문서만으로 Database·최종 Product Schema·세부 Architecture는 결정되지 않는다. 이번에는 평가 문서의 적용 범위와 우선순위만 수정했다. 기존 시스템 코드·저장소·운영 데이터를 변경하지 않았으며 구현·이관·통합은 진행하지 않았다.

