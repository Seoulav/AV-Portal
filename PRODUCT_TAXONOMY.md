# PRODUCT TAXONOMY

## 운영 범위 정정 — 제품 제외 (2026-09-21)

사용자 운영 결정에 따라 **HS-88M-U, HS-88MX, HD-D104U, HD-D108U는 `EXCLUDED FROM PORTAL`**이다. 이 결정은 아래 과거 분석·보존 권고보다 우선한다.

- Equipment Library 등록, Search/Filter 결과, Product Detail 생성, Product Compare, Taxonomy Mapping, Migration, 제품 데이터 검증·수집, Portal 제품 수량 집계에서 모두 제외한다.
- 과거 조사 기록에 해당 모델이 남아 있더라도 증빙·이력일 뿐, 활성 제품·검증 대기·향후 자동 등록 후보가 아니다. 명칭·사양 충돌의 해소도 Portal의 후속 과제로 요구하지 않는다.
- 원본 ZIP/PDF/Catalog/Datasheet 및 기타 제조사 자료는 수정·삭제하지 않는다. 여러 제품이 수록된 문서도 전체 원본을 보존하되 제외 모델 구역은 제품 데이터 준비에 사용하지 않는다.
- 기존 Library **31개는 조사 당시 원본 수량**이다. 이 중 HS-88MX, HD-D104U, HD-D108U의 3개 항목을 제외하여 현재 Portal 기준은 **28개 장비·시리즈 항목**이다. HS-88M-U는 원래 31개 목록에 없으므로 다시 차감하지 않는다. Series·묶음이 포함되어 있으므로 28개 SKU를 뜻하지 않는다.
- 이후 분석과 Product Data 준비는 이 제외 범위를 적용한다. 이번 변경은 문서 반영이며 기존 시스템 코드·데이터를 변경한 것은 아니다.


**대상:** AV Equipment Library / RTCOM Configurator → AV Portal  
**작성일:** 2026-09-21  
**상태:** 분류 체계 제안 · 사용자 검토 대기  
**선행 승인:** UI_UX_SPEC.md 승인. 이번 Taxonomy의 승인이나 구현 승인을 의미하지 않음.

## 1. 목적·근거·범위

이 문서는 **어떤 장비를 어떤 분류에서 찾게 할 것인가**를 정의한다. 제조사와 독립적인 장비 역할 중심 분류를 제안하고, 기존 RTCOM 분류·Portal 대상 28개 항목의 대응 후보를 제시한다. 기존 데이터와 코드를 수정하거나 새 제품을 수집·등록하지 않는다.

기준 문서는 [EXISTING_SYSTEM_ASSESSMENT.md](./EXISTING_SYSTEM_ASSESSMENT.md), [CORE_DOMAIN_CONCEPTS.md](./CORE_DOMAIN_CONCEPTS.md), [PORTAL_MVP_SPEC.md](./PORTAL_MVP_SPEC.md), 승인된 [UI_UX_SPEC.md](./UI_UX_SPEC.md)다. 최신 사용자 요청의 탐색 순서와 MVP 단계가 우선한다.

기존 항목 Mapping은 1차 조사 때 확보한 RTCOM `product-catalog.js`의 sourceProducts·기존 검증 상태와 `catalog.js`의 제품군·카드 목록을 읽어 작성했다. 고정 커밋은 `1d97f429328f1bd486ef1f7c881424b7e3bdcde8`이다. 제조사 원문을 새로 전수 검증하지 않았으므로 **기존 기록의 분류 근거**와 **공식 사양 검증 완료**를 구분한다. 이전 저장소 감사 문서는 참고로만 읽었으며, 그 문서의 이관·구현 계획을 실행하지 않는다.

다른 제조사·제품명은 사용자가 제공한 개념 예시로만 사용한다. 현재 등록되어 있다는 뜻이나 공식 분류를 새로 인증한 결과가 아니다. Builder와 LED Configurator는 외부 링크로 유지하며 그 제품 데이터를 가져오지 않는다.

이번에는 Database Table, JSON Schema, API, 필드명·자료형·필수 여부, Framework, SKU 구조를 결정하지 않는다. `PRODUCT_DATA_SCHEMA.md`도 작성하지 않는다.

## 2. Taxonomy 설계 원칙

1. **장비의 주된 역할을 분류한다.** “무엇인가?”는 Category, “무엇을 지원하는가?”는 Attribute/Capability 후보로 본다.
2. **Manufacturer는 별도 축이다.** 제조사 아래에 모든 Category를 복제하지 않는다.
3. **Domain → Category → 필요한 경우 Subtype**까지만 사용한다. Subtype이 없는 Category도 정상이다.
4. **주 분류 하나를 우선한다.** 부가 기능·사용 공간·Protocol은 추가 탐색 조건으로 찾게 한다. 같은 항목을 여러 Domain에 복제하지 않는다.
5. **탐색 분류와 제품의 단위를 구분한다.** Series·Model·TX/RX 묶음·판매 세트·옵션 카드·배치 인스턴스는 같은 개념이 아니다.
6. **원래 이름·분류·근거·검증 상태를 보존한다.** 불명확한 항목을 자동 재분류하거나 UNKNOWN을 false/0으로 바꾸지 않는다.
7. **초기 운영 분류와 확장 후보를 구별한다.** 없는 제품을 가정해 빈 메뉴를 대량 노출하지 않는다.
8. **분류는 Compatibility 보증이 아니다.** 같은 Category 또는 같은 Protocol이라는 이유로 장착·연결·대체 가능하다고 판단하지 않는다.

### 2.1 신규 항목의 분류 판단 순서

제품 소개·공식 문서에서 주 기능과 제품 단위를 확인 → 장비 역할에 맞는 Category 선택 → 같은 Category 안에서도 탐색·비교를 위해 필요한 경우만 Subtype 선택 → 인터페이스·전송 방식·성능은 별도 탐색 정보로 구분한다.

기능이 겹치면 주된 설계 역할과 제품 설명을 우선한다. 그것도 불명확하면 기존 분류 유지 또는 `REVIEW REQUIRED`로 남긴다. 관리용 검토 목록은 새 상위 Domain “기타”와 다르며, 미결정 제품을 사용자 탐색에서 조용히 숨기지 않는다.

## 3. Portal 탐색 우선순위와 화면 적용

**통합검색 → Equipment Domain / Category → Manufacturer Quick Access → Library 세부 Filter** 순서를 적용한다.

| 사용자 상황 | 진입 | 적용 원칙 |
|---|---|---|
| 모델명·제품명을 알고 있음 | Global Search | MTX5-D, XDM-20, SM58, Aquilon 같은 입력으로 탐색. 데이터에 없으면 검색 결과 없음 |
| 필요한 장비 종류를 알고 있음 | Domain / Category | 영상 분배기, DSP, 케이블처럼 업무 용어로 찾음 |
| 특정 제조사 자료를 찾음 | Manufacturer Quick Access | 제조사 조건으로 Library 진입. Category Tree의 루트가 되지 않음 |
| 후보 범위를 줄임 | Manufacturer / Category / Series / 기타 Filter | 현재 분류와 확인된 정보에 맞는 조건만 노출 |

### 3.1 Home에서의 초기 적용 제안

Home의 검색이 먼저이고 그 아래 장비 분류 탐색, 그 다음 제조사 영역을 둔다. Manufacturer 로고는 편의 기능이며 Category보다 상위 탐색을 강제하지 않는다.

