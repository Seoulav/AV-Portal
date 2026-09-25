# Group 2 사진 후보 목록 (2026-09-25)

- 작성: Work (Claude, Sonnet), `WebSearch`로 조사
- 대상: [W-20260925-008](../../작업/W-20260925-008.md)의 Group 2 8개 제품
- **이 문서는 후보 URL 모음이다. 사진 파일을 다운로드·게시하지 않았다.** 이 작업 환경은 제조사 사이트로의 파일 다운로드(`WebFetch`/`curl`)가 egress 정책으로 막혀 있어 실제 이미지 바이트를 받아오지 못했다(직접 확인: Panasonic·Analog Way 이미지 URL 다운로드 시도 모두 `EGRESS_BLOCKED`). 아래 URL은 검색 결과 제목·스니펫으로 식별했을 뿐, 페이지를 열어 이미지를 직접 보지 못했다.
- 실제 다운로드·webp 변환·모델 일치 확인·재사용 권리 판단은 이 목록을 넘겨받는 쪽(회사 PC의 Codex 등, 네트워크 제한이 없는 환경)이 수행해야 한다. `beta/group1-images.mjs`의 기존 5개 제품과 같은 형식(`role`, `file`, `alt`, `provider`, `model`, `sourceUrl`, `verificationStatus`, `originalSize`, `resolution`, `publicationStatus`)을 따른다.

## 제품별 후보

| 제조사 | 모델 | 공식 제품 페이지(카탈로그에 이미 등재된 링크) | 사진 후보 |
|---|---|---|---|
| Powersoft | Mezzo 322 AD | powersoft.com/en/products/install-amps/mezzo-series/mezzo-322-ad | 제품 페이지에 제품 이미지 있음(직접 확인 못함). 데이터시트: powersoft.com/wp-content/uploads/datasheet/PS_MEZZO_DS.pdf |
| Roland | V-02HD MK II | proav.roland.com/global/products/v-02hd_mk_ii/ | 전용 이미지·로고 페이지: **proav.roland.com/global/support/by_product/v-02hd_mk_ii/images_logos/** |
| Roland | UVC-01 | proav.roland.com/global/products/uvc-01/ | 전용 이미지·로고 페이지: **proav.roland.com/global/support/by_product/uvc-01/images_logos/** |
| Epson | EB-L530U | epson.co.kr(카탈로그의 정확 모델 페이지, V11HA27040) | 같은 페이지에 제품 이미지 있음(직접 확인 못함) |
| Audinate | AVIO USB C | getdante.com/platform/avio-usb-c/ | 같은 페이지 또는 제품·영업 가이드 PDF(getdante.com/wp-content/uploads/2025/03/AVIO-ProductSalesGuide-v2.pdf)에 이미지 있음(직접 확인 못함) |
| Shure | MXCW640 | shure.com/en-US/products/wireless-systems/mxcw/mxcw640 | 같은 페이지에 제품 이미지 있음(직접 확인 못함) |
| NETGEAR | GSM4248PX | netgear.com/uk/business/wired/switches/fully-managed/gsm4248px/ | 같은 페이지에 제품 이미지 있음(직접 확인 못함) |
| Analog Way | Aquilon RS1 | analogway.com/products/aquilon-rs1 | **직접 이미지 URL 확인됨** (2026-09-23 조사, 아래 참조) |

## 직접 이미지 URL이 확보된 항목 (2026-09-23 조사 결과 재확인)

`docs/research/major-equipment-official-links-2026-09-23.json`에 이미 있던 것으로, 유일하게 실제 이미지 파일 URL(제품 페이지가 아니라 `.jpg`/`.png` 직링크)이다. 다운로드·검증은 여전히 하지 않았다.

| 모델 | 방향 | URL | 검증 상태(9/23 기록) |
|---|---|---|---|
| Aquilon RS1 | 전면 | dwn01.analogway.com/Site+Internet/Series/LivePremier/Products/Aquilon+RS1/High+Resolution+Pictures/aquilon-4u-rs1-fav-det.jpg | OFFICIAL_LINK_LISTED_FETCH_FAILED (9/23 시점에도 다운로드 실패 기록) |
| Aquilon RS1 | 후면 | dwn01.analogway.com/Site+Internet/Series/LivePremier/Products/Aquilon+RS1/High+Resolution+Pictures/aquilon-4u-far-rs1-web.jpg | OFFICIAL_LINK_LISTED_FETCH_FAILED |

## 참고 — Group 2 8개 밖이지만 직접 이미지 URL이 있는 항목

이후 다른 작업에서 쓸 수 있도록 같은 조사에서 나온 나머지 직접 이미지 URL도 남긴다(Group 2 범위 아님).

| 제조사 | 모델 | 전면 | 후면 |
|---|---|---|---|
| Analog Way | Pulse 4K | dwn01.analogway.com/.../pulse-4k-fav.jpg | dwn01.analogway.com/.../pulse-4k-far.jpg |
| Analog Way | Eikos 4K | dwn01.analogway.com/.../eikos-4k-fav.jpg | dwn01.analogway.com/.../eikos-4k-far.jpg |
| Analog Way | Aquilon RS2 | dwn01.analogway.com/.../aquilon-4u-rs2-fav-det-web.jpg | dwn01.analogway.com/.../aquilon-rs2-far-det.png |
| Analog Way | Zenith 100 | dwn01.analogway.com/.../zenith100-fav-web.png | dwn01.analogway.com/.../zenith100-far-web.png |
| Panasonic | PT-VMZ61 | eu.connect.panasonic.com/.../vmz61_b_front_high.jpg (2500×1253, 9/23에 색상 변형·재사용 권리 "open"으로 기록됨) | 없음 |

전체 URL은 `docs/research/major-equipment-official-links-2026-09-23.json`의 `resource_kind`가 `전면 사진`/`후면 사진`인 레코드를 참조한다.
