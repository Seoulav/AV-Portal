# Codex 세션 B 진행 기록

세션 B 전용 기록이다. 세션 A의 `Work/지시서.md`는 수정하지 않는다.

## W-20261012-007 — Ross Video 한국에빅스 링크

- 상태: MERGED · PR #395 · `1e151021d3fbe8be44845a4d013181c7bc875fcc`
- 명세: `Work/작업/W-20261012-007.md` (읽은 main: `d79d5fb`)
- 브랜치: `codex/W-20261012-007-epics-links`; 전용 워크트리 `codex-b`
- 승인·선행: 사용자 최신 2026-10-12 지시가 한국에빅스 주소를 `http://avics.co.kr/ross`로 정정하고 세션 A와 병렬 진행하도록 배정했다.
- 범위: Ross Video 5종의 모델명 대조, 정확히 일치하는 국내 공급사 링크, 제조사·총판 URL 검증 최소 확장. 제품 JSON·카탈로그는 수정하지 않는다.

- [x] Ross 11개 하위 페이지와 Routing Switcher 본문을 브라우저에서 확인했다. 전체 모델명 일치는 `ULTRIX-HDX-IO`만 확인. `ULTRIX-NS-FR2`·`ULTRIPOWER`·`ULTRIPOWER-PS`·`ULTRITOUCH-2-HR`는 찾지 못해 링크를 만들지 않는다.
- [x] 전용 테스트 RED→GREEN, 기존 하만 48개 링크 유지, Pages 자료 검증 통과.
- [x] 수정 전용 검사 9/9, 전체 순차 검사 453건(452 pass·0 fail·기존 skip 1), 검색 인덱스 일치, Pages 자료 검증 272장비·265상세·442 WebP·128 uploads, 잠긴 PDF 업로드 12건 유지를 확인했다.
- [x] 최신 main 통합 뒤 생성 산출물 재생성·최종 검사, PR·CI·병합·Pages 배포와 공개 총판 링크를 확인했다.

## W-20261012-010 — AVer TR535 신규 등록

- 상태: MERGED · PR #397 · `77ed8aacf4c4f6a38f8f28941f7a293e38a6c0f3`
- 명세: `Work/작업/W-20261012-010.md` (읽은 main: `1e151021d3fbe8be44845a4d013181c7bc875fcc`)
- 브랜치: `codex/W-20261012-010-aver-tr535`; 전용 워크트리 `codex-b`
- 범위: 한국 공식 TR535 제품 페이지와 그 페이지가 제공하는 TR535 브로슈어만 사용. TR535N·AVer 미국 자료 미적용.

- [x] 한국 공식 제품 페이지를 브라우저로 열어 모델명·사양·이미지·브로슈어 링크를 확인했다.
- [x] TR535 카탈로그·상세 JSON·전면/후면 WebP·11개 Port Map·Signal Flow를 등록했다.
- [x] 웹과 브로슈어의 줌 값 충돌을 `CONFLICTED`로 병기하고 계산값을 만들지 않았다.
- [x] Port Map 감사 시트에서 11개 표식의 대상·순서·좌표를 눈으로 확인했다.
- [x] TR535 전용 검사 4/4, 최신 main 통합 후 전체 직렬 검사 465건 중 464 pass·0 fail·기존 skip 1을 확인했다.
- [x] `verify-pages`, 검색 인덱스 `--check`, 명사형 검사, 잠금 PDF 12건 유지를 확인했다.
- [x] 최신 main 통합 뒤 파생 산출물을 재생성하고 PR·CI·병합·Pages 공개 화면(1280px·390px)을 확인했다.

## W-20261012-012 — Ross Video Ultrix 라이선스 4종

- 상태: MERGED · PR #399 · `7bac4ef289e306dc723eb1e2754d406968377820`
- 명세: `Work/작업/W-20261012-012.md` (읽은 main: `77ed8aacf4c4f6a38f8f28941f7a293e38a6c0f3`)
- 브랜치: `codex/W-20261012-012-ultrix-licenses`; 전용 워크트리 `codex-b`
- 범위: 기존 카탈로그의 라이선스 4종에 상세 slug·소프트웨어 상세·한국에빅스 공급사 링크를 추가한다. 사진·I/O·Port Map·Signal Flow는 금지한다.

- [x] 한국에빅스와 Ross Video 공식 자료를 브라우저로 열어 라이선스 기능·SKU·FR2 한도를 대조했다.
- [x] `ULTRISCAPE`·`ULTRIMIX-MXR`·`ULTRISYNC-18`·`ULTRIMIX-DANTE` 상세를 사진·단자 없이 등록했다.
- [x] ULTRISYNC 기능과 FR2 최대 72입력은 확인하고, `ULTRISYNC-18` 정확한 SKU 구성은 `REVIEW REQUIRED`로 보존했다.
- [x] 한국에빅스 라이선스 URL을 네 모델의 검증된 공급사 링크로 연결하고 Pages 검사를 정확한 대응표 기반으로 확장했다.
- [x] W-012 전용 되감기 함수로 과거 전체 해시 검사를 유지하고 잠금 PDF 12건을 확인했다.
- [x] 카탈로그 273건 유지, 상세 270건, 전용·관련 검사와 Pages·검색·읽기용 카탈로그·명사형 검사를 통과했다.
- [x] 최신 main 통합 뒤 파생 산출물을 재생성하고 PR·CI·병합·Pages 배포를 확인했다. 공개 상세 4종은 HTTP 200이며 사진·I/O·Port Map·Signal Flow가 없고 ULTRISYNC-18만 `REVIEW REQUIRED`다.