초기에는 기존 5개 RTCOM 빠른 탐색을 유지할 수 있다. 분류 승인 후에는 예를 들어 `영상: 매트릭스·분배기·선택기`, `연결·전송: 익스텐더·케이블`처럼 Domain별로 묶어 보여줄 수 있다. Domain 카드를 누른 뒤 다시 여러 계층을 거치게 하지 않고 Category 바로가기를 함께 제공한다.

Audio·Display 등 실제 공개 항목이 없는 Domain은 첫 화면의 빈 카테고리 카드로 채우지 않는다. 분류 후보는 준비해 두되 해당 제품이 등록될 때 노출한다. 현재 구조의 즉시 변경이나 매핑 적용은 이번 작업에 포함하지 않는다.

### 3.2 기능별 공통 활용

| 기능 | Taxonomy 활용 |
|---|---|
| Equipment Library / Detail | 같은 분류명·경로·항목 수준 표시 |
| Search | 한글·영문 명칭과 확인된 동의어로 동일 분류 탐색 |
| Filter | Category에 의미 있는 정보만 조건으로 사용 |
| Product Compare | Category에 더해 항목 수준·역할·구성 조건을 검토 |
| Documents | 관련 제품/Series의 분류로 자료를 좁힘. Manual·Datasheet는 별도 문서 유형 |
| 향후 Admin | 분류 선택·근거 검토·오분류 정정에 사용. 범용 Taxonomy 편집기 구현은 현재 범위 아님 |

여러 Category를 다루는 종합 Catalog는 여러 관련 제품과 연결될 수 있다. 문서를 억지로 한 제품 Category로 복제하거나 분할하지 않는다.

## 4. Manufacturer / Series / Model과 분류 축

| 축 | 관계 | 설명 |
|---|---|---|
| 제품 식별 | Manufacturer → Series → Model | 누가 만든 어떤 제품군·모델인가. Series가 없거나 미확인이어도 가능 |
| 장비 분류 | Domain → Category → 필요 시 Subtype | 어떤 종류의 장비인가 |
| 지원 특성 | Interface / Signal / Protocol / Transport / Capability / Specifications | 어떤 조건에서 무엇을 지원하는가 |
| 제품 단위·관계 | Series 항목, 개별 Model, 판매 품목, 옵션, 묶음, Design Instance | 분류와 별도로 제품의 표현 수준·관계를 설명 |

사용자가 제시한 예시에서는 Manufacturer가 Yamaha, Series가 MTX, Model이 MTX5-D이고 분류는 Audio → DSP다. Yamaha나 MTX를 Domain·Category로 만들지 않는다. 이 예시를 실제 등록하거나 제조사 사양을 수집하지 않는다.

XDM Series는 매트릭스 제품군을 소개하는 항목이고 XDM-12·20·36은 별도의 모델이다. 같은 Matrix Switcher 분류를 참조할 수 있지만 Series 항목에 “섀시 한 대”라는 단위를 부여하지 않는다. 판매 SKU, 카드가 어느 섀시에 장착되는지, Builder에 실제 배치된 장비의 관계는 CORE_DOMAIN_CONCEPTS의 참고 영역이며 이번 Taxonomy에 넣지 않는다.

## 5. 추천 Top-Level Domain과 경계

**7개 Domain을 유지**할 것을 권고한다. 아래 표는 Portal의 탐색 설계 제안이며 업계 전체의 유일한 공식 분류를 주장하지 않는다.

| Domain / 한글 표시 | 중심 역할 | 경계 원칙 |
|---|---|---|
| Video / 영상 | 영상 생성·선택·분배·처리·변환·인코딩/디코딩 | 영상 출력 장치는 Display. 장거리 연결 중심 장치는 Connectivity |
| Audio / 음향 | 음성 수집·혼합·처리·증폭·재생 | 회의용으로 쓰인다고 모든 마이크·DSP를 Conferencing으로 옮기지 않음 |
| Display / 디스플레이 | 영상을 실제로 표시·투사 | 화면을 구동하는 Processor는 주 역할에 따라 Video |
| Control / 제어 | AV 장비·공간의 제어와 사용자 조작 | 모든 LAN 포트 장치를 Network로 분류하지 않음 |
| Conferencing / 회의·협업 | 회의 통신·협업을 주 역할로 하는 전용 단말·통합 장치 | 단독 Camera·Microphone·Speaker는 원래 역할 Category. 회의 용도는 추가 탐색 맥락 |
| Connectivity / 연결·전송 | 신호 연결·연장·케이블·접속·보조 부품 | 신호 처리·형식 변환이 주 기능이면 Video/Audio의 Converter 후보 |
| Network / 네트워크 | 네트워크 전달·접속 인프라 | AV-over-IP 영상/음향 Endpoint 자체는 역할에 따라 Video/Audio |

### 5.1 중복 후보의 처리

- **Extender:** Video와 Connectivity에 중복 Category를 만들지 않고 Connectivity → AV Extender를 권고한다. 영상 검색에서도 “영상 전송/확장” 동의어와 Signal 조건으로 찾을 수 있게 한다.
- **Camera:** 회의용만 가정하지 않고 Video → Camera를 권고한다. 회의실 용도·PTZ 등은 조건으로 탐색한다. 카메라·마이크·스피커가 결합된 회의 단말은 주 기능을 확인해 Conferencing에 배치한다.
- **Converter:** 영상 형식 변환은 Video, 음향 형식 변환은 Audio. 단순 접속·결선 변경은 Connectivity → Adapter / Termination. 여러 기능이 섞이면 주 기능 확인 전 보류한다.
- **Scaler:** 별도 최상위 기능 묶음은 만들지 않고 Video Processor의 전문 Subtype으로 시작한다. Matrix에 스케일링 기능이 있다는 이유로 Category를 바꾸지 않는다.
- **AV over IP Infrastructure:** 포괄적인 잡동사니 Category로 만들지 않는다. Network Switch·Network Interface 같은 실제 역할을 사용한다.

## 6. Domain별 Category·Specification 영역·Filter 후보

이 절은 **확장 가능한 분류 사전의 최소 후보**다. 모두 첫 화면에 노출하거나 새 데이터를 입력하라는 뜻이 아니다. 초기 Library에 직접 대응되는 것은 §12의 항목뿐이다. 모든 행의 Manufacturer·Series·Verification은 공통 탐색 축이므로 Filter 열에 반복하지 않았다.

Specification 영역은 다음 단계의 정보 조사 범위다. 필드명·타입·Required/Optional·단위 변환 규칙·성능 판정 공식은 정하지 않는다. Filter는 확인된 정보가 있을 때만 노출한다. 고급 수치 조건은 승인된 단계에 따라 Phase 2로 남긴다.

### 6.1 Video / 영상

