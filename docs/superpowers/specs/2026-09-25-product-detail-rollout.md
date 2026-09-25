# Product Detail 전체 확장 설계

- 작성일: 2026-09-25
- 기준 main: `8f7adf6b38f475a1ee5930a18c8ab04f4d616007`
- 적용 범위: 현재 공개 카탈로그 27개
- 기존 상세: BRC-AM7, DM7, Ki Pro GO2, PT-MZ17K, Rally Bar
- 신규 판정 대상: 나머지 22개
- 새 웹 조사: 수행하지 않음
- 제품 데이터·공개 사이트 변경: 수행하지 않음

## 목적

현재 공통 Product Detail renderer를 제품별 자료 상태가 서로 다른 공개 제품으로 확장한다. 자료가 완전한 제품만 허용하는 방식 대신, 확인된 사실과 `MISSING`, `REVIEW REQUIRED`, `CONFLICTED`를 함께 표시할 수 있는 기존 화면 구조를 사용한다.

## 공개 판정

### READY

정확한 제조사·모델 식별과 공식 제품 페이지가 확인되고, 기존 공식 자료만으로 Overview, Features, 주요 Specifications, I/O 데이터 패키지 작성을 시작할 수 있다. 일부 이미지나 Quick Document가 없더라도 해당 상태를 정확히 표시할 수 있으면 READY가 될 수 있다.

### READY WITH REVIEW FLAGS

제품 식별과 기본 내용은 구성할 수 있으나 Variant, Region, 주파수 대역, 이미지 역할·재사용, 문서 적용 범위 가운데 하나 이상을 `REVIEW REQUIRED`로 유지해야 한다. 검토 표시를 숨기지 않는 조건으로 데이터 준비를 진행할 수 있다.

### HOLD

제품 정체성, 하드웨어·라이선스 범위 또는 공식 근거의 적용 범위가 상세페이지의 핵심 내용을 구성하기에 부족하다. 목록과 공식 링크는 유지할 수 있지만 상세 링크는 만들지 않는다.

## 22개 판정

| Manufacturer | Model | 판정 | 기존 근거와 남은 조건 |
|---|---|---|---|
| BSS Audio | EC-4BV | READY WITH REVIEW FLAGS | 공식 제품 페이지 확인. 흑/백 및 US/EU 물리 Variant 선택이 미확정 |
| Audinate | AVIO USB C | READY WITH REVIEW FLAGS | 공식 제품군 페이지와 공식 Datasheet 확인. 정확 모델 표기·이미지 역할을 검토 상태로 유지 |
| Shure | MXCW640 | READY WITH REVIEW FLAGS | 공식 제품 페이지와 MXCW 시스템 매뉴얼 확인. 이미지 직접 링크·해상도 미확인 |
| Crown | CDI 2/300BL | READY WITH REVIEW FLAGS | 공식 제품 링크와 제품군 매뉴얼 존재. 2/300BL 전용 Cut Sheet 적용을 재확인 |
| Powersoft | Mezzo 322 AD | READY | 정확 모델 공식 페이지, 공식 Datasheet, 공식 User Guide 확인 |
| Powersoft | Quattrocanali 2404 DSP+D | READY | 정확 모델 페이지, DSP+D Datasheet, 제품군 User Guide 확인 |
| Powersoft | Quattrocanali 4804 DSP+D | READY | 정확 모델 페이지, DSP+D Datasheet, 제품군 User Guide 확인 |
| Powersoft | Duecanali 1604 DSP | READY | 정확 DSP Variant 페이지·Datasheet·User Guide 확인. DSP+D로 확대 적용 금지 |
| Shure | ULXD4Q | READY WITH REVIEW FLAGS | 공식 본체 페이지·한글 매뉴얼·Family Spec 확인. 주파수 Band/SKU 미확정 |
| Shure | QLXD4 | READY WITH REVIEW FLAGS | 공식 본체 페이지·Family 매뉴얼/브로셔 확인. 주파수 Band suffix 미확정 |
| Shure | UA874XA | READY WITH REVIEW FLAGS | 공식 정확 Variant 페이지 확인. Quick Documents와 이미지 상태가 부족 |
| Roland | V-02HD MK II | READY | 정확 모델 제품 페이지·매뉴얼·공식 사양 확인. 구형 V-02HD와 분리 |
| Analog Way | Aquilon RS1 | READY WITH REVIEW FLAGS | 공식 페이지·Datasheet·매뉴얼·전후면 이미지 후보 확인. 파일 접근·재사용 상태 검토 필요 |
| Roland | UVC-01 | READY | 정확 모델 페이지·매뉴얼·사양·브로셔 확인. 이미지 해상도는 검토 상태 유지 가능 |
| Ross Video | ULTRISCAPE | HOLD | 소프트웨어 라이선스이며 Frame/Slot별 entitlement가 미확정. 물리 장비 I/O 구조를 적용하지 않음 |
| NETGEAR | GSM4248PX | READY WITH REVIEW FLAGS | 정확 모델 공식 페이지 확인. Quick Documents와 이미지·세부 I/O 근거 보강 필요 |
| NETGEAR | XSM4216F | READY WITH REVIEW FLAGS | 정확 모델 공식 페이지 확인. Quick Documents와 이미지·세부 I/O 근거 보강 필요 |
| Epson | EB-PQ2220B | READY | 한국 공식 정확 모델 페이지·공식 Manual·Specification 확인 |
| Epson | EB-L790SU | READY | 한국 공식 정확 모델 페이지·공식 Manual·Specification 확인 |
| Epson | EB-L690U | READY | 한국 공식 정확 모델 페이지·공식 Manual·Specification 확인 |
| Epson | EB-L530U | READY | 한국 공식 정확 모델 페이지·공식 Manual·Specification·Catalog 확인 |
| Panasonic | PT-VMZ71 | READY | 공식 Series 페이지에 정확 모델 등재, 한국어 Family Manual과 정확 모델 Specification 확인 |

