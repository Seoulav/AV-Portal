# WORK_HANDOFF.md

> 2026-09-24부터 제품별 조사·재사용의 최신 기준은 [제품 자료 조사·재사용 운영 정책](PRODUCT_RESEARCH_OPERATING_POLICY.md)이다. 조사 완료와 공개 승인, 자료 발견과 모델 적용·사양 검증·재게시 권한을 구분하며, MISSING은 정해진 조사 범위의 완료를 막지 않는다.

## 1. 프로젝트 이름
AV Equipment Library / RTCOM Configurator → AV Portal

## 2. 프로젝트 목적
기존 RTCOM AV Equipment Library / Configurator를 AV Portal 본체로 발전시킨다.

### 개발 대상
- AV Equipment Library / RTCOM Configurator

### 외부 링크로만 유지
- AV System Builder
  - https://seoul-visual-tech.github.io/av-system-builder/
- LED Configurator
  - https://hkkim0454.github.io/svt-led-calculator/src/index.html

위 두 시스템은 현재 프로젝트에서 코드, Database, Product Data, 계산 Logic을 수정하거나 통합하지 않는다.

## 3. 현재 Portal의 기본 탐색 원칙
1. 통합검색
2. 장비 대분류 / Category
3. Manufacturer Quick Access
4. Library 내부 세부 Filter

Manufacturer는 Category의 상위 분류가 아니라 별도 탐색 축이다.

## 4. 현재 추천 Product Taxonomy
Top-Level Domain 후보:
- Video / 영상
- Audio / 음향
- Display / 디스플레이
- Control / 제어
- Conferencing / 회의·협업
- Connectivity / 연결·전송
- Network / 네트워크

기본 원칙:
- Domain → Category → 필요 시 Subtype
- Manufacturer는 별도 축
- Series / Model은 분류가 아니라 제품 식별
- HDMI / SDI / Dante / NDI / SDVoE / AES67 / HDCP / PoE / 4K 등은 대부분 Category가 아니라 Interface / Protocol / Capability / Specification
- 없는 제품군을 초기 화면에 빈 메뉴로 노출하지 않음
- Simple first → Expand when needed

## 5. Portal MVP 단계

### MVP 1
- Portal Shell / Navigation
- Home / Dashboard
- Manufacturer 탐색
- Equipment Library
- Product Detail
- Documents
- 기본 Search / Filter
- AV System Builder 외부 링크
- LED Configurator 외부 링크
- 기존 RTCOM Configurator 진입 / 복귀
- 기존 RTCOM 기능 보존

### MVP 1.5
- Dynamic Filter 고도화
- Product Compare
- RTCOM UI/UX 개선

### Phase 2
- Admin
- 고급 수치 검색
- Compare 결과 저장 / 출력
- RTCOM Revision / 자동 구성
- Documents 고급 관리

### 현재 제외
- 공통 Authentication
- Builder / LED 데이터 통합
- 세 시스템 공통 BOM
- 공통 Compatibility Engine
- AI 제품 추천
- Repository 통합
- Builder / LED 수정

## 6. Product Detail 방향
Product Detail 기본 구조:
- Manufacturer / Model / Series / Category
- Main / Front / Rear / Other Image
- Quick Documents
- Overview
- Structured Specifications
- I/O Ports
- Documents
- Verification & Sources

중요 원칙:
- 0
- 미지원
- 해당 없음
- 정보 없음

을 서로 다르게 취급한다.

정보가 없다고 0 또는 미지원으로 추측하지 않는다.

## 7. Product Data Schema 현재 상태
최종 PRODUCT_DATA_SCHEMA.md는 아직 작성하지 않았다.

현재는 다음 3단 구조 Skeleton만 검토 중이다.
1. Common Product Core
2. Category Specification Profile
3. Evidence / Source

중요한 보완 방향:
- Series / Model / Module / Bundle / Cable / Accessory를 하나의 item_level 값으로 평탄화하지 않음
- Physical Connector / Signal / Protocol / Direction / Quantity / Condition / Capacity를 구분
- 단일 max_resolution / max_distance보다 조건 조합을 보존
- Product Lifecycle / Document Lifecycle / Evidence Status / Publication Status를 분리할 필요 있음
- 복수 문서 근거와 문서 간 충돌을 보존
- 문서 Revision과 제품 HW/FW Revision을 구분

## 8. RTCOM 1차 자료 조사 현황
1차 자료:
- 02_사양서.zip
- 총 75개 파일 Inventory 완료
- PDF 46
- DOCX 7
- PPTX 2
- PNG 16
- JPG 4

주요 Product Family:
- XDM
- SPX
- VDM
- Integrated / Small Matrix
- Distribution / Switcher
- Extender
- Extender Frame / Module
- Cable
- XDM 전원 관련 자료
- 일부 기타 제품

현재 공식 Current / Legacy / Superseded 상태는 확정하지 않았다.

