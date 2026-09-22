# RTCOM DATA PREPARATION

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


**상태:** 1차 자료 조사 및 Skeleton 검토 · 사용자 검토 대기  
**작성일:** 2026-09-21  
**대상:** AV Equipment Library / RTCOM Configurator → AV Portal  
**결정 수준:** 최종 Product Data Schema 확정 전 준비 자료

## 1. 조사 결론과 적용 범위

**Common Product Core / Category Specification Profile / Evidence의 3단 구조는 유지할 가치가 있다.** 실제 자료는 공통적인 물리·전원 정보와 제품군별 사양을 반복해서 제공하지만, 모델·카드·옵션·동작 모드별 조건이 섞여 있다. 따라서 현재 Skeleton을 그대로 최종화하기보다 **적용 대상·조건·Revision과 복수 근거를 표현하는 개념**을 보완해야 한다.

우선 해결할 사항은 다음과 같다.

1. 같은 Series 안의 서로 다른 세대·모델명을 구분한다. XDM의 HI4N/HI4S와 HI100/HIS100, VDM-256X/288X를 임의로 동의어 처리하지 않는다.
2. 카드 포트, 섀시 슬롯, 영상 경로, 모드별 출력 수를 나눈다. QMS-88UX의 8×8 표제와 10개 출력 설명은 단일 숫자로 합칠 수 없다.
3. 자료 종류·검증 정도·문서 유효 상태·제품 판매 상태를 분리한다. 매뉴얼에 값이 있다는 사실은 그 자료가 현재 제품의 최종 승인 사양이라는 뜻이 아니다.
4. 문서 내부 충돌과 문서 간 충돌을 모두 남긴다. 최신 파일명이나 다수결로 값을 선택하지 않는다.
5. 사진·도면·사양표 이미지를 구분한다. 파일 확장자와 폴더명만으로 Product Image를 등록하지 않는다.

사용자가 승인한 `UI_UX_SPEC.md`, `PRODUCT_TAXONOMY.md`와 기존 평가·개념·MVP 문서를 기준으로 한다. Manufacturer와 Taxonomy는 독립적이며, 기존 MVP 1 / MVP 1.5 / Phase 2 순서를 유지한다. 이 조사의 신규 근거는 기존 분류 후보의 후속 검토 자료이며 승인된 문서를 직접 수정하지 않는다.

Builder·LED는 외부 링크로 유지한다. 이번에는 기존 코드·데이터·Configurator 계산을 수정하지 않았고, 최종 Schema·Database·JSON·API·Internal ID·SKU·필드 자료형·필수 여부를 설계하지 않았다. 문서 안의 D001 등의 표식은 **이 보고서 안에서 자료를 찾기 위한 번호**이며 제품/문서 시스템의 Internal ID 제안이 아니다.

### 1.1 조사 자료와 방법

- `02_사양서.zip`: 사용자가 제공한 공식 최종 자료 수령 전 1차 자료. 원본은 읽기만 했다.
- `PRODUCT_DATA_SCHEMA_SKELETON.md`: 다운로드 폴더의 초안을 전부 읽고 비교했다. 초안의 YAML·상태명·후속 실행 순서는 검토 대상이며 구현 지시로 실행하지 않았다.
- ZIP의 비디렉터리 파일 **75개 전부**를 목록화했다. PDF 46, DOCX 7, PPTX 2, PNG 16, JPG 4다.
- PDF는 전 페이지 텍스트 추출을 시도했고, DOCX 본문과 PPTX 슬라이드 텍스트를 확인했다. 추출이 희박한 XDM·SPX·QMS 등의 주요 표지·사양·구성 페이지는 화면으로 보완했다. 독립 이미지 20개는 축소 미리보기로 내용 유형을 확인했다.
- **전 문서 전 페이지의 육안 정밀 검증 또는 완전 OCR을 수행한 것은 아니다.** 특히 이미지형 매뉴얼의 모든 명령·사양, PPTX 내 이미지 표의 세부 수치는 미검증이다. 문서 존재 확인과 값 검증 완료를 구분한다.
- 본문에서 `D013 PDF p.7 / 인쇄 p.6`처럼 파일 페이지와 인쇄 페이지를 구분한다. 별도 표시가 없는 `p.`는 PDF 파일의 1부터 시작하는 페이지다. DOCX는 렌더링하지 않았으므로 절 제목으로, PPTX는 슬라이드로 참조한다.

## 2. RTCOM 자료 Inventory 요약

**75개 개별 파일의 원래 경로·유형·대상·버전·날짜·언어·유효 상태·조사 메모는 부록 A에 수록했다.** 원래 폴더 구조는 출처 위치로 보존하며 분류 판정의 근거로 단독 사용하지 않는다.

| 유형 | 실제 확인 예 | 조사 판단 |
|---|---|---|
| Product Catalog | D012 SPX, D021–023 XDM, D075 종합 48페이지 | 제품군·기능·간략 사양. 날짜·현재 적용 모델 별도 확인 |
| Datasheet / Specification | D003 SPX 참고 자료, D017–018 XDM 사양, D062–065 광모듈 표 이미지 | 초안·참고 성격 포함. 제품 사진과 구분 |
| User Manual | D001, D013, D034, D041, D048–052 등 | 제품·설치·제어·사양을 복합 수록 |
| Installation Guide | XDM D013 목차 §2, VDM D034 설치 절, 각 단품 매뉴얼 사용방법 | 독립 제목의 Installation Guide는 이번 목록에서 확인하지 못함. 매뉴얼 내 설치 절은 존재 |
| Command / Protocol | D025–029, SPX D001 후반 제어 설명 | 명령문·펌웨어 적용 범위 확인 필요. 명령에 숫자가 있다고 실제 용량으로 단정하지 않음 |
| Drawing | D032 XDM-POE 조립도 | 부품명·도면번호·도면일자 존재. 발주용 최신 승인 도면인지 미확인 |
| Product Image | SPX/XDM/VDM 전면·후면 및 HD-210U 사진 | 촬영/렌더링 형태와 공개 적합성 별도 검토 |
| Presentation | D061 광모듈스펙, D074 오디오 추출·병합 구성도 | PPTX 컨테이너 안에 사양표·교육 설명 포함 |
| Legacy / 이전 자료 | `이전자료` 경로의 11개 파일 | 문서 유형이 아니라 보관 상태 단서. 제품 단종·폐기 증거는 아님 |
| 기타 / 구성 이미지 | D030–031 전원 구성 이미지 | MAX2 표기 포함. XDM 적용 여부 확인 필요 |

### 2.1 중복과 파생 자료

- **D001 = D002**, **D004 = D070**: 파일 바이트의 SHA-256이 각각 동일하다. 같은 사양을 제공하는 독립된 두 근거로 세지 않는다. 두 원본 경로를 유지하고 삭제하지 않는다.
- D017 DOCX / D018 PDF, D040 DOCX / D041 PDF는 같은 주제·내용의 편집본/배포본 후보다. 전 문장·도형의 동일성을 확정하지 않았다.
- D052 / D054는 같은 QMS-88UX 매뉴얼 계열이지만 서로 다른 파일이다. 파일명 Revision 차이만으로 대체 관계를 확정하지 않는다.
- D062–065는 `사진` 폴더에 있지만 실제로는 전기·광 특성 사양표 이미지다. 대표 제품 이미지가 아니다.
- D030–031은 도식/제품 조합 이미지다. D032 CAD 계열 조립도와 동일 문서로 합치지 않는다.

## 3. 확인된 Product Family와 표현 단위

여기서 **확인됨**은 1차 자료 본문에서 해당 제품군·기능의 존재를 확인했다는 의미다. 현재 판매·공식 최종 사양·전체 라인업 확정을 의미하지 않는다.

| Product Family / 역할군 | 상태 | 실제 확인 근거 | 남은 범위 |
|---|---|---|---|
| XDM Series | 확인됨 | D013 p.3–18의 섀시·카드·옵션, D018 본체/카드 사양, D075 p.4–12 | 구·신 카드명 대응, XDM-20/20X, 전체 현행 라인업·288 적용 여부 |
| SPX Series | 확인됨 | D003 p.1–4, D012 p.1–4에 M810/M1620/M3236/M2472/M24120, 입력/출력 보드 | D001의 SPX-M24 표지 및 M2472/M24120 사양이 파일명 M810과 불일치 |
| VDM Series | 확인됨 | D034 §2.2–2.4의 프레임/보드, D075 p.17–27 | VDM-256X와 288X, 섀시 규격·보드 세대·판매 상태 |
| Integrated / Small Matrix | 확인됨 | QMS-44UX/88UX D051–054 | 제외 모델은 제품군 준비 범위에서 제거. 소형은 크기 특성이며 모든 Switcher를 Matrix로 묶지 않음 |
| Distribution / Switcher | 확인됨 | D041 HD-210U, D048 HDS-21U, D049 HDS-42MU, D047/D075 | HDS-42MU 분류 후보 보완; 치수 충돌; 소형 제품 전체 현행 목록 |
| Extender | 확인됨 | XDM-CTR100 D033 p.4–9, CT/CR D066–068, OBHD-2C D059, D075 | TX/RX 판매 단위, PSE/PD 변형, 거리 조건, 광모듈 적용 범위 |
| Extender Frame / Module | 확인됨 | MR-4S D069, SPX-R6 D004/D070 | 실제 수용 모듈 모델·전원 예산. SPX-R6를 SPX 매트릭스 섀시로 혼동하지 않음 |
| Cable | 확인됨 | AHOC D071, UMC D072, HOC UX D073, LHOC 포함 D075 p.43–46 | 길이별 SKU·방향성·현행 옵션·설치 제약 |
| XDM 전원 집합장치 | 일부 확인 | D032 도면 XDM-POE / XDM-PSU, D030–031 MAX2 구성 | 상용 모델명·정격·수용 카드·필수/선택 관계 |
| 기타 오디오 추출기 | 일부 확인 | D037 HEXA-01 매뉴얼 p.1–4 | 현행 제품 여부·Portal 초기 등록 대상 여부 |
| MAX2 / UXM 관련 자료 | 추가 자료 필요 | PureLink MAX2 D015/D024, D014 내부 리뷰, UXM 비교 D074 | XDM/VDM과 동일 모델·OEM·후속품이라는 관계는 확인 불가 |

