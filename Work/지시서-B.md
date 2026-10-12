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
