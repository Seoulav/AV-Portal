# W-015 마감 후속 9지도 점검표

- 상태: REVIEW / Work 병합 승인 대기. 구현 브랜치: `codex/W-20261016-015-closeout-fixes`.
- 기준 main: `d960088b6d8ed82c94aa16f1834c57966b07e30e`. #601 문서 병합 후 Work 2026-10-17 배정.
- 범위: Aquilon RS 7종의 LOCK·LAN·멀티뷰어·Dante, Sony 두 제품의 지정 근접 쌍.
- [전후 갤러리](W-20261016-015-closeout-fixes-preview/index.html) / [마감 보고서와 Work 결정](W-20261016-015-마감점검.md).

## 1. 전후 결과

사진 안 다른 번호 지시선↔괄호/지시선의 평행 길이 >8 SVG px에 대해 선 두께를 뺀 여유를 측정했다. 괄호↔괄호는 수치 검사에서 제외하고 별개로 보이는지 시각 확인했다. 원본 사진 픽셀 간격을 SVG px로 오인하지 않는다.

| 모델 | 원 전→후 | 기준 미달 평행 구간 전→후 | 후 전체 최소 여유(SVG px) | 후 내부 수평 >1/4 |
|---|---:|---:|---:|---:|
| Aquilon RS alpha | 8→8 | 2→0 | 11.389 | 0 |
| Aquilon RS1 | 10→10 | 2→0 | 11.389 | 0 |
| Aquilon RS2 | 10→10 | 2→0 | 11.389 | 0 |
| Aquilon RS3 | 10→10 | 2→0 | 11.389 | 0 |
| Aquilon RS4 | 10→10 | 2→0 | 11.389 | 0 |
| Aquilon RS5 | 10→10 | 2→0 | 11.389 | 0 |
| Aquilon RS6 | 10→10 | 2→0 | 11.389 | 0 |
| BRC-AM7 | 17→17 | 1→0 | 8.700 | 7 (기존 승인 유지) |
| SRG-A40 | 7→7 | 1→0 | 6.854 | 0 |

- 원 합계 **92→92**, 기준 미달 평행 구간 **16→0**, 원 겹침 **0**, 390px 문서 넘침 **0**.
- BRC-AM7 기존 긴 수평 구간 7개에는 후발 1/4 기준을 소급하지 않음(Work 2026-10-17 결정). 새 예외를 요청하는 것이 아님. Epson 8종도 이번 범위에 포함하지 않음.
- 실제 상세 페이지 390px에서 Rear 선택·번호 수·왼쪽/오른쪽 스크롤 상태·문서 폭 확인. 브라우저 오류 0.

## 2. 수정 내용과 식별 검토

- RS LOCK: 소켓 2개 아래로 괄호를 내려 실제 단자 폭을 표시. PSU 왼쪽 빈 통로로 내려감.
- RS LAN: 단일 LAN 아래 괄호, ON/OFF와 GPO 사이 별도 통로로 내려감. LOCK과 같은 수직선을 공유하지 않음.
- RS 멀티뷰어: HDMI 2개 아래 괄호에서 제어 블록 오른쪽 경계로 돌아 내려감. Dante와 분리.
- RS Dante: RJ-45 2개 아래에서 바로 내려감. 독립 검토가 RSalpha·RS1~5 끝다리의 ‘2ND’ 접촉을 찾아 y를 원본 16px 낮추었고, 최종 3배 확대에서 분리 재확인. RS6은 추가 하향 불필요.
- Sony BRC-AM7: #7 LAN via만 수정. #1 접지 괄호·경로는 그대로. LAN 옆에서 RESET 아래 빈 곳을 거쳐 왼쪽으로 나가 #1과 공유하던 14px 구간 해소.
- Sony SRG-A40: #5 VISCA OUT via 높이만 원본 744→748. #4 IN과 두 소켓 식별 유지, 지정 쌍 여유 6.854 SVG px.
- 번호·이름·설명·I/O·사양·사진·이미지 메타데이터·다른 표식 좌표·렌더러·검증기 불변. 실제 변경 표식은 RS 28개 + Sony 2개 =30개.

### 독립 시각 재검토