| Category / 표시명 | 포함 범위·필요 시 Subtype | 중요한 Specification 영역 | 주요 Filter 후보 |
|---|---|---|---|
| Matrix Switcher / 매트릭스 스위처 | 여러 입력과 출력의 경로 구성. 모듈형/일체형 Subtype | I/O 구조, Signal, Resolution 조건, 섀시·슬롯, Redundancy | 모듈형/일체형, 신호, 확인된 입출력 구조 |
| Matrix Module / 매트릭스 모듈·카드 | 별도 식별되는 매트릭스 카드. 입력/출력 Subtype | 카드 역할, I/O, Signal, 처리 기능, 장착 조건의 근거 | 입력/출력, 신호, 인터페이스. 호환 섀시는 별도 관계 검토 |
| Presentation Switcher / 프레젠테이션 스위처 | 발표·회의 신호 운용을 주목적으로 통합된 전환 장치 | 입력 유형, 출력·스케일링, 오디오·제어, 운용 모드 | 입력 인터페이스, 출력 구조, 확인된 프레젠테이션 기능 |
| Video Processor / 비디오 프로세서 | 합성·멀티윈도·비디오월 등 영상 처리. 전문 Scaler Subtype 가능 | 입력/독립 출력, 처리 자원, Canvas, Layer/Window, 운용 조건 | 처리 역할, 인터페이스, 확인된 운용 모드 |
| Video Distribution Amplifier / 영상 분배기 | 입력 신호를 여러 출력에 분배 | 입출력 구조, Signal, 영상 조건, EDID·보호 조건 | 신호, 입출력 구조, 확인된 분배 기능 |
| Signal Switcher / 영상 선택기 | 입력 신호의 선택·전환 중심 | 입출력 구조, 전환 방식, Signal, 제어 | 신호, 토폴로지, 자동/수동 전환 |
| Video Encoder / 영상 인코더 | 영상을 전송·처리에 맞게 인코딩하는 역할 | 입력, 인코딩/전송 조건, 지연, 네트워크·제어 | 입력 인터페이스, 확인된 Protocol/전송 방식 |
| Video Decoder / 영상 디코더 | 인코딩된 영상을 복원·출력하는 역할 | 수신 조건, 출력, 지연, 네트워크·제어 | 출력 인터페이스, 확인된 Protocol/전송 방식 |
| Video Converter / 영상 변환기 | 영상 형식·신호 변환 중심 | 변환 전/후 Signal, Format, 변환 방향, 전원 | 변환 입력/출력, 방향, 인터페이스 |
| Camera / 카메라 | 독립된 영상 촬영 장비 | 영상 출력, 해상도 조건, 렌즈·시야, 이동·제어, 전원 | PTZ/고정 등 확인된 형식, 출력 연결, 사용 용도 |

Matrix, Signal Switcher, Presentation Switcher 사이에서 이름만 보고 자동 판정하지 않는다. 독립 출력별 경로 선택·운용 목적·구성 설명을 함께 확인한다. Encoder/Decoder 겸용 장치는 현재 주 운용 역할이 분명하면 그쪽에 두고 겸용 특성을 표시한다. 분명하지 않으면 검토 보류하며 Encoder와 Decoder 항목 두 개로 자동 복제하지 않는다.

### 6.2 Audio / 음향

| Category / 표시명 | 포함 범위 | 중요한 Specification 영역 | 주요 Filter 후보 |
|---|---|---|---|
| Mixer / 믹서 | 오디오 믹싱·운용 중심 | 입력/출력, Bus, 처리·제어, 녹음/네트워크 | 아날로그/디지털, I/O 구조, 네트워크 오디오 |
| DSP / 오디오 DSP | 시스템 오디오 처리 중심 | Audio I/O, DSP Capacity, Sample Rate, Network Audio, Control | 입력/출력 형식, 확인된 처리 기능, Dante/AES67 등 |
| Amplifier / 앰프 | 오디오 전력 증폭 | 채널, 출력과 부하 조건, 보호·제어 | 채널 구성, 부하 방식, 네트워크 제어 |
| Speaker / 스피커 | 음향 재생 | 방식, 주파수·음압 조건, 지향·설치, 구동 조건 | 능동/수동, 설치 형태, 용도 |
| Microphone / 마이크 | 개별 음성 수음 장치 | Microphone Type, Polar Pattern, Frequency Response, Connection, Power | 유선/무선, 마이크 형식, 연결, 전원 |
| Wireless Microphone System / 무선 마이크 시스템 | 송수신을 포함한 시스템·전용 송수신 구성품 | 구성 단위, 무선 운용 조건, 채널, 송수신·전원 | 시스템/송신 구성품/수신 구성품, 마이크 형식, 연결 |
| Audio Interface / 오디오 인터페이스 | 오디오 장치·컴퓨터·네트워크의 I/O 접속 | Audio I/O, 연결, Sample Rate 조건, 지연·전원 | USB/네트워크 등 연결, I/O 유형, Protocol |
| Audio Converter / 오디오 변환기 | 오디오 형식·신호 변환 중심 | 변환 입력/출력, Sample Rate 조건, Clock, 전원 | 변환 방향, 입출력 형식, 연결 |

무선 마이크 한 개와 송수신 세트를 같은 단위로 보지 않는다. 네트워크 연결이 있는 DSP는 Network Interface로 옮기지 않는다. 음향 전용 분배기 같은 추가 역할이 실제 등록되면 기존 Category에 억지로 넣기보다 그때 신규 Category 필요를 검토한다.

### 6.3 Display / 디스플레이

| Category / 표시명 | 포함 범위·Subtype 후보 | 중요한 Specification 영역 | 주요 Filter 후보 |
|---|---|---|---|
| LCD Signage / LCD 사이니지 | 상업용 표시 장치·비디오월 패널 | 화면 크기, 해상도, 밝기, 입력, 운용·설치 | 독립형/비디오월 용도, 크기·해상도 범주, 입력 |
| Direct View LED / 직시형 LED | 캐비닛 / 일체형 LED 디스플레이 Subtype | 표시 단위, Pitch, 크기·해상도, 밝기, 전력·중량, 구동 조건 | 캐비닛/일체형, 실내/실외, 확인된 Pitch·표시 조건 |
| Projector / 프로젝터 | 투사형 표시 장비 | 해상도, 밝기 조건, 투사·렌즈, 입력, 설치 | 용도, 해상도 범주, 투사 방식·렌즈 조건 |
| Monitor / 모니터 | 모니터링·일반 영상 표시 역할 | 크기, 해상도, 밝기, 입력, 용도 | 사용 목적, 크기·해상도 범주, 입력 |

Display라는 상위 Domain만으로 비교군을 만들지 않는다. LED Cabinet과 Projector는 서로 다른 Category다. LED Cabinet과 일체형 LED도 제품 단위·설치 조건이 달라 추가 비교 구분이 필요하다. 사이니지와 Monitor의 경계는 제품의 공식 용도·운용 조건을 확인하며 화면 크기만으로 결정하지 않는다.

이 분류는 향후 Portal에 Display 제품을 직접 등록할 수 있는 자리만 마련한다. 기존 LED Configurator의 Model 데이터·계산값·가격·설계는 통합하지 않는다.

### 6.4 Control / 제어

| Category / 표시명 | 포함 범위 | 중요한 Specification 영역 | 주요 Filter 후보 |
|---|---|---|---|
| Control Processor / 제어 프로세서 | AV·공간 제어 중심 처리 장치 | 제어 I/O, 연동 방식, 처리·확장, 전원 | 제어 연결, 확장 방식, 설치 |
| Touch Panel / 터치 패널 | 제어 조작용 패널 | 화면·터치, 제어 연동, 연결, 설치·전원 | 화면 범주, 설치 형태, 연결·전원 |
| Control Interface / 제어 인터페이스 | 제어 신호·접점 등의 입출력·연결 | 제어 입출력, 방향, 전기 조건, 연동·전원 | 제어 신호 유형, I/O 구성, 연결 |