Series, Model, Card, TX/RX 묶음, Cable 길이 변형을 평탄화하지 않는다. 위 역할군은 승인된 Taxonomy를 설명하기 위한 것이며 새로운 Category를 자동 추가한 것이 아니다.

## 4. Skeleton 적합성 검토

| 검토 대상 | 판정 | 실제 근거와 보완 방향 |
|---|---|---|
| Common Core / Category Profile / Evidence의 3단 분리 | 유지 | D034의 공통 물리 정보와 카드별 포트/신호 표, D071 케이블 특성이 명확히 다름 |
| Manufacturer / Series / Model / 이름 | 유지 + 수정 필요 | D001 파일명/표지 차이, D022 XDM-20X, D072 알티정보통신 표기. 원문명과 확정 표시명을 구분할 준비 필요 |
| item_level 예시 | 수정 필요 | series/model은 식별 수준, module/cable/accessory는 제품 역할, bundle은 묶음 구성이다. 하나의 상호배타적 목록으로 확정하지 않음 |
| Category / Subtype | 유지 | 승인된 Taxonomy 기준. Manufacturer·Protocol을 Category로 넣지 않음 |
| tags | 수정 필요 | 미검증 기능을 tag로 우회하여 확정 표현하지 않도록 근거/용어 검토 필요 |
| 물리·전원·환경의 공통 영역 | 유지 + 수정 필요 | 공통으로 등장하나 모든 제품의 필수 정보는 아님. W/D/H 순서, 날개 포함, 온도 운용/보관, 소비전력/PSU 정격 구별 |
| Control 공통 영역 | 유지 + 수정 필요 | D001 p.5의 D-sub와 RJ45 제어, D025 명령 자료. 물리 커넥터와 통신/응용 명령을 구분 |
| overall_status | 수정 필요 | 제품 전체 상태만으로 D013 특정 카드명 충돌을 표현할 수 없음. 개별 주장 상태를 요약하는 역할로 제한 |
| I/O와 Capacity의 분리 | 유지 + 추가 필요 | D052 p.5–6의 8×8/10출력, D034 p.26의 DVI/HDMI 커넥터 병기. 포트 그룹·공유 경로·모드 조건 필요 |
| Capability 공통 영역과 Profile의 동일 개념 반복 | 수정 필요 | Scaling/HDCP/Power/Redundancy 등이 여러 곳에 반복됨. 독립적인 중복 진실값으로 관리하지 않도록 책임 범위를 후속 결정 |
| max_resolution / max_distance 단일 최댓값 관점 | 수정 필요 | D068 p.1의 FHD 100m / 4K30 70m. 포맷·케이블·모드·카드 조건 묶음이 필요 |
| Matrix / Module Profile | 유지 + 추가 필요 | D013 p.7,13,18의 섀시/카드/Dante 조건. 물리 슬롯·보드 용량·옵션 구성·적용 세대 구분 |
| Integrated Matrix / Small Matrix / Switcher 묶음 | 수정 필요 | D048 2→1 선택, D049 4→2 경로 선택, D041 분배 구조가 다름. 사양 영역 재사용은 가능하나 Category 동일화 금지 |
| Extender role에 bundle 포함 | 수정 필요 | TX/RX/transceiver는 동작 역할, bundle은 제품 표현/판매 구성. 별개 개념으로 검토 |
| Extender Frame Profile | 유지 + 추가 필요 | MR-4S 4모듈과 SPX-R6 6모듈, 전원 공유·모듈 조건. 프레임 전체 성능과 장착 모듈 사양을 분리 |
| Cable Profile | 유지 | D071–073의 활성 광·잠금·길이·외부 전원·설치 정보. 길이 제품 목록과 최대 성능은 구분 |
| Product Relations | 유지 + 수정 필요 | 존재/예시 연결과 전 조합 호환 보장을 구분. 관계의 출처·적용 조건 필요 |
| Documents / Evidence | 유지 + 추가 필요 | 복수 출처, 문서 내 위치, 원문 단위, 적용 모델/HW/FW, 출처 확인 정도, 충돌 유형 필요 |
| source_type의 legacy | 수정 필요 | manufacturer/internal/partner는 출처, legacy는 유효 상태. 서로 다른 축 |
| verification 상태 예시 | 수정 필요 | MANUAL_CONFIRMED는 문서 종류/관찰, LEGACY_SOURCE는 문서 상태. VERIFIED/CONFLICTED와 한 목록으로 확정하기 전 분리 검토 |
| media와 images의 병렬 정의 | 수정 필요 | 동일 파일의 출처·대상·대표 이미지 역할을 중복 관리하지 않도록 단일 개념 연결 검토 |
| Source Priority 고정 순위 | 수정 필요 | 치수는 적용 도면, 명령은 FW별 명령서 등 정보별 적합성이 다름. 자료 종류의 고정 순위로 자동 덮어쓰기 금지 |
| 모든 Capability를 모든 제품에 노출 | 불필요 | Cable에 Chassis 슬롯, 단순 분배기에 Dante 등 관련 없는 빈 영역을 강제하지 않음 |
| 현 단계의 replacement_for / successor_of 확정 | 불필요 | 개념 후보는 남기되, 제조사 근거 없이 제품 후속·대체 관계를 채울 필요 없음 |

### 4.1 추가로 준비할 개념

- **적용 범위:** Series 일반 설명인지 개별 Model/Card인지, 특정 HW/FW/옵션/동작 모드인지.
- **측정·표현 조건:** mm/inch, W/D/H 순서, 랙 날개 포함, 최대/일반 소비전력, PSU 용량, 채널별/합계 대역폭.
- **동일 주장에 대한 복수 근거:** 두 문서가 같은 값을 제시하더라도 복사본/파생본인지 표시.
- **미기재와 미확인 구별:** 본문에 없음, 읽지 못함, 적용 대상 불명확, 충돌, 비해당을 서로 구분.
- **Revision 계층:** 제품 HW/FW와 문서 Revision은 별개. 문서가 바뀌어도 제품이 바뀌었다고 단정하지 않음.

이 항목들은 의미상의 요구다. 필드명·자료형·Required/Optional·저장 형태를 정하지 않는다.

## 5. Category별 Specification 후보와 실제 근거

| Category / 영역 | 이번 자료에서 확인한 반복 정보 | 근거 예 | 공식 자료에서 보완할 부분 |
|---|---|---|---|
| Matrix Chassis | 입력/출력 용량, 장착 보드 수, 제어 패널, PSU, 냉각, 치수·무게·환경 | D034 p.12–20; D003 p.1–2; D013 p.6–12 | 현행 모델별 물리 슬롯과 지원 채널, Fan/PSU 구성, 기본/옵션/최대 장착 |
| Matrix Switching | 해상도/주사율/크로마, 대역폭, HDCP, EDID, 스케일링, 심리스, 월/멀티뷰 | D012 p.3–4, D075 p.5,14,18; D051 p.5–6 | 입력/출력 보드 및 모드별 제약, 비트 깊이/HDR 조합, 지연 |
| Matrix Card | 입력/출력 역할, 포트 수, 커넥터, HDMI/DP/SDI/CAT/광, 오디오 병합·추출 | D013 p.13–18; D034 p.21–30 및 출력 보드 절 | 카드 HW 개정, 제어/오디오 겸용 단자, 지원 Chassis 명시 목록 |
| Dante / Genlock | 모델별 Dante 선택 방식, Dante 출력 카드, SDI Genlock 설명 | D013 p.7,18; D018 p.1; D034 p.10 | Dante 입출력 채널/샘플레이트/동시 사용, Genlock 적용 카드와 커넥터, 신호 조건 |
| Integrated Matrix | 고정 I/O, 모드별 출력, 오디오, 제어, 전원·치수 | D051 p.5–6, D052 p.5–6 | QMS 모드별 경로·동시 출력, 전원 개정 |
| Signal Switcher | 입력 선택/우선순위, EDID, 오디오 병합·추출, 제어 | D048 p.4 및 사용방법 | Fast Switching을 Seamless와 같은 의미로 등록하지 않음 |
| Distribution | 분배 구조, 입력 선택 여부, I/O, HDCP/EDID, 오디오, 전원 | D041 p.4; D047; D075 p.31,34–39 (p.32–33 제외) | 2입력→10출력의 동작 모드, 데이터 누락·치수 오류 |
| Extender | 역할, 신호/커넥터, CAT/광, 거리별 포맷, HDCP/EDID, 오디오/제어, PSE/PD | D033 p.4–9; D066–068; D059 표지 | 케이블 등급, 광 모드/코어/파장/광모듈, 전원 공급 조건, TX/RX 판매 단위 |
| Extender Frame | 수용 모듈 수, TX/RX 혼합, 공유 전원, 모듈 핫스왑 | D069 p.1; D004 p.1 | 모듈 실모델·슬롯 역할·전원 예산, 프레임 사양과 모듈 사양 구분 |
| Cable | 활성 광 여부, 길이, 영상 포맷, 대역폭, HDCP/EDID/CEC, 전력, 환경, 잠금·보호캡·스풀 | D071–073; D075 p.43–46 | A/B 커넥터 세부형식, 방향 표기, 길이별 성능·품번, 굽힘/인장/포설 조건 |
| 전원 보조 품목 | 조립 외형, 채널 표기, 전원 입력, 연계 그림 | D032 p.1 | 상품 모델, 채널별 정격·합계 예산·포함 카드, 필수/선택·판매 여부 |

**확인되지 않은 값은 채우지 않았다.** 예를 들어 케이블 방향성은 프로파일로 유용하지만 “광 케이블이므로 방향을 확정”하지 않는다. Dante Sample Rate, 모든 모델의 HDR/Genlock, 모델별 전체 호환표도 확보 완료로 표시하지 않는다.

### 5.1 공통 수치를 단순화하면 사라지는 조건

