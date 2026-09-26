# W-20260926-004 — AVer·Lumantek·Logitech 3개 브랜드 15개 제품 상세페이지 신규 조사·전환 기록

작성: 2026-09-26, Claude Code 세션(Work/Codex 역할 동일 세션 대행)

## 배경

W-20260926-003(Yamaha 4개 제품) 완료 후 사용자가 "다음 배치도 작은 브랜드부터 해줘"라고 지시했다. 남은 브랜드 중 AVer·Lumantek·Logitech가 각 5개로 공동 최소였다. 세 브랜드를 한 번에(15개) 진행할지 AVer만 먼저 할지 사용자에게 물었고, "3개 브랜드 전부(15개) 한 번에 (추천)"를 선택받아 15개 전부를 이번 배치로 진행했다.

## 조사 방법

### AVer (5개)
공식 제품 페이지(kr.presentation.aver.com, averusa.com)와 모델별 데이터시트·브로셔를 병행 조사했다.

- **TR535N**: 한국 대리점 사이트(kr.presentation.aver.com)에서 `window.Discontinued = '1'`을 발견해 단종 여부를 의심했으나, 미국 공식 사이트(averusa.com)의 현재 Auto Tracking Camera 라인업에 TR535N이 정상적으로 등재되어 있어 글로벌 현역 제품임을 확인했다. 한국 대리점 브로셔(DownloadFile.ashx?n=3258)에서 전체 사양표를 확인했다.
- **TR535**: 마찬가지로 한국 대리점에서 단종 표시를 확인했는데, 이번에는 averusa.com의 현재 라인업에도 TR535가 없고 후속 모델 TR535N만 남아 있어, 한국 유통만이 아니라 제조사 전체에서 세대교체된 진짜 단종 모델로 판단했다. 이슈로 명확히 기록했다.
- **TR335·TR315**: averusa.com에 모델 전용 페이지와 데이터시트(tr335-datasheet.pdf, tr315-datasheet.pdf)가 있어 전체 사양표를 확인했다. 두 모델은 같은 본체를 공유하는 형제 모델로(줌 배율만 다름), 이미지도 같은 `tr335-335n/` 폴더에서 제공되나 TR315 전용 개별 사진은 없어 마케팅 합성 이미지(NDI 배지 포함)를 대체 사용했다.
- **CL01**: 공식 데이터시트(cl01-datasheet.pdf)와 사용설명서에서 사양이 일치함을 교차 확인했다.

### Lumantek (5개)
영문 사이트(lumantek.com)의 product_intro 페이지들이 PHP 오류(`Trying to get property 'CATEGORY_IDX' of non-object` 등)로 내용이 완전히 비어 있음을 발견했다. VS10만 정상 작동해 공식 사용설명서(VS10_MANUAL_ENG_211228.pdf)로 전체 사양을 확인했다.

나머지 4개(VS5, ez-MD+, ez-SHV+, ez-HSV+)는 한국 공식 사이트(lumantek.co.kr, 별도 도메인)에서 정상 작동하는 페이지를 발견해 대체 확인했다. 각 제품의 "시스템사양"(product_view) 페이지에 Data Input/Output, Connections, Electrical, Physical 전체 표가 있어 이를 근거로 사용했다. VS5는 공식 사용설명서(VS5_USER_MANUAL.pdf)도 확보해 시스템 스펙 절과 대조했다.

### Logitech (5개)
Rally Mic Pod Hub·Rally Mic Pod·Strong USB Cable·Rally Mic Pod Extension Cable은 각각 정상적인 제조사 제품 페이지에서 Technical Specifications 섹션을 확인했다.

**Rally Plus**: 카탈로그의 기존 official_links가 `hub.sync.logitech.com`의 커뮤니티 설정 가이드 게시글이어서, 정식 제품 페이지를 찾기 위해 `logitech.com/en-us/products/video-conferencing/room-solutions/rally.html`을 시도한 결과 실제로 `rally-ultra-hd-conferencecam.html`로 리다이렉트되었고, 페이지 타이틀이 정확히 "Rally Plus Video Conferencing Camera System"임을 확인했다. 이 페이지가 링크한 공식 Tech Specs 데이터시트(rally-plus.pdf, 카탈로그 manual_link와 동일)에서 Rally/Rally Plus 전체 시스템 구성·사양을 확인했다.

Rally Mic Pod Extension Cable은 제품 페이지 자체에 커넥터 규격이 명시되어 있지 않았다. 연결 대상인 Rally Mic Pod·Mic Pod Hub의 공식 사양에 "12핀 인터페이스"가 명시되어 있어 이를 근거로 추정치를 REVIEW REQUIRED로 표시했다(추측이 아니라 연결 대상 기기의 공식 사양에 근거한 교차 추정임을 명시).

## 반영 방식

- 상세 JSON은 기존 스키마와 동일하게 직접 작성(Python 헬퍼 스크립트로 일괄 생성 후 `json.dump`).
- `beta/group1-images.mjs`: 15개 슬러그 추가(20개 이미지, Front+Rear 페어 또는 단일 Main/Perspective).
- `beta/site/catalog.json`: 15개 항목에 slug·card_image 추가.
- `beta/manufacturer-hosts.mjs`: Lumantek에 `lumantek.co.kr` 추가(AVer의 `averusa.com`·`aver.com`, Logitech의 `logitech.com`은 기존 허용 목록의 서브도메인 규칙으로 이미 충분).

## 검증

- `node beta/update-snapshot.mjs`: 카탈로그 254건, 상세 45건(기존 30 + 신규 15)
- `node beta/verify-pages.mjs`: PASS — "254 equipment items, 45 details, 63 reviewed official WebP images, 0 card preview images, 5 user-uploaded PDF entries"
- `npm test`: 100 tests, 99 pass · 1 skip · 0 fail
- 로컬 정적 서버로 8개 샘플 상세 JSON의 실제 서빙(200 OK)과 필드 수(Rally Plus: specifications 15, io 8, features 5) 확인

## 발견 사항(이번 작업 범위 밖, 기록만)

- AVer 한국 대리점 사이트(kr.presentation.aver.com)의 "Discontinued" 플래그는 한국 유통 상태만 반영할 뿐 제조사 전체 라인업 상태와 반드시 일치하지는 않는다(TR535N/TR335/TR315는 한국에서 단종 표시되어도 미국 공식 사이트에서는 현역). 향후 AVer 제품 조사 시 이 플래그만으로 단종 여부를 단정하지 말고 averusa.com과 교차 확인이 필요하다.
- Lumantek 영문 사이트(lumantek.com)는 다수 제품 페이지가 CMS 오류로 비어 있다. 향후 Lumantek 제품 조사 시 한국 사이트(lumantek.co.kr)를 우선 확인하는 것이 효율적이다.

## 남은 일

- 카탈로그의 Logitech Rally Plus `official_links` 필드 자체는 이번 범위에서 갱신하지 않음(상세페이지 내부 공식 링크만 새 URL로 반영). 필드 자체를 정정하려면 별도 변경 작업 필요.
- 나머지 브랜드(Panasonic·Analog Way 6개, AMX 7개, NETGEAR·Roland·Yealink 8개 등)의 상세페이지 전환은 다음 배치로 진행.