## 9. Portal 제외 제품 — 확정 운영 결정
다음 4개 모델은 생산 여부와 관계없이 AV Portal에서 완전히 제외한다.

- HS-88M-U
- HS-88MX
- HD-D104U
- HD-D108U

처리 기준:
- Equipment Library 등록 제외
- Search / Filter 제외
- Product Detail 제외
- Product Compare 제외
- Taxonomy Mapping 제외
- Migration 제외
- 데이터 검증 및 수집 대상 제외
- Portal 제품 수량 집계 제외

단, 제조사 원본 PDF / Catalog / Datasheet / ZIP은 수정하거나 삭제하지 않고 증빙용으로 보존한다.

기존 Library 31개 중 실제 목록에 있던 제외 항목은:
- HS-88MX
- HD-D104U
- HD-D108U

따라서 현재 Portal 기준은 28개 장비·시리즈 항목이다.
HS-88M-U는 원래 31개 목록에 없으므로 다시 차감하지 않는다.

주의:
- HD-104U
- HD-108U

는 현재 제외 대상이 아니다.
HD-D104U / HD-D108U와 구분한다.

## 10. RTCOM 1차 자료 주요 Conflict
대표 검토 이슈:
- SPX 매뉴얼 적용 Model 불명
- XDM 구/신 카드명 관계
- XDM-20 / XDM-20X 관계
- AOD100 / DAN08 명칭 불일치
- VDM-256X / VDM-288X 관계
- VDM 일부 치수/무게 충돌
- HDS-42MU 치수 충돌
- QMS-88UX 8×8 표제와 10개 출력 설명
- CR104-U 신호 방향
- XDM-POE / XDM-PSU / MAX2 관계
- PureLink MAX2와 RTCOM 자료의 관계 미확정

임의로 하나를 정답으로 선택하지 않는다.

## 11. RTCOM 공식 자료 수령 후 우선 확인할 것
가장 먼저 필요한 것:
1. 현재 판매 Series / Model 목록
2. 단종 / Legacy 제품 목록
3. 제품별 최신 Datasheet / Manual / Catalog / Drawing
4. Chassis ↔ Card 공식 호환표
5. TX / RX / PSE / PD 관계
6. Cable 길이 / SKU / 방향성
7. 공식 제품 이미지
8. 자료의 Portal 공개 가능 범위

세부 질문은 RTCOM_DATA_PREPARATION.md를 기준으로 한다.

## 12. 현재 완료된 주요 문서
가능하면 다음 문서를 모두 새 PC의 같은 프로젝트 폴더에 둔다.

- AV_PLATFORM_PROJECT_BRIEF.md
- MODEL_ROUTING.md
- audit.md
- EXISTING_SYSTEM_ASSESSMENT.md
- CORE_DOMAIN_CONCEPTS.md
- PORTAL_MVP_SPEC.md
- UI_UX_SPEC.md
- PRODUCT_TAXONOMY.md
- PRODUCT_DATA_SCHEMA_SKELETON.md
- RTCOM_DATA_PREPARATION.md
- WORK_HANDOFF.md

자료:
- 02_사양서.zip
- 향후 RTCOM 공식 자료

## 13. 현재 작업 위치

완료:
- 기존 시스템 분석
- 프로젝트 범위 확정
- Portal MVP 정의
- UI / UX 설계
- Product Taxonomy
- Product Data Schema Skeleton
- RTCOM 1차 자료 Inventory
- Conflict List
- 공식 자료 수령용 질문 목록

현재:
- RTCOM 공식 추가 자료 대기

다음:
RTCOM 공식 자료 수령
→ 기존 1차 자료와 비교
→ 신규 / 동일 / 개정 / 누락 자료 구분
→ Series / Model / Module / TX-RX 대조
→ Conflict 업데이트
→ Current / Legacy / Superseded 확인
→ Product Data Schema 검토
→ 사용자 승인
→ PRODUCT_DATA_SCHEMA.md 작성

## 14. 아직 하지 말아야 할 것
사용자 승인 전에는 다음을 진행하지 않는다.

- Codex 구현 시작
- 최종 Product Data Schema 확정
- Database 선택
- JSON Schema 확정
- Migration
- Admin 구현
- 기존 RTCOM Logic 변경
- Builder / LED 수정
- Compatibility Engine 구현
- AI 추천 구현
- 미확인 사양 추측

## 15. 새 Work에서 시작할 때 지시
새 PC의 Work는 먼저 이 문서를 읽고,
위에 나열된 기준 문서들을 확인한다.

처음에는 코드나 문서를 수정하지 않는다.

다음 형식으로만 사용자에게 보고한다.

1. 현재 프로젝트 목적
2. 확정된 범위
3. 완료된 단계
4. 현재 대기 중인 작업
5. 다음 단계
6. 충돌하거나 불명확한 정보

사용자 확인을 받은 뒤 다음 작업을 진행한다.
