# W-20261016-015 Midra·Zenith 후속 — Codex 인계

## 완료 범위

- `pulse-4k`, `eikos-4k`, `zenith-100`, `zenith-200`의 고정 단자판 지도를 재설계했다.
- 원래 Rear 지도는 전체 기기 개요용 축약 지도, 확대된 단자 패널은 `Other` 역할로 추가했다.
- 번호·label·desc·`io`·사양·기능·`videoLayerPlan`은 변경하지 않았다. 확대 패널은 각 제품의 공식 Rear 사진에서 추출한 원본 픽셀만 사용한다.
- 중심 행은 행 사이 빈 공간을 따라 `via`로 좌우 바깥 번호에 연결했다. 외곽 행은 가장 가까운 위·아래 가장자리 괄호를 사용했다.

## 검증

- `tests/w20261016-015-midra-zenith-panels.test.mjs`: 3/3 통과. 지도 범위·사진 크기·역사 되감기·비변경 필드·`videoLayerPlan` 검사 포함.
- 시각 비교 24장(4종 × 변경 전후 × 760px/390px 좌/우): [갤러리](W-20261016-015-midra-zenith-preview/index.html).
- 전체 테스트·`verify-pages`·검색/카탈로그 검사 및 CI는 아직 실행 전이다.

## Work 검토 요청

고정 단자판이 다른 줄 단자나 라벨을 가리키지 않는지 갤러리를 확인해 달라. 병합은 Work의 시각 검토와 순서 안내 이후 진행한다.

## 통합 후 검증 결과

- latest `origin/main` `64839b82` (#594) fast-forward 통합 후 `build-detail-assets`, `update-snapshot`, 검색 인덱스·읽기 카탈로그 재생성. 검색·읽기 `--check`와 `verify-pages` 통과(289 품목, 286 상세, 529 검토 제품 이미지, 잠금 사용자 업로드 PDF 167건 포함).
- 전체 순차 테스트 858건: 통과 857, 실패 0, 기존 skip 1. 신규·연결 회귀 17/17 통과.
- Port Map lint: zenith-100·zenith-200 0 신호. pulse-4k·eikos-4k 각 1 `SHARED_WITH` 신호(공유 레이아웃 감지). 사진 기반 캡처와 자동 segment 검사에서는 지시선 관통·근접 문제 없음.
- 병합 전 Work 시각 검토와 병합 순서 응답 대기. 로컬 임시 빌드·캡처 스크립트는 `tmp/`에만 두고 PR에 포함하지 않음.
