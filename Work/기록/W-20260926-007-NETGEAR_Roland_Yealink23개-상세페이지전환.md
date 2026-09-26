# W-20260926-007 — NETGEAR·Roland·Yealink 23개 제품 상세페이지 전환 기록

## 대상 및 방법

PR #94 병합 후 다음 최소 브랜드인 NETGEAR(8)·Roland(8)·Yealink(8) = 24개를 대상으로 진행했다. 세 브랜드가 서로 독립적이라 조사 단계를 3개 배경 에이전트(subagent)에 병렬로 위임하고, 각 에이전트는 스크래치패드 안에서만 작업하도록 지시(레포 파일 직접 수정 금지)했다. 에이전트가 작성한 Python 딕셔너리(`products_<brand>.py`)를 이 세션에서 검증·통합해 최종 상세 JSON을 생성했다.

## NETGEAR (7개 반영, 1개 보류)

NETGEAR 사이트는 기본 curl User-Agent에 24바이트짜리 빈 스텁 페이지를 반환해, 데스크톱 Chrome User-Agent로 재요청해야 정상 페이지를 받을 수 있었다.

- **XSM4216F, GSM4230P, GSM4230PX, GSM4248P**: 공식 제품 페이지로 전체 사양 확인. 제품 이미지는 모델명이 뚜렷하게 보이지 않아 FOUND로 표시.
- **GSM4212P**: 카탈로그의 official_links가 가리키는 페이지가 실제로는 "GSM4210PX(M4250-8G2XF-PoE+)"를 설명하고 있음을 발견했다. "GSM4212P"라는 문자열은 페이지 어디에도 없었다. 카탈로그를 임의로 고치지 않고 이슈로 기록했으며, 실제 페이지 데이터(GSM4210PX)로 상세를 작성했다 — Work의 확인이 필요하다.
- **GS116PP, GS108PP**: 공식 페이지로 확인, 제품 라벨에 모델명이 선명하게 보여 VERIFIED.
- **GS728TPP**: 공식 지원 페이지(`netgear.com/support/product/gs728tpp`)가 Salesforce Lightning 기반 JS SPA라 정적 fetch로 접근 불가. 대체로 웹 검색을 통해 2015년작 공유 데이터시트(GS516TP/GS728TP/GS728TPP/GS752TP, `downloads.netgear.com/files/GDC/datasheet/en/...pdf`)를 찾아 텍스트를 추출, 사양 자체는 확보했다. 하지만 이 PDF와 페이지 어디에도 실제 제품 사진이 없어(로고·다이어그램만 존재) 이미지를 확보하지 못했다. 이 프로젝트의 검증 규칙(`verify-pages.mjs`)은 상세 슬러그가 있는 모든 제품에 이미지 최소 1장을 요구하므로, GS728TPP는 이번 배치에서 제외하고 상세 JSON을 만들지 않았다(Sony 4개와 같은 성격의 보류).

## Roland (8개 전부 반영)

proav.roland.com은 정적 서버 렌더링 사이트라 일반 curl로 문제없이 접근했다. 8개 제품 모두 공식 제품 페이지 + Reference/Owner's Manual PDF(static.roland.com 호스팅)에서 전체 사양·I/O를 확인했다.

- **V-02HD, VR-4HD, V-60HD**: 공식 사이트에 "Discontinued(단종)" 표기가 있음을 확인, 이슈로 기록했다(카탈로그 항목 자체는 유지). V-02HD는 후속 모델 "V-02HD MK II"가 이 카탈로그에 이미 별도 상세페이지로 존재하므로 혼동하지 않도록 구분해서 작업했다.
- 나머지 5개(V-1HD+, VR-6HD, V-8HD, V-80HD, V-160HD)는 단종 표기 없이 현역 제품으로 확인.

## Yealink (8개 전부 반영, 일부 물리 사양 미확인)