- **D068 p.1:** CAT5e/CAT6, FHD 최대 100m와 4K30 최대 70m가 함께 나온다. `100m / 4K`를 독립적으로 조합하면 잘못된 성능 주장이 된다.
- **D013 p.13 / 인쇄 p.12:** HIS100/HI100에 4 HDMI와 4 Audio In/Out이 병기된다. 영상 8채널이나 입력·출력 각각 4오디오로 임의 해석하지 않는다.
- **D013 p.7 / 인쇄 p.6:** XDM-12/20/36의 MCU Dante 옵션과 XDM-72/144의 별도 Dante I/O 슬롯 조건이 다르다. Series 전체 `Dante=true`로 확정할 수 없다.
- **D071 p.1:** 외부 전원 불필요와 DC 5V·0.25W가 함께 존재한다. 이는 즉시 충돌로 단정할 사례가 아니며 전원 공급 경로와 소비를 나눠 확인해야 한다.
- **D034 p.12–20:** PSU별 W와 합산식이 소비전력 표제 아래 표시된다. 이중화 전원 정격 합계가 실제 운용 소비전력인지 확인해야 한다.

## 6. I/O 구조 검토

| 개념 | 의미 | RTCOM 근거 / 주의점 |
|---|---|---|
| Physical Connector | 실제 단자 형태·성별·접점 | D013 p.13 HDMI female / Phoenix 5p, p.18 BNC / Phoenix 3p |
| Signal | 영상·음성·제어 신호의 의미 | HDMI 영상과 Analog Audio, SDI를 포트 형태와 구분 |
| Protocol / Standard | 전송·통신 규약 또는 표준 정보 | HDBaseT/Dante/TCP-IP와 HDMI 규격·HDCP 조건을 무차별 동일 값으로 합치지 않음 |
| Direction | 해당 신호의 입력/출력·역할 전환 | D033 TX/RX 스위치, D013 Audio In/Out 겸용 표기. RJ45라는 이유로 양방향 LAN으로 등록하지 않음 |
| Quantity | 확인된 물리 단자 수 | D052 p.6 HDMI 출력 10개. 매트릭스 표제 8×8과 별도 |
| Fixed / Optional | 기본 장착·선택 장착·조건부 존재 | XDM MCU Dante와 별도 카드, 카드가 장착되지 않은 섀시의 장비 I/O를 구분 |
| Card / Module | 포트가 속한 장착 단위 | D034 보드 사양과 프레임 장착 수는 다른 수준 |
| Condition | 사용 모드·보드·케이블·상대기기·FW | D052 출력 9/10 Quad-view, D033 PSE↔PD 운용 |
| Capacity | 동시 처리 채널·경로·장착 한계 | D034 p.26의 DVI 4개+HDMI 4개를 8개의 독립 영상 입력으로 단정하지 않음 |

### 6.1 필요한 의미상의 구분

1. **Connector / Signal / Transport / Protocol / Format / Capability를 분리한다.** RS-232는 전기적 인터페이스 표준 성격을 가진다. Skeleton의 Protocol 예시를 최종 분류표로 채택하지 않는다. RJ45(본문 표기)의 물리 형태만으로 HDBaseT·Dante·제어 LAN을 같다고 볼 수 없다.
2. **포트별·그룹별·제품 전체 조건을 나눈다.** 모든 포트가 항상 동일한 역할과 포맷을 지원한다고 가정하지 않는다.
3. **공유·대체 단자 가능성을 남긴다.** 물리 단자 수와 동시에 사용 가능한 논리 채널 수가 같다는 전제는 금지한다.
4. **섀시 잠재 용량과 실제 장착 상태는 다르다.** 이번에는 구성 계산을 하지 않으며 슬롯×포트 수를 계산해 새 사양을 생성하지 않는다.
5. **HDMI 문자열에 모든 정보를 합치지 않는다.** 커넥터 형태, HDMI 규격, 해상도/주사율/크로마/비트 깊이, HDCP 및 해당 동작 조건을 각각 확인할 수 있어야 한다.

## 7. Product Relation 후보와 확인 정도

| 관계 후보 | 이번 근거 | 확인 정도 | 추가로 받아야 할 근거 |
|---|---|---|---|
| Series → Model | D003 p.1, D013 p.3, D034 §2.2, D075 라인업 | 문서별 목록 확인 | 현행·단종·지역별·세대별 공식 목록 |
| Chassis → Input/Output Card | D013 p.13–18, D034 보드 절 | Series 내 카드군 확인 | 개별 Chassis/HW/FW별 허용 카드, 혼합·수량·대역폭 조건 |
| SPX 출력 카드 → SPX-RX | D012 p.4 CAT Output with SPX-Rx | 관계 문구 확인 | 카드 Revision·케이블·거리·전원 조건 |
| TX ↔ RX | D066 CT101-U→CR101-U 변환 방향, D059 OBHD-2C 표지/설명 | 역할·문서상 짝 확인 | 타 모델 교차 연결 가능 여부, 판매 SET/개별품 |
| XDM 카드 ↔ CTR100 운용 모드 | D033 p.9 CIS100에는 TX, COS100에는 RX 사용 설명 | 특정 문서 조건 확인 | 카드/CTR100 Revision과 PSE 모델 허용 조합 |
| Product → Optional Dante | D013 p.7,18; D018 p.1 | 모델별 방식과 카드 후보 확인 | 채널·샘플레이트·옵션 부품번호·동시 운용 |
| Product → Required / Included PSU | D041 p.2 구성품 12V 2A, D069 p.1 adapter included | 포함품 문구 확인 | 필수품·기본 제공·별매·대체품 구분 |
| Frame → Module | D069 최대 4개 혼합, D004 최대 6개 | 구조 수준 확인 | 장착 모듈 정확한 모델명·전원 예산 |
| Cable → Optional Accessory | D071 보호캡·모바일 스풀 | 선택품 존재 확인 | 적용 길이·품번·판매 단위 |
| Product → Document / Image | 각 문서의 표지·모델명·사양 절 | 연결 후보 확보 | 전체/일부 적용 범위·Revision·공개 승인 |
| 이전 제품 → 후속 제품 | MAX2/XDM 등 | UNVERIFIED | 제조사 공식 명칭 변경·후속·OEM 관계 설명 |

이 표는 확인할 관계의 의미만 제안한다. Relation enum, 저장 구조, 자동 Compatibility 판단 규칙을 만들지 않는다. 동봉·필수·권장·사용 예시도 같은 관계로 합치지 않는다.

## 8. Documents / Evidence 구조와 검증 의미

### 8.1 자료를 접수할 때 유지할 정보

문서 제목·원래 파일명/경로·유형·언어·본문 Revision·발행일·제공 주체·수령 이력·적용 모델/HW/FW·문서 유효 상태를 검토한다. 파일명 추정 날짜, 파일 속성 날짜, 본문 발행일은 구분한다. 이미지·도면의 제품 대상, 정면/후면/구성도 역할, 공개 가능 범위도 따로 확인한다.

중요한 사양에는 **원문 주장 + 단위/조건 + 문서/페이지/절/표의 위치 + 적용 대상 + 관찰 방법 + 검토 상태**를 연결할 준비가 필요하다. 동일 주장에 여러 출처가 붙을 수 있고, 동일 출처가 여러 모델에 조건부 적용될 수 있다. 이것은 개념 요구이며 데이터 타입이나 필드 정의가 아니다.

### 8.2 구별해야 할 상황

| 상황 | 처리 원칙 | 이번 예 |
|---|---|---|
| 제조사 명의 문서에 값이 있음 | 해당 문서에 기록됨을 표시. 수령본의 최신·최종 승인 여부는 별도 | D013 카드 표, D034 프레임 표 |
| Catalog에만 값이 있음 | Catalog 근거로 한정. 매뉴얼 확인으로 승격하지 않음 | D071 AHOC 외부 전원·길이 정보 |
| 여러 문서에 같은 값 | 각 출처 유지. 복사본/파생 자료는 독립 검증으로 세지 않음 | D004/D070는 완전 동일 파일 |
| 문서끼리 값이 다름 | 두 주장·적용 조건·질문을 함께 남김 | HDS-42MU 치수, VDM 프레임 규격 |
| 문서 내부 값이 다름 | 위치별 주장 보존. 제품 데이터 채택 보류 | D013 p.18 AOD100/DAN08 명칭 |
| 값은 있으나 적용 Model 불명 | Series 전체나 파일명 모델로 전파하지 않음 | D001 SPX-M810 파일과 M24/M2472/M24120 본문 |
| 현재 자료에서 확인 불가 | 미기재/추출 실패/미검토/비해당을 구별 | 이미지형 매뉴얼 미검토 페이지, 현재 SKU/단종 목록 |

### 8.3 근거를 추적하는 예 — 확정 데이터 레코드가 아님

> 관찰: XDM-HIS100 설명에 HDMI 포트 4개와 Audio In/Out 4개가 기재되어 있다.  
> 출처: D013, PDF p.13 / 인쇄 p.12, “XDM-HIS100 – HDMI Input Slot” 표와 설명.  
> 조건: 입력 보드 단위. 섀시 전체 용량이 아님.  
> 검토: 1차 수령 매뉴얼 이미지에서 확인. 현행 카드 Revision·오디오 겸용 방식·호환 Chassis는 공식 확인 대기.

`MANUAL_CONFIRMED` 같은 명칭을 사용하더라도 “매뉴얼에 기록되어 있음”까지만 표현해야 한다. 제조사 확인 없이 최종 `VERIFIED`로 승격하지 않는다. 이번 문서의 상태 용어도 최종 운영 상태 enum이 아니다.

## 9. Current / Legacy 구분 현황

| 상태 | 이번 조사 적용 | 판단 조건 |
|---|---|---|
| CURRENT | 확정 0개 | 제조사가 현재 적용 모델/Revision과 유효성을 확인해야 함 |
| LEGACY | 확정 0개; 보관상 이전자료 후보 11개 | 이전자료 폴더는 단서. 과거 제품/특정 FW에 여전히 유효할 수 있음 |
| SUPERSEDED | 확정 0개 | 무엇이 무엇을 어떤 범위에서 대체하는지 공식 관계가 필요 |
| UNKNOWN | 75개 전부의 현재 유효성 기본값 | 유형·모델·내용 일부를 확인했더라도 최신성은 별개 |