### 6.5 Conferencing / 회의·협업

| Category / 표시명 | 포함 범위·Subtype 후보 | 중요한 Specification 영역 | 주요 Filter 후보 |
|---|---|---|---|
| Conferencing Endpoint / 회의 단말 | Codec 중심 단말 / 통합형 회의 장치 | 회의 운용, AV 구성, 연결, 제어·전원 | 단말 형식, USB/네트워크 연결, 확인된 운용 방식 |
| Speakerphone / 스피커폰 | 수음·재생을 통합한 회의 음성 단말 | 수음·재생, 연결, 확장, 전원 | 연결 방식, 휴대/설치, 확장 기능 |
| Conferencing Processor / 회의 프로세서 | 회의 운용·처리를 주목적으로 하는 전용 장치 | 회의 처리·참여 구조, AV I/O, 제어·연동 | 시스템 역할, 연결·제어, 확인된 회의 기능 |

`USB AV Device`는 단일 Category로 채택하지 않는다. USB는 접속 특성이므로 Camera, Audio Interface, Speakerphone, 회의 단말 등 실제 역할로 분류한다. 단순 DSP에 회의 기능이 있다는 이유만으로 Conferencing Processor에 넣지 않는다. 아직 등록 제품이 없는 이 세 Category의 경계는 실제 사례가 생길 때 다시 검토한다.

### 6.6 Connectivity / 연결·전송

| Category / 표시명 | 포함 범위·Subtype 후보 | 중요한 Specification 영역 | 주요 Filter 후보 |
|---|---|---|---|
| AV Extender / AV 익스텐더 | 신호 연장 장치. Transmitter / Receiver / 역할 전환형 Transceiver | 역할, Signal, Transport, 거리와 조건, 보조 신호·전원 | TX/RX/역할 전환, 신호, 전송 매체, 벽부형 등 설치 |
| Extender Module / Frame / 전송 모듈·프레임 | 전송 확장 프레임 / 송신 모듈 / 수신 모듈 | 프레임·모듈 역할, 수용 구조, 신호·전원, 장착 근거 | 프레임/모듈, 송수신 역할, 전송 매체 |
| Cable / 케이블 | 각종 케이블·AOC 포함 | 양단 접속, 매체, 길이, 방향성, 전송·설치 조건 | Connector/Interface, 매체, AOC 여부, 길이·설치 특징 |
| Adapter / Termination / 접속·단자 부품 | 접속 어댑터, 수동 벽부 단자, 광 접속 부품 | 양단 접속, 결선·매체, 설치, 정격·조건 | Connector, 매체, 단자/어댑터, 설치 형태 |
| AV Accessories / AV 보조 부품 | 장착 / 전원 / 랙 보조 부품 Subtype 후보 | 보조 목적, 치수·하중 또는 전원 조건, 적용 근거 | 목적, 설치 형식, 확인된 전원 방식 |

벽부형이라는 이유만으로 Wall Plate Category에 모으지 않는다. 벽부형 능동 송신기는 AV Extender, 단순 벽부 접속부는 Adapter / Termination이다. 광이라는 이유만으로 Fiber Connectivity에 모든 장비를 모으지 않고, Cable·Extender·접속 부품의 역할에 따라 나눈다.

### 6.7 Network / 네트워크

| Category / 표시명 | 포함 범위 | 중요한 Specification 영역 | 주요 Filter 후보 |
|---|---|---|---|
| Network Switch / 네트워크 스위치 | 네트워크 전달 인프라 | 포트·링크, 스위칭·관리, 멀티캐스트, 전원·PoE 조건 | 포트/링크 유형, 관리 기능, PoE 역할·전원 예산 |
| Network Interface / 네트워크 인터페이스 | 네트워크 접속 자체가 주 기능인 장치·모듈 | 접속 매체, 링크, 장착/설치, 전원 | 매체, 연결 형식, 확인된 속도 범주 |

AV 신호를 생성·수신·처리하는 Endpoint와 네트워크 인프라를 구분한다. 네트워크 오디오를 아날로그 I/O로 제공하는 장치는 Audio Interface/Converter 후보이고, 영상 Encoding/Decoding 역할은 Video에 둔다. `AV over IP Gateway`는 변환 역할·대상이 확인된 뒤 기존 Converter/Interface 등으로 분류할 수 있는지 검토한다.

Portal 대상 28개 항목에서는 별도 Gateway·Network AV Endpoint Category를 강제할 근거가 없다. 일반 제품군에서 독립 역할로 반복 등장하고 기존 Category로 탐색·비교가 어려워질 때만 신규 Category를 제안한다. Protocol 이름으로 대신 분류하지 않는다.

## 7. Category vs Attribute / Capability와 Protocol 처리

| 표현 | 제안하는 정보의 위치 | 분류상 이유 |
|---|---|---|
| Matrix Switcher, DSP, Microphone | Category | 장비가 담당하는 역할 |
| Modular / Fixed Matrix | Matrix Switcher의 Subtype | 구성 방식이 탐색·비교에 실질적으로 중요 |
| Input Card / Output Card | Matrix Module의 Subtype | 모듈 자체의 역할을 구별 |
| TX / RX | AV Extender의 Subtype 또는 역할 Filter | 서로 다른 장비 역할. 이름만으로 확인하지 않음 |
| Dante / AES67 | 네트워크 오디오 관련 Protocol/Capability 탐색 축 | 장비 종류를 대신하지 않음 |
| NDI / SDVoE | 영상 전송 관련 기술·Protocol/Capability 탐색 축 | Encoder·Decoder·Processor 등의 역할과 분리 |
| HDMI / SDI | Interface / Signal 관련 탐색 축 | 같은 명칭에 커넥터·신호 규격 의미가 섞일 수 있어 상세에서 구분 |
| HDCP | 보호·연동 조건의 Capability/지원 정보 | 장비 종류가 아니며 단순 케이블 모양과도 다름 |
| PoE | 전원 공급/수전 관련 Capability와 조건 | 공급/수전 역할과 전원 조건을 확인해야 함 |
| 4K / 8K / 4K60 | 영상 Format·Specification/Capability | 해상도·주사율·색 조건의 일부. 제품 Category로 만들지 않음 |
| 광 / CAT / AOC | Transport·매체 또는 케이블 특성 | 장비 역할을 대신하지 않음 |
| PSE | 전원 역할·제품 변형 검토 정보 | 별도 Model/SKU인지 확인 필요. 새 Category로 만들지 않음 |
| 벽부형 / 랙형 | 설치 특성 | 서로 다른 역할의 장비에도 적용 가능 |

이 표의 Protocol/Capability 표기는 최종 기술 용어 사전이나 표준의 상세 정의가 아니다. 각 정보를 적합한 검색·필터 축으로 나누려는 개념 제안이다. 지원 여부·버전·조건은 실제 근거를 확인한 뒤 표시한다.

### 7.1 예외와 동의어

“Dante 인터페이스”, “SDI 분배기”, “HDMI 케이블”, “NDI 인코더” 같은 익숙한 복합 검색어는 허용한다. 하지만 각각 Audio Interface + 지원 기술, Video Distribution Amplifier + Signal, Cable + Interface, Video Encoder + 지원 기술의 조합으로 탐색한다.