집계는 READY 11개, READY WITH REVIEW FLAGS 10개, HOLD 1개다.

## Group 2 선정

| 순서 | Manufacturer | Model | Category | 판정 | 선정 이유 |
|---:|---|---|---|---|---|
| 1 | Powersoft | Mezzo 322 AD | Amplifier | READY | 공식 페이지·사양서·매뉴얼이 함께 있어 데이터 패키지 기준 제품으로 적합 |
| 2 | Roland | V-02HD MK II | Video Switcher | READY | HDMI 기반 영상 전환기 I/O와 세대 구분을 검증하기 좋음 |
| 3 | Roland | UVC-01 | Video Capture | READY | 소형 Capture 제품과 제한적인 이미지 상태를 검증하기 좋음 |
| 4 | Epson | EB-L530U | Projector | READY | 한국 공식 제품·지원 자료가 있고 Projector 사양 그룹을 확장할 수 있음 |
| 5 | Audinate | AVIO USB C | Audio Interface | READY WITH REVIEW FLAGS | 소형 Network Audio 인터페이스와 문서 누락 상태를 함께 검증 |
| 6 | Shure | MXCW640 | Conferencing Endpoint | READY WITH REVIEW FLAGS | 회의 단말 제품의 Audio·Network·Power 구조를 검증 |
| 7 | NETGEAR | GSM4248PX | Network Switch | READY WITH REVIEW FLAGS | Port·Speed·PoE 중심의 Network 제품 구조를 검증 |
| 8 | Analog Way | Aquilon RS1 | Video Processor | READY WITH REVIEW FLAGS | 대형 Video Processor의 복합 I/O와 이미지 검토 상태를 검증 |

같은 제조사의 유사 Amplifier와 동일 제품군 Projector는 다음 그룹으로 미뤄 첫 그룹의 화면·데이터 다양성을 우선한다.

## 데이터 패키지 원칙

각 제품은 Group 1과 같은 Header, Gallery, Quick Documents 4종, Overview, Features, Specifications, I/O 구조를 사용한다. 값이 없는 필드는 만들지 않으며 자료 슬롯은 `MISSING` 또는 `REVIEW REQUIRED`로 남긴다.

제품별 Markdown 패키지는 공개 데이터의 초안이다. 공식 URL, 모델 적용 범위, 문서 언어·개정, 이미지 역할·재사용 상태를 분리한다. 내부 메모, 공급처, 비공개 파일 경로, 원본 Excel 행 정보는 공개 데이터에 복사하지 않는다.

Group 2 패키지 작성 단계에서는 제품 JSON, 이미지 파일, Library 링크, Pages 아티팩트를 변경하지 않는다. 패키지가 검토된 뒤 별도 구현 작업에서 renderer 연결과 배포를 수행한다.

## 성공 조건

- 22개 전부가 세 판정 중 하나를 갖는다.
- Group 2 8개가 제조사·제품군 다양성과 기존 근거를 함께 만족한다.
- Group 2 제품별 패키지가 Group 1 구조를 따르며 근거 없는 값을 포함하지 않는다.
- Quick Documents는 정확히 4개 슬롯을 유지한다.
- 이미지와 문서의 확보·모델 적용·재사용 상태를 각각 구분한다.
- ULTRISCAPE는 License용 표현과 적용 범위가 정해지기 전까지 HOLD를 유지한다.
- 공개 코드와 제품 데이터는 이 설계 승인만으로 변경되지 않는다.