이전자료 경로의 11개는 D014–016, D024, D026–029, D035, D053–054다. 폴더명 외의 공식 대체/폐기 관계는 아직 확인하지 않았다.

제품의 ACTIVE/LEGACY/DISCONTINUED와 문서의 CURRENT/LEGACY/SUPERSEDED를 혼합하지 않는다. 과거 문서에 있는 제품을 단종으로 등록하거나, 최근 파일명 자료를 현재 제품의 정답으로 삼지 않는다. 모든 이전자료는 보존한다.

## 10. Conflict / Unverified 검토 목록

표의 번호는 공식 자료 수령 시 회신과 연결하기 위한 이 문서의 질문 번호다. 충돌과 정상적인 조건 차이, 제품 동일성 미확인을 구별했다.

| 번호 | 유형·우선순위 | 관찰과 위치 | 현재 처리 / 제조사 확인 |
|---|---|---|---|
| C01 | 적용 모델 불명 · 우선 | D001 파일명 SPX-M810, 표지 SPX-M24 series, p.5 소비전력 M2472/M24120 | M810의 무게/치수/전력으로 전파 금지. 매뉴얼 적용 라인업 요청 |
| C02 | 명칭/세대 미확인 · 우선 | D018 HI4N/HI4S/SI4S 등과 D013 p.13–18 HI100/HIS100/SIS100 등 | 별도 모델/이전 명칭/설계 초안 여부 질문. 자동 alias 금지 |
| C03 | 모델 동일성 미확인 · 우선 | D022 XDM-20X, D013의 XDM-20 | 동일품·변형·오탈자 중 어느 것인지 확인 |
| C04 | 문서 내부 명칭 불일치 · 우선 | D013 p.18: 절/사진 XDM-AOD100, 표 제목 XDM-DAN08 | 모델명·Dante 입출력 채널·전용 슬롯 역할 확인 |
| C05 | 라인업 차이 · 우선 | D034 p.20 VDM-256X, D075 p.17–18 VDM-288X | 세대별 라인업/현재 판매 모델 확인. 이름 자동 교체 금지 |
| C06 | 물리 사양 차이 · 우선 | D034 p.14 VDM-32X 435×368×440mm,17.7kg; D075 p.18 483×402×532.6mm,25.6kg | 날개 포함·구성·세대 조건 확인. 단위 환산으로 해소 불가 |
| C07 | EXCLUDED FROM PORTAL · 과거 기록만 보존 | HS-88M-U: D057 p.1의 30Hz/60Hz 차이 | Portal 검증·수집·제조사 확인 질문 대상에서 제거. 원본 보존 |
| C08 | EXCLUDED FROM PORTAL · 과거 기록만 보존 | D050/D057 HS-88M-U와 D075 p.28 HS-88MX | 두 모델 모두 제외. 동일성·후속 관계 검증 불필요, 원본 보존 |
| C09 | 치수 충돌 · 우선 | D049 p.4 HDS-42MU 232(W)×65(D)×30(H); D056 p.1 80(W)×232(D)×30(H); D075 p.35 232(W)×80(D)×30(H) | 깊이 값과 W/D 방향을 각각 확인. 사진 치수 추정 금지 |
| C10 | 조건 차이/전원 미확인 · 우선 | D052 p.5–6 8×8 표제, 출력 10개와 9/10 Quad-view; 표 100–200VAC, 연결단자 DC Power Jack; D058 그림 DC +12V | 출력 역할별로 보존. 전원은 HW 개정·표 오탈자 확인 |
| C11 | 문서 내 신호 방향 불일치 · 우선 | D068 p.1 설명은 CR104-U가 CAT→HDMI 복원, 표 Output Signal은 HDBaseT | 수신기 출력 신호를 제조사에 확인. 설명을 임의 정답 처리하지 않음 |
| C12 | 범위 혼합 · 우선 | D004 p.1 프레임 SPX-R6에 Transmitter/Receiver 각각 3W 및 HDMI/CAT 단자 기재 | 프레임 전체인지 모듈당 사양인지 확인 |
| C13 | 전원/제품명 미확인 | D032 부품명 XDM-POE, 전면 XDM-PSU, D030–031 MAX2 표기 | 상품명·호환 범위·전원 구조·제공 형태 확인 |
| C14 | 적용 정보 오삽입 후보 | D075 p.31 HD-D102U 페이지 상단에 QMS-88UX 치수/무게도 존재 | 페이지 전체를 한 제품 사양으로 가져오지 않음. HD-D102U 명시 구역만 후보 근거 |
| C15 | 기존 미결정의 근거 보강 | D049 p.4,9 및 D056 p.1은 HDS-42MU Matrix 기능/출력 지정; D075 p.39 HD-210U는 2중1 선택→10 동일 출력 설명 | Taxonomy의 과거 REVIEW 항목에 새 근거 확보. 승인 분류/기존 데이터는 이번에 변경하지 않음 |
| C16 | 옵션 의미 일부 확인 | D033 p.4,9 PSE는 Power Sourcing Equipment, 반대쪽 CTR100(PD) 급전 설명 | 의미는 문서에서 확인. 공식 판매명·SET·PSE/PD 양끝 조합/급전 규격은 별도 확인 |
| C17 | 문서 날짜/현재성 미확인 | KV07/251219 등은 파일명 정보, 본문 발행/개정 이력 확인 미완료 | 최신 이름을 근거로 CURRENT/최종 사양 판정하지 않음 |
| C18 | 파생 자료/브랜드 관계 미확인 | PureLink MAX2 D015/D024, 알티컴 MAX2 D014 | 동일 플랫폼이어도 XDM의 개별 사양·호환 근거로 자동 이전 금지 |

이 목록은 대표적으로 확인한 이슈다. 전 문서의 모든 오류를 전수 검출했다는 의미는 아니다. 기존 Portal의 CONFLICTED/NEEDS_REVIEW 항목을 이번 자료 접수만으로 해제하지 않는다.

## 11. Data Coverage Matrix

이 표는 제외 모델을 뺀 제품군을 기준으로 읽는다. 제외 모델의 자료는 확보율·누락·Conflict·검증 대기 집계에 포함하지 않는다. Archive Inventory의 75개 파일 수는 원본 보존 수량이므로 그대로 유지한다.

**AVAILABLE**은 특정 조사 목적에 사용할 자료가 확보됨, **PARTIAL**은 일부 모델·조건만 확보, **MISSING**은 이번 묶음에서 해당 범위 근거를 찾지 못함, **CONFLICTED**는 확인된 불일치, **REVIEW REQUIRED**는 적용 대상·유효성 검토 필요를 뜻한다. 문서 존재가 AVAILABLE이어도 최종 공식 사양 승인은 아니다. 아래 Images는 제품 모습을 보여 주는 자산이며 사양표 이미지와 구별한다.

| Product Family | Identity | Specs | I/O | Images | Documents | Relations | Main Missing Data |
|---|---|---|---|---|---|---|---|
| XDM | REVIEW REQUIRED | PARTIAL | PARTIAL | PARTIAL | AVAILABLE | PARTIAL | 현행 이름/카드 대응, 슬롯·Dante·SKU·HW/FW 적용표 |
| SPX | REVIEW REQUIRED | PARTIAL | PARTIAL | PARTIAL | AVAILABLE | PARTIAL | M810/M24 매뉴얼 적용, 모델별 치수/전원·오디오 포트 차이 |
| VDM | REVIEW REQUIRED | CONFLICTED | PARTIAL | PARTIAL | AVAILABLE | PARTIAL | 256/288 라인업, 치수·무게·세대별 보드/광 인터페이스 |
| Integrated / Small Matrix | REVIEW REQUIRED | CONFLICTED | PARTIAL | PARTIAL | AVAILABLE | PARTIAL | QMS 출력 모드·전원, 현행 개정 |
| Distribution / Switcher | PARTIAL | CONFLICTED | PARTIAL | PARTIAL | AVAILABLE | PARTIAL | HDS-42MU 치수, HD-210U 본문 빈 치수, 전체 모델별 매뉴얼 |
| Extender | PARTIAL | CONFLICTED | PARTIAL | PARTIAL | AVAILABLE | PARTIAL | TX/RX 판매 단위, CR104 방향, 광모듈 적용, 거리·급전 조건 |
| Extender Frame / Module | PARTIAL | REVIEW REQUIRED | PARTIAL | PARTIAL | PARTIAL | PARTIAL | MR-4S/SPX-R6 모듈 실모델·전원 예산·전체 매뉴얼 |
| Cable | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | 현행 길이 품번, 방향·단자·포설 조건, 전체 설치 가이드 |
| XDM 전원 보조장치 | REVIEW REQUIRED | PARTIAL | PARTIAL | PARTIAL | PARTIAL | REVIEW REQUIRED | XDM-POE/PSU/MAX2 관계, 공식 사양서/매뉴얼·정격 |
| HEXA-01 / 기타 | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | REVIEW REQUIRED | 현행 여부·제품군 포함 여부·자료 적용 범위 |

모든 Family에 공통으로 **공식 현재/단종 모델 목록, SKU/판매단위 목록, 제조사 승인 문서 목록, 확정 HW/FW별 호환표는 MISSING**이다. Product Image는 문서 삽입 사진까지 포함하여 PARTIAL이며, 배포 가능한 독립 고해상도 전면/후면 이미지의 완비를 의미하지 않는다. 문서형 PDF 46개 전체의 화면 검증을 마친 상태도 아니다.

## 12. 다음 공식 자료 수령 시 RTCOM에 확인할 질문

**질문·수집 범위:** HS-88M-U, HS-88MX, HD-D104U, HD-D108U는 EXCLUDED FROM PORTAL이며 아래 모델 목록·사양·문서 요청에서도 제외한다. 일괄 수령 문서에 실려 있으면 원본 보존만 한다.

