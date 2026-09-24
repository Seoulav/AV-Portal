# AV Portal 제품 자료 조사·재사용 운영 정책

- 적용일: 2026-09-24
- 상태: 사용자 지시를 반영한 **기획 정책**. 최종 Product Data Schema, Database, Storage 또는 공개 배포 결정을 의미하지 않는다.
- 우선순위: 이 문서는 과거 기획 문서의 자료 조사 범위·Quick Documents 구성과 충돌할 때 우선한다. 과거 조사 결과와 충돌 기록은 삭제하지 않는다.

## 1. 목적과 조사 단위

목적은 회사 주요장비 목록의 제품을 AV Portal Product Detail에 넣을 수 있는 수준으로, 이미 확보한 자료를 재사용하면서 부족한 부분만 보완하는 것이다. 전체 제품을 처음부터 다시 조사하거나 제조사 전체 제품군을 수집하지 않는다.

조사 단위는 Research Master List 또는 Product List에 있는 한 제조사 또는 작은 제품군이다. Excel 밖의 후속 모델·신제품·같은 시리즈의 다른 모델·대체 제품을 추가하지 않는다. Series, Variant, Kit, TX/RX, PSE 및 지역 차이는 근거 없이 같은 제품으로 합치지 않는다.

## 2. 자료 재사용 우선 순서

각 묶음은 먼저 다음을 읽는다.

1. Research Master List와 Product List의 원본 행·브랜드·모델·중복 연결
2. Resource Register/자료대장의 기존 URL·언어·개정·적용 모델·확인 수준
3. 기존 제품별 조사 결과, Verification/Conflict 기록, 브랜드별 Supplemental Source 기록
4. W-20260923-010·W-20260923-011의 영상 옵션 결과와 BRC-AM7 Product Detail 콘텐츠
5. 해당하는 로컬 제조사 직접 제공 자료

이미 확인한 Official Product Page, Manual, 시방서, 사양서, 기술문서, Front/Rear Image, Overview, Features, Specifications, I/O는 다시 검색하지 않는다. 재사용한 사실과 원래 출처·상태를 결과에 적고, 비어 있거나 모델 적용이 미확인인 항목만 추가 조사한다.

## 3. 기본 조사 완료 판정

각 제품은 아래 항목의 **상태를 모두 기록하면** 기본 조사 완료다. 모든 항목이 FOUND여야 한다는 뜻은 아니다.

| 항목 | 기록할 최소 내용 |
|---|---|
| Official Product Page | 실제 해당 제품 또는 확인된 Series 페이지 URL, 모델 적용 상태 |
| Manual | 제목·언어·URL·개정/날짜·모델 적용 상태 또는 MISSING |
| 시방서 | 제목·출처 유형·URL·적용 상태 또는 MISSING |
| 사양서 | 제목·언어·URL·개정/날짜·모델 적용 상태 또는 MISSING |
| 기술문서 | 제목·언어·URL·적용 상태 또는 MISSING |
| Front Image | 역할·URL·모델 일치·해상도·출처·상태 또는 MISSING |
| Rear Image | 역할·URL·모델 일치·해상도·출처·상태 또는 MISSING |

`FOUND`, `MISSING`, `VERIFIED`, `REVIEW REQUIRED`, `CONFLICTED`는 서로 바꿔 쓰지 않는다. 자료 발견, 모델 적용 확인, 사양 검증, 공개/재게시 권한 확인은 별도의 판단이다. MISSING이 남아도 정해진 검색 범위를 마친 제품은 조사 완료로 기록하고 다음 제품으로 넘어간다.

## 4. Quick Documents와 추가 문서

Product Detail Quick Documents는 **Manual, 시방서, 사양서, 기술문서** 네 유형만 간단히 표시한다. Official Product Page는 문서 카드와 분리한 외부 링크다. 없는 유형은 가짜 버튼을 만들지 않는다.

Firmware/Software, CAD, Brochure, Quick Start, Installation Guide, Product Page PDF, 기타 부속 자료는 MVP 필수 조사 대상이 아니다. 이미 확보한 자료는 삭제하지 않고 Documents의 `Additional / Supplemental Documents`로 보존한다. Product Page PDF는 제목·적용 범위를 확인하지 않고 Datasheet/사양서로 자동 분류하지 않는다.

## 5. 출처·언어·브랜드 규칙

비RTCOM은 한국 제조사 공식 제품·지원·다운로드·한국어 문서를 먼저 확인한다. 한국어 자료가 없을 때만 글로벌 공식 자료를 사용한다. 모델, Revision, Region, Variant, Applicable Product가 충돌하면 자동 선택하지 않고 REVIEW REQUIRED 또는 CONFLICTED로 남긴다.

| 브랜드 | Primary | Supplemental | 적용 규칙 |
|---|---|---|---|
| JBL / AMX / BSS | 제조사 공식 | TechDataPS | 값이 다르면 두 출처와 상태를 보존하며 Supplemental이 공식값을 덮어쓰지 않음 |
| Shure | Shure 공식 | 삼아프로사운드 | 위와 같은 구분·충돌 보존 |
| RTCOM | 사용자 직접 제공 제조사 자료 | 공식 홈페이지의 제품 소개·기본 특징·공개 이미지·제품 페이지 | 홈페이지 설명만으로 미확인 사양·호환성·판매 단위·재게시 권한을 확정하지 않음 |

RTCOM의 HS-88M-U, HS-88MX, HD-D104U, HD-D108U는 조사·등록·공개 대상에서 제외한다. 과거 증빙은 보존한다.

## 6. 화면 콘텐츠 규칙

Product Detail 순서는 Header, Image Gallery, Quick Documents, Overview, Features, Specifications, I/O, Documents, Sources & Verification이다. TechDataPS는 정보 배치만 참고하며 디자인을 복제하지 않는다. 밝은 RTCOM/LED 계열의 White/Light Gray, Blue Accent, 일부 Blue-Purple Gradient, Rounded Card, Soft Shadow, Pill Tab을 유지한다.

Features는 공식 근거로 제품당 5~8개를 짧게 작성하며 조건을 생략하지 않는다. Specifications는 Name, Value, Unit, Condition, Source, Verification을 분리하고 서로 다른 조건값을 합치지 않는다. I/O는 Connector, Signal, Direction, Quantity, Protocol/Standard, Fixed/Optional, Condition, Source를 별도 보존하며 Video, Audio, Network/Control, Sync/Timecode, Power, Recording/Media 등으로 묶을 수 있다.

## 7. 저장·공개 제한

기존 로컬 `research`/`outputs` 구조를 사용한다. 원본 Excel, 업체 정보, 내부 메모, 비공개 제조사 직접 자료, 원본 이미지/PDF/CAD, 개인 PC 경로는 GitHub 공개 저장소에 올리지 않는다. GitHub에는 공개 가능한 Markdown 요약, Source URL, 상태·검증 결과, 작업 기록만 둔다.

이번 정책은 제품 구현, GitHub Pages 재배포, 최종 Schema, Database 또는 Storage Vendor 결정을 승인하지 않는다. 이미지·문서의 공개/재게시 권한은 자료의 발견·모델 적용과 분리해 기록한다.

## 8. 묶음별 결과 보고 형식

제조사 또는 제품군 묶음마다 다음 숫자만 보고한다: 조사 제조사, 대상 제품 수, 기존 자료 재사용 제품 수, 실제 추가 조사 제품 수, 새 Front/Rear Image 수, Manual/시방서/사양서/기술문서의 FOUND·MISSING 수, REVIEW REQUIRED, CONFLICTED, Product Detail 준비 완료 제품 수, 사용자가 결정할 사항.
