# Yamaha DM7 — Product Detail 콘텐츠 패키지

- 조사·확인일: 2026-09-24 (KST)
- 작업: W-20260924-001 구현 준비. 화면 콘텐츠 작성 완료, 구현·배포 미승인.
- 대상: 공개 beta/site/catalog.json의 Yamaha / DM7 1개. Sony BRC-AM7도 목록에 있으나 후보 비교 후 추가 조사하지 않았다.
- 최종 Schema나 DB 형식이 아닌 화면용 편집 원고·출처 대장이다. 제조사 원문·사진·PDF는 이 문서에 복제하지 않는다.
- 확보는 열람·모델 확인을 뜻하며 공개 재게시 허가를 뜻하지 않는다.

## 1. 선정 이유

DM7은 한국 공식 제품 페이지에서 본체와 COMPACT·Control을 구분한 이미지와 사양을 제공한다. 한국어 사용설명서·참고 설명서의 실제 본문, 영어 데이터시트·블록도·CAD·브로슈어도 확인했다. 물리 단자와 논리 채널, 고정 포트와 옵션 슬롯을 나눠 보여주기 좋다.

Sony BRC-AM7은 한국 공식 제품 사양 및 지원 페이지·글로벌 Help Guide 존재까지 후보 비교했다. 두 제품의 전체 자료량을 평가한 결과는 아니며, 이번 목적에 필요한 DM7의 자료가 충분하여 범위를 DM7 하나로 확정했다.

## 2. Product Identity / Header 확정 원고

여기서 확정은 이번 시안에 쓸 편집 원고를 뜻하며 제품 데이터 반영·공개 승인과 다르다.

| 필드 | 화면 콘텐츠 | 근거 |
|---|---|---|
| Manufacturer | Yamaha | S1 |
| Product Name | DM7 디지털 믹싱 콘솔 | S1 |
| Model | DM7 | S1, S3 표지·p.8 |
| Series | DM7 Series | S1 |
| Category | Audio / Mixer / Digital Mixing Console | 앞의 Audio·Mixer는 현 공개 목록, 세부 유형은 S1에 근거한 표시용 제안 |
| Short English Description | A digital mixing console with Dante networking and 120 mono input channels. | S1, S3 p.19를 자체 요약 |
| Korean Product Description | DM7은 라이브 공연·방송·설치 음향을 위한 디지털 믹싱 콘솔입니다. 120개 모노 입력 채널과 28개 페이더를 갖추고, 본체 아날로그 입출력과 Dante 네트워크를 함께 사용합니다. | S1, S3 p.19 자체 요약 |
| Verification Summary | 주요 하드웨어 사양·입출력은 공식 자료로 확인했습니다. 자료 간 USB 표기 차이와 문서 최신성은 별도 확인 사항입니다. 이미지·PDF 재게시 허가는 미확인입니다. | 아래 검토 기록 |

DM7 COMPACT의 72채널·16입력·16페이더·16.5kg, DM7 Control의 외형·사양·설명서를 DM7에 혼용하지 않는다. DM7-EX 또는 옵션 장착 상태로 표현하지 않는다.

## 3. 이미지 대장

네 개의 고유 이미지 파일을 실제 열어 역할·제품 표기·크기를 확인했다. Main은 Front를 대표로 지정하므로 중복 썸네일을 만들지 않는다. 모두 Manufacturer Official이며 Supplemental은 사용하지 않았다. 이미지의 날짜·개정은 미표기다. 숫자는 원본 픽셀 크기로 페이지의 썸네일 표시 크기와 다르다.