사용자가 말한 “내일”은 다음 공식 자료 수령 시점을 뜻한다. 수령 예정 자료의 내용·최종성을 미리 가정하지 않으며, 이 목록을 실제로 RTCOM에 발송하지 않았다.

### 12.1 먼저 받을 자료 — 제품·문서 기준선

1. 공식 제조사 한글/영문/브랜드 표기는 무엇인가? 알티컴·RTCOM·RTCom·알티정보통신·MAX2/PureLink의 관계와 허용 표시명을 설명해 달라.
2. 현재 판매 Series/Model, 단종·Legacy·후속 모델 목록과 적용 지역/Revision을 제공해 달라. XDM-20/20X, HI4N/HI4S와 HI100/HIS100, VDM-256X/288X의 관계를 명시해 달라.
3. TX/RX는 개별 모델·개별 판매인가, SET 판매인가? PSE와 기본형/PD의 정확한 모델명·옵션·포함품·판매 단위는 무엇인가?
4. SKU/Part Number를 별도로 관리하는가? 케이블 길이·카드·전원·세트별 공식 품번표를 제공할 수 있는가?
5. 각 모델의 최신 Datasheet, Manual, Catalog, Drawing, Command/FW 문서, 제품 이미지와 **현재 사용 가능/대체됨/특정 구형 모델 전용** 목록을 제공해 달라.

### 12.2 Matrix / Video / Audio

6. Chassis별 입력 슬롯·출력 슬롯·공용/예약 슬롯·슬롯당 카드 포트·최대 논리 용량은 무엇인가? 지원 보드/HW/FW별 매트릭스를 요청한다.
7. Redundant PSU의 기본/옵션 여부, 동작 방식과 정격·실제 최대 소비전력, Fan/PSU 수량, Hot Swap 대상(카드/PSU/Fan)과 운용 제약은 무엇인가?
8. HDMI/DisplayPort/SDI 버전, 지원 Resolution·Frame Rate·Chroma·Bit Depth·HDR·Bandwidth·HDCP를 **카드/입출력/모드별 조합**으로 제공할 수 있는가?
9. EDID의 저장/복사/사용자 설정, Scaling/Seamless/Fast Switching의 의미와 지연, Video Wall/Multiview/Quadview의 포트·해상도·동시 운용 제한은 무엇인가?
10. Genlock은 어떤 Model/Card에서 어느 단자를 통해 어떤 기준 신호를 지원하는가?
11. Analog Audio 추출/병합/임베디드 지원 방향과 단자 공유 방식은 무엇인가? Dante 적용 모델·옵션 카드·입출력 채널 수·Sample Rate·동시 처리 조건은 무엇인가?
12. D013 p.18의 AOD100/DAN08 중 정확한 명칭은 무엇인가? D018의 2CH Dante 및 XDM-36 32×32 제한 문구가 현재도 유효한가?
13. SPX-M810 파일명의 매뉴얼은 실제로 어느 모델에 적용되는가? QMS-88UX의 출력 1–8과 9–10 역할, 전원 입력과 HW 개정 차이를 확정해 달라.

### 12.3 Extender / Cable / Physical

14. TX/RX/Transceiver 역할과 대응 모델은 무엇인가? CAT/광 매체, HDBaseT 버전, 케이블 등급별 최대 거리·해상도·크로마 조합을 제공해 달라.
15. Fiber의 Single/Multi Mode, 코어 수·커넥터·파장·광모듈 품번과 허용 조합은 무엇인가? D062–065 사양표는 어떤 완제품/HW에 해당하는가?
16. PoE/PSE/PD/PoC/PoH 용어의 정확한 의미·급전 표준·정격·방향·동시 외부 전원 허용 조건은 무엇인가? XDM-CTR100 PSE/PD 조합과 MR-4S/SPX-R6/XDM-PSU 전원 예산을 제공해 달라.
17. Cable A/B 단자·방향성·Active/Passive·길이별 품번/성능·외부 전원·CEC/EDID/HDCP·플래넘·굽힘/인장·보호캡/스풀 조건은 무엇인가?
18. Dimensions는 W×D×H 중 어느 순서이며 날개/돌출부 포함인가? Weight는 섀시만/카드·PSU 포함/포장 중 어느 조건인가? Rack Unit, Power Input/Consumption, Operating Temperature/Humidity를 모델별로 제공해 달라.

### 12.4 충돌 확인과 문서 운영

19. C01–C18 중 제외 이력 C07·C08을 뺀 활성 항목에 대해 “정정값”뿐 아니라 **적용 Model/HW/FW, 근거 파일/페이지, 정정 또는 대체 대상 문서**를 회신해 달라. 다른 조건의 두 값이 모두 유효하면 그 조건을 알려 달라.
20. 1차 ZIP의 `이전자료`와 `참고용` 중 계속 보관·공개할 자료, 현재 사용을 중단할 자료를 지정해 달라. 삭제 대신 이력 보존을 전제로 한다.
21. 사진·도면·카탈로그의 Portal 공개/다운로드 허용 범위와 내부용 문서를 구분해 달라. 모델별 전면/후면/대표 이미지, 치수 도면, 설치 가이드의 원본 제공을 요청한다.
22. Command 문서의 적용 FW 버전, 변경 이력, 현재 매뉴얼과 별도 명령서 중 영역별 기준을 알려 달라. 이번 요청은 Portal API 설계나 장비 제어 구현이 아니다.

## 13. 공식 자료 수령 후 검증 절차와 남은 결정

| 순서 | 작업 | 다음 단계로 넘어갈 판단 기준 |
|---|---|---|
| 1 | 이번 ZIP·Inventory·Skeleton을 기준선으로 보존 | 원본/수령일/제공 주체 구별. 파일 변경 없음 |
| 2 | 새 공식 자료 Inventory 작성·기존 목록 비교 | 신규/동일/개정/누락 구분. 같은 이름의 다른 파일도 식별 |
| 3 | 문서 최신성·공식 적용 범위 확인 | 문서 Revision·발행일·Model/HW/FW와 제조사 확인 연결 |
| 4 | Series/Model/Module/TX-RX/판매단위 대조 | C01–05/C13/C18 등 명칭 관계 해결 또는 보류 명시 |
| 5 | 중요 Specification와 I/O를 근거별 대조 | 포트/용량·모드·단위·조건 구분. PDF 표/그림 원문 확인 |
| 6 | Conflict 목록 갱신·제조사 회신 반영 | 임의 자동 선택 없이, 양쪽 주장 및 채택/보류 이유 보존 |
| 7 | Current/Legacy/Superseded 문서 구분 | 문서의 대체 관계와 적용 범위가 확인됨. 원본 삭제 없음 |
| 8 | Category별 Specification Group 검토 | 공통 영역·제품군 영역·Evidence의 경계 승인. 무관한 영역 강제 없음 |
| 9 | 최종 Schema 작성 여부 사용자 검토 | 남은 결정·미해결 범위 공개 후 다음 작업 요청을 받음 |
| 10 | 승인된 후속 작업에서 Product Data Schema 작성 | 이번 단계에서 실행하지 않음. 데이터 입력·Migration은 별도 범위 |

### 13.1 최종 Schema 전에 남은 Decision

- Series/Model/Module/Bundle/Variant의 표현 수준과 공식 이름·판매 단위를 어떻게 구별할지.
- 공통 Core, Capability, Category Profile 사이에 반복되는 개념을 어느 영역에서 책임질지.
- 영상 Format·Transport Distance·Power 조건과 복수 동작 모드를 어떻게 의미상 묶을지.
- Physical Port / Shared Port Group / Logical Capacity / Slot의 구분과 적용 단위.
- 제품 상태·문서 상태·근거 종류·검증 상태를 어떻게 분리하고, 사용자 화면에서 어떤 수준까지 보여 줄지.
- 동일 값의 복수 근거·파생 문서·내부 충돌·개정 이력을 어떻게 추적할지.
- 제품 관계의 존재와 제조사가 보증한 적용 조건을 어떻게 구별할지.
- 필수 자료 5종의 충족 여부와 공개 준비 상태의 표시·검토 절차를 구체화할 것. 자료 미확보 제품의 정식 공개는 보류하며, 기술 사양의 미확인 표시와 별도로 관리한다.
- 현행 자료 수령 후에도 해소되지 않은 이슈를 보류한 채 다음 설계를 진행할 수 있는 범위.

**현재 결과는 준비 문서 한 개다.** Skeleton을 수정하거나 최종 Schema로 승격하지 않았다. `PRODUCT_DATA_SCHEMA.md`를 작성하지 않았으며, 기존 Portal·Configurator·31개 제품 데이터 및 외부 도구를 변경하지 않았다. 아래 Inventory를 포함한 본 문서의 사용자 검토를 요청하고 여기서 작업을 멈춘다.

## 부록 A. 개별 파일 Inventory

아래에 ZIP 내부의 전체 75개 파일을 순서대로 기록한다. `F:`는 **파일명에만 나타난 Version/Date 단서**이며 본문 발행 정보로 확정한 것이 아니다. `미확인`은 해당 항목이 존재하지 않는다는 뜻이 아니다. 언어는 확인한 본문/이미지 기준이며 숫자 중심 이미지의 원문 언어는 별도로 유보할 수 있다. 문서 유효 상태는 전부 UNKNOWN이고, 이전자료 경로는 LEGACY 검토 후보로만 표시한다.