예외적인 독립 Category는 **고유한 장비 역할·사용자 탐색 목적·별도 사양/비교 기준이 반복적으로 필요한 경우**에만 제안한다. 이번에는 Protocol 이름만으로 만든 예외 Category를 채택하지 않는다. 검색 별칭을 위해 Tree를 늘리지 않는다.

## 8. Modular Product, Cable, Accessory 처리

### 8.1 모듈형 장비

| 대상 | 분류 후보 | Taxonomy 밖에서 다룰 관계 |
|---|---|---|
| 모듈형 Matrix Chassis | Video → Matrix Switcher → 모듈형 | 어떤 카드가 어느 슬롯에 장착 가능한가 |
| Input / Output Card | Video → Matrix Module → 입력/출력 카드 | 허용 섀시·펌웨어·조합·슬롯 조건 |
| 독립형 TX / RX | Connectivity → AV Extender → 송신/수신 | 대응 TX/RX, 호환 Matrix Card |
| 전송용 Module / Frame | Connectivity → 전송 모듈·프레임 | 어떤 모듈을 수용하는가 |
| 별도 전원 품목 | Connectivity → AV Accessories → 전원 보조 부품 후보 | 필요한 전압·용량·공급 대상·기본 포함 여부 |

Category에 카드가 올라간다는 사실은 단독 구매·호환이 검증됐다는 뜻이 아니다. 카드의 신호·수량·전원 조건을 만들어 넣지 않는다. 모듈이라는 말만으로 모든 모듈을 Accessory로 모으지 않고 주된 장비 역할을 따른다.

기본형/PSE와 TX/RX 묶음은 별도 분류 Category를 만들지 않는다. 전자는 확인이 필요한 제품 변형, 후자는 현재 카탈로그의 표현 단위일 수 있다. 슬래시로 묶인 이름을 판매 세트 SKU로 확정하거나 두 제품 행으로 분리하지 않는다.

### 8.2 Cable

초기에는 **Connectivity → Cable 한 Category**를 권고한다. HDMI Cable / Fiber Cable / Network Cable / Audio Cable을 모두 별도 Subtype으로 만들기보다 양단 Connector·Interface·매체·길이·AOC·잠금·보호 형태 등의 확인된 Filter로 찾게 한다.

특히 HDMI AOC는 HDMI 연결 특성과 광 매체 특성을 함께 가질 수 있으므로 어느 한 갈래에만 넣는 깊은 Tree보다 별도 탐색 축이 유리하다. 활성 소자가 있다는 이유만으로 기존 AOC 항목을 독립 Extender로 옮기지 않는다. 제품의 케이블 형태와 기존 설명을 보존한다.

케이블 비교는 Category만 같다고 허용하지 않는다. 양단 접속·방향·판매 단위·길이 조건의 차이를 확인한다. EA/SET/m와 같은 수량 단위는 Taxonomy의 가지가 아니다.

### 8.3 Accessory

AV Accessories는 장착·전원·랙 보조 부품처럼 **보조 목적이 분명한 품목**에 제한한다. 분류하기 어려운 모든 장비를 넣는 기본값으로 사용하지 않는다. 초기 해당 품목이 없으면 메뉴에 노출하지 않는다.

독립 Network Switch는 PoE를 지원해도 Network이고, 별도 전원 공급만 주 역할인 품목은 전원 보조 부품 후보가 될 수 있다. 실제 제품 성격이 없으면 “전원 장비”라는 문자열만으로 확정하지 않는다. 도구의 잠정 BOM 문구를 Library 제품으로 자동 생성하지 않는다.

## 9. Search / Filter와 Product Compare Group

### 9.1 Search / Filter

공통 탐색 축은 Manufacturer, Domain/Category, Series, Verification이다. Category별 유용한 조건은 §6을 사용한다. Subtype은 별도의 깊은 탐색 단계를 강제하기보다 해당 Category의 선택 조건으로 사용할 수 있다.

MVP 1에서는 기본 탐색과 확인된 단순 Filter만 제공한다. Dynamic Filter 고도화와 Compare는 MVP 1.5, 고급 수치 검색·Admin은 Phase 2라는 승인된 순서를 유지한다. 분류 사전에 Filter 후보가 있다는 이유로 전부 구현하지 않는다.

데이터가 없는 Filter는 노출하지 않는다. `지원하지 않음`, `0`, `해당 없음`, `정보 없음`을 구분하며 미확인 제품을 자동으로 제외하지 않는다. 검색 결과 0개이면 조건을 그대로 설명하고 사용자가 해제하게 한다. Category 변경 시 의미가 없어진 조건은 해제 사실을 알려준다.

기존 분류의 “분배기·선택기”는 두 Category를 한 번에 찾는 기존 빠른 탐색 묶음으로 남길 수 있다. 이 묶음 자체를 비교 가능한 단일 제품 종류로 취급하지 않는다.

### 9.2 Comparison Group 제안

Comparison Group은 새 Tree가 아니라 **비교할 때 의미와 제품 단위가 맞는지 확인하는 관점**이다. 같은 Category는 출발점이지만 충분조건은 아니다. MVP 1.5에서는 같은 Category·동일 수준 항목 비교라는 승인된 제한을 유지한다. 다른 Category 사이의 비교를 이번에 새로 허용하지 않는다.

| 비교 대상 | 같은 비교군으로 보기 전 확인할 점 |
|---|---|
| Matrix Switcher | Series 소개 vs 개별 Chassis 구분, 모듈형/일체형, 장착 구성·I/O 조건 |
| Matrix Module | 입력 vs 출력 역할, 카드 단위·처리 기능. 같은 비교군이어도 상호 호환 보장 아님 |
| AV Extender | TX/RX/역할 전환형, 단품 vs 묶음, 매체·거리의 적용 조건 |
| Video Processor | Scaler 중심 vs 합성/멀티윈도 중심, 장착 구성·자원 용어 |
| Microphone / 무선 시스템 | 단일 수음 장치 vs 송수신 시스템/구성품은 구별 |
| Direct View LED | Cabinet vs 일체형 표시 장치, 비교하는 면적·수량·조건 |
| Cable | 접속 목적·양단·길이·판매 단위·방향성 |
| Accessories / 접속 부품 | 같은 보조 목적·전기/기계 역할인지 확인 |

Microphone와 Amplifier, Matrix Switcher와 Cable, LED Cabinet과 Projector는 같은 비교군이 아니다. 서로 다른 사양을 단일 숫자로 환산하거나 숫자가 크다는 이유로 더 좋은 제품이라고 표시하지 않는다. 비교 분류의 일치는 구매 대체 가능성이나 Compatibility 판정이 아니다.

## 10. 기존 RTCOM Category Mapping 후보

새 분류는 **검토용 대응표**다. 현재 5개 Category를 참고하되 제외 모델은 Mapping 대상에 넣지 않는다. 일괄 이름 교체·제품 분할·삭제·Migration은 수행하지 않는다.

