# SONY BRC-AM7 Product Detail 콘텐츠 패키지

- 상태: **DRAFT 콘텐츠** (2026-09-24 조사). 첫 상세 화면 검증 대상은 BRC-AM7이다. 이전 DM7 원고는 기록으로 보존하며 이 화면의 입력으로 쓰지 않는다.
- 범위: 제조사 공식 웹페이지로 연결할 텍스트·URL·출처 상태만. 이미지·PDF·CAD의 복제, 재게시, 배포용 파일 저장은 승인하지 않는다.
- 공개 베타 연결: `beta/site/catalog.json`의 SONY `BRC-AM7` 항목에 저장된 [한국 Sony Pro 제품 페이지](https://pro.sony/ko_KR/products/ptz-network-cameras/brc-am7)와 같은 모델이다. 기존 25개 목록은 변경하지 않는다.
- 출처 코드: **P** [Sony Pro 한국 제품 페이지](https://pro.sony/ko_KR/products/ptz-network-cameras/brc-am7), **H** [한국어 도움말](https://helpguide.sony.net/rc/brc-am7/v1/ko/index.html), **HS** [한국어 사양](https://helpguide.sony.net/rc/brc-am7/v1/ko/contents/specifications.html), **HC** [한국어 커넥터 블록](https://helpguide.sony.net/rc/brc-am7/v1/ko/contents/connector_block.html), **SP** [Sony Korea 지원](https://www.sony.co.kr/electronics/support/studio-and-broadcast-cameras-pan-tilt-zoom-cameras/brc-am7), **PP** [한국 제품 페이지 PDF 내보내기](https://pro.sony/ko_KR/pdf/products/ptz-network-cameras/brc-am7). 모두 제조사 공식이다. 웹 자료는 바뀔 수 있으므로 구현 때 URL·개정 재확인.

## A. Product Header — 확정 원고

| 필드 | 화면 콘텐츠 | 근거/상태 |
|---|---|---|
| Manufacturer | SONY | P / VERIFIED |
| Product / Model | BRC-AM7 | P, H / VERIFIED |
| Series | BRC (Sony Pro PTZ/원격 카메라 계열) | P의 분류. 별도 판매 시리즈 명칭은 MISSING; `BRC`를 모델 접두어로만 표시 |
| Category | 영상 · PTZ/원격 카메라 · 4K 카메라 | P, 베타 분류 / VERIFIED. 다중 카테고리 허용 |
| Short English Description | 4K 60p PTZ camera with AI-assisted auto framing and 20× optical zoom. | P, HS의 사실을 재서술 / VERIFIED |
| Korean Product Description | BRC-AM7은 1.0형 이미지 센서와 광학 20배 줌을 갖춘 Sony의 4K PTZ 카메라입니다. 자동 프레이밍, 유선 IP 제어와 SDI·HDMI 출력을 지원해 스튜디오와 현장 영상 제작에 사용할 수 있습니다. | P, HS / VERIFIED. 기능별 펌웨어·출력 조건은 아래 표 참조 |
| Verification Summary | 공식 한국 제품 페이지·한국어 사용 안내·한국어 사양에서 모델을 확인했습니다. 일부 기능은 설정·펌웨어 조건이 있고, 줌 용어 충돌 및 이미지 재게시 권한은 검토 중입니다. | 아래 이슈 C1, R1 |

## B. Image Gallery

Sony 한국 제품 페이지의 **갤러리 5장**을 브라우저에서 확인했다. Sony 이미지 서비스가 `wid=1200&hei=720`로 제공하는 표시본이므로 해상도는 **요청 표시 크기 1200×720**이며, 원본 픽셀 크기는 미확인이다. 3번째가 정면, 4번째가 뒷면·단자다. 이 URL은 **원본 파일의 재게시 허가가 아니며** 공개 앱에서 외부 이미지 삽입(핫링크) 허용 여부도 미확인이다. 구현 시 확인 전에는 출처 링크와 MISSING/권한 대기 표시만 가능하다. 다른 모델 또는 AI 이미지를 사용하지 않는다.

| 역할 | 공식 이미지 URL | 해상도 | 확인·사용 메모 |
|---|---|---|---|
| Main | https://www.sony.com/image/826ea30c6742e760e0c500edc5787dff?fmt=jpeg&wid=1200&hei=720 | 표시 요청 1200×720, 원본 MISSING | P 갤러리 1/5; BRC-AM7 전방 사선. Official / 모델 일치 VERIFIED, 공개 삽입 권한 REVIEW REQUIRED |
| Front | https://www.sony.com/image/90470eb5cd45473e16b04e7ff772fb9b?fmt=jpeg&wid=1200&hei=720 | 표시 요청 1200×720, 원본 MISSING | P 갤러리 3/5; 정면 렌즈와 전면 베이스 확인. Official / 방향 VERIFIED, 공개 삽입 권한 REVIEW REQUIRED |
| Rear | https://www.sony.com/image/ff7d8e54abe4d0be10dbd75baceaff7d?fmt=jpeg&wid=1200&hei=720 | 표시 요청 1200×720, 원본 MISSING | P 갤러리 4/5; 뒷면 단자 패널 확인. Official / 방향 VERIFIED, 공개 삽입 권한 REVIEW REQUIRED. HC 단자 번호와 향후 매핑 가능 |
| Perspective | https://www.sony.com/image/e7123a37278e1e6838d2a9d17326cbfc?fmt=jpeg&wid=1200&hei=720 | 표시 요청 1200×720, 원본 MISSING | P 갤러리 2/5; 다른 전방 사선. Official / 모델 일치 VERIFIED, 공개 삽입 권한 REVIEW REQUIRED |
| Other | https://www.sony.com/image/1d6ac39e4f740e6d1d48567583cfc7b8?fmt=jpeg&wid=1200&hei=720 | 표시 요청 1200×720, 원본 MISSING | P 갤러리 5/5; 색상 액센트 변형 묶음으로 보임. 같은 주문 구성인지 미확인; 기본 화면에서는 제외 권장 / REVIEW REQUIRED |

대체 공식 후면 보조 이미지: [Sony Pro 뒷면 단자 설명 이미지](https://pro.sony/s3/2024/03/21111406/BRC-AM7-conn-690x500.png), 표시본 690×500. 제품 페이지의 설명용 이미지이며 주 갤러리 원본 대체로 자동 선택하지 않는다.

## C. Quick Documents · 전체 문서 목록

`VERIFIED`는 **BRC-AM7 모델 적용** 확인이지 재배포 승인이나 문서 최신성 보증이 아니다. Quick Documents는 실제 있는 URL만 만든다. `PP`는 제품 페이지의 자동 생성 PDF이며 별도 Datasheet로 이름 붙이지 않는다.

| 유형/화면 카드 | 제목 · 언어 | 공식 URL | 개정/날짜 | 적용/상태 |
|---|---|---|---|---|
| Official Product Page / 표시 | BRC-AM7 Sony Pro · 한국어 | https://pro.sony/ko_KR/products/ptz-network-cameras/brc-am7 | 페이지 개정 표기 MISSING; 2026-09-24 확인 | BRC-AM7 VERIFIED |
| User Manual / 표시 | BRC-AM7 도움말 안내 · 한국어 웹 | https://helpguide.sony.net/rc/brc-am7/v1/ko/index.html | URL `/v1/`; 문서 본문 개정일 MISSING | BRC-AM7 VERIFIED. Sony Korea 지원의 날짜 표시와 실제 본문 개정 동일 여부 REVIEW REQUIRED |
| User Manual PDF / 보조 링크 | BRC-AM7 도움말 인쇄가능 PDF · 한국어 | https://helpguide.sony.net/rc/brc-am7/v1/ko/print.pdf | `/v1/`; PDF 내부 개정일 MISSING | H에서 PDF 링크 존재 VERIFIED, 파일 본문·페이지 재검토 필요. PDF 복제 금지 |
| Specification / 표시 | BRC-AM7 사양 · 한국어 웹 | https://helpguide.sony.net/rc/brc-am7/v1/ko/contents/specifications.html | `/v1/`, 개정일 MISSING | BRC-AM7 VERIFIED |
| Product Page PDF / 보조 링크 | BRC-AM7 한국 제품 페이지 PDF 내보내기 · 한국어 | https://pro.sony/ko_KR/pdf/products/ptz-network-cameras/brc-am7 | 자동 생성; 고정 개정일 MISSING | 9쪽 BRC-AM7 제품·사양 확인. Datasheet로 오분류 금지, C1 충돌 포함 |
| Technical Document / 조건부 표시 | free-d Integration Manual · 영문 제목, 본문 언어 REVIEW REQUIRED | https://pro.sony/ko_KR/product-resources/knowledge/free-d-integration-manual-brc-am7 | 개정일 MISSING | P 리소스에 BRC-AM7 링크 확인, 링크 대상 본문·적용 범위 REVIEW REQUIRED |
| Drawing / CAD / 조건부 표시 | Diagrams: BRC-AM7 CAD Data · 영문 제목, 파일 언어 MISSING | https://pro.sony/ko_KR/product-resources/diagrams/outline-views-brc-am-7 | 파일 형식·개정 MISSING | P 리소스 링크는 모델명 일치. 실제 CAD 파일·도면 내용 REVIEW REQUIRED. 다운로드 버튼으로 가장하지 말고 리소스 페이지 링크만 표시 |
| Firmware / Software 안내 / 표시 | Sony Korea BRC-AM7 지원 · 한국어 | https://www.sony.co.kr/electronics/support/studio-and-broadcast-cameras-pan-tilt-zoom-cameras/brc-am7 | 개별 릴리스는 지원 페이지에서 재확인 | 모델 적용 VERIFIED, 지역별 제공·최신 버전 REVIEW REQUIRED. 직접 펌웨어 파일 링크 없음 |
| Datasheet | MISSING | — | — | 제조사 단독 데이터시트 확인 못함. PP를 임의 대체하지 않음 |
| Installation Guide | MISSING | — | — | H 안의 설치 절은 있으나 독립 문서는 확인 못함 |
| Quick Start Guide | MISSING | — | — | 별도 문서 확인 못함 |
| Brochure | MISSING | — | — | 별도 BRC-AM7 브로셔 확인 못함 |

Sony Korea 지원의 `사용자 안내` PDF는 카메라 본체 사용 설명서가 아닌 **RM-IP Setup Tool 안내**일 가능성이 있어 본체 Manual 카드에서 제외한다. 제목·본문 재확인 전 연결하지 않는다.

## D. Main Sections

### Overview · Features

Header 한글 설명을 간략히 반복하고 촬영·제어·전원·출력 조건은 아래 Features와 표로 이동한다. 다음 **8개**는 공식 자료를 엔지니어용 짧은 문장으로 재서술했다.

1. 1.0형 Exmor RS CMOS 센서로 최대 4K 59.94/50p 영상을 출력한다. (P, HS; 출력 형식·설정 조건)
2. 광학 20배 줌과 24–480mm(35mm 환산) 범위를 제공한다. (HS)
3. AI 분석 기반 자동 프레이밍으로 사람을 따라 구도를 조정할 수 있다. (P; 기능 설정·펌웨어 조건은 별도 표시)
4. 팬 ±175°, 틸트 −30°~210° 범위에서 PTZ 제어를 지원한다. (HS)
5. SDI OUT1 12G, SDI OUT2 3G, HDMI 출력과 선택형 SFP+ 광 출력을 구분해 연결한다. (HS, HC; 광 출력은 모듈 필요, SDI1과 동일 신호)
6. LAN을 통한 IP 제어와 RTSP·SRT 등 네트워크 스트림을 제공한다. (PP; 프로토콜별 펌웨어·네트워크 조건 확인)
7. 12V DC 또는 IEEE 802.3bt Type 4 Class 8 PoE++ 전원을 사용한다. (HS)
8. XLR 오디오 입력 2개와 3.5mm 마이크 입력 1개를 제공한다. (HS, HC)

### Specifications

**표의 각 행은 사양 1건이다. 총 27건.** 단위는 값과 분리하되 조건이 있는 항목을 단정형으로 표시하지 않는다. `VERIFIED`는 기재한 공식 URL과 모델 일치 검증이다.

| 분류 | Name | Value | Unit | Condition | Source | Verification |
|---|---|---|---|---|---|---|
| Camera | 센서 | Exmor RS CMOS, 1.0형 | — | — | HS | VERIFIED |
| Camera | 최대 유효 화소 | 약 14.0 | MP | 촬영 모드·설정에 따라 달라짐 | HS | VERIFIED |
| Camera | AF | 위상차+콘트라스트 | — | 촬영 설정에 따라 동작 | HS | VERIFIED |
| Camera | ND 필터 | 1/4~1/128 | ND | 선형 가변 범위 | HS | VERIFIED |
| Video | SDI OUT1 최대 출력 | 3840×2160/59.94p | 픽셀/fps | 출력 형식·주파수 설정 | PP p.3 | VERIFIED |
| Video | HDMI 최대 출력 | 3840×2160/59.94p | 픽셀/fps | 출력 형식·주파수 설정 | PP p.3 | VERIFIED |
| Video | 내부 기록 형식 | XAVC HS/S, XAVC Long/Intra | — | 코덱·컨테이너·매체별 제약 있음 | HS | VERIFIED |
| Lens / Zoom | 광학 줌 | 20 | 배 | — | HS, PP p.2 | VERIFIED |
| Lens / Zoom | 초점 거리 | 24–480 | mm | 35mm 환산 | HS | VERIFIED |
| Lens / Zoom | 최대 개방 조리개 | F2.8–F4.5 | F | 줌 위치에 따라 변경 | HS | VERIFIED |
| Lens / Zoom | 수평 화각 | 약 75 | 도 | 광각 | HS | VERIFIED |
| PTZ | 팬 범위 | −175~+175 | 도 | — | HS | VERIFIED |
| PTZ | 틸트 범위 | −30~210 | 도 | — | HS | VERIFIED |
| PTZ | 팬/틸트 속도 | 0.004~180 | 도/초 | 설정에 따라 달라짐 | HS | VERIFIED |
| PTZ | 프리셋 | 최대 100 | 개 | 리모컨/웹 앱마다 이용 가능 수 다름 | HS | VERIFIED |
| Network | LAN | 1000BASE-T | — | RJ-45 | HS | VERIFIED |
| Streaming / Protocol | IP 스트리밍 | RTP/RTCP, RTSP, RTMP/RTMPS, SRT, NDI\|HX | — | 서비스·펌웨어·구성 조건 재확인 | PP p.5 | REVIEW REQUIRED |
| Control | 제어 | VISCA RS-422, VISCA over IP | — | 관리자·네트워크 설정 필요 | HC, PP p.5 | VERIFIED |
| Audio | 오디오 입력 | XLR 3핀 ×2, 3.5mm MIC ×1 | — | LINE/MIC/+48V 선택은 XLR | HS | VERIFIED |
| Audio | 기록 오디오 | LPCM 24-bit/48kHz/4ch | — | 기록 형식에 따라 | HS | VERIFIED |
| Power | DC 전원 | 12 | V | XLR 4핀; 허용 입력 11–17V | HS, HC | VERIFIED |
| Power | PoE++ | IEEE 802.3bt Type 4 Class 8 | — | 스위치의 전력 예산 확인 | HS | VERIFIED |
| Power | 최대 소비 전력 (DC) | 132 | W | DC IN 공급 | HS | VERIFIED |
| Power | 최대 소비 전력 (PoE++) | 71.3 | W | PoE++ 공급 | HS | VERIFIED |
| Physical | 질량 | 약 3.5 | kg | — | HS, PP p.1 | VERIFIED |
| Physical | 크기 | 약 168.7×225.2×192.3 | mm | W×H×D, P 기준 | PP p.1 | VERIFIED |
| Environment | 작동 온도 | 0~40 | °C | — | HS | VERIFIED |

**C1 충돌, 화면 사양에서 제외:** HS는 줌을 `디지털 30배(4K)/40배(FHD)`로 표기하지만 PP p.2는 `클리어 이미지 줌 약 1.5배/2배`와 `디지털 줌 아니요`를 별도 표기한다. 광학 20배만 확정 표시하고, 확장 줌은 Sony 용어·총 배율 구분이 확인되기 전까지 CONFLICTED로 남긴다. PP의 현재 페이지는 향후 펌웨어를 예고할 수 있으므로 2026-09-24 현재 제공 버전으로 읽지 않는다.

### I/O

**실물 커넥터 기능별 총 14행.** Rear 사진과 HC의 단자 위치를 함께 보여줄 수 있도록 이름을 보존한다. 커넥터 사진에 번호 핫스폿을 당장 확정하지 않는다.

| Connector | Signal | Direction | Quantity | Protocol / Standard | Fixed / Optional | Condition | Source |
|---|---|---|---:|---|---|---|---|
| SDI OUT1 BNC | Video | OUT | 1 | 12G/6G/3G/HD-SDI | Fixed | 출력 형식·설정별 | HS, HC |
| SDI OUT2 BNC | Video | OUT | 1 | 3G-SDI Level A/HD-SDI | Fixed | SDI1과 별도 포트 | HS, HC |
| HDMI Type A | Video | OUT | 1 | HDMI | Fixed | 형식·프레임 설정별 | HS, HC |
| OPTICAL SFP+ | Video | OUT | 1 | SDI 광 변환 | Optional module | SFP+ 모듈 필요; SDI OUT1과 동일 신호, 광 입력 아님 | HS, HC |
| LAN RJ-45 | Network/PoE | I/O | 1 | 1000BASE-T, PoE++ | Fixed | PoE++ 공급은 적합 스위치 필요 | HS, HC |
| VISCA IN RJ-45 | PTZ control | IN | 1 | VISCA RS-422 | Fixed | 관리자 설정·스위치 설정 | HC |
| VISCA OUT RJ-45 | PTZ control | OUT | 1 | VISCA RS-422 | Fixed | 데이지체인 구성 확인 | HC |
| AUDIO IN 1/2 XLR 3핀 | Audio | IN | 2 | LINE/MIC/MIC+48V | Fixed | 두 입력의 개별 설정 확인 | HS, HC |
| MIC 3.5mm stereo | Audio | IN | 1 | Plug-in power 호환 | Fixed | XLR과 별도 마이크 입력 | HS, HC |
| GENLOCK IN BNC | Sync | IN | 1 | 1.0Vp-p, 75Ω | Fixed | 외부 동기 | HS, HC |
| TC IN BNC | Timecode | IN | 1 | TC | Fixed | 출력 아님 | HS, HC |
| DC IN XLR 4핀 | Power | IN | 1 | 11–17V DC | Fixed | 공칭 12V | HS, HC |
| OPTION RJ-45 | Tally | I/O | 1 | Red/green tally | Fixed connector | 적용 구성·배선 확인 | HS, HC |
| CFexpress Type A/SD slots | Recording media | I/O | 2 | CFexpress A 또는 SD | Fixed slots | 카드 미포함, 지원 조합 확인 | HS, HC |

Rear 이미지(갤러리 4/5)의 단자군은 HC의 번호·명칭과 시각적으로 연결할 수 있다. 실제 좌표·포트별 강조·전면/후면 핫스폿은 별도 사진 사용 허가와 화면 검증 후 결정한다.

### Documents · Sources & Verification

Documents는 위 목록 중 URL이 있는 실제 카드만 노출한다. Official Product Page, 한국어 Manual, 한국어 Specification은 우선 노출한다. Technical Document·CAD는 리소스 **소개 페이지** 링크로 표시하고 실제 다운로드 파일처럼 꾸미지 않는다. Datasheet/Brochure의 MISSING은 비활성 가짜 버튼 대신 명시적 누락 문구로 처리한다.

Sources & Verification은 `Manufacturer Official` 안에 P·H·HS·HC·SP·PP와 각 적용 범위를 둔다. Supplemental / Domestic 자료는 이번 제품에서 **없음**으로 표시한다. 사양별 VERIFIED/CONFLICTED/REVIEW REQUIRED를 보존하고, 자료 확인·사양 확인·이미지/PDF 게시 권한을 별도 열로 취급한다.

## 화면 검증용 배치와 누락 처리

순서: **Header → 큰 Main 사진 + Front/Rear/Perspective 썸네일·역할·클릭 확대 → Quick Documents 2×2/2×3 → Overview → Features → Specifications → I/O → Documents → Sources & Verification**. Desktop은 섹션 탐색 또는 탭, Mobile은 가로 스크롤 가능한 Sticky Tab. 기존 밝은 RTCOM/LED 계열의 흰색·연회색·파랑 강조·일부 파랑/보라 그라데이션·둥근 카드·부드러운 그림자를 사용한다. TechDataPS는 정보 우선순위만 참고하고 Dark Theme/디자인은 복제하지 않는다.

- 이미지 파일을 표시할 권리가 미확인인 동안은 **이미지 영역 자체**를 유지하고 `공식 페이지에서 이미지 보기` 출처 링크와 권한 대기/MISSING 상태를 표시한다. 외부 핫링크도 승인 없이 배포에 넣지 않는다. 확대한 화면은 Esc와 초점 복귀를 고려한다.
- 없는 독립 문서는 MISSING으로 표시하되 클릭 가능한 빈 카드나 PDF 직접 다운로드 버튼을 만들지 않는다.
- 카탈로그의 다른 24개 제품, 기존 데이터·사이트·배포는 건드리지 않는다. 이 문서는 콘텐츠 패키지이며 DB/최종 스키마/저장소 결정이 아니다.

## 남은 확인 항목

| ID | 상태 | 내용 · 다음 확인 |
|---|---|
| M1 | MISSING | 독립 Datasheet, Brochure, Installation/Quick Start 확인 못함. H 안의 설치/초기화 절로 대체하지 않음 |
| M2 | MISSING | 갤러리 원본 파일의 실제 화소 수와 공식 개정 메타데이터 |
| C1 | CONFLICTED | 확장 줌의 `digital`/`Clear Image Zoom` 용어와 배율 표기 충돌. Sony 공식 자료의 동일 개정 대조 전 표시 보류 |
| R1 | REVIEW REQUIRED | 이미지/PDF/CAD 재게시와 외부 핫링크 권한. 현재 공식 링크만 보유 |
| R2 | REVIEW REQUIRED | Sony Korea 지원 목록·H/PP의 최신 개정·지역별 펌웨어와 기능 조건 재확인 |
| R3 | REVIEW REQUIRED | free-d 기술문서와 CAD 리소스 링크 대상 본문·파일 개정 및 BRC-AM7 적용 범위 |
| R4 | REVIEW REQUIRED | Gallery Other의 색상 액센트 변형과 실제 판매 구성 일치 여부 |

**최소 조사 완료·조사 종료:** Front/Rear 공식 사진 URL, Overview, Features 8개, 주요 Specifications 27행, I/O 14행, 공식 제품 페이지, 한국어 Manual을 확보했다. 독립 Datasheet는 MISSING이다. 이 범위면 BRC-AM7 한 제품의 로컬 시안 원고로 충분하다. CAD·Firmware·세부 기술문서·게시 권한은 시안 착수 조건이 아니라 후속 검토다. 다만 이 DRAFT는 코드 착수 승인이나 READY가 아니며, 이미지/PDF/CAD 공개 업로드는 하지 않는다.