## W-20261012-008 — 앰프 출력 사양 임피던스 표

- 상태: MERGED · PR #404 · 병합 `1fc8dd36904c66b4990a54d2b9b3692a424e5417`
- 명세: `Work/작업/W-20261012-008.md` (읽은 main: `e9a375fe472131125d597eb871267d9a6979b705`)
- 브랜치: `codex/W-20261012-008-amp-table`; 전용 워크트리 `codex-b`
- 승인: 사용자 2026-10-12의 전 앰프 표 적용 재촉과 READY 명세.
- 범위: 옴별 출력 그룹이 있는 모든 앰프의 사양 렌더링 피벗. 제품 JSON·세션 A 진행 파일은 수정하지 않는다.

- [x] 출력 부하 패턴을 가진 Crown 23종을 전수 집계했다. CDi·DCi의 같은 출력 그룹에 속한 `70Vrms` 등도 표에 유지했다. XLS 상세 데이터는 저장소에 없다.
- [x] 렌더러 계약 검사 RED→GREEN. i-tech 충돌값·조건·배지·출처 기록과 비출력 사양을 보존했다.
- [x] i-tech·CDi 2종·DCi 1종을 1280px·390px로 캡처했다. 390px 문서 너비는 375px이고 표는 카드 안에 머문다.
- [x] 삼성 `lh32qmcebgcxkr`와 JBL `control-23-1`의 사양 표·출처 기록 DOM SHA-256은 같은 데이터의 기준 main 렌더러와 일치했다.
- [x] 전체 직렬 검사 476건 중 475 pass·0 fail·기존 skip 1, Pages 자료 검증 273장비·270상세·451 WebP·128 uploads, 검색 인덱스 일치, 잠금 PDF 업로드 12건 유지를 확인했다. 기본 병렬 실행의 RTCOM 복구 테스트 1건은 단독·직렬 실행에서 통과했다.
- [x] 최신 main `1e7daa64083f01dea281861f075b21899d79c3ad` 통합 후 상세 파생 자산을 재생성했다. PR #404 CI 전체 통과 후 병합했으며, Pages 배포 run `38243264841` 성공을 확인했다.
- [x] 공개 i-tech 4x3500HD 화면에서 표·8Ω 충돌 조건·빈칸 대시를 확인하고 [캡처](기록/W-20261012-008-screens/public-i-tech-4x3500hd-1280.png)를 추가했다.

## W-20261012-013 — 빌더 라이브러리 단자 전수 검토

- 상태: IN_PROGRESS · 1차 리뷰 수정 반영·재검증 완료, PR 준비
- 명세: `Work/작업/W-20261012-013.md` (읽은 main: `a16360380e42e3b150876778e6745de0cb1cfd04`, PR #409)
- 브랜치: `codex/W-20261012-013-builder-ports`; 전용 워크트리 `codex-b`
- 승인·범위: 사용자 2026-10-12 READY 명세. 1차는 Crown·Powersoft·BSS의 아날로그 I/O와 Shure ULXD4·ULXD4D. 세션 A 충돌 제품 JSON은 건드리지 않는다.
- 기준 리포트: 제품 303, I/O 행 1,451, 생성 단자 2,145, 확인 필요 264, 단자 0 제품 12.

- [x] Shure ULXD 단일/2채널 공식 매뉴얼을 대조했다. ULXD4 원본 복합 행 `1/4" (6.35 mm) TRS 및 XLR`을 그대로 보존하고 근거 기반 IO_OVERRIDES로 XLR 1·TRS 1을 생성했다. RF BNC 2, Ethernet 제어 1이며 Dante는 추가하지 않았다. ULXD4D의 XLR 2·Dante RJ-45 2는 기존 생성 결과와 일치함을 검사했다.
- [x] Crown I-TECH 4x3500HD 공식 매뉴얼 rear-panel diagram을 근거로 다중 포트 override를 추가했다. 아날로그 XLR 4, AES3 XLR 2, CobraNet/VDrive RJ-45 1. 원본 복합 I/O 문구는 그대로 유지한다. 옵션 Speakon/Binding Post 스피커 출력 행은 선택형이므로 검토 상태로 둔다.
- [x] ULXD4 변경의 과거 이력 되감기 함수와 전체 제품 해시 연결 검사 초안을 추가했다.
- [x] 1차 리포트 변화: 확인 필요 264→261, I/O 행 1,451→1,452, 단자 2,145→2,157, 단자 0 제품 12 유지. Crown 28→27, Shure 35→33. 미확정 BLU-160 카드 구성·Mezzo 322 AD 커넥터는 값 추정 없이 남겼다.
- [x] ULXD4 원문 보존을 요구한 독립 리뷰 지적을 반영했고, 표적 테스트 5/5 및 전체 테스트 484건(483 통과·기존 skip 1), Builder·검색 인덱스·읽기 카탈로그·Pages 검증을 통과했다.
- [ ] 최신 main 재통합·커밋·PR 리뷰·병합·Pages 공개 및 Builder 화면 캡처.