- **VCM35, UVC86, AVHub**: 제품 리소스 페이지에 직접 링크된 공식 Datasheet PDF를 확보해 정밀한 수치 사양(치수, 무게, 센서 FOV/줌 범위 등)까지 확인했다.
- **CM20, CS10**: tech-specs 페이지의 마케팅성 스펙 블록에서 실제 수치(주파수 응답, SPL, 픽업 반경 등)는 확인했으나, product-resource 페이지가 자체 PDF 없이 `supportx.yealink.com`/`support.yealink.com`(JS 기반 SPA)로만 안내되어 있어 데이터시트나 정확한 치수/무게는 확인하지 못했다. 이슈로 기록.
- **UVC85-BYOD**: 번들(UVC85 카메라 + CP50 + CPE40) 수준의 사양은 확인했으나, 개별 구성품(CP50 등)의 세부 지식베이스 문서가 JS SPA라 접근하지 못해 이슈로 기록.
- **CPE40**: 별도 tech-specs/resource 템플릿 자체가 없이 Overview 페이지로만 리디렉션되어, 정성적 기능 설명은 확보했으나 정량 음향 사양(주파수 응답·SPL 등)은 확인하지 못해 이슈로 기록.

카탈로그 제품명 "SmartVision40"(공백 없음)과 공식 사이트 표기 "SmartVision 40"(공백 있음)의 차이는 카탈로그 표기를 그대로 유지하도록 통합 단계에서 보정했다.

## 발견한 문제와 수정

- **에이전트 산출물의 `issues` 필드 형식 불일치**: 일부 항목(V-02HD, VR-4HD, V-60HD, SmartVision40, CM20, CS10, AVHub, UVC85-BYOD, CPE40 총 9건)이 프로젝트 스키마의 `{code, status, title, detail}` 딕셔너리가 아니라 평문 문자열로 작성되어 있었다. 통합 스크립트 실행 후 별도 Python 패치로 전부 정규화했다.
- **`verify-pages.mjs`의 비공개 마커 정규식과의 우연한 충돌**: Roland 6개 제품(V-1HD+, VR-4HD, VR-6HD, V-8HD, V-60HD, V-80HD, V-160HD 중 정지 이미지 저장 매수를 다루는 스펙 항목)의 "내부 메모리 N개 저장"이라는 정상적인 스펙 문구가, 비공개 자료 유출 방지용 정규식의 `내부 메모` 패턴과 부분 일치해 `verify-pages.mjs`가 실패했다. "내장 메모리"로 표현을 바꿔 해결했다(의미 변화 없음).
- **이미지 파일 확장자 불일치**: 연구 에이전트가 원본 확장자(.jpg/.png)를 그대로 `images[].file`에 남겨둔 경우가 있어, 실제로 webp 변환 후 저장한 파일명과 어긋났다. 일괄 정규식 치환으로 `.webp`로 통일했다.

## 코드 변경

- `beta/group1-images.mjs`: 23개 슬러그 신규 항목(group1Images, cardImages) 추가.
- `beta/site/catalog.json`: 23개 항목에 slug·card_image 필드 추가.
- `beta/site/detail/data/*.json`: 23개 신규 파일.
- `beta/manufacturer-hosts.mjs`: 변경 없음(기존 허용 호스트 suffix 매칭으로 모든 이미지/문서 CDN 서브도메인이 커버됨).

## 검증

`node beta/build-readable-catalog.mjs && node beta/update-snapshot.mjs && node beta/verify-pages.mjs && npm test` 전부 통과. verify-pages.mjs는 254 items, 87 details, 105 검증된 공식 WebP 이미지로 통과했고, npm test는 100개 중 99 pass·1 skip·0 fail로 기존과 동일한 결과를 유지했다.

## 남은 일

- GS728TPP: 제품 사진 확보 후 상세페이지 추가(사용자 보유 자료 확인 요청 또는 추가 조사).
- GSM4212P vs GSM4210PX 모델명 불일치 확인.
- Yealink CM20/CS10/AVHub/UVC85-BYOD/CPE40의 일부 물리 사양 후속 확인.
- 다음 최소 브랜드로 계속 진행 예정(BSS Audio 9개, Televic 10개, Ross Video 11개, NovaStar 13개 등).