| 자료 번호 | File Name — ZIP 상대 경로 | Document Type | 관련 Series / Model | Version / Revision | Date | Language | Current / Legacy / Unknown | Notes |
|---|---|---|---|---|---|---|---|---|
| D001 | `01_SPX/메뉴얼/SPX-M810 User Manual_프로토콜.pdf` | User Manual + Command (42p) | SPX / SPX-M24 표지, M810 파일명 | 미확인 | 미확인 | KO/EN | UNKNOWN | 표지·p.5 사양과 제어 본문 확인; 적용 모델 불명(C01) |
| D002 | `01_SPX/메뉴얼/사본(1) - SPX-M810 User Manual_프로토콜.pdf` | User Manual + Command (42p) | SPX / D001과 동일 | 미확인 | 미확인 | KO/EN | UNKNOWN | D001과 바이트 동일, 독립 검증 근거 아님 |
| D003 | `01_SPX/사양서/알티컴 SPX사양서.pdf` | Specification / 참고 자료 (5p) | SPX / M810,M1620,M3236,M2472,M24120 및 카드 | 미확인 | 미확인 | KO/EN | UNKNOWN | 5p 이미지형; p.1–5 육안 확인. 세부 사이즈 추후 업데이트 문구 |
| D004 | `01_SPX/사양서/알티컴-SPX-R6.pdf` | Catalog / Specification (1p) | SPX / SPX-R6, SPX-Extender | 미확인 | 미확인 | KO/EN | UNKNOWN | 1p; 6모듈·전원·거리. 프레임/모듈 사양 범위 확인 필요 |
| D005 | `01_SPX/사진/SPX-3236(F2).png` | Product Image (PNG) | SPX / 전면 SPX-M3236 표기 | 미확인 | 미확인 | 제품 영문 표기 | UNKNOWN | 전면 사진. 파일명은 SPX-3236; 공식 명칭 대조 필요 |
| D006 | `01_SPX/사진/SPX-3236(R1).png` | Product Image (PNG) | SPX / M3236 후보(파일명) | 미확인 | 미확인 | 제품 영문 표기 | UNKNOWN | 후면 장착 구성 이미지; 모델 적용은 파일명 단서 |
| D007 | `01_SPX/사진/SPX-3236(R2).png` | Product Image (PNG) | SPX / M3236 후보(파일명) | 미확인 | 미확인 | 제품 영문 표기 | UNKNOWN | 후면 장착 구성 이미지; D006과 카드 배치 다름 |
| D008 | `01_SPX/사진/SPX-3236(R3).png` | Product Image (PNG) | SPX / M3236 후보(파일명) | 미확인 | 미확인 | 제품 영문 표기 | UNKNOWN | 후면 장착 구성 이미지; 배치로 호환·기본 포함품 추정 금지 |
| D009 | `01_SPX/사진/SPX-M1620.png` | Product Image (PNG) | SPX / M1620 후보(파일명) | 미확인 | 미확인 | 제품 영문 표기 | UNKNOWN | 전면 이미지 확인, 정확한 라벨 정밀 판독 별도 |
| D010 | `01_SPX/사진/SPX-M810 전면.png` | Product Image (PNG) | SPX / M810 | 미확인 | 미확인 | 제품 영문 표기 | UNKNOWN | 전면 및 모델 표기 확인 |
| D011 | `01_SPX/사진/SPX-M810 후면.png` | Product Image (PNG) | SPX / M810 후보(파일명) | 미확인 | 미확인 | 제품 영문 표기 | UNKNOWN | 후면 단자 이미지 확인; 포트별 사양 정밀 판독 별도 |
| D012 | `01_SPX/카달로그/SPX 시리즈 카탈로그_(KOR).pdf` | Product Catalog (6p) | SPX / 5개 섀시·HI8,CO12,HO10,HO12,RX | 미확인 | 미확인 | KO/EN | UNKNOWN | 6p 이미지형; p.1–6 육안 확인. D003과 오디오 포트 수 대조 필요 |
| D013 | `02_XDM/메뉴얼/RTCom_Manual_XDM_KV03_20250630.pdf` | User Manual + Installation + Command (107p) | XDM / 12,20,36,72,144,216·입출력 카드 | F: KV03 | F: 20250630 | KO/EN | UNKNOWN | 107p; 텍스트 추출 제한. 목차·p.3–18 육안, p.7/13/18 확대 확인 |
| D014 | `02_XDM/메뉴얼/이전자료/MAX2 메뉴얼 개발팀 리뷰. Ver.2.1 20240604.docx` | User Manual / 내부 리뷰본 후보 (DOCX) | MAX2 / Series·보드 | F: Ver.2.1 | F: 20240604 | KO/EN | UNKNOWN; 이전자료 폴더(LEGACY 후보) | DOCX 본문 확인; XDM과 동일 사양으로 취급 금지 |
| D015 | `02_XDM/메뉴얼/이전자료/PureLink - MAX2 4K60 Cross Platform Matrix Router - User Manual V2.0 (1).pdf` | User Manual (87p) | PureLink / MAX2 4K60 Cross Platform Matrix Router | F: V2.0 | 미확인 | EN | UNKNOWN; 이전자료 폴더(LEGACY 후보) | 87p; 표지 제조사 PureLink. RTCOM XDM 적용 관계 미확인 |
| D016 | `02_XDM/메뉴얼/이전자료/RTCom_Manual_XDM_KV02_20250205.pdf` | User Manual (46p) | XDM / Series | F: KV02 | F: 20250205 | KO/EN | UNKNOWN; 이전자료 폴더(LEGACY 후보) | 46p; 표지·목차/부분 텍스트 확인, 전 사양 화면 대조 미완료 |
| D017 | `02_XDM/사양서/신규 XDM 매트릭스 사양(2023.10).docx` | Specification (DOCX) | XDM / 12,20,36,72,144 및 HI4N/HI4S 등 | 미확인 | F: 2023.10 | KO/EN | UNKNOWN | DOCX 본문 확인; D018과 같은 주제, 구명칭·Dante 조건 |
| D018 | `02_XDM/사양서/신규 XDM 매트릭스 사양(2023.10).pdf` | Specification (4p) | XDM / D017과 같은 제품군 | 미확인 | F: 2023.10 | KO/EN | UNKNOWN | 4p; 본체·입력·출력 사양 본문 확인. 명칭 세대 미확정 |
| D019 | `02_XDM/사진/XDM-12.png` | Product Image (PNG) | XDM / XDM-12 | 미확인 | 미확인 | 제품 영문 표기 | UNKNOWN | 전면 제품 이미지 확인 |
| D020 | `02_XDM/사진/XDM-36.png` | Product Image (PNG) | XDM / XDM-36 | 미확인 | 미확인 | 제품 영문 표기 | UNKNOWN | 사선 전면·측면 제품 이미지 확인 |
| D021 | `02_XDM/카달로그/RTcom_catalogue_XDM-12 (국문)KV.1.0.pdf` | Product Catalog (2p) | XDM / XDM-12 | F: KV.1.0 | 미확인 | KO/EN | UNKNOWN | 2p; 본문 확인, 줄별 글자 추출 형태로 정밀 표 대조 필요 |
| D022 | `02_XDM/카달로그/RTcom_catalogue_XDM-20X (국문)KV.1.0_참고용.pdf` | Product Catalog / 참고용 (4p) | XDM / XDM-20X | F: KV.1.0 | 미확인 | KO/EN | UNKNOWN | 4p; 본문 제목 20X. 20과 동일성 미확인 |
| D023 | `02_XDM/카달로그/RTcom_catalogue_XDM-36 (국문)KV.1.0_참고용.pdf` | Product Catalog / 참고용 (4p) | XDM / XDM-36 | F: KV.1.0 | 미확인 | KO/EN | UNKNOWN | 4p; 본문 확인, 참고용 표시 보존 |
| D024 | `02_XDM/카달로그/이전자료/MAX2 Catalog 2024 (1).pdf` | Product Catalog (17p) | PureLink / MAX2 | 미확인 | F: 2024 | EN | UNKNOWN; 이전자료 폴더(LEGACY 후보) | 17p; PureLink 표기. XDM에 사양 이전 금지 |
| D025 | `02_XDM/커맨드/XDM_COMMAND_V1.8.pdf` | Command / Protocol (12p) | XDM 후보(파일명) / 적용 모델·FW 미확인 | F: V1.8 | 미확인 | EN/일부 KO | UNKNOWN | 12p; Switching/설정 명령 본문. Revision별 FW 적용 필요 |
| D026 | `02_XDM/커맨드/이전자료/XDM_COMMAND_V1.3.docx` | Command / Protocol (DOCX) | XDM 후보(파일명) / 적용 모델·FW 미확인 | F: V1.3 | 미확인 | EN/일부 KO | UNKNOWN; 이전자료 폴더(LEGACY 후보) | DOCX 명령 본문 확인, 이전자료 |
| D027 | `02_XDM/커맨드/이전자료/XDM_COMMAND_V1.5.docx` | Command / Protocol (DOCX) | XDM 후보(파일명) / 적용 모델·FW 미확인 | F: V1.5 | 미확인 | EN/일부 KO | UNKNOWN; 이전자료 폴더(LEGACY 후보) | DOCX 명령 본문 확인, 이전자료 |
| D028 | `02_XDM/커맨드/이전자료/XDM_COMMAND_V1.6.docx` | Command / Protocol (DOCX) | XDM 후보(파일명) / 적용 모델·FW 미확인 | F: V1.6 | 미확인 | EN/일부 KO | UNKNOWN; 이전자료 폴더(LEGACY 후보) | DOCX 명령 본문 확인, 이전자료 |
| D029 | `02_XDM/커맨드/이전자료/XDM_WALL 중첩 COMMAND-V1.00 (1) (1).docx` | Command / Protocol (DOCX) | XDM 후보(파일명) / Output Quad Wall | F: V1.00 | 미확인 | EN | UNKNOWN; 이전자료 폴더(LEGACY 후보) | DOCX의 Wall 모드 명령 확인; 적용 카드·FW 미확인 |
| D030 | `03_XDM_분배기 외/POE RACK/사진/HDBT PoE 슬롯.jpg` | Drawing / 구성·사진 조합 (JPG) | MAX2 POH/COS 등 / XDM 적용 미확인 | 미확인 | 미확인 | KO/EN | UNKNOWN | 전원 구성 도식·모듈 사진이며 일반 대표 이미지 아님 |
| D031 | `03_XDM_분배기 외/POE RACK/사진/XDM POE구성.png` | Drawing / 구성 이미지 (PNG) | MAX2 전원 랙/Extender 표기 / XDM 적용 미확인 | 미확인 | 미확인 | KO/EN | UNKNOWN | 그림 MAX2 표기, 파일명 XDM. 적용 관계 검토 필요 |
| D032 | `03_XDM_분배기 외/POE RACK/사진/XDM-POE(2U)_030_ASSY.pdf` | Drawing / Assembly (1p) | XDM-POE / 전면 XDM-PSU | 도면번호 말미 V10 (문서 Revision 동일성 미확인) | 본문: 2024.07.23 | KO/EN | UNKNOWN | 1p; 도면 부품명·도면번호 ALT-XDM POE-000_V10 및 2024.07.23 확인 |
| D033 | `03_XDM_분배기 외/전송기/메뉴얼/XDM-CTR100 사용설명서(한글) Ver.1.4 (1).pdf` | User Manual + Installation (11p) | XDM / XDM-CTR100, CTR100-PSE | F: Ver.1.4 | 미확인 | KO/EN | UNKNOWN | 11p; p.3–10 육안 확인. PSE/PD 및 카드별 TX/RX 운용 설명 |
| D034 | `04_VDM/메뉴얼/RTCom_Manual_VDM_KV07_251219.pdf` | User Manual + Installation + Command (103p) | VDM / 8X~256X·입출력 보드 | F: KV07 | F: 251219 | KO/EN | UNKNOWN | 103p 텍스트; 프레임·카드·제어 절. 카탈로그 288X/치수 차이 |
| D035 | `04_VDM/메뉴얼/이전자료/RTCom_Manual_VDM_KV05 2.pdf` | User Manual + Installation + Command (99p) | VDM / Series·입출력 보드 | F: KV05 | 미확인 | KO/EN | UNKNOWN; 이전자료 폴더(LEGACY 후보) | 99p 텍스트; 이전자료. KV07과 전 항목 개정 비교 미완료 |
| D036 | `04_VDM/사진/VDM-48X.jpg` | Product Image (JPG) | VDM / 48X 후보(파일명) | 미확인 | 미확인 | 제품 영문 표기 | UNKNOWN | 전면 섀시 이미지. 카드 장착·후면 정보는 아님 |
| D037 | `05_기타제품/기타/메뉴얼/(KOR)User Manual_HEXA-01_Rev.02.pdf` | User Manual (8p) | Series 미확인 / HEXA-01 | F: Rev.02 | 미확인 | KO/EN | UNKNOWN | 8p; HDMI audio extractor/down-mixing. 현행 여부 미확인 |
| D038 | `05_기타제품/분배기/메뉴얼/HD-13U 사용설명서(한글) Ver.1.2.pdf` | User Manual (11p) | Series 미확인 / HD-13U | F: Ver.1.2 | 미확인 | KO/EN | UNKNOWN | 11p; 표지 육안. 본문 추출 희박, 세부 표 검증 미완료 |
| D039 | `05_기타제품/분배기/메뉴얼/HD-13U-Manual V100- (1).pdf` | User Manual / 간이 운용 설명 (2p) | HD-13 본문 / HD-13U 파일명 | 본문: V1.00 | 미확인 | KO/EN | UNKNOWN | 2p; EDID·오디오·FW 모드. 모델명 차이 확인 필요 |
| D040 | `05_기타제품/분배기/메뉴얼/HD-210U 사용설명서(한글) Ver.1.0.docx` | User Manual (DOCX) | Series 미확인 / HD-210U | F: Ver.1.0 | 미확인 | KO/EN | UNKNOWN | DOCX 본문; D041 대응 후보, 값 차이 전수 비교 미완료 |
| D041 | `05_기타제품/분배기/메뉴얼/HD-210U 사용설명서(한글) Ver.1.0.pdf` | User Manual (11p) | Series 미확인 / HD-210U | F: Ver.1.0 | 미확인 | KO/EN | UNKNOWN | 11p; 구성품·I/O·운용 확인. p.4 크기/무게 칸 비어 있음 |
| D042 | `05_기타제품/분배기/사진/HD-210U/HD-210U_01.jpg` | Product Image / 현장 사진 (JPG) | HD-210U 후보(경로) | 미확인 | 미확인 | 제품 영문 표기 | UNKNOWN | 후면 단자 사진; 배경 포함, 게시 적합성 별도 |
| D043 | `05_기타제품/분배기/사진/HD-210U/HD-210U_02.jpg` | Product Image / 현장 사진 (JPG) | HD-210U | 미확인 | 미확인 | 제품 영문 표기 | UNKNOWN | 전면 모델·버튼 사진, 배경 포함 |
| D044 | `05_기타제품/분배기/사진/HD-210U/HD-210U_FRONT.png` | Product Image (PNG) | HD-210U | 미확인 | 미확인 | 제품 영문 표기 | UNKNOWN | 전면 제품 컷 확인 |
| D045 | `05_기타제품/분배기/사진/HD-210U/HD-210U_REAR.png` | Product Image (PNG) | HD-210U 후보(경로) | 미확인 | 미확인 | 제품 영문 표기 | UNKNOWN | 후면 단자 제품 컷 확인 |
| D046 | `05_기타제품/분배기/카달로그/RTcom_Catalogue_HD-D102U (국문)KV.1.0.pdf` | Product Catalog / Specification (1p) | Series 미확인 / HD-D102U | F: KV.1.0 | 미확인 | KO/EN | UNKNOWN | 1p 제품 설명·사양. 종합 카탈로그와 적용 범위 대조 필요 |
| D047 | `05_기타제품/분배기/카달로그/알티컴-HDMI분배기.pdf` | Product Catalog / Specification (4p) | HD-13U,HD-104U,HD-108U,HD-210U | 미확인 | 미확인 | KO/EN | UNKNOWN | 4p 분배기 자료. 각각 제품명 표시 구역에 근거 연결 |
| D048 | `05_기타제품/소형매트릭스/메뉴얼/HDS-21U 사용설명서한글Ver.1.0.pdf` | User Manual + Command (12p) | Series 미확인 / HDS-21U | F: Ver.1.0 | 미확인 | KO/EN | UNKNOWN | 12p; 2→1 선택·EDID·오디오·제어 |
| D049 | `05_기타제품/소형매트릭스/메뉴얼/HDS-42MU 사용설명서(한글)Ver.1.0.pdf` | User Manual + Command (12p) | Series 미확인 / HDS-42MU | F: Ver.1.0 | 미확인 | KO/EN | UNKNOWN | 12p; p.4,9 경로 선택 근거. 치수 차이(C09) |
| D050 | `05_기타제품/소형매트릭스/메뉴얼/RTCom_Manual_HS-88M-U_KV03.pdf` | User Manual + Command (15p) | Series 미확인 / HS-88M-U | F: KV03 | 미확인 | KO/EN | UNKNOWN | 15p; HDMI1.4 8×8, HS-88MX와 별도 식별  **EXCLUDED FROM PORTAL — 증빙 전용, 제품 등록·검증·수집 제외.** |
| D051 | `05_기타제품/소형매트릭스/메뉴얼/RTcom_Manual_QMS-44UX_KV.03.pdf` | User Manual + Installation/Control (39p) | QMS / QMS-44UX | F: KV.03 | 미확인 | KO/EN | UNKNOWN | 39p; 표지·p.2–6 화면 확인, 나머지 추출 제한 |
| D052 | `05_기타제품/소형매트릭스/메뉴얼/RTcom_Manual_QMS-88UX_KV.04.pdf` | User Manual + Installation/Control (54p) | QMS / QMS-88UX | F: KV.04 | 미확인 | KO/EN | UNKNOWN | 54p; p.2–6 화면 확인. 10출력/모드 및 전원 적용 확인 |
| D053 | `05_기타제품/소형매트릭스/메뉴얼/이전자료/RTcom_Manual_QMS-44UX_KV.01.pdf` | User Manual (21p) | QMS / QMS-44UX | F: KV.01 | 미확인 | KO/EN | UNKNOWN; 이전자료 폴더(LEGACY 후보) | 21p; 이전자료, 12V5A 구성품 등 본문 확보 |
| D054 | `05_기타제품/소형매트릭스/메뉴얼/이전자료/RTcom_Manual_QMS-88UX_KV.03_압축본.pdf` | User Manual (54p) | QMS / QMS-88UX | F: KV.03 | 미확인 | KO/EN | UNKNOWN; 이전자료 폴더(LEGACY 후보) | 54p; 이전자료, 텍스트 제한. KV04와 모든 이미지 차이 미검증 |
| D055 | `05_기타제품/소형매트릭스/카달로그/RTcom_Catalogue_HDS-21U (국문)KV.1.0.pdf` | Product Catalog / Specification (1p) | Series 미확인 / HDS-21U | F: KV.1.0 | 미확인 | KO/EN | UNKNOWN | 1p; Switcher 설명·단자·전원 |
| D056 | `05_기타제품/소형매트릭스/카달로그/RTcom_Catalogue_HDS-42MU (국문)KV.1.0.pdf` | Product Catalog / Specification (1p) | Series 미확인 / HDS-42MU | F: KV.1.0 | 미확인 | KO/EN | UNKNOWN | 1p; Matrix 기능 설명과 Distributor 표제 혼재, 치수 비교 필요 |
| D057 | `05_기타제품/소형매트릭스/카달로그/RTcom_catalogue_HS-88M-U (국문)KV.1.0.pdf` | Product Catalog / Specification (1p) | Series 미확인 / HS-88M-U | F: KV.1.0 | 미확인 | KO/EN | UNKNOWN | 1p 화면 확인; 30Hz/60Hz 문서 내부 차이  **EXCLUDED FROM PORTAL — 증빙 전용, 제품 등록·검증·수집 제외.** |
| D058 | `05_기타제품/소형매트릭스/카달로그/RTcom_catalogue_QMS-88UX (국문)KV.1.0.pdf` | Product Catalog / Specification (1p) | QMS / QMS-88UX | F: KV.1.0 | 미확인 | KO/EN | UNKNOWN | 1p; 8×8 설명과 출력9/10 모드, DC 그림. 매뉴얼과 대조 필요 |
| D059 | `05_기타제품/전송기/메뉴얼/OBHD-2C 사용설명서(한글) Ver.2.1.pdf` | User Manual (12p) | Series 미확인 / OBHD-2C | F: Ver.2.1 | 미확인 | KO/EN | UNKNOWN | 12p; 표지 TX/RX·2LC 명시, 세부 본문 추출 제한 |
| D060 | `05_기타제품/전송기/메뉴얼/XDM-CTR100 사용설명서한글 Ver.1.3.pdf` | User Manual (11p) | XDM / XDM-CTR100 | F: Ver.1.3 | 미확인 | KO/EN | UNKNOWN | 11p; 표지/역할 및 부분 텍스트, D033과 전 개정 차이 미검증 |
| D061 | `05_기타제품/전송기/사양서/광모듈스펙.pptx` | Presentation / 광모듈 사양 (2 slides) | FT101-U,FR101-U,OBHD-2C-TX/RX | 미확인 | 미확인 | KO/EN | UNKNOWN | 2슬라이드 제목 확인. 표 이미지의 상세 수치·적용 모듈 미검증 |
| D062 | `05_기타제품/전송기/사진/FR101-U.png` | Specification image (PNG) | FR101-U 후보(파일명) / 광모듈 | 미확인 | 미확인 | EN | UNKNOWN | 사진 폴더의 전기·광 특성 표. 제품 모습 이미지 아님 |
| D063 | `05_기타제품/전송기/사진/FT101-U.png` | Specification image (PNG) | FT101-U 후보(파일명) / 광모듈 | 미확인 | 미확인 | EN | UNKNOWN | 전기·광 특성 표. 적용 완제품/HW·표 발행 주체 확인 필요 |
| D064 | `05_기타제품/전송기/사진/OBHD-2C-RX.png` | Specification image (PNG) | OBHD-2C-RX 후보(파일명) / 광모듈 | 미확인 | 미확인 | EN | UNKNOWN | RX 광·전기 특성 표. 표 안 완제품명 검증 미완료 |
| D065 | `05_기타제품/전송기/사진/OBHD-2C-TX.png` | Specification image (PNG) | OBHD-2C-TX 후보(파일명) / 광모듈 | 미확인 | 미확인 | EN | UNKNOWN | TX 광·전기 특성 표. 원본 Datasheet 요청 |
| D066 | `05_기타제품/전송기/카달로그/RTcom_Catalogue_CT101-U_CR101-U (국문)KV.1.0.pdf` | Product Catalog / Specification (1p) | VDM 표기 / CT101-U,CR101-U | F: KV.1.0 | 미확인 | KO/EN | UNKNOWN | 1p; TX/RX 방향·HDBaseT·거리·포맷 본문 |
| D067 | `05_기타제품/전송기/카달로그/RTcom_Catalogue_CT103-U_CR103-U (국문)KV.1.0.pdf` | Product Catalog / Specification (1p) | VDM 표기 / CT103-U,CR103-U | F: KV.1.0 | 미확인 | KO/EN | UNKNOWN | 1p; 벽부형 송수신·스케일링. CT103-U-H와 같은 모델인지 미확인 |
| D068 | `05_기타제품/전송기/카달로그/RTcom_Catalogue_CT104-U_CR104-U (국문)KV.1.0.pdf` | Product Catalog / Specification (1p) | Series 미확인 / CT104-U,CR104-U | F: KV.1.0 | 미확인 | KO/EN | UNKNOWN | 1p; 거리별 조건·CR104 출력신호 충돌(C11) |
| D069 | `05_기타제품/전송기/카달로그/알티컴-MR4S.pdf` | Product Catalog / Specification (1p) | Series 미확인 / MR-4S | 미확인 | 미확인 | KO/EN | UNKNOWN | 1p; 혼합4모듈·공유전원. 상세 모듈 모델 미기재 |
| D070 | `05_기타제품/전송기/카달로그/알티컴-SPX-R6.pdf` | Product Catalog / Specification (1p) | SPX / SPX-R6 | 미확인 | 미확인 | KO/EN | UNKNOWN | D004와 바이트 동일. 다른 폴더에 중복 보관 |
| D071 | `06_케이블/카달로그/RTcom_AHOC_KV0.1.pdf` | Product Catalog / Specification (1p) | AHOC / AHOC-100 표기 | F: KV0.1 | 미확인 | KO/EN | UNKNOWN | 1p; AOC·100m·외부전원 불필요·설치 옵션 |
| D072 | `06_케이블/카달로그/락킹_RTcom_UMC_Kor_02.pdf` | Product Catalog / 설치 설명 (2p) | UMC / 길이별 모델 목록 | 미확인 | 미확인 | KO/EN | UNKNOWN | 2p; 알티정보통신·HDMI1.4·잠금 설명. 현행 여부 미확인 |
| D073 | `06_케이블/카달로그/일반형_RTcom_HOC UX Cables.pdf` | Product Catalog / Specification (1p) | HOC UX / 개별 길이 모델 미확인 | 미확인 | 미확인 | KO/EN | UNKNOWN | 1p; AOC·외부 전원 불필요·최대100m. HOC-UX 공식 표기 확인 |
| D074 | `07_기타자료/VDM,UXM시리즈 매트릭스 오디오 추출병합 구성도 20190704.pptx` | Presentation / 구성도 (5 slides) | VDM,UXM / 개별 모델 미확인 | 미확인 | F: 20190704 | KO/EN | UNKNOWN | 5슬라이드; 오디오 추출/병합 비교, 모델별 적용은 별도 |
| D075 | `RTcom_catalogue (국문)KV.1.0.pdf` | Product Catalog / 종합 (48p) | XDM,SPX,VDM·Matrix/분배/Extender/Cable | F: KV.1.0 | 미확인 | KO/EN | UNKNOWN | 48p; 원본 Library 31항목과 대응, 현재 Portal 대상 28개. p.28 HS-88MX, p.32 HD-D104U, p.33 HD-D108U는 EXCLUDED FROM PORTAL이며 증빙만 보존. 페이지 내 다른 모델 문구 혼입 주의 |

