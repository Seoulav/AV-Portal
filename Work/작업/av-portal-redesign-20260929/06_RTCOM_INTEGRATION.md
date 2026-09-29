# 6단계 — 알티컴 공개 제품정보 읽기 연동

- 선행: 5단계 완료·사용자 확인
- 근거: rtcom-configurator `docs/handoff/AV_PORTAL_RTCOM_PRODUCT_DATA.md`(알티컴 쪽 인계 문서), `docs/audit/SITE_SCOPE_REVIEW.md` §9
- 바꾸는 것: 새 동기화 스크립트, 동기화한 알티컴 데이터 폴더, 목록·상세 화면의 알티컴 제품 표시
- 바꾸지 않는 것: 알티컴 데이터 값, rtcom-configurator 저장소

## 1. 원칙

1. 알티컴 브로셔 수준 제품정보의 **원본은 rtcom-configurator 하나**입니다. AV Portal은 읽기만 합니다.
2. 데이터는 공개(rtcom-configurator) → AV Portal 한 방향으로만 흐릅니다. AV Portal에서 rtcom-configurator로 보내는 기능을 만들지 않습니다.
3. AV Portal에서 알티컴 사양 값을 고치지 않습니다. 틀린 값을 발견하면 보고만 합니다.
4. 내부 자료(단가·노하우 등) 연결은 이 단계에 포함하지 않습니다. AV Portal 비공개 전환 뒤 별도 작업입니다.

## 2. 공개 데이터 주소

| 파일 | 주소 |
|---|---|
| 목록 | `https://seoulav.github.io/rtcom-configurator/data/products/index.json` |
| 상세 | `https://seoulav.github.io/rtcom-configurator/data/products/{id}.json` |
| 이미지 | `https://seoulav.github.io/rtcom-configurator/output/design/assets/products/{file}` |

- 형식: `schema: "rtcom.products.v1"`. 2026-09-29 기준 31종(시리즈 XDM·SPX·VDM, 일체형, 분배기·선택기, 전송기, 전원, 케이블)
- 상세 JSON은 AV Portal 상세 JSON과 같은 필드(`manufacturer, productName, model, series, itemType, categories, english, korean, overview, images, documents, features, specifications, io, sources, issues` 등)를 쓰도록 만들어져 있습니다.
- 알티컴 쪽 추가 필드: `id`, `group`, `catalogPages`, `lineup`, `related`, `aliases`, `lead`, `subtitle`, `portMap` 등. 모르는 필드는 무시해도 됩니다.
- `images[].file`은 파일명만 담습니다. 전체 주소는 목록의 `imagePath`로 만듭니다.
- `documents[].file`이 있는 문서는 `https://seoulav.github.io/rtcom-configurator/output/design/assets/docs/{file}`로 엽니다.

## 3. 동기화 스크립트 (빌드할 때 한 번 받는 방식)

1. `scripts/sync-rtcom.mjs`가 목록·상세·이미지를 받아 `vendor/rtcom/`(이름은 관례에 맞게)에 저장합니다. 화면이 열릴 때마다 rtcom 사이트에서 받는 방식은 쓰지 않습니다(그쪽 사이트가 멈추면 AV Portal도 비기 때문).
2. `schema`가 `rtcom.products.v1`이 아니면 중단합니다.
3. 받은 시각과 파일별 SHA-256을 `vendor/rtcom/SYNC.json`에 기록합니다.
4. 지난 동기화와 비교해 사라진 `id`가 있으면 경고하고, 새 `id`는 목록에 추가합니다.
5. 사용자가 원할 때 실행합니다(자동 주기 실행은 이 단계에 넣지 않습니다).

## 4. 화면 표시

- **목록**: 알티컴 31종을 제조사 `RTCOM`(표시 이름 "알티컴(RTCOM)")으로 라이브러리에 넣습니다. 카테고리는 알티컴 `categories`를 그대로 씁니다. 카드 사진은 `cardImage`
- **상세 주소**: `/detail/?product=rtcom-<id>`. 기존 AV Portal slug와 겹치지 않도록 `rtcom-` 접두어를 붙입니다.
- **상세 화면**: 2단계 템플릿을 그대로 씁니다. 알티컴 제품일 때만 다음을 더합니다.
  - 머리 부제에 `subtitle`이 있으면 `english` 대신 사용, 01 요약에 `lead`가 있으면 `korean` 대신 사용(`**굵게**` 한 곳을 굵은 글자로)
  - 머리 오른쪽 첫 버튼: `알티컴 제품정보에서 자세히 보기 ↗` → `https://seoulav.github.io/rtcom-configurator/#products/<id>`. 알티컴 쪽의 Port Map·Signal Flow·EDID·딥 스위치 카드는 AV Portal에 다시 만들지 않고 이 링크로 보냅니다.
  - 기록 영역에 "원본: rtcom-configurator, 동기화 시각 …" 한 줄
  - `related`가 있으면 06 관련 제품 카드에 표시(대상도 `rtcom-<id>` 주소로)
- 검색용 목록 파일(4단계)에 알티컴 31종을 포함합니다.
- `catalog.html`·`llms.txt`에도 포함할지는 사용자에게 먼저 묻습니다.

## 5. 검증

1. 동기화 스크립트 실행 결과(31종, 실패 0)와 `SYNC.json`
2. 알티컴 대표 4종(`xdm`, `hd-210u`, `xdm-ctr100`, `hoc-ux`) 상세를 1280px·390px로 캡처
3. 알티컴 데이터 파일이 원본과 SHA-256이 같음을 확인(값을 고치지 않았다는 증거)
4. "자세히 보기" 링크 31개가 모두 열리는지 확인
5. 기존 240개 상세·홈 검색이 작업 전과 같음