| Existing Category | Proposed Domain | Proposed Category | Proposed Subtype | Notes |
|---|---|---|---|---|
| 모듈형 매트릭스 (`matrix`) | Video | Matrix Switcher | 모듈형 | 기존 3개는 Series 소개 항목. 개별 Chassis로 변환하지 않음 |
| 일체형 매트릭스 (`integrated`) | Video | Matrix Switcher | 일체형 | 제외 모델을 뺀 QMS 2개 항목의 Matrix Switcher 설명에 근거 |
| 분배기 / 선택기 (`distribution`) | Video | Video Distribution Amplifier 또는 Signal Switcher | 기본 미지정 | 하나의 기존 분류가 두 역할로 대응. 개별 행 검토 필요 |
| 전송기 / 확장 (`extender`) | Connectivity | AV Extender 또는 Extender Module / Frame | 송신/수신/역할 전환/프레임 중 확인된 역할 | 12개 중 MR-4S는 프레임 후보. 묶음은 단일 TX/RX로 확정하지 않음 |
| 케이블 (`cable`) | Connectivity | Cable | 미지정 | HDMI·광·AOC·잠금·아머드는 특성/Filter로 분리 |

기존 사용자가 5개 분류로 찾던 경로는 전환을 검토하더라도 유지할 필요가 있다. 대표적으로 “전송기·확장”을 누르면 프레임이 사라지지 않게 기존 묶음 전체를 볼 수 있어야 한다. 제외 모델을 뺀 항목 중 아직 Mapping이 승인되지 않은 항목은 기존 분류에서 계속 찾을 수 있게 한다.

## 11. Mapping의 근거 수준

| Confidence 표기 | 의미 |
|---|---|
| `D — DOCUMENTED IN EXISTING` | 기존 코드의 설명·기능이 역할 분류를 뒷받침. 공식 재검증 완료가 아님 |
| `REVIEW REQUIRED` | 상위 역할 후보는 있으나 정확한 분류·Subtype·표현 단위가 추가 검토 필요 |
| `UNVERIFIED` | 해당 세부 역할 또는 관계를 현재 근거로 확인할 수 없음 |

Mapping Confidence와 제품의 기존 `CATALOG_ONLY / NEEDS_REVIEW / CONFLICTED`는 별개의 정보다. 예를 들어 익스텐더라는 역할은 확인할 수 있어도 해상도나 방향 표기는 충돌할 수 있다. 아래의 p. 번호는 **기존 코드가 참조하는 카탈로그 페이지**이며 이번에 그 페이지 원문을 다시 검증했다는 뜻이 아니다.

## 12. Portal 대상 RTCOM 28개 항목 Mapping

아래 표의 짧은 Category 이름은 §6·§15의 같은 Category를 가리킨다. `미지정`은 Category 미분류가 아니라 해당 Subtype을 확정하지 않았다는 뜻이다. TX/RX 묶음은 표현 단위로 별도 설명하며 Subtype을 새로 “세트”로 만들지 않는다.

| Existing Item / Group | Existing Category | Proposed Domain | Proposed Category | Proposed Subtype | Confidence / Notes |
|---|---|---|---|---|---|
| XDM Series | 모듈형 매트릭스 | Video | Matrix Switcher | 모듈형 | D. 프레임·입출력 카드 구성 설명, p.4–12. Series 항목 유지; 개별 섀시가 아님 |
| SPX Series | 모듈형 매트릭스 | Video | Matrix Switcher | 모듈형 | D. 메인 프레임과 입력/출력 카드 설명, p.13–16. 처리 기능이 있어도 Processor로 자동 변경하지 않음 |
| VDM Series | 모듈형 매트릭스 | Video | Matrix Switcher | 모듈형 | D. 프레임·크로스 플랫폼·카드 정보, p.17–27. 실제 슬롯·사양 확정과 구분 |
| QMS-44UX | 일체형 매트릭스 | Video | Matrix Switcher | 일체형 | D. 4x4 Matrix 설명, p.29. PIP·스케일링은 추가 기능 |
| QMS-88UX | 일체형 매트릭스 | Video | Matrix Switcher | 일체형 | D. 8x8 Matrix 설명, p.30. 운용 모드와 분류를 구별 |
| HD-D102U | 분배기·선택기 | Video | Video Distribution Amplifier | 미지정 | D. Splitter 및 입력 1·출력 2 설명, p.31 |
| HDS-21U | 분배기·선택기 | Video | Signal Switcher | 미지정 | D. Switcher·Fast Switching·Priority 설명, p.34. 숫자만으로 분류한 것이 아님 |
| HDS-42MU | 분배기·선택기 | Video | Signal Switcher 후보 | 미지정 | REVIEW REQUIRED. Switcher 설명은 있으나 4x2 출력의 독립 경로 선택 여부 미확인, p.35. Matrix와의 경계 확인 전 기존 분류 유지 |
| HD-13U | 분배기·선택기 | Video | Video Distribution Amplifier | 미지정 | D. 1x3 Splitter 설명, p.36 |
| HD-104U | 분배기·선택기 | Video | Video Distribution Amplifier | 미지정 | D. 1x4 Splitter 설명, p.37 |
| HD-108U | 분배기·선택기 | Video | Video Distribution Amplifier | 미지정 | D. 1x8 Splitter 설명, p.38 |
| HD-210U | 분배기·선택기 | Video | Video Distribution Amplifier 후보 | 미지정 | REVIEW REQUIRED. 2x10 Splitter 설명, p.39. 복수 입력의 선택·분배 동작 미확인; 이름/포트 수로 Matrix를 확정하지 않음 |
| XDM-CTR100 / PSE | 전송기·확장 | Connectivity | AV Extender | 역할 전환형 후보 | D: Transceiver·TX/RX 역할 전환 설명, p.10. REVIEW REQUIRED: 기본형/PSE 개별 역할·판매 변형·전원 범위. 현재 묶음 보존 |
| XDM-CT103 / CR103 | 전송기·확장 | Connectivity | AV Extender | 미지정 — TX/RX 묶음 표시 | D. 벽부형 송수신기 설명, p.11. Wall Plate로 이동하지 않음. 세트 SKU 여부 UNVERIFIED |
| XDM-FT101 / FR101 | 전송기·확장 | Connectivity | AV Extender | 미지정 — 묶음 보존 | D. Fiber Extender와 광 전송 설명, p.12. 개별 TX/RX 방향은 본 표에서 확정하지 않음 |
| CT101-U / CR101-U | 전송기·확장 | Connectivity | AV Extender | 미지정 — 묶음 보존 | D. HDBaseT Extender 설명, p.21. 개별 역할·세트 판매 단위는 별도 확인 |
| CT102-U / CR102-U | 전송기·확장 | Connectivity | AV Extender | 미지정 — TX/RX 묶음 표시 | D. Scaling Extender·수신기 스케일링 설명, p.22. Scaler 기능은 주 분류를 대체하지 않음 |
| CT103-U-H / CR103-U | 전송기·확장 | Connectivity | AV Extender | 미지정 — TX/RX 묶음 표시 | D: 벽부형 송수신기 설명, p.23. 기존 NEEDS_REVIEW 유지, 해상도 REVIEW REQUIRED |
| FT101-U / FR101-U | 전송기·확장 | Connectivity | AV Extender 후보 | 미지정 | REVIEW REQUIRED. Fiber Extender 설명, p.24. 기존 CONFLICTED·프로토콜 확인 필요 보존. 세부 Protocol/역할 미확정 |
| FT102-U / FR102-U | 전송기·확장 | Connectivity | AV Extender 후보 | 미지정 | REVIEW REQUIRED. Scaling Fiber Extender 설명, p.25. 기존 CONFLICTED·방향 표기 충돌. TX/RX Subtype 강제 금지 |
| FT103-U-H / FR103-U | 전송기·확장 | Connectivity | AV Extender 후보 | 미지정 | REVIEW REQUIRED. Wall Plate Fiber Extender 설명, p.26–27. 기존 CONFLICTED·방향 표기 충돌 보존 |
| MR-4S | 전송기·확장 | Connectivity | Extender Module / Frame | 전송 확장 프레임 | D. Modular Extension Frame·모듈 혼합·단일 전원 설명, p.40. 독립 TX/RX로 분류하지 않음; 수용 모듈 관계는 별도 검증 |
| OBHD-2C | 전송기·확장 | Connectivity | AV Extender | 미지정 | D. HDMI Fiber Extender 설명, p.41. 항목이 개별 TX/RX인지 판매 쌍인지 UNVERIFIED |
| OBUX-1C | 전송기·확장 | Connectivity | AV Extender | 미지정 | D. HDMI Fiber Extender·오디오 기능 설명, p.42. 개별 역할·판매 단위 UNVERIFIED |
| HOC-UX | 케이블 | Connectivity | Cable | 미지정 | D. Active Optical Cable 설명, p.43. AOC·HDMI는 특성 |
| LHOC | 케이블 | Connectivity | Cable | 미지정 | D. Locking HDMI Active Optical Cable 설명, p.44. 잠금·설치 조건은 특성 |
| AHOC | 케이블 | Connectivity | Cable | 미지정 | D. Armored HDMI Active Optical Cable 설명, p.45. 아머드·스풀은 특성/옵션 |
| UMC Locking Cable | 케이블 | Connectivity | Cable | 미지정 | D. Locking HDMI Cable·길이 구성 설명, p.46. 길이별 SKU 생성 없음 |