### Inventory 해석 시 주의

- 파일명 Version/Date는 원문 본문에 발행일·Revision이 확인되기 전까지 별도 단서로만 사용한다. ZIP 수정 시간은 문서 발행일로 사용하지 않았다.
- Series 미확인은 제품을 임의의 Series로 묶지 않았다는 의미다. Library의 역할 Category와 제조사의 Series를 혼동하지 않는다.
- 독립 파일의 범위를 전부 목록화했지만, 문서 삽입 이미지·도면을 각각 별도 파일로 세지 않았다. 같은 파일의 복사본도 원본 경로 보존을 위해 별도 행으로 남겼다.
- 자료의 지시문·명령문은 제품 설명을 이해하기 위한 내용으로만 읽었다. 장비 제어·설치·펌웨어 변경이나 문서의 개발 계획 실행은 하지 않았다.

## 추가 준비 요구 — 제품별 정식 공개 자료 점검

기존 Family 단위 Coverage Matrix의 Images / Documents는 5종 필수 자료 확보 완료를 뜻하지 않는다. 1차 ZIP Inventory 75개와 기존 관찰은 보존하며, 이번 요구 반영만으로 어떤 제품도 공개 준비 완료로 승격하지 않는다. 실제 URL·원본 해상도·공식성·전후면 일치 여부의 전수 확인은 이번 문서 수정에서 수행하지 않았다.