portmap-audit 스킬의 독립 재검토 절차로 다른 검토자가 원본과 전후 760px·390px 좌우·3배 확대를 직접 확인했다. 첫 검토의 Dante 인쇄 접촉을 고친 뒤 최종 재검토 결과는 아래와 같다.

| 모델 | 변경 표식 | 최종 판정 |
|---|---|---|
| Aquilon RS alpha | #5 LOCK, #6 LAN, #7 멀티뷰어, #8 Dante | 모두 OK |
| Aquilon RS1~RS6 각 제품 | #7 LOCK, #8 LAN, #9 멀티뷰어, #10 Dante | 6종 24표식 모두 OK |
| BRC-AM7 | #7 LAN | OK · #1과 분리, RESET·접지·단자 관통 없음 |
| SRG-A40 | #5 VISCA OUT | OK · #4와 분리, 소켓·인쇄 관통 없음 |

인접 LOCK/LAN 괄호 끝다리는 원본 6px(약2.27 SVG px) 간격이다. 이 괄호↔괄호 쌍은 수치6px 적용 대상이 아니며, 확대와 760/390에서 서로 다른 단자 범위로 분리되는 것을 확인했다. 자동 검사는 인쇄 글자와 의미상 오인을 판단하지 못하므로, 위 판정은 저장된 캡처의 변경 표식에 한정한다.

## 3. 캡처 72장

모든 제품에 전/후 각각 760px, 390px 좌/우, 변경 부위3배를 포함했다. Sony 3배 그림은 지정 번호 쌍 주변만 자른 것이며 전체 경로·원은 760/390 그림으로 확인한다.

| 모델 | 변경 전 | 변경 후 |
|---|---|---|
| Aquilon RS alpha | [760](W-20261016-015-closeout-fixes-preview/before/aquilon-rsalpha-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/before/aquilon-rsalpha-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/before/aquilon-rsalpha-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/before/aquilon-rsalpha-zoom3x.png) | [760](W-20261016-015-closeout-fixes-preview/after/aquilon-rsalpha-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/after/aquilon-rsalpha-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/after/aquilon-rsalpha-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/after/aquilon-rsalpha-zoom3x.png) |
| Aquilon RS1 | [760](W-20261016-015-closeout-fixes-preview/before/aquilon-rs1-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/before/aquilon-rs1-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/before/aquilon-rs1-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/before/aquilon-rs1-zoom3x.png) | [760](W-20261016-015-closeout-fixes-preview/after/aquilon-rs1-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/after/aquilon-rs1-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/after/aquilon-rs1-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/after/aquilon-rs1-zoom3x.png) |
| Aquilon RS2 | [760](W-20261016-015-closeout-fixes-preview/before/aquilon-rs2-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/before/aquilon-rs2-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/before/aquilon-rs2-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/before/aquilon-rs2-zoom3x.png) | [760](W-20261016-015-closeout-fixes-preview/after/aquilon-rs2-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/after/aquilon-rs2-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/after/aquilon-rs2-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/after/aquilon-rs2-zoom3x.png) |
| Aquilon RS3 | [760](W-20261016-015-closeout-fixes-preview/before/aquilon-rs3-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/before/aquilon-rs3-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/before/aquilon-rs3-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/before/aquilon-rs3-zoom3x.png) | [760](W-20261016-015-closeout-fixes-preview/after/aquilon-rs3-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/after/aquilon-rs3-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/after/aquilon-rs3-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/after/aquilon-rs3-zoom3x.png) |
| Aquilon RS4 | [760](W-20261016-015-closeout-fixes-preview/before/aquilon-rs4-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/before/aquilon-rs4-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/before/aquilon-rs4-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/before/aquilon-rs4-zoom3x.png) | [760](W-20261016-015-closeout-fixes-preview/after/aquilon-rs4-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/after/aquilon-rs4-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/after/aquilon-rs4-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/after/aquilon-rs4-zoom3x.png) |
| Aquilon RS5 | [760](W-20261016-015-closeout-fixes-preview/before/aquilon-rs5-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/before/aquilon-rs5-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/before/aquilon-rs5-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/before/aquilon-rs5-zoom3x.png) | [760](W-20261016-015-closeout-fixes-preview/after/aquilon-rs5-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/after/aquilon-rs5-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/after/aquilon-rs5-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/after/aquilon-rs5-zoom3x.png) |
| Aquilon RS6 | [760](W-20261016-015-closeout-fixes-preview/before/aquilon-rs6-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/before/aquilon-rs6-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/before/aquilon-rs6-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/before/aquilon-rs6-zoom3x.png) | [760](W-20261016-015-closeout-fixes-preview/after/aquilon-rs6-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/after/aquilon-rs6-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/after/aquilon-rs6-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/after/aquilon-rs6-zoom3x.png) |
| BRC-AM7 | [760](W-20261016-015-closeout-fixes-preview/before/brc-am7-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/before/brc-am7-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/before/brc-am7-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/before/brc-am7-zoom3x.png) | [760](W-20261016-015-closeout-fixes-preview/after/brc-am7-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/after/brc-am7-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/after/brc-am7-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/after/brc-am7-zoom3x.png) |
| SRG-A40 | [760](W-20261016-015-closeout-fixes-preview/before/srg-a40-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/before/srg-a40-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/before/srg-a40-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/before/srg-a40-zoom3x.png) | [760](W-20261016-015-closeout-fixes-preview/after/srg-a40-760.png) · [390-left](W-20261016-015-closeout-fixes-preview/after/srg-a40-390-left.png) · [390-right](W-20261016-015-closeout-fixes-preview/after/srg-a40-390-right.png) · [zoom3x](W-20261016-015-closeout-fixes-preview/after/srg-a40-zoom3x.png) |