**수량 확인:** Portal 대상은 기존 분류 기준 3 + 2 + 7 + 12 + 4 = **28개**다. 대응 후보는 Matrix Switcher 5, 영상 분배기 5, 영상 선택기 2, AV Extender 11, 전송 프레임 1, Cable 4다. 제외 모델은 Mapping 행과 합계에서 제거했다. 원본 31개는 과거 조사 수량으로만 보존한다. 이는 문서상 대상 수량이며 실제 등록 완료 수가 아니다.

### 12.1 Configurator 내부 항목의 추가 참고 — 28개에 가산하지 않음

| Existing Item / Group | 기존 위치 | Proposed Domain / Category / Subtype | Confidence / Notes |
|---|---|---|---|
| XDM-12 / XDM-20 / XDM-36 등 | catalog.js의 XDM models | Video / Matrix Switcher / 모듈형 | D. 구성기의 섀시 선택 목록이라는 근거. Library 3개 Series를 개별 모델로 자동 확장하지 않음 |
| XDM-288 | XDM models·상세 사양 확인 예정 | 같은 분류 후보 | REVIEW REQUIRED. 기존 미확정 사양 유지 |
| XDM-HI100·HIS100·DPI100·CIS100·FIS100·SIS100 | XDM input 목록 | Video / Matrix Module / 입력 카드 | D. 입력 목록 위치·설명에 근거. 접미사만으로 추론하지 않음 |
| XDM-HOS100·DPOS100·COS100·FOS100·SOS100·WOS100 | XDM output 목록 | Video / Matrix Module / 출력 카드 | D. 출력 목록에 근거. 모든 섀시 장착 가능을 의미하지 않음 |
| SPX의 models, input, output 그룹 | catalog.js의 SPX 그룹 | Video / Matrix Switcher·Matrix Module | D: 원본 역할 그룹. 세부 섀시/카드 허용 조건 REVIEW REQUIRED |
| VDM의 models, input, output 그룹 | catalog.js의 VDM 그룹 | Video / Matrix Switcher·Matrix Module | D: 원본 역할 그룹. 세부 슬롯·혼합 조건 REVIEW REQUIRED |
| 별도 POE Power Supply 등 잠정 전원 문구 | 평가 문서의 Configurator BOM | Connectivity / AV Accessories / 전원 후보 | UNVERIFIED. 제품 Model·공급 방식 확인 없이 Library 항목으로 만들지 않음 |

## 13. Naming Rules

화면 표시는 한글을 우선하고 필요 시 영문을 병기한다. 검색에서는 한글·영문·확인된 약어를 함께 찾을 수 있게 하되, 본문에서 사용하는 대표 이름은 일관되게 유지한다.

| 원칙 | 예시 |
|---|---|
| 장비 역할을 간단히 표현 | 매트릭스 스위처, 영상 분배기, 오디오 DSP, 네트워크 스위치 |
| 업계 약어는 허용하고 필요한 곳에서 설명 | DSP, LED, TX(송신), RX(수신) |
| Series는 제조사 공식 표기를 유지 | XDM, SPX, VDM, MTX를 일반 Category 이름으로 쓰지 않음 |
| 동의어는 검색을 위한 연결 | 분배기/Splitter/Distribution Amplifier, 선택기/Switcher는 검토된 맥락에서 연결 |
| 충돌 가능한 짧은 용어는 영역을 표시 | 영상 선택기 vs 네트워크 스위치, 영상 변환기 vs 오디오 변환기 |
| 설치·Protocol·성능을 Category 명칭에 누적하지 않음 | “4K HDMI 광 벽부 TX”는 익스텐더 + 확인된 특성 조합 |
| 검토 상태는 명칭에 섞지 않음 | 정식 제품명은 보존하고 REVIEW REQUIRED는 별도 상태 |

다른 제조사에서 같은 Series 이름을 사용하면 제조사 맥락으로 구분한다. Subtype에 Manufacturer나 특정 Model명을 넣지 않는다. 모델명·PSE·TX/RX 표기를 임의 정리해 제품 차이를 없애지 않는다. 최종 번역 사전·내부 코드값·Slug는 이번에 정하지 않는다.

## 14. 초기 노출과 과설계 방지

분류 사전 전체와 사용자에게 보이는 메뉴 전체는 같지 않다. 초기에는 근거가 있는 RTCOM 분류·대응 후보를 중심으로 제공하고 확장 Category는 실제 콘텐츠가 생길 때 활성화를 검토한다.

| 구분 | 범위 | 현재 처리 |
|---|---|---|
| Library 직접 대응 | Matrix Switcher, 영상 분배기, 영상 선택기, AV Extender, 전송 프레임, Cable | 28개 대응표 검토. 실제 데이터 변경 없음 |
| 기존 구성기에서 확인 | Matrix Module, 개별 Chassis | 분류상 자리를 정의. Library 공개 등록 여부는 별도 결정 |
| 향후 다제조사 확장 | Audio, Display, Control, Conferencing, Network 및 그 밖의 Video Category | 제품 수집·등록 없이 정의만 준비 |
| 경계 미확정 | Gateway/겸용 Endpoint·일부 Switcher·묶음 역할 | 기존 분류 유지/검토 목록. 새 Category를 선제적으로 늘리지 않음 |

새 Category를 늘리기 전에는 기존 Category+Attribute로 사용자가 찾을 수 있는지 먼저 검토한다. 독립된 역할과 사양·비교 요구가 확인될 때만 추가하며 모든 Category에 Subtype을 강제하지 않는다.

## 15. 최종 추천 Taxonomy Tree — 검토용 제안

`[초기 후보]`는 28개 Portal 대상 Library 항목의 대응이 있는 분류이고 `[구성기 참고]`는 현재 Library 항목과 별개다. 표기 없는 Category는 확장 후보이며 초기 빈 메뉴 노출을 요구하지 않는다. 들여쓰기의 최대 분류 깊이는 Domain → Category → Subtype이다.