| 점검 영역 | 제품별로 확인할 내용 | 부족할 때 처리 |
|---|---|---|
| 공식 제품 페이지 | 해당 모델의 제조사 공식 URL, 연결 유효성, Series 공통 페이지라면 해당 모델의 명시적 적용 여부 | RTCOM은 미수령과 제조사 확인에 따른 전용 페이지 부재를 구분; 후자는 공식 사이트/Series URL과 부재 근거로 관리 |
| 공식 Datasheet / Specification | 공식 제공 근거, 모델·Revision 적용, 원본 문서와 Source URL/제공 경로 | 카탈로그 존재만으로 자동 충족 처리하지 않음 |
| 공식 User Manual | 공식 제공 근거, 모델·HW/FW 적용, 언어·Revision·출처 | 설치 도식·사양표를 매뉴얼 대체로 간주하지 않음 |
| Front Image | 실제 대상 모델 전면, 원본 픽셀 크기, Source URL·제공 주체, 고해상도 적합성 | 전면 또는 고해상도 원본 누락을 REQUIRED / MISSING으로 유지 |
| Rear Image | 실제 대상 모델 후면, 원본 픽셀 크기, Source URL·제공 주체, 고해상도 적합성 | 제조사 미제공도 자동 면제하지 않고 REQUIRED / MISSING 유지 |
| Publication readiness | 위 5종의 확보·출처·적용 모델·이미지 적합성 검토 결과 | 자료 준비와 정식 공개를 구분, 미충족은 공개 준비 미완료 |

제조사가 직접 전달한 파일은 제공자·수령 경로·날짜·원본을 보존한다. 공개 Source URL이 없으면 임의 URL을 만들지 않고 URL 미확보 사유와 직접 제공 증빙을 남긴다. 제조사 직접 제공이 확인되면 Source URL 없이도 공식 출처로 인정할 수 있다. 자료 자체의 적용 모델·Revision·이미지 품질과 나머지 공개 요건은 별도로 검토한다. 원본과 화면 표시용 축소본을 구분하고, 축소본의 해상도로 원본을 판정하지 않는다.

### RTCOM 자료 요청 목록 보완

기존 §12 질문에 더해, Portal 대상 모델별 공식 Product Page URL, 공식 Datasheet/Specification, 공식 User Manual, 고해상도 전면·후면 원본을 요청할 준비를 한다. 이미지마다 공식 다운로드/소개 페이지 URL, Media Kit/Press Asset 출처, 제공 주체, 실제 픽셀 크기, 적용 모델·HW Revision을 연결하도록 요청한다. 가능하면 긴 변 2000px 이상의 원본을 요청하고, 미제공 자료와 제공 불가 사유도 모델별로 회신받는다. 별도 발송은 하지 않았다.

현재 필수 자료가 누락된 모델을 자동 삭제하거나 기존 시스템에서 비공개 처리하는 코드는 실행하지 않는다. 향후 정식 공개 판단에 이 운영 기준을 적용한다. 최종 Product Data Schema 작성과 원본 자료 수정은 수행하지 않는다.