## 4. 검사 근거

- 원본 고정 fixture: `tests/fixtures/w015-closeout-before.json`. 9지도 변경 전 좌표와 전체 나머지 제품 필드/사진 SHA, 최종 지도 SHA 기록.
- `tests/w20261016-015-closeout-fixes.test.mjs`: 12건. 첫 간격 시험은 변경 전 9지도 전부 실패(원본 불변 검사 1건 통과)를 확인하고 수정 후 통과. 범위 밖 필드·사진·번호·다른 좌표 보존, 간격/원/긴 선, exact hash 역사 복원, 잘못된 mutation 거부, 반복 복원 검사.
- 기존 W-014/W-017 역사 복원에 이번 승인 후보 지도만 되돌리는 단계를 연결. 과거 기준 fixture와 기존 검사 조건은 보존.
- `node --test --test-concurrency=1 tests/*.test.mjs`: **872건, 871 pass / 0 fail / 기존 skip 1**, 58.3초.
- `node beta/build-detail-assets.mjs`, `node beta/update-snapshot.mjs`, 검색 인덱스·읽기용 카탈로그 재생성.
- `node beta/build-search-index.mjs --check`, `node beta/build-readable-catalog.mjs --check` 통과.
- `node beta/verify-pages.mjs`: 289 제품 / 286 상세 / 529 사진 / 167 PDF 항목, 종료0. 기존 PDF Canvas/font 환경 경고는 있었고 검사 실패는 없음.
- 독립 코드 리뷰: Blocking/Important 0. 연속 선분 합산 간격 재측정, 승인 범위 확인, 표식 문구 mutation 184건 거부 확인. 최신 main 통합·CI 결과는 PR과 인계 기록에 최종 기재.
- 로컬 측정/캡처 스크립트와 원시 결과는 `outputs/w015-closeout-fixes/`에 보존(PR 제외). 캡처와 검사 fixture는 PR에 포함. Python 미설치 환경에서 공개 SVG 렌더러 + Chrome CDP로 측정·캡처.

## 최신 main 통합

- origin/main f5a7a6b0433166209fca715ad37bd874dd158500 (#602 Zenith100 보정 포함)을 통합. 제품/테스트/사진의 세션 B 변경을 그대로 보존. 검색 인덱스 충돌은 원본에서 재생성으로 해결.
- 본 PR 기준 예외 문서 변경은 세션 D 섹션 8줄 추가뿐. 렌더러·검증기·잠금 PDF·builder/cpq·다른 세션 진행 파일 변경 없음.
- 통합 후 전체872건871pass/0fail/기존skip1(54.8초), 종료0. Pages·검색·읽기용카탈로그check 재통과.