| ID / Image Role | Source URL | Resolution | 확인·사용 가능성 메모 |
|---|---|---|---|
| I1 Main + Front | [DM7 정면 원본](https://kr.yamaha.com/ko/files/DM7-front-4000_tcm144-2158404.jpg) | 4000×4000 | S1의 DM7 본체 갤러리. 정면에서 조작면을 내려다본 사진이다. 물리 Front Panel의 PHONES 단자가 보이는 정면도와 동일시하지 않음. 공개 재게시·핫링크 허가 미확인 |
| I2 Rear | [DM7 후면 원본](https://kr.yamaha.com/ko/files/DM7-rear_tcm144-2158567.jpg) | 2000×2000 | DM7 로고 및 후면 단자 라벨 확인. 공개 재게시·핫링크 허가 미확인 |
| I3 Perspective | [DM7 사선 원본](https://kr.yamaha.com/ko/files/DM7-angle-left_tcm144-2159042.jpg) | 2000×2000 | S1의 angle left 이미지, DM7 본체. 공개 재게시·핫링크 허가 미확인 |
| I4 Other — Top | [DM7 상단 원본](https://kr.yamaha.com/ko/files/DM7-top-4000_tcm144-2158732.jpg) | 4000×4000 | 상단 조작면, Front와 별도 역할. 공개 재게시·핫링크 허가 미확인 |

로컬 증빙 폴더: outputs/dm7-detail-preparation-20260924/. 파일: front.jpg, rear.jpg, perspective.jpg, other.jpg, images-metadata.json, evidence-sha256.json. 이 경로는 조사 PC의 저장소 루트 기준이며 다른 워크트리·GitHub에는 파일이 없다. 공개 문서의 URL로 접근 가능성을 재확인하거나 사용자가 로컬 파일을 별도로 전달해야 한다.

갤러리 alt 원고: “Yamaha DM7 정면 조작면”, “Yamaha DM7 후면 입출력 패널”, “Yamaha DM7 사선 모습”, “Yamaha DM7 상단 조작면”. 사진 원본은 변경하지 않았다. 후속 로컬 미리보기에서도 이미지 사용 조건을 확인하고, 사용할 수 없으면 “이미지 사용 확인 대기”를 표시한다. 이미지 미발견(MISSING)과 권한 미확인은 다른 상태다.

## 4. 문서·출처 대장

모든 실제 자료는 Manufacturer Official이다. 한국어 자료를 먼저 찾았으나 한국 사이트의 구 PDF 경로는 404가 발생하여 **동일 한국어 문서의 글로벌 공식 URL**을 채택했다. 미국 사이트 URL은 data.yamaha.com으로 이동한다. 언어를 호스트 국가로 추정하지 않고 본문으로 확인했다. S3/S4 표지 일부의 자동 텍스트 추출 오류는 시각 확인·본문으로 보완했다.

| ID / 유형 | Title / Language | Source URL | Revision / Date | Product 적용 확인 |
|---|---|---|---|---|
| S1 Official Product Page | DM7 시리즈 — 개요 / 한국어 | [한국 공식 제품 페이지](https://kr.yamaha.com/ko/business/audio/products/mixers/dm7/) | 개정·발행일 미표기, 확인일 2026-09-24 | DM7 본체 라인업만 사용. 다른 모델·옵션이 같은 페이지에 존재 |
| S2 Specification | DM7 시리즈 — 사양 / 한국어 페이지·영문 표 | [한국 공식 사양](https://kr.yamaha.com/ko/business/audio/products/mixers/dm7/specs.html) | 개정·발행일 미표기 | DM7 열을 사용하고 COMPACT 열 제외. 페이지 실제 열람 |
| S3 User Manual | DM7 / DM7 COMPACT 콘솔 사용설명서 / 한국어 | [공식 한국어 PDF](https://usa.yamaha.com/files/download/other_assets/9/2138359/dm7_ko_om_a1.pdf) | Published 03/2023, LBEM-A1, 24쪽 | 표지·p.8 모델, p.10–14 패널, p.19 DM7 사양 확인 |
| S4 Reference Manual | DM7 시리즈 참고 설명서 / 한국어 | [공식 한국어 참고 설명서](https://usa.yamaha.com/files/download/other_assets/7/2235257/DM7_RM_Ko_D0.pdf) | Published 05/2025, YJ-D0, 447쪽 | DM7 시리즈 공통. 전체 447쪽 기능 검증 아님; 최신 펌웨어 전체 적용은 미확인 |
| S5 Datasheet | DM7 Data Sheet / 영어 | [DM7 Series 데이터시트 ZIP](https://usa.yamaha.com/files/download/other_assets/0/2168440/DM7_series_datasheet.zip) | 문서 개정·발행일 미표기. PDF 수정 메타데이터 2023-09-20은 발행일로 사용하지 않음 | ZIP의 DM7_series_datasheet/DM7_data_sheet.pdf, 12쪽. COMPACT 파일 제외. p.2–6 사양·단자·치수 확인 |
| S6 Technical Document | DM7, DM7 Compact Block Diagram / 영어 | [공식 블록도 PDF](https://usa.yamaha.com/files/download/other_assets/3/2138363/dm7_bd_c0.pdf) | Published 08/2023, IP-C0, 8쪽 | DM7와 COMPACT 공동 문서. DM7 표시 범위만 적용; 설치 배선도 아님 |
| S7 Drawing / CAD | CAD Data (DM7 Series) / 언어 비의존 DXF | [공식 CAD ZIP](https://usa.yamaha.com/files/download/other_assets/7/2138267/DM7_series_dxf.zip) | 개정·발행일 미확인 | ZIP 내부 DM7_series_dxf/DM7.dxf 확인. 도면 렌더·치수 정밀 검증은 미실시. DM7-EX·COMPACT 파일 사용 금지 |
| S8 Brochure | DM7 Series Brochure / 영어 | [공식 브로슈어 PDF](https://usa.yamaha.com/files/download/brochure/6/2139246/DM7-brochure-en-web.pdf) | PDF 제목 “DM7 brochure 2023 EN”; 별도 개정 코드 미확인, 9쪽 | DM7/COMPACT 공동 문서. 제품 식별과 요약 사양 확인, 기능 전체 최신성 검증 아님 |
| S9 Installation Guide | DM7 본체 전용 독립 설치 가이드 / MISSING | 없음 | 없음 | 사용설명서에 설치·카드 장착 설명이 있으나 독립 가이드로 둔갑시키지 않음. DM Editor 설치 가이드는 PC 소프트웨어용 |
| S10 Quick Start Guide | DM7 본체 전용 독립 빠른 시작 가이드 / MISSING | 없음 | 없음 | 조사한 공식 목록에서 독립 문서 미발견. 존재하지 않는다고 단정하지 않음 |
| S11 자료 탐색 경로 | 한국 Resources / 한국어 | [한국 공식 자료 목록](https://kr.yamaha.com/ko/business/audio/products/mixers/dm7/resources.html) | 동적 목록, 개정 미표기 | 본문 목록은 동적 로딩이라 정적 HTML만으로 없음 판정하지 않음 |
| S12 보완 탐색 경로 | DM7 Downloads / 영어 | [글로벌 공식 자료 목록](https://usa.yamaha.com/products/proaudio/mixers/dm7/downloads.html) | 확인일 2026-09-24 | S5–S8의 링크 확인. 펌웨어 V2.00 표기가 있어 구 문서를 최신이라고 표시하지 않음 |

독립 Specification PDF는 MISSING이다. Specification 카드는 실제 확인한 S2 웹 사양으로 제공할 수 있다. Datasheet ZIP에 A&E 사양이 포함되어 있어도 별개 PDF가 있는 것처럼 만들지 않는다. 한국어 Datasheet·Brochure·Block Diagram은 이번 조사에서 미발견으로 남기고 영어 자료임을 표시한다.

문서 원본은 로컬에서 읽었으며 GitHub에는 링크·자체 요약·확인 결과만 남긴다. S3 p.6은 설명서 복제에 제조사 서면 동의를 요구한다. 따라서 다운로드 가능하다는 이유로 PDF·도면·사진을 AV Portal에 재업로드하거나 허가 완료로 표시하지 않는다.

## 5. Overview 확정 원고

DM7은 본체의 마이크·라인 입력과 네트워크 오디오를 한 콘솔에서 운용하는 디지털 믹서입니다. 120개 입력 믹싱 채널은 물리 입력 단자 수와 다릅니다. 본체에는 아날로그 입력 32개와 출력 16개가 있으며, Dante와 USB 오디오를 통해 외부 장치·컴퓨터에 연결할 수 있습니다. 아래 사양은 DM7 본체 기준이고 별도 카드·컨트롤러·라이선스가 포함된 구성은 뜻하지 않습니다.

근거: S1, S3 p.12–13·19, S5 p.2–4.

## 6. Features 확정 원고

1. 120개 모노 입력 채널과 48 Mix·12 Matrix·2 Stereo 버스로 믹싱을 구성합니다. (S3 p.19)
2. 28개 모터 페이더와 3개 터치 화면으로 채널과 주요 기능을 조작합니다. (S3 p.19)
3. 본체의 32개 아날로그 입력과 16개 아날로그 출력으로 현장 장비를 연결합니다. (S1, S5 p.2·4)
4. Dante는 최대 144입력·144출력 채널의 네트워크 오디오를 지원합니다. 두 네트워크 단자의 채널 수를 더하지 않습니다. (S3 p.13)
5. USB-C 연결로 최대 18입력·18출력 오디오 인터페이스와 USB-MIDI를 사용합니다. 컴퓨터 드라이버 조건은 설명서를 확인해야 합니다. (S3 p.13)
6. PY 카드 슬롯 1개로 입출력을 확장할 수 있습니다. 카드는 별도이며 슬롯 자체를 추가 오디오 단자로 계산하지 않습니다. (S3 p.13·16)
7. 내장 이중 전원 공급장치와 두 AC 입력을 제공해 전원 운용을 구성할 수 있습니다. (S3 p.12)
8. 48kHz와 96kHz 샘플링을 지원하며, 장비 연결 시 클록 설정을 맞춰야 합니다. (S3 p.19)

마케팅 원문은 복사하지 않고 기능·조건을 자체 요약했다. 펌웨어별 신기능·옵션 라이선스 기능은 이번 시안의 필수 특징에 포함하지 않는다.

## 7. Structured Specifications

VERIFIED는 기재한 공식 문서·페이지와 일치한다는 뜻이다. 실측·제품 전체 인증·최신 펌웨어 전체 기능 검증을 뜻하지 않는다. 그룹별 조건·근거·상태를 유지하고 표의 값만 떼어 쓰지 않는다.

| Group | Name | Value | Unit | Condition | Source | Verification |
|---|---|---|---|---|---|---|
| General | 제품 유형 | 디지털 믹싱 콘솔 | — | DM7 본체 | S1 | VERIFIED |
| Audio | 입력 믹싱 용량 | 120 | mono channels | 물리 입력 단자 수 아님 | S3 p.19 | VERIFIED |
| Audio | 믹싱 버스 | 48 Mix / 12 Matrix / 2 Stereo | buses | Stereo B의 Mono 전환은 별도 설정 | S3 p.19, S5 p.2 | VERIFIED |
| Audio | 내부 샘플링 | 48 / 96 | kHz | 선택 설정 | S3 p.19 | VERIFIED |
| Audio | 신호 지연 | 1.5 미만 | ms | INPUT → OMNI OUT, Fs=96kHz | S3 p.19 | VERIFIED |
| Control | 모터 페이더 | 28 | 개 | 100mm 터치형, 24+4 | S3 p.19 | VERIFIED |
| Control | 터치 화면 | 12.1 × 2 / 7 × 1 | inch × 개 | DM7 본체 | S3 p.19 | VERIFIED |
| Network | Dante 오디오 | 최대 144 in / 144 out | channels | 48/96kHz, 24/32bit; Primary·Secondary 중복 합산 금지 | S3 p.13 | VERIFIED |
| Network | 제어 네트워크 | 10BASE-T / 100BASE-TX | — | Dante 포트와 별개 NETWORK 단자 | S5 p.4 | VERIFIED |
| Power | 입력 전압 | 100–240 | V AC | 50/60Hz | S3 p.19 | VERIFIED |
| Power | 소비 전력 | 240 | W | 제조사 표기, 실측 아님 | S3 p.19 | VERIFIED |
| Power | 전원 구성 | 내장 이중 전원 | — | AC IN A/B, 연결 조건 S3 참조 | S3 p.12 | VERIFIED |
| Physical | 외형 W × H × D | 793 × 324 × 564 | mm | 고무발 포함 | S3 p.19 | VERIFIED |
| Physical | 중량 | 23.5 | kg | DM7 본체 | S3 p.19 | VERIFIED |
| Environment | 작동 온도 | 0–40 | °C | 제조사 운용 범위 | S3 p.19 | VERIFIED |
| Environment | 보관 온도 | −20–60 | °C | 작동 온도와 구분 | S3 p.19 | VERIFIED |

Video 그룹은 이 오디오 믹서 시안에서 생략한다. HDMI·SDI 등 영상 입출력 항목을 만들어 넣지 않는다. 전체 사양 전사 대신 화면 검증에 필요한 16개 항목을 선정했다.

## 8. I/O

Quantity는 명시가 없으면 물리 단자 수다. 네트워크 오디오 채널·GPI 신호선은 Condition에 따로 기록한다. 기본 상태 VERIFIED(자료 대조), USB-A 행은 표기 충돌을 표시한다.

| Connector | Signal | Direction | Quantity | Protocol / Standard | Fixed / Optional | Condition | Source |
|---|---|---|---|---|---|---|---|
| XLR 3-hole, INPUT 1–32 | 아날로그 마이크/라인 | Input | 32 | Balanced analog | Fixed | 팬텀 전원은 단자별 설정, 디지털 채널 수와 구분 | S3 p.12, S5 p.4 |
| XLR 3-pin, OMNI OUT 1–16 | 아날로그 오디오 | Output | 16 | Balanced analog | Fixed | 출력 패치 설정에 따름 | S3 p.12, S5 p.4 |
| XLR 3-hole, AES/EBU IN | 디지털 오디오 | Input | 2 | AES/EBU | Fixed | 단자당 2채널, 합계 4채널; DM7 SRC 지원 | S3 p.13, S5 p.2·4 |
| XLR 3-pin, AES/EBU OUT | 디지털 오디오 | Output | 2 | AES/EBU | Fixed | 단자당 2채널, 합계 4채널; DM7 SRC 지원 | S3 p.13, S5 p.2·4 |
| etherCON CAT5e, PRIMARY/SECONDARY | 네트워크 오디오 | Bidirectional | 2 | Dante / 1000BASE-T | Fixed | 최대 144 in/144 out, 2포트 합산 금지 | S3 p.13, S5 p.4 |
| USB Type-C, TO HOST | 오디오·MIDI | Bidirectional | 1 | USB 2.0 / USB-MIDI | Fixed | 최대 18 in/18 out, 48/96kHz·32bit, PC 드라이버 필요 | S3 p.13 |
| USB Type-A, TO DEVICE | 저장·2트랙 녹음/재생 | Bidirectional | 2 | USB 2.0/1.1 | Fixed | 상단. S5 p.6 USB-B 표기와 충돌, 아래 C1 참조 | S3 p.11, S5 p.2·4; CONFLICTED |
| RJ-45, NETWORK | 외부 제어 | Bidirectional | 1 | IEEE 802.3, 10BASE-T/100BASE-TX | Fixed | Dante etherCON과 별개 포트 | S3 p.13, S5 p.4 |
| BNC, WORD CLOCK IN | 동기 클록 | Input | 1 | TTL / 75Ω termination | Fixed | 입력 내부 종단 | S3 p.13, S5 p.4 |
| BNC, WORD CLOCK OUT | 동기 클록 | Output | 1 | TTL / 75Ω | Fixed | 출력 | S3 p.13, S5 p.4 |
| XLR 3-hole, TC IN | 타임코드 | Input | 1 | SMPTE | Fixed | 아날로그 오디오 입력으로 분류하지 않음 | S3 p.13, S5 p.4 |
| D-sub 15-hole, GPI | 접점 제어 | Bidirectional | 1 | GPI | Fixed | 하나의 커넥터에 5 in/5 out | S3 p.13, S5 p.4 |
| 6.35mm TRS, PHONES | 모니터/CUE | Output | 1 | Stereo unbalanced | Fixed | 전면 하단, 레벨 조절 | S3 p.14, S5 p.4·6 |
| PY slot | 확장 카드 인터페이스 | 카드에 따름 | 1 slot | 장착 카드에 따름 | 슬롯 Fixed / 카드 Optional | 카드 미장착 기준. 별도 SKU·포트 추가 없음 | S3 p.13·16 |
| AC IN A/B | 전원 | Input | 2 | AC / V-lock | Fixed | 오디오 포트 집계 제외 | S3 p.12, S5 p.2 |

사진 연결 Notes: I2에서 INPUT·OMNI OUT·AES/EBU·Dante·NETWORK·TC IN·WORD CLOCK·GPI·USB TO HOST·PY·AC IN 위치와 라벨을 확인할 수 있다. I1/I4에서 상단 USB 위치를 확인할 수 있다. PHONES는 I1에 뚜렷하게 노출되지 않아 S3 p.14의 전면 도해로 확인한다. 사진만으로 수량을 확정하지 않았으며 클릭 핫스폿 좌표는 이번에 만들지 않는다.

## 9. Sources & Verification 화면 원고

- **공식 자료:** Yamaha 한국 제품·사양 페이지, 한국어 사용설명서/참고 설명서, 공식 글로벌 데이터시트·블록도·CAD·브로슈어.
- **보조 출처:** 이번 제품에 사용한 보조 출처 없음.
- **확인 범위:** 주요 하드웨어 사양 16항목과 입출력 대조. CAD 파일 목록 확인. 전체 펌웨어 기능·도면 정밀 치수 검증 아님.
- **검토 필요:** 문서 최신성, USB 표기 차이, 사진·PDF·CAD 재게시 허가.

| ID | 상태 | 확인 내용 | 시안 처리 |
|---|---|---|---|
| C1 | CONFLICTED | S5 p.4는 USB A, p.6 A&E 문장은 USB-B 표기. S3 p.11과 공식 사진은 상단 USB A와 부합 | USB-A 후보 표시는 유지하되 “자료 간 단자 표기 차이”와 양쪽 페이지를 연결. 제조사 정정 확인 전 충돌 종료 처리 금지 |
| C2 | REVIEW REQUIRED | S4는 2025-05 D0, S12는 펌웨어 V2.00을 표시. 최신 개정 전체 일치 검증 아님 | “최신 매뉴얼” 대신 실제 개정·발행일 표시. 신규 펌웨어 기능을 자동 추가하지 않음 |
| C3 | REVIEW REQUIRED | 사진·PDF·CAD 공개 재게시 허가 증빙 미확보. S3 p.6은 설명서 복제에 서면 동의 요구 | 파일 자체 공개 금지. 공식 문서로 이동하는 링크와 재게시를 구분 |
| C4 | REVIEW REQUIRED | CAD ZIP의 DM7.dxf 존재 확인, 형상·치수 렌더 검증 미실시 | “공식 CAD ZIP · DM7.dxf 선택”만 안내, 치수 검증 완료 배지 금지 |

## 10. 실제 화면 콘텐츠 연결

A Header는 §2 원고를 사용한다. B Gallery는 I1(Main/Front), I2(Rear), I3(Perspective), I4(Other/Top) 순서다. Main 중복 썸네일 없음.

C Quick Documents는 아래 **6카드**로 구성한다. 네이티브 PDF 재배포·iframe 삽입 대신 공식 URL로 이동한다.

| 카드 | 연결 | 라벨·조건 |
|---|---|---|
| Manual | S3, 추가 선택 S4 | 한국어 사용설명서 / 한국어 참고 설명서; 날짜·개정 각각 표시 |
| Datasheet | S5 | 영어 · ZIP · DM7_data_sheet.pdf 선택. PDF 직접 링크처럼 표시하지 않음 |
| Specification | S2 | 공식 웹 사양 · DM7 열 |
| Technical Document | S6 | 영어 · 블록도 · IP-C0 |
| Drawing | S7 | CAD ZIP · DM7.dxf · 도면 검증 미실시 |
| Official Product Page | S1 | 한국 공식 페이지 ↗ |

Brochure S8은 전체 Documents 목록에 유지한다. S9/S10은 카드 없이 “독립 설치 가이드 / 빠른 시작 가이드: MISSING”을 자료 현황에만 표시한다. 설치 설명은 사용설명서에 포함되어 있다고 안내할 수 있다.

D 본문은 Overview(§5) → Features(§6) → Specifications(§7) → I/O(§8) → Documents(§4) → Sources & Verification(§9).

### Desktop / Mobile 및 상태

- 정보 구조는 앞 단계 UI_UX_SPEC §5를 따른다. A→B→C→D 순서, 밝은 White/Light Gray·Blue Accent·일부 Blue-Purple Gradient·큰 Rounded Card·Soft Shadow·Glass/Layered·Pill Tab.
- Desktop: 큰 대표 이미지와 썸네일, Quick Documents 2열×3행, 여섯 본문 섹션 이동 링크, 사양/I/O의 조건·근거 보존.
- Mobile: 같은 콘텐츠 순서, 가로 스크롤 Sticky Pill 섹션 링크, 문서 1~2열, 사양/I/O는 세로 카드. 페이지 전체 수평 넘침 금지.
- 이미지 확대: 클릭·키보드 선택, Esc·닫기·초점 복귀. 이미지 비율 유지, 포트 라벨을 잘라내지 않음.
- MISSING: 없는 파일 버튼·가짜 이미지 없음. 이미지 요청 실패는 “이미지를 불러오지 못했습니다”와 재시도/출처 링크, 미확보와 구분.
- 권한 대기: 자료는 존재해도 표시 권한 미확인이면 “이미지 사용 확인 대기”. 다른 모델·AI 이미지 대체 금지.
- 출처 링크 장애 시 저장된 사양을 자동 삭제하거나 다른 제품 링크로 바꾸지 않는다.
- 390px·768px·1440px 및 키보드 조작 검수. 이번 단계에서는 구현·화면 테스트를 수행하지 않았다.

## 11. 준비 결과와 경계

대표 제품 1개의 콘텐츠·이미지 원본 URL/화소·문서 링크·주요 사양·I/O를 준비했다. 구 한국 PDF URL의 실패, 글로벌 공식 한국어 사본 사용, 문서 개정 차이와 USB 표기 충돌을 보존했다. 이미지 4개는 육안 확인했으며 한국어 설명서 p.13 및 데이터시트 p.4를 렌더하여 표 의미를 대조했다.

미완료는 독립 설치/Quick Start 문서, 한국어 데이터시트·브로슈어·블록도, CAD 정밀 검증, 최신 펌웨어 전체 대조, 이미지·파일 재게시 권한이다. 이 모두를 채우기 위해 25개 제품 조사나 DB 설계를 먼저 할 필요는 없다. 승인된 범위의 단일 제품 로컬 시안에서 누락·검토 상태까지 검증할 수 있도록 후속 DRAFT를 준비한다.

**구현 착수 불가:** 현재 사용자 지시는 자료 준비만 승인하고 구현을 금지한다. 다음 작업은 “Yamaha DM7 단일 Product Detail 로컬 시안 구현·검증”이며 사용자 구현 승인·자료 사용 방식 확인·기획 PR 병합 조건을 충족한 뒤 READY로 전환한다. 현재 Pages는 main push마다 배포되어 문서 PR도 이번에는 병합하지 않는다.
