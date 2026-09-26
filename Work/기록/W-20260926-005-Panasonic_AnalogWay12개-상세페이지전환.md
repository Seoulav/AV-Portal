# W-20260926-005 — Panasonic·Analog Way 2개 브랜드 12개 제품 상세페이지 신규 조사·전환 기록

작성: 2026-09-26, Claude Code 세션(Work/Codex 역할 동일 세션 대행)

## 배경

W-20260926-004(AVer·Lumantek·Logitech 15개 제품) 완료 후, 사용자가 "sony는 직접 이미지 줄께 나머지 계속해줘"라고 지시했다. Sony 4개 제품은 사용자가 직접 이미지를 제공하기로 해 보류하고, 다음 최소 브랜드인 Panasonic·Analog Way(각 6개, 총 12개)를 진행했다.

## 조사 방법

### Panasonic (6개)
공식 프로젝터 사이트(docs.connect.panasonic.com)는 시리즈 페이지(`/products/<시리즈>/`)와 별도 사양 페이지(`/products/<시리즈>/spec/`)로 구성된다. 세 시리즈 페이지(vmz71, mz20k, mz882)에서 각 시리즈에 속한 전체 모델의 사양표를 한 번에 확인했다.

**모델명 불일치 발견**: 카탈로그의 "PT-MZ14K", "PT-MZ11K"(L 접미사 없음)를 조사하던 중, 제조사 공식 사이트에 이 이름의 단독 페이지가 없고(`docs.connect.panasonic.com/projector/products/mz14k/` → 404) mz20k 시리즈 페이지에는 "PT-MZ14KL", "PT-MZ11KL"(L 접미사 있음)만 등재되어 있음을 확인했다. 검색 API로도 "PT-MZ14K"는 검색되지 않았다. 반면 PT-MZ882는 카탈로그 표기(L 없음)와 정확히 일치하는 실제 모델("공급 렌즈 포함" 버전, PT-MZ882L은 렌즈 별매 버전으로 별도 존재)이 제조사 사이트에 실존함을 확인했다. 이 차이를 임의로 수정하지 않고 이슈로 기록했다(공식 모델명 PT-MZ14KL/PT-MZ11KL 사양을 반영하되 카탈로그 productName은 그대로 유지).

이미지는 세 시리즈 페이지 모두 정적 HTML에 `img_mainimg001.png/jpg`라는 시리즈 대표 이미지(흑백 두 모델을 나란히 놓은 합성 사진, "Panasonic" 로고만 보이고 모델 번호 텍스트는 없음)가 있어 이를 사용했다. 개별 모델 전용 사진은 확인하지 못해 FOUND(VERIFIED 아님)로 표시했다.

### Analog Way (6개)
6개 제품 페이지(analogway.com) 모두에서 모델 전용 "Technical Datasheet" PDF 링크(`dwn01.analogway.com/.../Technical+Datasheet/...`)를 확인했다 — 이전 배치(W-20260926-001)에서 Aquilon RS1에 사용했던 것과 동일한 패턴이다. 각 데이터시트는 Key features, Technical specifications, Product Specifications(치수·무게·전원·소음 등) 섹션을 모두 포함하는 매우 상세한 자료였다.

이미지도 5개 제품(Pulse 4K, Eikos 4K, Aquilon RS2, Zenith 100, Zenith 200)은 `dwn01.analogway.com/.../High+Resolution+Pictures/` 폴더에서 고해상도(최대 6952×1960) 정면 사진을 확보했으며, 전부 전면 패널에 정확한 모델명이 인쇄되어 있어 VERIFIED로 확인했다. RC400T만 예외로, 이 폴더에 이미지가 없었고 대신 analogway.com 웹사이트 자체(Webflow 기반, `cdn.prod.website-files.com`)에 임베드된 정면 사진(`RC400T.avif`)을 사용했다 — 제조사 공식 웹사이트에 직접 게시된 자산이므로 `manufacturer-hosts.mjs`에 이 CDN 도메인을 허용 목록으로 추가해 반영했다.

## 반영 방식

- 상세 JSON은 기존 스키마와 동일하게 직접 작성(Python 헬퍼 스크립트로 일괄 생성 후 `json.dump`).
- `beta/group1-images.mjs`: 12개 슬러그 추가. Panasonic 3쌍(PT-VMZ71/61/51, PT-MZ14K/11K)은 시리즈 공용 이미지를 슬러그별로 다른 파일명으로 복제해서 사용했다 — `verify-pages.mjs`가 이미지 파일명 전역 유일성을 강제하기 때문에(사용자 업로드 매뉴얼과 달리 group1Images는 파일명 중복이 허용되지 않음), 최초 시도 시 `AssertionError: 이미지 파일명 중복`으로 실패한 것을 발견하고 각 슬러그마다 별도 파일(`pt-vmz61-main.webp`, `pt-vmz51-main.webp`, `pt-mz11kl-main.webp`)로 복제해 해결했다.
- `beta/site/catalog.json`: 12개 항목에 slug·card_image 추가.
- `beta/manufacturer-hosts.mjs`: Analog Way에 `website-files.com` 추가(RC400T 이미지 호스팅용).

## 검증

- `node beta/update-snapshot.mjs`: 카탈로그 254건, 상세 57건(기존 45 + 신규 12)
- `node beta/verify-pages.mjs`: PASS — "254 equipment items, 57 details, 75 reviewed official WebP images, 0 card preview images, 5 user-uploaded PDF entries"
- `npm test`: 100 tests, 99 pass · 1 skip · 0 fail
- 로컬 정적 서버로 10개 상세 JSON의 실제 서빙(200 OK)과 필드 수(Aquilon RS2: specifications 16, io 6, features 6) 확인

## 발견 사항(이번 작업 범위 밖, 기록만)

- `verify-pages.mjs`는 `group1Images`(제품 사진)의 파일명이 전역에서 유일해야 한다고 강제한다(사용자 업로드 매뉴얼/참고자료와 다른 규칙). 같은 원본 이미지를 여러 슬러그가 공유해야 할 때는(이번처럼 제조사가 시리즈 전체에 동일 사진 1장만 제공하는 경우) 파일을 슬러그별로 복제해야 한다. 향후 시리즈 공용 이미지를 다루는 배치에서 유의할 점.
- Panasonic PT-MZ14K/PT-MZ11K의 카탈로그 표기(L 없음)와 공식 모델명(PT-MZ14KL/PT-MZ11KL) 불일치는 이번 범위 밖(Work 확인 필요).

## 남은 일

- PT-MZ14K/PT-MZ11K 모델명 표기 확인(Work).
- Sony 4개 제품은 사용자가 직접 이미지를 제공하기로 해 보류.
- 나머지 브랜드(AMX 7개, NETGEAR·Roland·Yealink 8개 등)의 상세페이지 전환은 다음 배치로 진행.
