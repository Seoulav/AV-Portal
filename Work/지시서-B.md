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
### BSS Audio GPIO 묶음 (PR 준비)

- 상태: 구현·집중 검증 완료, PR 준비. 브랜치 `codex/W-20261012-013-phase4-bss`; 세션 A 제외 제품 JSON은 수정하지 않았다.
- `beta/port-vocabulary.mjs` exact-match override 4건과 `tests/w013-bss-ports.test.mjs` 추가. 리뷰에서 지적된 connector 원문 검증 assertion도 보완했다.
- BSS 공식 모델별 자료로 BLU-100·101·160 GPIO 12입력·6출력을 확인해 Phoenix/Combicon 단자 포트로 분리했다. BLU-50v2는 방향별 수량만 확인되고 단자 모양은 불명확해 `UNKNOWN`으로 유지했다.
- 최신 main 기준 Builder 리포트: 303 제품·1,459 I/O·2,230 단자·229 확인 필요·단자 0 제품 5 → BSS 적용 후 303·1,459·2,302·225·5. BSS 확인 필요 행은 10→6.
- 남은 BSS 6행은 BLU-160 선택 카드 I/O 5행(실제 장착 구성에 따라 다름)과 BLU-50v2 watchdog 출력 수량 1행(공개 자료에서 불명확)으로, 추정하지 않고 남겼다.
- BSS 집중 5/5, Builder 라이브러리 검사 14/14. 최신 main `dcbc37b` 통합 후 검색 인덱스·공개 스냅샷·읽기 카탈로그 재생성, 검색 인덱스 `--check`, 읽기 카탈로그 `--check`, `verify-pages` 통과(장비 274·상세 271·공식 WebP 453·사용자 PDF 항목 130). 생성된 파생 파일의 추가 diff 없음.
- 전체 `npm test`: 511건 중 508 통과·2 실패·기존 skip 1. 두 실패 모두 RTCom 동기화의 Windows 임시 디렉터리 rename `EPERM`; 그중 한 케이스는 단독 재실행 통과. W-013 BSS 테스트는 통과했다.
- BSS 근거: [BLU-100 datasheet](https://bssaudio.com/en/product_documents/blu100_datasheetpdf), [BLU-101 datasheet](https://bssaudio.com/en-US/product_documents/blu101datasheet_18-0818-bpdf), [BLU-160 datasheet](https://bssaudio.com/en-US/product_documents/blu160datasheet-pdf), [BLU-50v2 한국 제품 페이지](https://bssaudio.com/ko/products/blu-50v2) 및 [공식 datasheet](https://bssaudio.com/ko/site_elements/data-sheet-blu-50v2).
- 남은 단계: PR 필수 CI 확인·병합·Pages 배포, 공개 BLU-100 Builder 화면 캡처 및 기록. BSS 묶음 뒤 나머지 제조사 검토를 계속한다.

- PR #420 병합 완료: merge SHA `5f0a976d3acc2414438b54ccfb62f7c1120b5f17`; Builder CI run `38258773502` 성공. Pages 배포 run `38259165309` 성공.
- 공개 Builder에서 BLU-100의 GPIO In 1–12와 GPIO Out 1–6, 이슈 0을 확인했다. [화면 캡처](기록/W-20261012-013-screens/public-builder-bss-blu-100-1280.png).
- BSS 묶음 병합·배포·공개 화면 확인 완료. 다음은 남은 제조사별 확인 필요 행을 계속 검토한다.


## W-20261012-013 first phase closeout

- Status: first phase complete; PR #420 merged at `5f0a976d3acc2414438b54ccfb62f7c1120b5f17`. Builder CI run `38258773502` passed; Pages run `38259165309` passed.
- Scope completed: Crown/I-TECH, Powersoft Mezzo, BSS GPIO, ULXD4 and ULXD4D batches. Public BLU-100 Builder page confirmed GPIO In 1-12 and GPIO Out 1-6, with issue count 0; capture: `Work/기록/W-20261012-013-screens/public-builder-bss-blu-100-1280.png`.
- Session B has moved to the queued W-014 task. Other manufacturer batches remain for later planning.


## W-20261012-014 Shure lineup

- Status: implementation and local verification complete; preparing PR. Branch `codex/W-20261012-014-shure-series`, based on main `134ec37e3b2ef59d8f30473ca682f90459badad1`.
- Added brandSort to all 30 Shure catalog items and seven lineup groups. A900W-R-GM is in MXA based on [Shure A900-GM](https://pubs.shure.com/view/guide/A900-GM/en-US.pdf), [MXA920](https://www.shure.com/en-US/docs/guide/MXA920), and [MXA925](https://www.shure.com/en-US/docs/guide/mxa925); removed the standalone ACC group.
- W-014 focused/regression tests: 14 passed. Search index, readable catalog, and Pages verification passed. Full suite: 512 passed, 1 existing skip, and one unrelated RTCOM Windows rename test failed with EPERM; isolated rerun passed.
- Remaining: latest-main integration, final full verification, PR/CI, merge, Pages deployment, and public Shure lineup screenshot.


## W-20261012-014 release closeout

- PR #422 merged, merge SHA `13218d3639a668190764b0b6b5a6ba47a7ae794e`; Builder CI run `38262027969` and Pages deployment run `38262404409` passed.
- Public AV Portal Shure view confirmed all 30 items and seven groups: ULX-D 8, QLX-D 4, SLX-D+ 6, MXC 3, MX 3, MXA 2, UA 4. A900W-R-GM appears in MXA and no ACC group is shown.
- Screenshot: `Work/기록/W-20261012-014-screens/public-shure-lineup-1280.png`. W-014 complete. Proceeding to queued W-017 after this closeout record.

## W-20261012-017 Aquilon RS4 + manufacturer layer tables

- Status: complete. Implementation PR #425 merged at `74f7509c04abb7db46c9eedcbfaf5f2b85166185`; heading/column-label fix PR #426 merged at `bc8411c7cb07ada4c4a52082f1c8944ae76400e8`; browser-cache invalidation PR #428 merged at `fa97738c887c94eecab917422c97a72520581ae4`.
- Merge order: by user direction, W-017 PR #425 merged before session A's W-013-A PR #427. PR #427 merged to main while the UI follow-ups were in progress; latest main was integrated for PR #428. No session A files were edited.
- W-015 integration: integrated main commit `53c7e7401bd68c8568d51db24b5550ea3cf4904f`; resolved conflicts in both detail HTML templates and the UI verification test while preserving both RTCOM data forwarding and the layer table. Regenerated detail assets, search index, readable catalog, and snapshot.
- Added manufacturer-specific layer tables for Analog Way (7), NovaStar (2), and Colorlight (3). Current row is highlighted and accessible; mobile uses an internal horizontal scroller. XDM-WOS100 excluded. No product JSON/catalog/photo/PDF changes.
- Verification: after integration, full Node suite 522 passed, 0 failed, 1 existing skip; verify-pages, search/readable-catalog --check, RTCOM --check, and feature-wording scan passed. CI passed for code PRs #425/#426/#428. Pages runs #425 `38267442851`, #426 `38268877683`, latest #428 deployment `38269959164` succeeded.
- Live public check: RS4 table 7 rows; Analog Way Zenith 100 7; NovaStar H5 2; Colorlight X100 Pro-7U 3; each highlights the current model. At 390px, document width remains 390px; table wrapper is 318px, content 940px, and internal scrolling works (scrollLeft 180).
- RS4 history: first registered by commit `98f9056dd765d32387bdf8736441520bc25c527f`, PR #363 (W-20261006-002; merged 2026-10-11 UTC). Existing values match supplied `Aquilon-RS4-datasheet-en-20260703.pdf`; SHA-256 `F1D84D18B3C91EDD41459BA944C09A9698A52E69557FF3364FBB5EA84AB17E1C` matches the task reference. Checked figures: 24x4K60p inputs, 16x4K60p outputs, up to 12x4K or 24xDL/2K mixing layers, and 120MP Program throughput. W-016 table agrees. Version-label difference: filename date 20260703, while page 7 internal code is the older `AQL-RS4-EN-20260401`; no figure conflict found. Existing record was not duplicated or changed.
- Screenshots (desktop; mobile versions are in the same directory): [RS4](기록/W-20261012-017-screens/public-rs4-1280.png), [Analog Way](기록/W-20261012-017-screens/public-analog-way-zenith-100-1280.png), [NovaStar](기록/W-20261012-017-screens/public-novastar-h5-1280.png), [Colorlight](기록/W-20261012-017-screens/public-colorlight-x100pro-7u-1280.png).


## W-20261012-013 2? (B2) baseline

- Branch: `codex/W-20261012-013-builder-ports-b2`; latest main at start: `7974b7996035f18d0df2a54aa3a4c904e38244cf` (includes W-017 closeout and W-013-A merge).
- Baseline command: `node beta/build-builder-library.mjs --report`. Catalog 303 products / 1,459 I/O rows / 2,329 generated ports. Rows: ports 1,126 (77.2%), unresolved 210, wireless 49, unsupported 23, slots 32, service 19. Product counts: ports present 265 (fully resolved 163, partly unresolved 102), I/O but zero generated ports 5, no I/O 33.
- Assignment excludes Samsung (31 unresolved rows), Analog Way (31), Roland (19), leaving **129 unresolved rows** for this phase across all other brands. Relevant residual batches: Crown 27, Panasonic 16, Powersoft 7, BSS Audio 6, Shure 5, plus other manufacturers.
- I/O but zero generated ports: Logitech Rally Mic Pod Extension Cable, Rally Mic Pod Hub; Colorlight X100Pro 2U, 4U, 7U. These require official evidence and row classification before adding ports.
- Rules: official sources only for filling factual gaps; use exact-match IO_OVERRIDES when source wording is correct but parser lacks a mapping; retain ambiguous rows and explain. Do not edit Samsung, Analog Way, or Roland files. Preserve product data with W-013 history rewind functions, regenerate derived assets only after integrating latest main, and request merge-order confirmation before merge.
- Checklist: [ ] manufacturer-by-manufacturer work/report; [ ] B2 history rewind and focused tests; [ ] report before/after comparison; [ ] public Builder captures; [ ] full suite + verify-pages + builder-library report/check; [ ] latest-main integration and artifact regeneration; [ ] PR/CI; [ ] request merge-order confirmation; [ ] merge/Pages/public verification.

### B2 manufacturer report: Shure

- Scoped baseline: 5 unresolved rows, including MX392/C, MX395, MX418D/C, MXA925W-R, and MXCWAPT-W.
- Reviewed model-applicable Shure material: MX39x User Guide (https://www.shure.com/en-US/docs/guide/MX39x), MX395 User Guide (https://www.shure.com/en-US/docs/guide/MX395), MX412D/MX418D User Guide (https://www.shure.com/en-US/docs/guide/MX400D), MXA925 User Guide (https://www.shure.com/en-US/docs/guide/mxa925), and MXCW User Guide (https://pubs.shure.com/view/guide/MXCW/en-US.pdf).
- Three phantom-power rows (MX392/C, MX395, MX418D/C) are already supplied through the existing microphone audio connection, so no separate power port is generated. MXA925W-R's PoE row is represented on primary RJ45 port 1; the manufacturer guide specifies only two RJ45 ports, so the duplicate third port is suppressed. Its separate source row describing phantom-powered audio conflicts with the official guide's Dante/PoE description and remains unresolved without changing the source wording.
- MXCWAPT-W's model-applicable guide identifies one Ethernet RJ45 used for Dante and PoE. Filled blank I/O quantity with 1 and marked VERIFIED (source tags P, M); raw connector/signal/condition wording retained. A B2 rewind fixture protects its whole product SHA and I/O SHA.
- Report after Shure: 303 products / 1,459 I/O rows / 2,328 ports; 1,130 port rows (77.5%), 206 unresolved. Shure unresolved 1 row (MXA925W-R), unresolved Shure rows reduced 5 to 1; global ports reduced by one because duplicated PoE connector was removed. Focused tests: 13 passed, 0 failed.

### B2 manufacturer reports: Crown, Powersoft, BSS Audio

- Crown scoped baseline was 27 unresolved rows. Crown CDi BLU Link/HiQnet, CDi GPIO/AUX, DCi Network GPIO/AUX and DCi DA Dante/AES67 rows now map to model-documented terminals. ComTech D rows were corrected from a combined GPIO/AUX label to four GPI inputs, and the separate three-pin NO/COM/NC fault relay output was recorded from the Crown manual/datasheet. Crown is down to one unresolved row: I-Tech 4x3500HD speaker connector is listed as a Speakon-or-binding-post option, but the exact installed variant is not established. It remains unresolved.
- Powersoft's 7 unresolved rows were addressed using the MEZZO user guide and official product/rear-panel references. Four-channel AD Dante rows share the already represented dual RJ45 Ethernet ports; overrides suppress duplicate physical ports. MEZZO 322 AD's two model-specific GPI inputs are mapped, and the official status contact output is now represented separately on the shared terminal block.
- BSS Audio's 6 unresolved rows were addressed with model-specific official material. BLU-160 card rows now use their documented four slots, four channels per installed card, up to 16; BLU-50v2 watchdog output is mapped as one Phoenix/Combicon control output. No connector count was inferred from the ambiguous GPIO accessory kit.
- After these manufacturer groups, report is 303 products / 1,462 I/O rows / 2,479 generated ports; port rows 1,172 (80.2%), unresolved 167. Scoped global report reduction from the Shure checkpoint: Crown 27→1 (-26), Powersoft 7→0 (-7), BSS Audio 6→0 (-6). Relevant focused suite: 12 passed, 0 failed. Rewind fixture checks 21 B2-modified product JSON files against the pre-B2 baseline `7974b7996035f18d0df2a54aa3a4c904e38244cf`; only I/O fields are permitted to differ.

### B2 manufacturer report: Panasonic

- Panasonic began with 16 unresolved rows. Fifteen exact rows for PT-MZ11K, PT-MZ14K, PT-MZ17K, and PT-MZ882 now map serial/multi-projector sync, remote-control, and USB terminals from the model-applicable Korean manuals (DPQP1432ZC/X1 page 28; DPQP1564ZA/X1 page 27). No product JSON wording was changed; exact source-text IO_OVERRIDES were used.
- PT-MZ17K's AC input row remains unresolved because the data marks the connector and value MISSING and provides no model-specific official value. No AC connector was inferred.
- Panasonic unresolved rows: 16→1; focused tests: 2 passed, 0 failed. Current report: 303 products / 1,462 I/O rows / 2,500 generated ports; 1,187 port rows (81.2%), 152 unresolved. Excluding the three assigned-out brands' 81 rows leaves 71 unresolved rows in B2's scope.

### B2 manufacturer reports: Sony, Blackmagic Design, AMX, Televic, AJA, Yamaha

- Sony BRC-AM7's VISCA RS-422 RJ45 input/output, two XLR audio inputs, and one 3.5 mm audio input were mapped from model-specific manufacturer specs/help. One Sony `srg-a40` row still reports unsupported Sync as quantity 0 and was left unresolved.
- Blackmagic HyperDeck Studio HD Plus/Pro SDI (2 program + 1 monitor), HDMI (1 input + 1 output), and RS-422 (1 input + 1 output) were mapped from the manufacturer technical specs/manual. All 6 rows resolved.
- AMX NX-1200/NX-2200/NX-3200 AxLink terminals were mapped as bidirectional GPIO using each model's datasheet. One other AMX row remains unresolved.
- Televic Confidea FLEX, Plixus AE-R Dante, and Plixus NEXT network connectors were mapped to their model-specific port counts and upstream/downstream or loop-through roles. All 4 rows resolved.
- AJA Ki Pro GO2's four SDI inputs, four SDI pass-through outputs, one SDI monitor output, and reference input/loop output were mapped from its manual. The separate timecode row remains unresolved because its source lists SDI BNC or analog XLR as alternate paths and says LTC consumes an audio channel; no single terminal is inferred.
- Yamaha DM7 AES/EBU is two stereo pairs (two XLR connectors in and two out); both rows resolved from the Korean Reference Manual.
- Sony 5→1, Blackmagic 6→0, AMX 4→1, Televic 4→0, AJA 5→1, Yamaha 2→0. Combined checkpoint report: 303 products / 1,462 I/O rows / 2,550 ports; port rows 1,210 (82.8%), unresolved 129. The three excluded brands still account for 81; B2 scope now has 48 unresolved rows. Relevant focused test files: 6 tests passed, 0 failed.

### B2 manufacturer report: Yealink and Logitech

- Yealink AVHub USB-A ×2, USB-B ×1 and VCH RJ45 ×7, plus UVC86 USB-A and VCH RJ45, are mapped from the official model data sheets. AVHub's separate Codec Port remains unresolved because the source names the port but does not specify the physical connector or data direction.
- Logitech Rally Bar microphone input, Rally Mic Pod/HUB proprietary links, and Rally Plus display/table hub links now produce their documented physical terminals. Rally Mic Pod Extension Cable remains unresolved because the current connector label is explicitly marked estimated and no exact connector evidence is present.
- Yealink 6→1 and Logitech 6→1 unresolved rows. The Rally Mic Pod Hub no longer appears among products with I/O but zero generated ports; the cable still does. Current report: 303 products / 1,462 I/O rows / 2,569 ports; port rows 1,220 (83.4%), unresolved 119; 4 products have I/O but zero generated ports. Focused tests: 2 passed, 0 failed.

### B2 manufacturer reports: Ross Video and Lumantek

- Ross Video Ultritouch-2-HR's two external DC inputs, two RJ45, and physically present HDMI/USB ports (both marked unimplemented in source) are represented. Ultrix NS-FR2's ENET1/2 are mapped. Ultripower's required PSU1 AC inlet is represented; optional PSU2 is not counted as installed by default. Ultrix HDX-IO's option-dependent SFP row remains unresolved because its module may carry different SDI/HDMI/MADI signals.
- Lumantek VS10's two XLR inputs and two outputs, generic one Remote I/O terminal (connector kept UNKNOWN), and the single DB9 audio breakout terminals on EZ-MD Plus/VS5 are mapped from model-specific manual/material. Lumantek's 4 unresolved rows were resolved.
- Ross 4→1; Lumantek 4→0. Current report: 303 products / 1,462 I/O rows / 2,581 ports; port rows 1,227 (83.9%), unresolved 112; 4 products still have I/O but zero generated ports.
- AVer TR315/TR335/TR535 mapping was prepared from their product rows, but automatic approval review rejected changing the shared generator because it identified AVer as a session A modification range. No AVer product or vocabulary change was applied; AVer remains pending scope clarification.

### AVer evidence-only handoff (user scope correction, 2026-10-13)

- User excluded AVer from B2 because session A has already reviewed TR315, TR335, and CL01 and recorded its hold reasons. Do not change their product JSON or add AVer IO_OVERRIDES in this B2 branch. If new official evidence is found, report only the document, URL, and exact I/O row for session A to reassign.
- AVer manufacturer documents reviewed:
  - TR315 official model datasheet: `https://www.averusa.com/pro-av/downloads/datasheet-brochure/tr315-datasheet.pdf`; official product page: `https://www.averusa.com/products/auto-tracking-camera/tr315`. Datasheet I/O row `io[0]` (`Video` / connector `3G-SDI, HDMI, IP, USB` / signal `Video/Audio out`, quantity 4) corresponds to the four media listed in the Multi-stream Capability and Video Output sections; the rear connector drawing separately labels HDMI, 3G-SDI, USB Type-B, and the camera's Ethernet/PoE+ port. Evidence supports each media category, but the B2 session did not split or alter the existing row.
  - TR335 official model datasheet: `https://www.averusa.com/pro-av/downloads/datasheet-brochure/tr335-datasheet.pdf`; official product page/support: `https://www.averusa.com/products/auto-tracking-camera/tr335` and `https://www.averusa.com/pro-av/support/tr335n-335`. Datasheet page 1 lists 3G-SDI, HDMI, IP, USB output; page 3 rear diagram labels RS232, RS422, HDMI, 3G-SDI, USB Type-B, Audio In, DC 12V, and PoE+. Current builder unresolved row is `tr335#0` / `io[0]` (Video, `3G-SDI, HDMI, IP, USB`, `Video/Audio out`, quantity 4), classified `multi-connector`; not changed.
  - TR315 current builder unresolved row is `tr315#0` / `io[0]` (same connector/signal/quantity shape), classified `multi-connector`; not changed.
  - CL01 official datasheet: `https://www.averusa.com/pro-av/downloads/datasheet-brochure/cl01-datasheet.pdf`; current builder has 0 unresolved rows. Its rear diagram labels Micro USB, RS-422, RS-232, RJ45, and DC 12V; the data's USB update row is classified service/non-port, not a generated terminal. No B2 change.
- The current AVer unresolved count of 3 also includes TR535 `io[0]`; it is outside this evidence-only handoff and remains unmodified.

### B2 manufacturer report: NETGEAR and remaining zero-terminal products

- NETGEAR's four M4250 rows combining `USB Type-C / RJ45-DB9` (`gsm4230p#3`, `gsm4230px#3`, `gsm4248p#2`, `xsm4216f#1`) are now represented as two physical console connectors each: one RJ45 RS232 and one USB-C. The official M4250 series datasheet names these as separate console ports and lists model-specific applicability; no product JSON wording or quantity was changed. Evidence: https://downloads1.netgear.com/files/netgear/documents/M4250-Datasheet.pdf and official model pages for GSM4230P / XSM4216F.
- `gs728tppv3#3` remains unresolved: its model-applicable NETGEAR hardware guide labels the console port “not for customer use” and does not specify its connector shape. `gsm4212p#7` remains unresolved because the official datasheet identifies a front USB-C LED Ext port but does not state its I/O direction.
- Focused NETGEAR test passed. Current Builder report: 303 products / 1,462 I/O rows / 2,589 generated ports; 1,231 port rows (84.2%), 108 unresolved; 4 products still have I/O but zero generated ports.
- Zero-terminal audit: Colorlight X100Pro 2U/4U/7U expose two optional I/O board slots each and no installed boards, so their rows remain slots and no terminals are fabricated. Logitech Rally Mic Pod Extension Cable remains at zero because its connector is explicitly marked estimated and no official exact connector evidence was found. Rally Mic Pod Hub is now resolved and no longer in this list.

### W-013 B2 최종 검증 상태 (2026-10-13)

- 작업 트리: `codex-b`; 브랜치: `codex/W-20261012-013-builder-ports-b2`. 시작 시점의 `origin/main` `15380a3fed97841873d3ad16e8dff027052c675d` (세션 A2 PR #431 포함)을 통합했다. 이어 `a430a45a1d646fd1319a40969d27cb38bae06a98` (W-003 명세 PR #435)을 최신 main으로 추가 통합하고 산출물을 재생성했다.
- AVer는 사용자 지시에 따라 전부 제외했다. TR315·TR335·CL01 JSON과 AVer IO_OVERRIDES는 수정하지 않았고, 앞의 증거 전용 메모만 세션 A에 넘긴다. Samsung·Analog Way·Roland·DS-8S도 변경하지 않았다.
- BLU-160의 기존 수량·조건은 이미 기입돼 있으므로 B2 변경 대상에서 제외하고 기준 SHA `7974b7996035f18d0df2a54aa3a4c904e38244cf` 바이트로 복원했다. 생성 산출물도 다시 만들었다.
- 되감기 함수의 과거 해시 검증을 수정했다. W-013 A2 → B2 → A1 → Phase 1 순서로 역변환하며, 이전 변경을 먼저 적용해 B2 전체 제품 해시를 깨던 검사와 중복 호출을 바로잡았다. BLU-160은 B2 history fixture에서 제외했다.
- 최종 `node --test --test-concurrency=1 tests/*.test.mjs`: 567 tests, 566 passed, 0 failed, 1 skipped. Windows 임시 디렉터리 rename 검사는 작업 트리 임시 경로에서 통과했다.
- 최종 `node beta/verify-pages.mjs`: 통과 (카탈로그 274, 상세 271, 공식 WebP 453, 사용자 PDF 항목 130). `node beta/build-search-index.mjs --check`, `node beta/build-builder-library.mjs --check`, `git diff --check`, `git diff --cached --check` 통과. PDF 잠금 회귀는 전체 테스트에서 통과했다.
- Builder 전수 보고: 303 products / 1,462 I/O rows / 2,632 terminals; 1,251 terminal rows (85.6%), 88 unresolved; 266 products with terminals (218 fully mapped, 48 partly unresolved), 4 products with I/O but no generated terminal, 33 with no I/O. Samsung 26 + Roland 18 + Analog Way 17 + AVer 3 + VS ENT 5 = 69 assigned-out rows; B2 assigned scope has 19 unresolved rows.
- 상태: 코드·데이터 검증 완료. merge commit 정리, PR, CI 대기, 공개 Builder 화면 캡처는 후속 체크리스트에 남김. 병합 승인은 사용자가 이번 턴에 명시적으로 제공했다.

### B2 리뷰 후 수정 및 재검증

- 자체 리뷰에서 Powersoft MEZZO 322 AD의 원문 수량 설명/검증 상태와 MEZZO 324 AD의 Dante 조건/검증 상태가 Builder 편의를 위해 변경된 점을 발견했다. 원문 값으로 복원하고 회귀 테스트로 고정했다. MEZZO 324 AD는 복원 후 제품 JSON 변경이 없어 이력 픽스처에서 제외했다. MEZZO 322 AD는 새 상태 접점 단자 행만 승인 변경으로 되감도록 SHA를 갱신했다.
- 수정 후 전체 테스트: 568 tests, 567 passed, 0 failed, 1 skipped. Windows 임시 디렉터리에서 실행.
- 복원 후 search index와 public snapshot을 다시 생성했다. `verify-pages`, search-index `--check`, readable-catalog `--check`, builder-library `--check`, PR diff check 모두 통과했다.
- 현재 PR #434의 기존 Builder CI는 초록이지만, 리뷰 반영 커밋을 push한 뒤 새 head의 CI를 다시 확인해야 한다. 공개 Builder 캡처, merge, Pages 배포 확인은 아직 완료되지 않았다.

### W-013 B2 배포 완료 (2026-10-13)

- 리뷰 수정 반영 head `cfc19243e696f635e59f56de5e8b04262c8c06ce`의 Builder CI run `38298551678` 통과 후 PR [#434](https://github.com/Seoulav/AV-Portal/pull/434)을 병합했다. merge SHA: `dcd6c762833aa66ec62c01fa82933bf387d8f9fd`.
- main Pages 배포 run `38298859788` 성공. 배포 파이프라인의 verify-pages, 전체 테스트, Builder 생성, 빌드, 업로드를 모두 통과했다.
- 공개 [AV System Designer](https://seoulav.github.io/AV-Portal/builder/)에서 Powersoft MEZZO 322 AD를 추가해 단자 9개와 이슈 0을 확인했다. 캡처: [public-builder-b2-mezzo-322-ad-1280.png](기록/W-20261012-013-screens/public-builder-b2-mezzo-322-ad-1280.png).
- W-013 B2 완료. AVer는 요청에 따라 제품·생성기 변경 없이 공식 자료와 행만 증거 메모로 세션 A에 인계했다.

## W-20261013-003 — 첫 화면 텍스트 목록 섹션 제거

- 명세: `Work/작업/W-20261013-003.md`; 읽은 기준 main SHA `f98a80c5fcdb6671f40feef2311f6d056997d296`; 구현 브랜치 `codex/W-20261013-003-home-cleanup`.
- 사용자 승인 범위: 첫 화면의 04 읽기용 카탈로그 링크 섹션만 제거. 03 설계 도구, `catalog.html`·`llms.txt` 산출물 및 head alternate 링크는 유지.
- [x] 기존 UI·브라우저 검사·읽기용 산출물 검증 흐름 확인.
- [x] 회귀 테스트 RED 확인: 5개 중 4개 통과, 홈 노출 회귀 1개 실패.
- [x] 첫 화면과 브라우저 검증 갱신, 화면 캡처(1280px·390px), 직접 접근 200 확인.
- [x] 전체 테스트·verify-pages·산출물 재생성·최신 main 통합·PR/CI·병합/Pages·공개 확인.
- 최신 origin/main 4fdc1370d432f5a2b4eed31d890fe14f5e2ce8ed 통합 후 readable catalog와 search index를 재생성했다.
- 브라우저 검사 10개 시나리오, 실패 0, 오류 0. catalog.html·llms.txt 로컬 HTTP 200, 유형과 내용 확인.
- 홈 1280/390 및 Shure 제조사 선택 1280/390 캡처를 만들었다. 홈에 03 설계 도구가 남고 04 섹션은 없는 것을 확인했다.
- 전체 테스트 571개: 570 통과, 0 실패, 1 기존 비공개 제품 목록 경로 스킵. verify-pages, readable catalog 생성, search-index --check 통과.
- 제품 데이터 JSON 변경 없음. 구현 PR #439은 Builder CI 통과 후 merge SHA 42a07d3bbace01258fd6dac767508d9251ef3e57로 병합했다. Pages run 38302599149 성공. 공개 홈·Shure 화면 1280/390 및 catalog.html·llms.txt 직접 접근을 확인했다. 공개 캡처는 W-20261013-003-screens/public-* 파일이다.

## W-20261013-004 — SD컴퍼니·emision Media Server·PixelFit

- 명세: `Work/작업/W-20261013-004.md` (READY, main 반영). 작업 브랜치 `codex/W-20261013-004-sdcompany`; 시작 기준 main `9a2c5274b5320703610f4c97536936de6fc50aed`.
- 사용자 승인: SD컴퍼니 제조사와 emision 미디어서버·PIXELFIT 등록, PixelFit의 QMS-88UX 06 스타일 화면 구성 예시.
- [x] SD컴퍼니 공식 홈페이지·Media Server 모델 페이지 확인. Media Server와 PixelFit 상세, 분류·공식 링크·PixelFit 캡처 이미지 4장을 등록했다. PPT 원본과 Activation Code가 포함된 image1은 커밋 대상에서 제외.
- [x] PixelFit은 사용자 캡처에서 확인된 값만 기록했다. OS 버전, 드라이버, 판매 단위, 전용 제품 페이지는 확인 필요로 남겼다. 사용자 ROI 수치는 게시하지 않았다.
- [x] 화면 예시 SVG 3종: 1340×780 / 1295×780 / 물리 해상도 1920×1080. 각 적용 방식, 1920×1080@60Hz 변경 불가 신호, 여백·위치를 함께 표시. 출처 캡처에 없는 레이아웃은 추가하지 않았다.
- [x] renderer·validator·CSS를 prototype 원본과 beta 생성본에 반영하고 `detail-assets.test.mjs` 동기화 검사를 통과했다.
- [x] 전체 테스트 626개 중 625 통과, 0 실패, 1 스킵. Search index `--check` 통과. `verify-pages` 통과(276 카탈로그 항목, 273 상세).
- [x] 390px에서 본문 가로 폭 375px, 예시 카드 305px, SVG 284px 확인. 가로 넘침 없음.
- [ ] 최신 `origin/main` (`2df15a54df52e2a8c2be9dc52c48bb3aa7111094`) 통합 후 파생물 재생성 및 전체 검증.
- [ ] PR·필수 CI·열린 PR 경로 겹침 확인, 병합·Pages 배포·공개 1280/390 확인.
- 브라우저 screenshot API가 세션 탭의 프레임을 반환하지 않아 현재 캡처 파일은 만들지 못했다. 공개 확인 시 재시도한다.

- W-004 최신 main `3485105f22412d5c881a5d7fac02decb83d1d3a9` 통합 완료. 충돌난 검색 인덱스는 통합 후 재생성함.
- 통합 후 전체 테스트 627건(626 통과·0 실패·1 skip), `verify-pages`, search-index `--check`, PR diff check 통과. 코드 리뷰 차단 없음.
- 다음: 변경 기록 커밋/push/PR, CI 확인, 공개 배포 후 두 상세와 제조사 칩을 1280px·390px에서 확인·캡처.

### W-20261013-004 완료 (2026-10-13)

- PR [#456](https://github.com/Seoulav/AV-Portal/pull/456) CI 전체 통과 후 병합, SHA `047f0fe0b938bf0ca41e8a343819c5df9d808e84`.
- Pages run [#38370072445](https://github.com/Seoulav/AV-Portal/actions/runs/38370072445) 성공. PixelFit·Media Server 공개 상세와 SD컴퍼니 칩을 확인했다.
- 1280px/390px 공개 화면 캡처 6장을 `Work/기록/W-20261013-004-screens/`에 보존했다. 상세 DOM은 390px에서 가로 넘침 없음, 제조사 칩 선택 시 2개 제품 노출.
- W-004 완료. 이후 대기열의 Insta360 W-009에는 사용자 보강 사실을 공식 자료와 대조해 반영한다.

## W-004 PixelFit 적용 방식 교정 후속 (2026-10-13)

- 사용자 교정: NVIDIA는 커스텀 해상도 제작, AMD·일반 모드는 표시 영역 마스킹과 작업표시줄 표시.
- PixelFit overview·주요기능·적용 방식 사양과 예시 1·2의 적용 방식 라벨을 교정했다. 화면 예시의 1340×780, 1295×780, 물리 해상도 1920×1080 및 1920×1080@60Hz 값은 유지했다.
- 테스트 우선으로 `tests/w004-sdcompany.test.mjs`의 적용 방식 기대값을 변경했고, 기존 테스트가 두 하드웨어 마스크 라벨에서 실패하는 것을 확인한 뒤 구현을 수정했다.
- 후속 상세 회귀 6/6 통과. 병렬 전체 테스트에서 RTCOM 임시 디렉터리 rename `EPERM`이 간헐적으로 발생했으나, 해당 파일 단독 실행과 직렬 전체 테스트가 통과했다(전체 627건, 1 skip).
- `node scripts/check-feature-wording.mjs --check` 통과. 전용 `--diff origin/main`은 승인된 의미 수정이 overview·specifications·settings에 포함되어 `non-wording product fields changed` 1건을 보고한다. 대상 외 필드 수정 여부는 JSON diff를 직접 점검한다.
- 최신 main `c038ff56` 기준 후속 브랜치 `codex/W-20261013-004-pixelfit-concepts`. 열린 PR #449 파일과 충돌 없음. PR·CI·병합·Pages·공개 화면 확인 대기.

## W-20261013-004 PixelFit QMS-style 상세 개선 후속 (2026-10-13)

- 사용자 요청에 따라 PixelFit 상세의 01·06·07 표현 계층을 QMS-88UX 상세 규약에 맞춰 개선한다. 제품 사양과 예시 값은 기존 승인 자료에서 확인되는 값만 사용한다.
- [x] 01 한눈에 보기: 버전 2.0.0.0, 컨셉 2가지, NVIDIA·AMD, 모든 디스플레이 타일 4개.
- [x] 06 동작 모드: 커스텀 해상도 제작 / 마스킹 영역 해상도 카드. 활성 윈도우·바탕화면 해상도와 AMD·모든 디스플레이·emision 작업표시줄 설명을 포함.
- [x] 07 화면 구성 예시를 키보드 조작 가능한 칩 전환으로 변경. NVIDIA는 1340×780 출력 자체를 파란 화면으로, AMD는 1920×1080 신호 내 1295×780 표시 영역 및 오른쪽 625px·아래 300px 검정 마스킹으로 표현. 전체 화면 예시 유지.
- [x] Site·prototype renderer, validator, CSS를 함께 갱신. 다른 제품 상세 데이터 JSON은 수정하지 않음.
- [x] 테스트 우선: `tests/pixelfit-presentation.test.mjs` RED 후 GREEN. W-004 상세 테스트 6/6 통과.
- [x] Chrome 로컬 화면: 1280px / 390px에서 타일 4개, 모드 2개, 예시 탭 3개 확인. 가로 넘침 1280px -15px / 390px 0px. 클릭·화살표 키 전환 확인.
- [x] 최신 main `0bda1d5a9ebc344d164383c538724b22d88bd66a` 통합. search-index 충돌은 원본에서 재생성. snapshot·search index·readable catalog 갱신.
- [x] 최신 main 통합 후 직렬 전체 테스트 통과. `node beta/build-search-index.mjs --check`, `node beta/build-readable-catalog.mjs --check`, `node beta/verify-pages.mjs`, `node scripts/check-feature-wording.mjs --check`, `git diff --check` 통과.
- [ ] 변경 커밋 push 후 PR #459 필수 CI 확인.
- [ ] 병합 후 Pages 배포 및 공개 PixelFit 1280px·390px 캡처·탭 동작 확인.

## W-20261013-004 PixelFit 4K AOI·디자인 복귀 후속 (2026-10-13)

- 브랜치: `codex/W-20261013-004-pixelfit-aoi`, 최신 main `aee3364d45c33c9a8d251908eb3e024bb2526910` 통합 완료.
- 사용자 수정 지시: QMS형 타일·모드 카드·예시 탭을 제거해 이전 정적 카드 디자인으로 복귀. NVIDIA 커스텀 해상도 / AMD·일반 마스킹+작업표시줄 교정은 유지. 기본 캔버스는 3840×2160 신호 안의 표시 영역(AOI).
- [x] 회귀 테스트를 먼저 갱신해 현재 구현에서 실패함을 확인.
- [x] PixelFit 한 제품의 예시를 4K AOI(1295×780, 오른쪽 2545px·아래 1380px)와 NVIDIA 커스텀 1340×780 두 장의 정적 카드로 변경. AOI 외곽은 검정 마스킹으로 표시.
- [x] site·prototype 렌더러/검증기와 표현 CSS를 동기화. PixelFit 외 제품 JSON 변경 없음.
- [x] PixelFit·W-004 집중 테스트 8/8 통과. 직렬 전체 테스트 636건(635 통과, 0 실패, 1 환경 의존 skip). 병렬 테스트에서 한 번 발생한 Windows 임시 경로 `EPERM rename`은 직렬 전체 실행에서 재현되지 않음.
- [x] Chrome 로컬 1280px·390px에서 표준 요약 4개, 정적 카드 2개, AOI/마스킹 및 1340×780 보조 예시 확인. 문서 수평 넘침 0px.
- [x] 최신 origin/main 통합 후 search index·readable catalog·public snapshot 재생성. search-index/readable-catalog `--check`, `verify-pages`, feature-wording `--check`, PR diff check 통과. `verify-pages`는 276 항목·273 상세·477 제품 이미지·132 PDF 확인. PDF.js 선택 canvas polyfill 경고는 있었으나 검증은 성공.
- [x] 파생 산출물·진행 기록 커밋 후 PR [#465](https://github.com/Seoulav/AV-Portal/pull/465) 생성. Builder CI 통과 후 병합 SHA `2ae3341761b0fc8859f4841aa036e487cf21442f`.
- [x] Pages 배포 run [#38382533033](https://github.com/Seoulav/AV-Portal/actions/runs/38382533033) 성공.
- [x] 공개 PixelFit 상세에서 표준 요약 4개·정적 예시 2개·4K AOI 마스킹·NVIDIA 1340×780 예시를 확인. 1280px 가로 여유 15px, 390px 수평 넘침 0px. 캡처: `Work/기록/W-20261013-004-screens/pixelfit-aoi-public/`.

## W-20261013-009 — Insta360 제조사·4종 등록 (2026-10-14)

- 명세 `Work/작업/W-20261013-009.md` READY 및 PR #455 병합 커밋 `3485105f22412d5c881a5d7fac02decb83d1d3a9` 확인. 구현 브랜치 `codex/W-20261013-009-insta360`, 기준 main `9390b93aed08ef20e92a010bfbc5e25d89d9911c`.
- [x] Insta360 Connect(Video Bar)·Link 2·Wave for Business·Wave 등록. 제조사 공식 링크·이미지 연결, Compuzone은 공식 링크에서 제외.
- [x] 사용자 제공 64쪽 PDF를 `beta/site/manuals/insta360-conference-line-collection-20260729.pdf`에 게시. SHA-256 `c93167947683439df5da7f2e441f4c7d2d9e9f7e0b99c0014e01e04e6249102f`, 무잠금, 가격 표기 없음. 네 제품 문서 카드 모두 보기·다운로드 액션으로 연결.
- [x] Wave for Business만 Connect(Video Bar) 연동 가능, 일반 Wave 연동 불가를 명시하고 사용자 확인 및 공식 매뉴얼 근거를 구분.
- [x] W-009 추가 제품·업로드·스냅샷만 제거하는 과거 상태 되감기 함수를 만들고 과거 카탈로그·파일·문서·해시 회귀 검사에 적용. W-013 Builder 테스트의 중복 import/test 선언도 정리해 기존 테스트가 실행되도록 복원.
- [x] W-009 전용 테스트 4/4 통과. 병렬 `npm test` 재실행은 Windows 임시 폴더 rename `EPERM` 1건으로 실패했으나, `node --test --test-concurrency=1 tests/*.test.mjs`는 655개 중 654 통과·실패 0·기존 skip 1로 통과. PR 필수 CI도 전체 성공.
- [x] `verify-pages`: 장비 280, 상세 277, 검토 이미지 484, 사용자 업로드 PDF 138, 잠금 PDF 12건 유지. PDF.js 선택 canvas polyfill 경고가 있었으나 검증 성공.
- [x] 공개 화면 4종·Insta360 제조사 목록을 실제 1280px·390px CSS viewport로 확인·캡처. 네 상세와 목록 모두 390px에서 `documentWidth=390`으로 가로 넘침 없음; 제조사 칩 `Insta360 4` 선택 상태 확인.
- [x] PR [#478](https://github.com/Seoulav/AV-Portal/pull/478) 필수 `builder` CI 성공 후 병합. 병합 SHA `7fdfda4eae2aa860a02db610330d3b43273c8188` (2026-10-13 22:34:51 UTC). Pages 배포 run [#38478739867](https://github.com/Seoulav/AV-Portal/actions/runs/38478739867) 성공.
- [x] 공개 상세 4종 모두 문서 카드에 보기 버튼·다운로드 링크 확인(각 2개: 헤더/문서 행). Connect에서 보기 버튼을 눌러 PDF.js 뷰어의 64쪽 canvas 렌더 확인; 다운로드 실파일 9,092,982 bytes, SHA-256 `c93167947683439df5da7f2e441f4c7d2d9e9f7e0b99c0014e01e04e6249102f` 일치. 파일 URL HTTP 200, `application/pdf`.
- [x] 캡처 10장: `Work/기록/W-20261013-009-screens/` (4종 상세 + 제조사 칩, 각 1280px·390px).
- #479는 W-009 뒤 세션 A가 통합해 `6beb63783c2d8114dc7966cbd80ef1e47d801428`로 병합했다. 현재 main에는 이어서 RTCOM 동기화 `f54a05f401fbb1a47de3b51c533f44d45dfb756d`도 포함된다.

## W-20261013-004 PixelFit 사용자 제공 PDF 게시 + AOI 위치 교정 (2026-10-14)

- 브랜치 `codex/W-20261014-pixelfit-docs-aoi`, 기준 main `84826c2ea88b070b4b591d07e85fe071e4fb3bc8`; 작업 위치 `codex-b`.
- [x] 사용자 제공 `emision_PixelFit_Capture.pptx`를 PowerPoint로 PDF 변환. 원본 6장·PDF 6쪽, PDF 432,999 bytes, SHA-256 `1a9d953e6c2a807fe84fe0381f0096ed43deda78f6a5f6db8eaf3241f089be06`. 여섯 쪽을 시각 확인했으며 원본 PPTX는 커밋하지 않는다.
- [x] `beta/site/manuals/emision-pixelfit-capture.pdf`를 PixelFit 참고자료로 등록하고 문서 보기·다운로드 액션 연결. Media Server 소개서와 다른 자료는 추가하지 않는다.
- [x] NVIDIA·AMD 예시 모두 3840×2160 캔버스 안에 AOI를 표시. 캡처 수치 1295×780·1340×780은 보존하고 4K 기준 여백은 산술 계산. NVIDIA는 커스텀 해상도 제작, AMD·일반은 AOI 밖 마스킹+emision 작업표시줄로 구분.
- [x] X·Y로 화면 안 어디든 AOI 지정 및 기준점 변경 가능을 사용자 확인(2026-10-14) 근거로 설명. 수치가 없는 위치 이동 카드는 “위치 지정 예시”로 표시하고 크기·좌표 수치를 만들지 않는다.
- [x] 정적 카드 디자인을 유지하고 사이트·prototype renderer/validator를 함께 갱신. 새 PDF에 맞춰 `mirror-docs.mjs` 업로드 목록 생성이 기존 순서·잠금 상태를 보존하도록 수정. 관련 과거 테스트는 새 PixelFit 문서 한 행/파일만 되감는 함수 적용.
- [x] PDF 6쪽, 1280px·390px 로컬 상세 캡처: `Work/기록/W-20261013-004-screens/pixelfit-document-local/`. CDP DOM에서 390px document/body 폭 390px, 화면 카드 3개 확인. PDF.js 뷰어에서 `/ 6` 및 첫 쪽 canvas 렌더 확인. 실제 다운로드 파일 432,999 bytes, SHA가 게시 예정 PDF와 일치.
- [x] `node beta/build-search-index.mjs --check`, `node beta/build-readable-catalog.mjs --check`, `node beta/verify-pages.mjs` 통과(280 항목·277 상세·490 검토 이미지·140 사용자 업로드 PDF, 잠금 PDF 12건). 전체 직렬 테스트 663개 중 662 통과·실패 0·환경 의존 skip 1. PDF.js 선택 canvas/font polyfill 경고는 있었으나 관련 검증은 통과.
- [x] PR [#486](https://github.com/Seoulav/AV-Portal/pull/486) 필수 `builder` CI 성공 후 병합(SHA `6f131a7b8bb73ec195cc2e5b90c9ad4173f943a0`). Pages run [#38511064123](https://github.com/Seoulav/AV-Portal/actions/runs/38511064123) 성공.
- [x] 공개 상세 1280px·390px에서 AOI 카드 3개, 각 3840×2160 캔버스, 위치 지정 문구, 문서 액션 확인. document/body 폭은 1280px viewport에서 1265px, 390px viewport에서 390px로 넘침 없음. 공개 캡처: `Work/기록/W-20261013-004-screens/pixelfit-document-public/`.
- [x] 공개 PDF URL HTTP 200·`application/pdf`·432,999 bytes. 뷰어 `/ 6`, 6 canvas 렌더. 내려받은 실파일 SHA-256 `1a9d953e6c2a807fe84fe0381f0096ed43deda78f6a5f6db8eaf3241f089be06` 일치.


## PixelFit 설명자료 등록 후속 (2026-10-14)

- 기준: 최신 origin/main에서 시작한 codex/W-20261014-pixelfit-description-pdf (기준 SHA d6a69ae9, PR #488 병합분 포함).
- 새 자료: 사용자 제공 PixelFit_설명자료.pdf; 입력 SHA-256 e25ccb1547e9711f25f7c618f18314c7df93e113ec2698b12319cce222476dbe, 12쪽, 잠금 없음. 모든 쪽 텍스트·연락표 시각 검토 완료.
- 사용자 Work 승인(2026-10-14): 작업 모드 2종(① NVIDIA 전용 GPU 커스텀 해상도 ② 바탕화면 마스킹)과 마스킹 내부 NVIDIA·AMD 하드웨어 마스크 선택 구조 승인. 사용자 구두 설명과의 관계를 source D에 6·9쪽 근거와 함께 명시.
- 반영: PixelFit 설명 PDF 별도 업로드·카탈로그/매니페스트 등록, 기존 6쪽 화면 안내 PDF 별도 유지. 상세의 모드 설정·features·사양·설명과 D 근거표에 3·4·6·8·9·11쪽 인용 추가. OS 버전·GPU/드라이버 최소 요건·판매 단위는 미확정 유지.
- 동기화 경로가 같은 제품의 여러 사용자 참고 PDF를 지원하도록 userReferenceLinksFor 추가, 매니페스트 생성 시 제품+파일별 제목 조회, verify-pages 중복 기준 확장. PDF 두 카드 보기/다운로드 회귀 테스트 추가.
- 검증: PixelFit/mirror-docs 집중 테스트 18/18 통과. 전체 테스트 684건 중 683 통과, 0 실패, 1 기존 skip. verify-pages: 280 제품·277 상세·490 이미지·141 업로드 PDF 통과. 검색 인덱스·읽기용 카탈로그 --check 통과. 주요기능 명사형 검사 통과. 전체 해시 비교는 출처/기능/수치의 승인된 사실 보강 때문에 변경 항목으로 보고하며 실패 원인은 아님.
- 상태: REVIEW 준비; 최신 main 재통합, PR·CI·Pages 및 공개 화면 확인은 진행 예정.

## 공개 확인 후 사양 표 정정 (2026-10-14)

- PR #489 병합 및 Pages run 38538545011 성공 뒤 공개 화면을 확인하는 중, 설명자료에서 추가한 사양 일부가 인코딩 깨짐으로 저장되고 기존 NVIDIA·AMD 적용 행이 중복 노출되는 것을 발견.
- 원인: 제품 JSON 구성 스크립트가 신규 spec 텍스트 일부를 잘못 기록했고, 기존 적용 방식 행 제거·보존 필터가 중복으로 포함.
- 조치: 잘못된 5개 사양 행과 기존 중복 2개 적용 방식 행 제거. 검증된 6개 source D 행만 유지하고 정확한 PDF 쪽수 근거 유지. 새 회귀 테스트에서 정확한 사양 이름 목록·구식 항목 부재·깨진 '?' 문자 부재를 확인.
- 이 정정은 별도 후속 PR에서 코드 CI·Pages 배포 후 공개 확인할 것. 사용자 요청 완료 처리는 다음 배포 확인까지 보류.
## PixelFit 설명자료 출처 표기 정정 후속 (2026-10-14)

- 공개 상세 재확인에서 이전 구현 시 남은 깨진 중복 출처명 한 건을 발견했다. 검증된 출처 D(사용자 제공 PixelFit 설명자료 PDF)는 그대로 보존하고, 깨진 중복만 제거했다.
- 회귀 테스트에 설명자료 출처 D가 하나이며 출처명에 깨진 물음표 문자가 없는 조건을 추가했다.
- #491 재배포에서 사양 행은 정상 표시됨을 확인했다. 이 정정 PR 병합·배포 후 문서 카드, 두 PDF의 보기·다운로드 및 1280px·390px 공개 화면을 최종 확인한다.

### 최종 공개 확인

- PR [#492](https://github.com/Seoulav/AV-Portal/pull/492) 병합 SHA `c5b91698670c789219bf6d6d1b3effbfee1ed054`; Builder CI run [38541346140](https://github.com/Seoulav/AV-Portal/actions/runs/38541346140) 성공. Pages 배포 run [38541794324](https://github.com/Seoulav/AV-Portal/actions/runs/38541794324) 성공.
- 공개 상세 [emision PixelFit](https://seoulav.github.io/AV-Portal/detail/?product=emision-pixelfit)에서 두 문서 카드, 2개 보기 버튼, 다운로드 링크를 확인. 6쪽 화면 안내는 뷰어 `/ 6`, 설명자료는 `/ 12` 및 페이지 canvas 렌더 확인.
- 공개 PDF 두 파일 모두 HTTP 200·`application/pdf`: 화면 안내 432,999 bytes, SHA-256 `1a9d953e6c2a807fe84fe0381f0096ed43deda78f6a5f6db8eaf3241f089be06`; 설명자료 474,421 bytes, SHA-256 `e25ccb1547e9711f25f7c618f18314c7df93e113ec2698b12319cce222476dbe`.
- 캡처 `Work/기록/W-20261013-004-screens/pixelfit-explanation-final/`: 1280px과 390px의 문서 섹션. 1280px 페이지 너비 1265px, 390px 페이지 너비 390px로 가로 넘침 없음; 두 카드 모두 표시.
- 배포 검증: 280 제품·277 상세·490 검토 이미지·141 업로드 PDF, 잠금 PDF 12건 보존. 전체 테스트 684건: 683 통과·0 실패·기존 skip 1.
- 앞선 #489 배포 QA에서 사양 인코딩 깨짐/중복을 찾아 #491로 고친 뒤 공개 재확인했고, 출처명 깨짐 중복 1건도 #492로 정리했다. 현재 공개 사양·두 모드·출처 등록 및 문서 동작이 정상이다.

## W-20261014-005 — Ross Video Carbonite Ultra 등록 (2026-10-14)

- 명세: `Work/작업/W-20261014-005.md` READY, PR #495 병합. 명세를 읽은 기준 commit `c30ddfbd`; 구현 브랜치 `codex/W-20261014-005-carbonite-ultra`, 별도 폴더 `codex-b`.
- 사용자 승인: 2026-10-14 “이것도 추가” — Carbonite Ultra 및 전면·후면 사진/PDF 게시.
- 입력 자료 SHA-256 확인: PDF `0527e3d4d02e60e634321ab7072505110510a35d7cc62f97ee1504340e319848`; Front `330778d4c551ca74e7f880dd6820c30fac399fdbec2e4b9884293d940a34a1f9`; Rear `ea814491f3812d2010d8438a583a5c3dae23b3ff95f849772e8d9c1bea5ee079`.
- [x] 명세·입력 파일 확인. PDF.js 277쪽 `Ultra 9.2 User Manual`, Part 4841DR-110-09.2 확인. 전면 인쇄와 두 사진의 Carbonite Ultra 모델 일치 확인.
- [x] Ross 공식 제품·사양 페이지와 매뉴얼 대조. SDI 출력 구성 차이를 `CONFLICTED`로 보존.
- [x] 제품 카탈로그·상세·Front/Rear 사진·사용자 매뉴얼 업로드 등록, 검색·카탈로그 파생물 생성 및 Carbonite focused tests 통과.
- [x] Port Map 16표식 사진 감사 및 REF IN/OUT 방향 교정. 자동 lint 0 경고. 전체 `node --test --test-concurrency=1 tests/*.test.mjs`: 692건 중 691 pass, 0 fail, 1 기존 skip.
- [x] `verify-pages` 281 제품·278 상세·497 검토 이미지·142 업로드 PDF; 잠금 PDF 12건 유지. 검색 인덱스 `--check` 통과. 문구 검사 0 대상/0 제품.
- [x] 로컬 1280px·390px 상세와 PDF.js 매뉴얼 `/ 277`·canvas 렌더 및 다운로드 SHA 확인. 공개 캡처·Pages 확인은 병합 후 진행.
- [x] 최신 `origin/main` 통합 후 검색 인덱스·읽기용 카탈로그 `--check`, `verify-pages`, 전체 직렬 테스트, 문구 검사와 diff 검사 통과.
- [x] 구현 PR [#498](https://github.com/Seoulav/AV-Portal/pull/498) 필수 CI 성공·병합(SHA `4f5d0a30b71042eab8c9cf3c0d93209f3af5dff9`); Pages run [38549535124](https://github.com/Seoulav/AV-Portal/actions/runs/38549535124) 성공.
- [x] 공개 상세 1280px·390px, Port Map, 문서 보기/다운로드 확인. 공개 매뉴얼 뷰어 첫 페이지 canvas 및 `/ 277` 확인; PDF 다운로드 HTTP 200·SHA 원본 일치. 캡처는 `Work/기록/W-20261014-005-screens/public/`.
- [x] 병합 후 검사 보완: 비공개 스프레드시트 검사가 `.XLS`·`.XLSX`도 찾도록 대소문자 무시 Git pathspec으로 수정, 실제 대문자 확장자 탐지 확인. 전체 테스트 692건 중 691 통과·0 실패·기존 skip 1.


## PixelFit 12-page document title correction (2026-10-14)

- Scope: rename the emision PixelFit 12-page user PDF to "emision PixelFit product proposal (user provided)" across the document card/viewer metadata, source D, product evidence text, upload manifest, and fixed test values. Keep the separate six-page screen guide unchanged.
- [x] Updated userReferences title, product detail wording/evidence name, manifest upload title, targeted regression tests, and rebuilt search index.
- [x] Focused PixelFit document tests pass (2/2).
- [x] Six-page guide metadata and PDF bytes unchanged; full tests 692 (691 pass, 0 fail, 1 existing skip), verify-pages (281 products/278 details/142 uploaded PDFs, 12 locked PDFs retained), search-index --check, readable catalog regeneration, feature wording check, and diff checks pass.
- [ ] Open PR, confirm required CI, merge, verify Pages deployment and public card/viewer titles at 1280px and 390px.
- Other SD Company product documents: MediaServer introduction remains unpublished; no other posted SD Company documents found.

## PixelFit 03 화면 구성 예시 확대 + GPU 지원 범위 보강 (2026-10-14)

- 브랜치 `codex/W-20261014-pixelfit-example-layout`, 시작 기준 HEAD `9ded72a4` (W-007 명세 PR #501 병합본).
- [x] 화면 구성 예시를 제품 사진 바로 다음으로 이동하고 번호를 03으로 재배열. 4K AOI 데이터와 예시 수치·구도는 유지.
- [x] 정적 예시 카드를 칩 전환형 큰 카드로 구현. 탭 키보드 조작 및 접근성 상태 구현; 모바일은 그림 뒤에 설명이 오도록 CSS 구성.
- [x] overview·작업 모드·주요 기능에 NVIDIA만 실제 커스텀 해상도 생성, NVIDIA는 생성·마스킹 모두, NVIDIA 외 GPU는 마스킹만 가능하다는 사용자 확인(2026-10-14) 반영. 신호 해상도 유지형 마스킹과 실제 OS/GPU 해상도 생성의 차이 설명 및 GPU 지원 비교 표 추가.
- [x] 제안서 근거 6·9쪽과 사용자 확인을 D/U 근거에 연결. 제품 상세 JSON 외 제품 데이터는 수정하지 않음.
- [x] 최신 `origin/main`에 #506 Carbonite 설명과 #507 INOGENI 등록을 통합. 검색 인덱스 충돌은 수동 해소하지 않고 상세 자산·검색 인덱스·공개 스냅샷·읽기용 카탈로그를 원본에서 재생성.
- [x] #507 통합 후 전체 직렬 테스트 701건 중 700 통과·0 실패·기존 skip 1, `verify-pages`(283 항목·280 상세·501 검증 이미지·142 업로드 PDF, 잠금 PDF 12건 유지), 검색 인덱스 `--check`, feature wording(대상 0), diff 검사를 통과.
- [x] Work가 1280px·390px 시각 캡처 생략을 승인(2026-10-14). 탭형 예시 구현으로 진행; 정적 카드 비교는 생략.
- [x] PR [#505](https://github.com/Seoulav/AV-Portal/pull/505) Ready 전환 후 필수 `builder` CI 성공(run [38579252097](https://github.com/Seoulav/AV-Portal/actions/runs/38579252097)). 병합 SHA `e48dc1bdd94a1ebbbf7a7b699b5d073ecfaafe95`.
- [x] Pages 배포 성공(run [38579905649](https://github.com/Seoulav/AV-Portal/actions/runs/38579905649)). 공개 상세 HTML·JSON HTTP 200 확인. 공개 JSON에 GPU별 지원표와 3개 예시 포함; 공개 JS 해시가 저장소와 일치하고 03 번호·gallery 뒤 이동 로직이 배포된 코드에 포함됨. 공개 렌더러·CSS 해시 일치, 탭·비교표·420px 모바일 규칙 존재 확인.


## W-20261014-007 USB cable facet ? 2026-10-15

- Status: COMPLETE. Implementation PR: #511, merge SHA `b881074592a5cf72c52ead02168238507c88993b`.
- Read the READY spec. User confirmed the fourth categories[] level is permitted only for HDF-CCF with the exact label "USB 3.2 Gen2 10Gbps". verify-pages and regression tests keep every other catalog item at three levels.
- Added HDF-CCF once under manufacturer HDCVT, with 5m/10m/15m options, per-length PD values, the 100W conflict preserved, official image, and the uploaded V1.1 manual. Added a strict W-007 history inverse and adjusted prior full-history checks without weakening their assertions.
- Official HDCVT exact-model page confirms HDF-CCF and USB 3.2 Gen 2 10Gbps. The uploaded PDF SHA-256 matches the supplied file; PDF.js reads all 7 pages and the detail viewer resolves its local upload card.
- Beluga Highwave Pro C-to-C 8K 5M remains unregistered: no exact-model official 10Gbps specification found. The closest Beluga official HIGH WAVE CtoC page is a 1.5m generic cable; it does not establish the 5m Pro variant.
- Existing records with USB 3.2 Gen 1 (AJA Ki Pro GO2 and INOGENI U-BRIDGE 3) were identified for reporting only; neither meets the requested Gen 2 / 10Gbps classification, and neither was changed.
- Current verification: `npm.cmd test` (705 total, 704 pass, 1 existing skip); `node beta/verify-pages.mjs`; `node beta/build-search-index.mjs --check`; `node scripts/check-feature-wording.mjs --check` all pass. HDF PDF is unlocked; 12 locked-upload references are retained.
- Pending: latest-main integration check, PR/CI, merge, Pages deployment, and public data/document URL confirmation. No browser surface is available in this environment; report nonvisual verification if that remains true.

## W-20261014-007 — USB 3.2 Gen2 10Gbps 케이블 분류 (2026-10-15)

- 상태: REVIEW. 브랜치 `codex/W-20261014-007-usb32gen2-cables`, 기준 `origin/main` `c3e212e3d4a78f601b58cfb6c477c7b48bda0c32`.
- 사용자 확인에 따라 `categories[]` 4단 값은 HDF-CCF에만 허용. `verify-pages`가 나머지 제품의 기존 3단과 HDF의 정확한 4단 목록을 검사.
- HDF-CCF를 HDCVT 제조사로 1개 등록. 길이 옵션 5m·10m·15m, 전력 5m 90W / 10m·15m 85W, 본문 100W와의 충돌을 `CONFLICTED`로 보존. 모드별 4-lane/2-lane, SOURCE→DISPLAY 방향 및 최대 15m를 근거에 맞게 반영.
- 사용자 제공 V1.1 매뉴얼을 게시. PDF SHA-256 `c96e33cce303073b0c0106c3e61eb90d6f33a712e1f8c2a5e7bd41ee3229518f`, 7쪽·잠금 없음. 업로드 문서 카드/뷰어 테스트 포함. 잠긴 PDF 업로드 참조 12건 유지.
- Beluga Highwave Pro C-to-C 8K 5M은 정확한 모델의 공식 USB 3.2 Gen2/10Gbps 근거를 확인하지 못해 등록 보류. 기존 제품 조사에서 AJA Ki Pro GO2 및 INOGENI U-BRIDGE 3는 USB 3.2 Gen1로 확인되어 후보 보고만 하며 재분류하지 않음.
- 최신 main 확인: `origin/main`은 위 SHA이며 현재 구현 브랜치의 조상. 열린 PR #449는 Builder 화면 작업으로 경로 중복 없음.
- 검증: 직렬 전체 테스트 705건 중 704 통과, 기존 skip 1, 실패 0. `verify-pages`: 284 제품·281 상세·502 검토 이미지·143 업로드 PDF. 검색 인덱스 `--check`(702064 bytes), feature wording(대상 0), `git diff --check` 통과. 병렬 테스트에서는 기존 RTCOM 임시 디렉터리 교체에서 Windows EPERM이 나왔으나 직렬 전체 실행에서 재현되지 않음.
- 파생 산출물(검색 인덱스·읽기용 카탈로그·공개 스냅샷) 최신 기준으로 재생성. 공개 후 브라우저 캡처 대신 JSON/HTML/PDF URL과 SHA로 비시각 확인 예정(이 환경에 브라우저 표면 없음).
- 다음: 지정 파일만 커밋 → PR/CI 초록 → 병합 → Pages 완료 및 공개 JSON·HTML·PDF 확인.

### W-007 병합·배포 확인

- PR #511은 필수 Builder CI 전체 성공(run `38595234366`) 후 2026-10-14 16:10 UTC에 병합. main SHA `b881074592a5cf72c52ead02168238507c88993b`.
- Pages 배포 성공(run `38595836941`, deploy job 2m18s).
- 공개 HTTPS 확인: catalog/detail/search-index/docs manifest/detail HTML/catalog HTML/PDF 모두 HTTP 200. 공개 카탈로그에서 HDCVT·HDF-CCF 및 네 번째 `USB 3.2 Gen2 10Gbps` 값 확인. 매뉴얼 PDF 853678 bytes, `%PDF-`, SHA-256 `c96e33cce303073b0c0106c3e61eb90d6f33a712e1f8c2a5e7bd41ee3229518f`로 게시본 일치.
- 브라우저 캡처 도구 미가용으로 시각 캡처는 하지 않음. 공개 JSON/HTML/PDF 응답과 자동 문서 카드·PDF 액션 검증으로 대체.
- Beluga Highwave Pro 8K 5M은 정확 모델의 공식 USB 3.2 Gen2 근거 부족으로 등록 보류. AJA Ki Pro GO2 및 INOGENI U-BRIDGE 3의 USB 3.2 Gen1 표기는 후보 보고만 완료.
## W-20261015-011 — AMX Varia Port Map (2026-10-15)

- 명세 `Work/작업/W-20261015-011.md` READY, 기준 SHA `c9fef4cced0282d8a3cb80f7f107cc31beb26af5`, 브랜치 `codex/W-20261015-011-amx-varia-portmaps`.
- 범위: AMX Varia 4종 사진 적합성 확인 및 후면 단자 지도. JBL·Sony 및 다른 제품 파일은 수정하지 않음.
- [x] 세션 C 사진 감사 시트와 대상 상세 JSON·Rear 사진 대조.
- [x] SL50·SL80 후면 사진을 원본 픽셀 격자로 직접 확대 확인. 두 사진의 RJ-45 하우징 1개만 현행 I/O(PoE 802.3af)와 대응해 Port Map 추가; USB 형태로 보이는 포트는 I/O/모델별 근거가 없어 제외.
- [ ] VARIA-100/80 추가 도면 조사·시각 판독. 공식 QSG 자료는 찾았으나 이 환경에서 직접 렌더할 수 없어 좌표를 입력하지 않고 제품별 보류.
- [ ] 되감기 함수·회귀 검사·점검표 및 인계 문서.
- [ ] 최신 main 통합 후 파생물 재생성, 전체 직렬 검사·verify-pages, PR/CI, 병합·배포·공개 확인.
- 도구 제한: Python/py/Pillow가 설치되지 않아 `scripts/portmap-audit.py`를 실행하지 못함. Edge headless 캔버스 격자로 원본 좌표를 눈으로 확인해 수동 배치했으며, 미통과 자동 점검은 통과로 기록하지 않음.

## W-20261015-011 — AMX Varia Port Map (2026-10-15, 병합 전 통합 업데이트)

- 기준 명세: `Work/작업/W-20261015-011.md` (PR #526 병합), 구현 브랜치 `codex/W-20261015-011-amx-varia-portmaps`.
- [x] Varia-SL50·SL80 Rear의 보이는 RJ-45 각 1개만 Port Map에 추가. 사진 원본 격자와 렌더 결과를 수동 검토했고, 별도 에이전트도 좌표가 RJ-45 몸체를 가리키는지 독립 확인.
- [x] Varia-100·Varia-80은 기존 Rear에 단자가 없고, 공식 QSG의 후면 도면은 현재 환경에서 페이지 그림을 직접 렌더·판독할 수 없어 지도화 보류. Other 사진은 연결 도면이 아님. 추정 좌표 미입력.
- [x] 되감기 함수, 제품 범위 회귀 테스트, 기존 전역 집계 테스트 반영. 최신 `origin/main` `c0c528ad7fa4b23346fe7317a6c68734d94393bc`(PR #527 Sony rear maps) 통합. 검색 인덱스와 public snapshot 재생성.
- [x] 직렬 전체 테스트: 726건 중 725 통과, 0 실패, 기존 skip 1. `verify-pages`: 284 제품·281 상세·508 검토 이미지·143 업로드 PDF. `build-search-index --check`, feature wording 검사, `git diff --check` 통과. 잠금 PDF 12건 유지.
- 도구 한계: Python/Pillow 미설치로 자동 Port Map 좌표 감사는 실행하지 않음. 원본 격자 이미지와 렌더 결과의 시각 검토·독립 에이전트 확인을 기록. QSG 후면 도면은 직접 시각 판독 불가.
- 상태: 검증 완료, PR 준비. 공개 배포 및 Varia-100/80 후속 도면 판독은 남음.

### W-011 최신 main #528 통합·최종 검증

- 최신 `origin/main` `32161e0f71662bcf8f7a3bc5905dc820462cdeff`(PR #528 Sony 공개 점검 기록)를 통합한 뒤 검색 인덱스와 public snapshot 재생성.
- 전체 직렬 테스트 재실행 결과: 726건, 725 통과, 0 실패, 기존 skip 1. `verify-pages`, 검색 인덱스 `--check`, feature wording, PR diff check도 재통과.
- PR용 변경 범위는 W-011 제품/기록/테스트 파일로 확인. Sony 변경은 최신 main에서만 포함되며 PR 변경으로 재포함되지 않음.

### W-011 PR·배포·공개 확인 완료

- PR #529 (https://github.com/Seoulav/AV-Portal/pull/529) CI `builder` 초록, 병합 SHA `4f50adcde08660aaeb4de8794417bbd5e735b991`.
- Pages 배포 workflow run `38675364250` 성공.
- 공개 URL 비시각 확인: `detail/data/varia-sl50.json`, `detail/data/varia-sl80.json`, 두 상세 route 모두 HTTP 200. JSON에 후면 RJ-45 Ethernet / PoE(802.3af) 각 1개와 승인 좌표가 게시됨.
- 공개 `varia-100`·`varia-80` 상세 JSON도 HTTP 200이고 `portMap` 없음 확인. 공식 모델별 QSG 후면 연결 도면은 찾았으나 그림을 직접 렌더해 시각 판독하지 못해 지도화는 보류.
- CUA에서 사용 가능한 브라우저 surface가 없어서 시각 캡처는 생략하고 공개 JSON·HTML 응답으로 확인.

## W-20261016-003 — Insta360 제품별 브로슈어 (2026-10-16)

- 명세·인계서를 `origin/main` `6efb560164d905a1efd4c527b742018af871cbd4`에서 재확인. 브랜치 `codex/W-20261016-003-insta360-brochures`. 작업 시작 시 추적 변경은 없었고, 기존 stash 5건은 다른 작업 기록이어서 열거나 적용하지 않음.
- [x] 사용자 제공 PDF 4건의 SHA-256·쪽수·잠금 확인: Connect 8쪽, Link 2 8쪽(본문 한국어), Wave 10쪽, Wave for Business 19쪽. 원본 해시 모두 명세와 일치하고 잠금 없음. 각 제품의 새 문서를 기존 64쪽 컬렉션 앞에 등록, 문서 제목에 한국어·쪽수·사용자 제공 표시.
- [x] 첨부 이미지(1785×2526) 확인: `Insta360 Link 2 Pro | Link 2C Pro` 공동 소개 이미지. 일반 Link 2 사진으로 모델이 일치하지 않아 제품 사진에 등록하지 않음.
- [x] 브로슈어 전문 대조: Connect 48MP 광각 카메라·8K Gallery 최대 8명·AI Resolution+·모드 및 설치 옵션, Link 2 오디오 모드 3종, Wave 32GB 저장·MP3 최대 1,000시간·다중 Wave OTA 예정, Wave for Business 기본 테이블 마운트·온디바이스 AI 전사·역할 기반 접근 제어 추가.
- [x] WfB 브로슈어 2쪽(Business/Standard 비교)·7쪽(Wave x Connect)에서 WfB의 Connect 연동 확인. 9쪽은 결합 수음 최대 20m 표기. 일반 Wave 브로슈어에는 Video Bar 불가가 명시되지 않아 사용자 확인(2026-10-13) 근거는 유지.
- [x] 일반 Wave 지름 및 데스크톱·모바일 OS 값을 공식 사양 페이지와 브로슈어 10쪽에서 대조, 두 쪽 값을 `CONFLICTED`로 나란히 기록. PDF 메타데이터 생성일 2025-10-13(본문 발행일/판 미표기). 측정 부위 차이는 도면/각주에서 확인되지 않아 추정하지 않음.
- [x] 되감기 함수 `tests/w20261016-003-history.mjs`, 문서·충돌 테스트 `tests/w20261016-003-insta360.test.mjs` 작성. 타깃 테스트 3/3 통과. 검색 인덱스(702878 bytes)·공개 스냅샷(284 항목/281 상세) 재생성. `build-search-index --check`, feature wording(0 대상), `git diff --check`, `verify-pages`(284 장비/281 상세/508 이미지/147 PDF 업로드) 통과.
- [x] 전체 직렬 테스트, 잠금 PDF 12건 확인, 변경 파일 리뷰 및 브라우저 사용 가능 여부 확인.
- [x] 최신 `origin/main` 재통합 후 파생물 재생성·검증, PR/CI, 병합, Pages 배포·공개 문서/다운로드 SHA 확인.

## W-20261016-003 완료 보고 (2026-10-16)

- PR [#542](https://github.com/Seoulav/AV-Portal/pull/542) 병합 완료, merge SHA `86f1f0d78e58a3f3740bad4ec8e75e2b592dd6d0`.
- 필수 Builder CI 성공(run `38832637946`); Pages 배포 성공(run `38832979722`).
- 전체 테스트 `npm.cmd test`: 740건 중 739 통과, 실패 0, 기존 skip 1. `verify-pages`: 284 제품·281 상세·508 검토 이미지·147 업로드 PDF, 잠금 PDF 12건 유지. 검색 인덱스 검사·feature-wording·diff 검사 통과.
- 공개 확인(비시각): 네 제품 상세 JSON·HTML과 manifest HTTP 200. 네 브로슈어 PDF GET 200이며 공개본 SHA가 게시 전 입력값과 모두 일치; 제품별 브로슈어가 기존 64쪽 컬렉션보다 먼저 표시.
  - Connect 8쪽 / 4,703,979 bytes / SHA `95536f0ea8a290d312e654690b01f9b2bce4360210e23b0774739a436068acb0`
  - Link 2 8쪽 / 7,289,769 bytes / SHA `b05b78559ae5bd9e36c292441577bdd33b8fa0894279ec1a1c32bbf7936549c4`
  - Wave 10쪽 / 3,920,627 bytes / SHA `cf1364499c9168e678f41b2a1c8bbda148c820119001edab8313fadaaf03d65f`
  - Wave for Business 19쪽 / 4,069,400 bytes / SHA `7c50e65e1b8432b222c8d6bf992a51c429ddbb48c24c0039d39d61ffbedade7f`
- 공개 Wave 충돌은 지름 Ø64.3mm(M) 대 52.8mm(B, 10쪽), 컴퓨터 OS Windows 10/macOS 12(M) 대 Windows 7/macOS 10(B, 10쪽), 모바일 OS Android 10/iOS·iPadOS 12(M) 대 Android 8/iOS·iPadOS 9(B, 10쪽) 모두 `CONFLICTED`로 병기.
- Wave for Business 브로슈어 2·7쪽에서 Connect 연동 지지를 확인. 일반 Wave 브로슈어에는 비호환 문구가 없어 Video Bar 연동 불가 표기는 사용자 확인 U(2026-10-13) 유지.
- CUA에 브라우저 surface가 없어 1280px·390px 화면 캡처는 만들지 못함. 상세 HTML·JSON, 문서 manifest, PDF 다운로드 응답/SHA 및 보기·다운로드 링크 회귀 검사로 비시각 확인.
- 첨부 이미지는 Link 2 Pro·Link 2C Pro 공동 이미지로 확인되어 일반 Link 2 제품 사진에 사용하지 않음.

## W-20261016-008 — Belkin Connect Air

- 상태: IN_PROGRESS
- 명세: `Work/작업/W-20261016-008.md` (명세·인계서 읽음, 기준 최신 main `0c8f4192259863c7dd8dca388c457536a1a117cb`; 명세 병합 PR #563)
- 구현 브랜치: `codex/W-20261016-008-belkin-connect-air` (`codex-b` 별도 워크트리)
- 인계서의 `ede0dfb0`/열린 PR 표기는 작성 당시 상태로 확인. 실제 main에는 명세와 인계서가 #563으로 병합됨.
- 승인: Belkin Connect Air 등록·시그널 플로우·AirMedia 비교 장점 정리. 카테고리 `화상회의 / Conferencing / Wireless Presentation` 사용자 승인(2026-10-16). 1단계 기존 한글값 유지, 검증기는 대상 slug 한정 허용.
- 범위 제외: Crestron 등록, 가격·판매처, `builder/`, `cpq/`, 다른 제조사 제품 변경.
- 체크리스트:
  - [x] 한국 공식 제품 정보·공식 글로벌 보충 자료 대조 및 비교 근거표 작성
  - [x] Belkin 제조사·Connect Air 카탈로그/상세/공식 사진·Port Map·시그널 플로우 등록
  - [x] 공개 파생물 재생성, 전체 테스트·검사 및 모바일 Port Map 선 미리보기 확인
  - [ ] Work 인계서 작성, PR·CI·병합 순서 확인·배포·공개 점검

- Full suite: 753 tests, 752 passed, 0 failed, 1 skipped.
- Derived outputs regenerated; `--check`, `verify-pages`, and 390px Port Map preview passed. Non-Belkin PDF/manifest mirror changes: 0.


### W-008 PR #571 review fixes

- PR #568 merged into main (merge commit 47a432d7).
- Removed Belkin/AVC024-specific branches from the beta and prototype Port Map validators; shared role validation remains unchanged.
- Data-only fit: duplicate the official image as a separate Front-role asset for Port Map, remove map.note, and carry its explanation in the image description. Main card image remains unchanged.
- Added regression assertions for Front-role mapping, removed note, and rejection of a Main-role Port Map. Updated cache tokens in both apps and product models.
- Added W-015 exception record at Work/??/W-20261016-015-??.md: diagonal integrated-cable photo, edge brackets ambiguous, leader lines cross connectors/cables: 0.
- Focused regression checks: 14/14 passed; diff whitespace check passed. Full suite and Pages verification remain after latest-main integration and derived artifact regeneration.