```text
AV Equipment
├─ 영상 (Video)
│  ├─ 매트릭스 스위처 (Matrix Switcher) [초기 후보]
│  │  ├─ 모듈형 (개별 섀시 또는 해당 제품군의 분류)
│  │  └─ 일체형
│  ├─ 매트릭스 모듈·카드 (Matrix Module) [구성기 참고]
│  │  ├─ 입력 카드
│  │  └─ 출력 카드
│  ├─ 프레젠테이션 스위처 (Presentation Switcher)
│  ├─ 비디오 프로세서 (Video Processor)
│  │  └─ 전문 스케일러 (필요한 경우만 Subtype)
│  ├─ 영상 분배기 (Video Distribution Amplifier) [초기 후보]
│  ├─ 영상 선택기 (Signal Switcher) [초기 후보]
│  ├─ 영상 인코더 (Video Encoder)
│  ├─ 영상 디코더 (Video Decoder)
│  ├─ 영상 변환기 (Video Converter)
│  └─ 카메라 (Camera)
├─ 음향 (Audio)
│  ├─ 믹서 (Mixer)
│  ├─ 오디오 DSP (DSP)
│  ├─ 앰프 (Amplifier)
│  ├─ 스피커 (Speaker)
│  ├─ 마이크 (Microphone)
│  ├─ 무선 마이크 시스템 (Wireless Microphone System)
│  ├─ 오디오 인터페이스 (Audio Interface)
│  └─ 오디오 변환기 (Audio Converter)
├─ 디스플레이 (Display)
│  ├─ LCD 사이니지 (LCD Signage)
│  ├─ 직시형 LED (Direct View LED)
│  │  ├─ LED 캐비닛
│  │  └─ 일체형 LED 디스플레이
│  ├─ 프로젝터 (Projector)
│  └─ 모니터 (Monitor)
├─ 제어 (Control)
│  ├─ 제어 프로세서 (Control Processor)
│  ├─ 터치 패널 (Touch Panel)
│  └─ 제어 인터페이스 (Control Interface)
├─ 회의·협업 (Conferencing)
│  ├─ 회의 단말 (Conferencing Endpoint)
│  │  ├─ Codec 중심 단말
│  │  └─ 통합형 회의 장치
│  ├─ 스피커폰 (Speakerphone)
│  └─ 회의 프로세서 (Conferencing Processor)
├─ 연결·전송 (Connectivity)
│  ├─ AV 익스텐더 (AV Extender) [초기 후보]
│  │  ├─ 송신기 (Transmitter / TX)
│  │  ├─ 수신기 (Receiver / RX)
│  │  └─ 역할 전환형 (Transceiver)
│  ├─ 전송 모듈·프레임 (Extender Module / Frame) [초기 후보: 프레임]
│  │  ├─ 전송 확장 프레임
│  │  ├─ 송신 모듈
│  │  └─ 수신 모듈
│  ├─ 케이블 (Cable) [초기 후보]
│  ├─ 접속·단자 부품 (Adapter / Termination)
│  └─ AV 보조 부품 (AV Accessories)
│     ├─ 장착 보조 부품
│     ├─ 전원 보조 부품
│     └─ 랙 보조 부품
└─ 네트워크 (Network)
   ├─ 네트워크 스위치 (Network Switch)
   └─ 네트워크 인터페이스 (Network Interface)
```

§5의 Domain 설명표, §6의 Category 범위·Specification·Filter 표, §10–12의 Mapping이 Tree의 해석 기준이다. Tree의 Subtype이 해당 제품에 적용되지 않거나 확인되지 않으면 비워 둘 수 있다. “기타” Subtype을 채우기 위해 추측하지 않는다. 세트·Series·Model 같은 표현 수준을 네 번째 계층으로 붙이지 않는다.

## 16. 미결정 사항과 사용자 확인 요청

| 검토 사항 | 권고안 / 남은 확인 |
|---|---|
| Extender의 주 Domain | Connectivity에 한 번만 두고 Video 탐색에서는 용어·Filter로 찾게 하는 안 검토 |
| Camera와 USB AV Device | Camera는 Video, USB는 Attribute, 통합 회의 장비만 Conferencing으로 두는 안 검토 |
| Scaler 분리 수준 | 처음에는 Video Processor의 전문 Subtype. 실제 독립 탐색 수요가 커지면 Category 분리 검토 |
| 초기 Home | 기존 5개 빠른 탐색을 보존하면서 콘텐츠가 있는 Domain으로 묶어 제공하는 안 검토 |
| HDS-42MU / HD-210U | 출력·입력의 실제 선택/분배 방식 확인 전 기존 분류 유지 |
| XDM-CTR100 / PSE, TX/RX 묶음 | 개별 역할·변형·판매 구성 미확정. Subtype 강제·항목 분할 금지 |
| VDM 광 계열·CT103-U-H | 기존 방향/프로토콜/해상도 검토 상태 유지. 사양 충돌을 분류 작업으로 해결하지 않음 |
| MR-4S | 전송 확장 프레임 분류 후보. 실제 수용 모듈·호환 조건은 별도 확인 |
| 구성기 카드·개별 Chassis의 Library 공개 | 분류 자리는 준비하되 등록 범위는 아직 결정하지 않음 |
| Comparison Group | 같은 Category에 추가적인 수준·역할 구분이 필요하다는 원칙 검토. 구현·상세 규칙은 후속 |

우선 **7개 Domain의 경계, Connectivity 중심의 Extender 분류, 얕은 Category/Subtype 구조, Portal 대상 28개 Mapping 후보**를 검토해 주세요. 제품별 미확정 사실의 답을 지금 임의로 채우지는 않았다.

### 근거 위치

- 기존 기능·데이터 한계: [EXISTING_SYSTEM_ASSESSMENT.md](./EXISTING_SYSTEM_ASSESSMENT.md) §5·§8.
- 제품군/Model/판매 단위/옵션의 구분: [CORE_DOMAIN_CONCEPTS.md](./CORE_DOMAIN_CONCEPTS.md) §0·§2.
- 승인된 단계·검색·Compare·불완전 데이터 표현: [UI_UX_SPEC.md](./UI_UX_SPEC.md) §1·§7·§10·§11.
- 31개 항목의 직접 근거: [고정 커밋의 product-catalog.js](https://github.com/seoulav/rtcom-configurator/blob/1d97f429328f1bd486ef1f7c881424b7e3bdcde8/src/product-catalog.js), `sourceProducts`, `verificationFor`.
- 구성기 섀시·카드 그룹: [고정 커밋의 catalog.js](https://github.com/seoulav/rtcom-configurator/blob/1d97f429328f1bd486ef1f7c881424b7e3bdcde8/src/catalog.js), XDM/SPX/VDM의 models/input/output.

**이번 결과물은 PRODUCT_TAXONOMY.md 하나다.** 기존 코드·데이터·기존 문서는 변경하지 않았다. 제품 수집·등록·Migration, Builder/LED 수정·데이터 통합, Database/Framework/API/JSON Schema/Product Data Schema 설계, Authentication·Admin·Compatibility·AI 추천 구현은 수행하지 않았다. Taxonomy 검토 전 작업을 멈추며 `PRODUCT_DATA_SCHEMA.md`는 작성하지 않는다.
