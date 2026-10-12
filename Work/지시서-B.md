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

- 상태: IN_PROGRESS · 1차 MERGED, 2차 Shure 묶음 구현·검증 완료, PR 준비
- 명세: `Work/작업/W-20261012-013.md` (READY, PR #409 병합; 읽은 기준 main `a16360380e42e3b150876778e6745de0cb1cfd04`)
- 구현: 1차 PR #410 병합 `6c9a904ae5be8922021852d2743767ee2cb7f848`; 2차 Shure 브랜치 `codex/W-20261012-013-phase2-shure`
- 승인·범위: 사용자 2026-10-12 READY 명세. 세션 A 제외 목록의 제품 파일은 변경하지 않는다.

### 1차 — Crown·Powersoft·BSS 및 ULXD4/ULXD4D

- [x] 공식 문서 대조, I/O 전용 이력 되감기, 공개 Builder 캡처를 포함해 PR #410 병합.
- [x] Pages 배포 workflow run `38248661982` 성공 확인. Crown/I-TECH와 ULXD4 캡처는 `Work/기록/W-20261012-013-screens/`에 기록.
- [x] 당시 기준 제품 303·I/O 1,452·생성 단자 2,157·미해결 261·단자 0 제품 12.

### 2차 — Shure 묶음

- [x] 정확한 모델 자료로 MX395, MXC420/C, MXCW640, MXCWAPT-W, QLXD1/4, SLXD1+/4+/4D+, UA844+SWB, UA845UWB, UA864A, UA874XA, ULXD1의 수량·포트 표현을 보강했다. 원문 복합 커넥터는 유지하고 필요한 경우 `IO_OVERRIDES`를 사용했다.
- [x] ULXD4Q·MX392/C·MX418D/C는 세션 A 작업 충돌 회피로 그대로 뒀다. MX395 팬텀 전원 행, MXA925W-R 중복 오디오 행, MXCWAPT-W 공유 RJ45 Dante/PoE 행도 중복 물리 포트를 만들지 않도록 미해결로 보존했다.
- [x] 제품 13종의 I/O 전용 되감기와 고정 전체 제품 SHA 검사를 연결했다. W-06005 고정 해시 테스트도 새 W-013 이력 규칙과 연결했다.
- [x] 리포트 변화(2차 전): 제품 303·I/O 1,452·생성 단자 2,157·미해결 261·단자 0 제품 12 → 제품 303·I/O 1,453·생성 단자 2,214·미해결 238·단자 0 제품 7. Shure 미해결 10행(세션 A 제외 7행 포함)은 제품/행별 이유와 함께 PR 기록에 남긴다.
- [x] 집중 검사 16/16. 최신 main 통합 후 전체 Node 검사 498건 중 497 pass·0 fail·기존 skip 1을 순차 실행으로 확인했다. 검색 인덱스·스냅샷을 재생성했고 Builder, 검색 인덱스 `--check`, 읽기 카탈로그 `--check`, Pages 검증을 통과했다(장비 274·상세 271·공식 WebP 452·사용자 업로드 PDF 항목 130). 잠금 PDF 12건은 전체 검사에서 확인.
- [x] 최신 `origin/main` `9fa8e5bd09551c00c5c6c8f559ce438d37b2ee15` 통합. 파생 인덱스 충돌은 재생성으로 해결하고 merge commit `417bbc7`에 기록. 통합 후 전체 검증 통과.
- [x] PR #414 병합·Pages 배포를 확인하고 공개 Shure ULXD1 화면을 캡처했다. 병합 SHA `30c341b5177a62644f1dfe38efb3540f0bc33608`, workflow run `38253262599`.
- [x] Shure 묶음 배포 후 Powersoft 제조사 묶음으로 이어갔다.

### Shure 묶음 배포 완료 보완

- PR #414 병합 SHA `30c341b5177a62644f1dfe38efb3540f0bc33608`; Pages workflow run `38253262599` 성공.
- 공개 Builder ULXD1 화면에서 아날로그 마이크 입력 1개와 RF 출력 1개, 이슈 0을 확인하고 캡처를 `Work/기록/W-20261012-013-screens/public-builder-shure-ulxd1-1280.png`에 추가.

### Powersoft Mezzo 묶음

- 상태: MERGED · PR #415 · merge SHA `62879814cd5ad4e52cb727a419594d584829d498`; Pages run `38255978790` 성공.
- 범위: `mezzo-322-a`, `mezzo-322-ad`, `mezzo-324-a`, `mezzo-324-ad`, `mezzo-602-a`, `mezzo-602-ad`, `mezzo-604-a`, `mezzo-604-ad`. 제품 JSON은 바꾸지 않았다.
- 공식 MEZZO User Guide·Series Datasheet에서 모델군의 3.5mm 스테레오 미니잭과 322 AD 입력 블록 단자를 확인했다. 322 AD는 단일 Euro 5mm 출력 커넥터에 출력 2채널을 제공한다. DasaSR 사이트는 자동 사람 확인 페이지로 자료 열람이 막혀 제조사 자료를 대체 근거로 사용했다.
- 8개 exact-match override 추가: 7개 모델의 공유 스테레오 미니잭 입력 1개씩, 322 AD의 입력 복합 행(블록 1·미니잭 1), 스피커 출력 블록 1개. 원문 행은 유지했다.
- Builder 전후: 303 제품·1,455 I/O·2,216 단자·238 확인 필요·단자 0 제품 5 → 303·1,455·2,226·229·5. Powersoft 확인 필요 8→7. 나머지는 GPI·네트워크 Dante 공유 포트 등 수량 근거가 없어 보류.
- Powersoft 집중 4/4, Builder 기존 검사 14/14, 전체 직렬 검사 502건 중 501 pass·0 fail·skip 1. 검색 인덱스 `--check` 및 `verify-pages` 통과. 읽기용 카탈로그 생성은 `codex-b` 쓰기 권한이 막아 최신 main 통합 후 승인된 실행으로 다시 확인 예정.
- 제외 제품 JSON은 건드리지 않았다. 최신 main 기준으로 검색 인덱스·스냅샷·읽기용 카탈로그를 재생성했고 CI에서 카탈로그·검색·Pages 검증을 확인했다. 공개 Builder에서 322 AD 입력 2·Speaker Out 1·Dante I/O 2와 이슈 0을 확인했다. 캡처: `Work/기록/W-20261012-013-screens/public-builder-powersoft-mezzo-322-ad-1280.png`. 미확정 GPI 행은 확인 1로 남아 있다.
- PR #415 병합 SHA `62879814cd5ad4e52cb727a419594d584829d498`; Pages run `38255978790` 성공.
- Pages 이후 공개 Builder URL에서 MEZZO 322 AD를 추가해 Line Audio In 1·2, Speaker Out 1, Dante I/O 1·2를 확인했다. 이슈는 0, 미확정 GPI 행은 `확인 1`로 유지됐다. [화면 캡처](기록/W-20261012-013-screens/public-builder-powersoft-mezzo-322-ad-1280.png).
- 다음 제조사 검토는 BSS Audio 묶음부터 이어간다.