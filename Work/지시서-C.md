# 세션 C 진행 기록

## W-20261014-008 — INOGENI 신설·TOGGLE DOCK 2×1·U-BRIDGE 3 등록

- 상태: MERGED (PR #507 병합·Pages 공개 검증 완료)
- 명세: `Work/작업/W-20261014-008.md` (읽은 main `aca29d5da0f89a95c10492c4c900d966d9c893ef`) · 브랜치 `codex/W-20261014-008-inogeni` · 전용 워크트리 `codex-c`
- 승인 근거(사용자 원문): “https://inogeni.com/product/toggle-dock-2x1/ , https://inogeni.com/product/u-bridge-3-0/ 2제품도 추가해줘” + “제품의 특징은 홈페이지 참고해”. 명세의 세션 B 표기보다 최신 사용자 배정인 세션 C를 따른다.
- [x] 공식 Overview·Tech specs·Resources·Compatible Devices를 확인했다. 명세 작성 시 빠졌던 Tech specs의 본체별 크기·무게와 공식 원격 PDF 링크를 발견해 근거표에 기록했다. PDF 사본은 게시하지 않았다.
- [x] 두 제품의 모델명 인쇄를 공식 원본 사진에서 읽고 Main·Diagram 4개를 등록했다. TOGGLE 호스트 1 USB-C와 호스트 2 USB-B+HDMI, U-BRIDGE PC HOST·DEVICE 단자를 별도 I/O로 작성했다.
- [x] 공식 연결 그림에 TOGGLE 9개, U-BRIDGE 11개 번호를 게시 픽셀로 좌표화했다. `portMap` 유효성 오류 0건, 로컬 1280px·390px 지도 눈 확인, 브라우저 오류·가로 넘침 0건. Python 명령이 없어 `portmap-audit.py` 대신 실제 렌더러 SVG와 원본을 대조했다.
- [x] 제조사 허용 호스트·이미지 매니페스트·카탈로그·검색 인덱스·읽기용 카탈로그·스냅샷을 갱신했다. 선택적 W-008 되감기를 기존 이력 검사에 연결했다.
- [x] Builder 파생 라이브러리에서 TOGGLE 9행·12단자, U-BRIDGE 7행·12단자를 확인했다. 두 제품 모두 확인 필요 I/O 행 0건이다.
- [x] 전체 검사 697건(696 pass·0 fail·기존 skip 1), `verify-pages` 283장비·280상세·501 이미지·142 uploads, 검색 인덱스 `--check` 통과.
- [x] Work 지정 순서에 따라 #506 병합 뒤 최신 main을 통합하고 충돌 난 검색 인덱스를 원본에서 재생성했다. 추가 #508 문서 병합도 통합했다. 전체 직렬 검사 700건(699 pass·0 fail·기존 skip 1), 검색 인덱스 검사, Pages 검증(283장비·280상세·501 이미지·142 uploads) 통과.
- [x] PR #507의 최종 Builder CI run `38577993536` 성공 뒤 병합 SHA `8d6b5cadf1ee5583315bf0c0e2c143f535fe6550`을 확인했다.
- [x] Pages run `38578538504` 성공. 공개 version revision `8d6b5ca`. TOGGLE DOCK 2×1과 U-BRIDGE 3을 각각 1280px·390px에서 확인했다(HTTP 200, 지도 9·11개, 브라우저 오류·문서 가로 넘침 없음). 모바일 양쪽 스크롤과 INOGENI 칩의 2제품 필터도 눈으로 확인했다. [공개 검증](기록/W-20261014-008-C-공개검증.md).

[제품별 근거표](기록/W-20261014-008-C-근거표.md) · [Work 인계](기록/W-20261014-008-C-Work-인계.md)

## W-20261014-002·003·004 — 제품 문구 및 Port Map 표시

- 상태: MERGED (PR #496 병합·Pages 공개 화면 확인)
- 기준 main: `c5b91698670c789219bf6d6d1b3effbfee1ed054` · 브랜치 `codex/W-20261014-002-wording` · 전용 워크트리 `codex-c`
- 승인 근거(W-002, 사용자 원문): “미러, 복제 이 용어의 통일이 필요해 보입니다. 중복으로 쓸 필요까진 없어 보입니다.” / “저희가 주로 쓰는 제품들 중에는 큰 편이고, 일체형 프로젝터에는 콤팩트라는 표현이 없어서 빠지는 게 나을 것 같습니다.”
- 승인 범위: W-002 NovaStar 한 제품과 Epson 7종 문구, W-003 X100 Pro 2U·4U·7U 후면 지도, W-004 PT-MZ11K·14K·17K 도면 표식 위치. PT-MZ20K는 현 카탈로그에 없음. Analog Way 및 다른 Epson 제품은 제외.
- [x] NovaStar 공식 H2 사양서 V1.17.0 인쇄 39쪽의 커넥터 2 출력 “copy”와 인쇄 38쪽의 4xHDMI 이미지 “mirroring”을 대조했다. H_1xHDMI2.0의 출력 기능은 “복제”로 통일하고 4xHDMI의 서로 다른 두 기능은 유지했다.
- [x] Epson 7종의 한글·영문 설명에서 콤팩트/compact 표현을 제거하고 밝기·해상도·크기 비교·무게 등의 수치를 보존했다.
- [x] X100 Pro 3종의 실제 Rear 사진에서 녹색 INPUT와 파란색 OUTPUT 슬롯 묶음을 확인하고, 위 여백의 번호 2개와 각 가로 범위 괄호를 추가했다.
- [x] PT-MZ11K·14K·17K 공용 도면의 파란 표식을 위 1–5 / 아래 6–10 여백으로 배치했다. 기존 인쇄 번호와 도면 단자 위치는 유지했다.
- [x] 제품별 선택적 되감기와 이전 해시 검사 연결, 검색 인덱스·스냅샷·읽기용 카탈로그 재생성, 전체 테스트 686건 중 685 pass·기존 skip 1·실패 0, Pages 검증 통과.
- [x] 로컬 1280px·390px 화면에서 NovaStar·Epson 대표와 X100 Pro 3종·Panasonic 3종을 확인했다. 브라우저 오류·문서 가로 넘침 없음. 모바일 지도는 기존 가로 스크롤 방식이다.
- [x] 최신 main `299f291a51e34b793c6be0bb3ec054cc2d66f304`의 Logitech·PixelFit 변경을 통합했다. 검색 인덱스는 통합 원본에서 재생성하고 지도 수량 검사는 151 map / 99 fallback으로 대조했다. 전체 테스트 689건 중 688 pass·기존 skip 1·실패 0.
- [x] Work가 #496 선병합을 확인했다. 필수 Builder CI run `38545779608` 성공 후 PR #496을 병합했다(병합 SHA `91e20767fc838bbe6eeacb2c1a12362ebfdbaecd`).
- [x] Pages run `38546183127` 성공. 공개 `version.json` revision `91e2076`. NovaStar·Epson EB-PQ2220B·X100 Pro-2U·PT-MZ11K의 공개 1280px·390px 캡처를 눈으로 확인했다(HTTP 200, 오류·페이지 가로 넘침 없음). X100·Panasonic의 390px 오른쪽 스크롤도 확인했다.

[작업 근거표](기록/W-20261014-002-004-C-근거표.md) · [공개 검증](기록/W-20261014-002-004-C-공개검증.md) · [Work 인계](기록/W-20261014-002-004-C-Work-인계.md)

## W-20261013-007 — BEHX-H 비즈니스 TV 6종 연결 범례 지도

- 상태: MERGED (BEHHL 6종 배포·공개 화면 확인)
- 명세: `Work/작업/W-20261013-007.md` (읽은 main `4958f9c008dd988415ccf110d7581ae78aac0116`)
- 브랜치: `codex/W-20261013-007-behhl-guide-c`; 전용 워크트리 `codex-c`
- 범위: 사용자 제공 BEHX-H 설치가이드 1쪽에 보이는 다섯 단자 표시를 여섯 제품의 Diagram·Port Map으로 등록. 기존 I/O 사양, 다른 제품, 렌더러, 검증기 변경 없음.
- [x] 재개 시 미커밋 변경을 확인하고 사용자 제공 PDF SHA-256과 기존 게시본의 바이트 동일성을 검증했다.
- [x] 1쪽 범례의 USB·LAN·HDMI(eARC)·ANT·HDMI를 지도화하고 2쪽 BE43HX-**~BE85HX-** 적용 표를 대조했다. 6종에 동일 픽셀 공유 도면을 사용했다.
- [x] HDMI 범례 2개와 공식 사양 3개의 차이 및 세 번째 위치 미표기를 Diagram 설명과 근거표에 적었다. 기존 사양과 RF 단자 수는 유지했다.
- [x] 제품별 선택적 이력 되감기와 새 지도 검사를 연결했다.
- [x] 번호·지시선 다섯 개를 대표 1280px와 390px 좌우 스크롤 캡처로 눈 확인했다. 로컬 브라우저 오류·문서 가로 넘침 없음.
- [x] 대표 LH55BEHHLBFXKR 공개 1280px·390px 캡처를 눈으로 확인했다. HTTP 200, 지도와 다섯 설명·HDMI 충돌 문구 표시, 가로 넘침·브라우저 오류 없음.
- [x] 전체 직렬 검사 659건(658 pass·0 fail·기존 skip 1), 검색 인덱스 `--check`, Pages 검증(280장비·277상세·490 WebP·139 uploads)을 통과했다.
- [x] 최신 main `7db7b99d23fc0e948676728fff455acfadeaab3e`의 RTCOM 동기화 변경을 통합했다. 검색 인덱스 충돌은 통합 원본에서 재생성하여 해소했다.
- [x] 통합 후 전체 직렬 검사 659건(658 pass·0 fail·기존 skip 1), 검색 인덱스 `--check`, RTCOM 동기화 `--check`(32/32), Pages 검증(280장비·277상세·490 WebP·139 uploads), `git diff --check origin/main...HEAD`를 통과했다.
- [x] Work가 현재 #449와 파일이 겹치지 않으며 이 PR을 CI 통과 후 먼저 병합해도 된다고 확인했다.
- [x] PR #484의 필수 Builder CI run `38502573689` 성공 후 병합 SHA `80b092bb13c8ef694748af471c25578a407a73a7`을 확인했다.
- [x] Pages run `38502854175` 성공. 공개 `version.json` revision `80b092b`, 대표 제품 JSON HDMI 3·지도 5개를 확인했다. [공개 1280px 캡처](기록/W-20261013-007-C-BEHHL-public-1280.png) · [390px 캡처](기록/W-20261013-007-C-BEHHL-public-390.png).

[지도 근거표](기록/W-20261013-007-C-BEHHL-지도-근거표.md) · [Work 인계](기록/W-20261013-007-C-BEHHL-지도-Work-인계.md)

## W-20261012-013 3차 — 영상·기타 제조사 Builder 단자 재검토

- 상태: MERGED (배포·공개 Builder 확인)
- 명세: `Work/작업/W-20261012-013.md` (읽은 main `12c1e607ddd6d9c9d176f1b7ff0d884686c7366e`)
- 브랜치: `codex/W-20261012-013-phase3-video-c`; 전용 워크트리 `codex-c`
- 범위: Samsung·Sony·Panasonic·AVer·Roland·Analog Way·AMX·기타의 확인 필요 행. 세션 A 소유 오디오·TR315/TR335·`pt-*` 파일은 변경하지 않는다.
- [x] 시작 report: 305제품·I/O 1,573행·단자 2,836개·확인 필요 119행·I/O 있으나 단자 0 제품 4개. 이전 A2/B2 보류 사유를 읽었다.
- [x] AMX 1행의 공식 수량 보강, AJA 1행 중복 해소, Roland 4행 전이중 RS-232 override, TR535 1행 해소와 제어 행의 허위 4개 포트 교정을 공식 자료로 검증했다.
- [x] 확인 필요 112행·단자 2,842개·I/O 있으나 단자 0 제품 4개. 신규 검사 RED→GREEN 및 선택적 제품 되감기 검사를 확인했다.
- [x] 전체 직렬 검사 646건(645 pass·0 fail·기존 skip 1), Pages 검증(276 장비·273 상세·479 WebP·134 uploads), 검색 인덱스·읽기용 카탈로그·빌더 라이브러리 `--check`를 통과했다.
- [x] Builder 타입 검사, 단위 검사 101건, 스키마 검사, 빌드, E2E 39건을 통과했다.
- [x] 로컬 Builder 대표 TR535 1280px·390px 화면에서 영상 출력과 제어 단자, 사진, 가로 넘침 없음, 브라우저 오류 없음을 확인했다.
- [x] Work가 #472 선병합 순서를 확정했다. 병합 직전 `origin/main`은 시작 SHA `12c1e607`과 같아 재통합·파생 재생성이 불필요했다. PR diff 범위·`git diff --check origin/main...HEAD`를 확인하고 필수 Builder CI run `38396120370` 성공 후 PR #472를 병합했다(병합 SHA `b15fea7d6f70780b7ce8f07e2ce7fd7ffb5c272e`).
- [x] Pages run `38396545856` 성공. [공개 Builder](https://seoulav.github.io/AV-Portal/builder/)에서 TR535를 1280px·390px로 확인했다(HTTP 200, 사진·HDMI Out 2개·SDI Out 1개·RS-232/RS-422 양방향 단자 표시, 가로 넘침·브라우저 오류 없음). [1280px 캡처](기록/W-20261012-013-C3-public-1280.png) · [390px 캡처](기록/W-20261012-013-C3-public-390.png).

[근거표](기록/W-20261012-013-C3-근거표.md) · [Work 인계](기록/W-20261012-013-C3-Work-인계.md)

## W-20261013-007 — 호텔 TV U800F · 비즈니스 TV BEHHL

- 상태: MERGED (U800F 6종 배포 확인, BEHHL 6종 근거 부족으로 보류)
- 명세: `Work/작업/W-20261013-007.md` (읽은 main `0bda1d5a9ebc344d164383c538724b22d88bd66a`)
- 브랜치: `codex/W-20261013-007-displays-c`; 전용 워크트리 `codex-c`
- 범위: 호텔 TV U800F 6종의 Diagram·Port Map, BEHHL 6종 후면 자료 대조와 보류 기록. 비디오월·WMF·LED 및 세션 A/B 진행 파일은 변경하지 않는다.

- [x] 삼성 국내 한글 매뉴얼 12쪽의 U800F 전용 도면과 적용 모델 6종을 확인했다. HP-ID·HEADPHONE·SERVICE는 U800F 지도에서 제외했다.
- [x] U800F 후면 도면을 Diagram으로 등록하고 6종에 동일한 10개 번호 지도를 적용했다. 공식 그림과 기존 I/O가 확인하는 단자만 표시했다.
- [x] 도면 위 좌표 점검 이미지와 대표 1280px·390px 캡처를 눈으로 확인했다.
- [x] BEHHL 설치가이드 그림의 HDMI 2개와 국내 스펙의 HDMI 3개 충돌을 확인했다. 글로벌 공식 자료도 조사했으나 국내 6종의 정확한 후면 도면·사진을 확인하지 못해 지도 생성을 보류했다.
- [x] 제품별 이력 되감기와 공유 도면 계약 검사를 연결했다.
- [x] 비디오월 #461 병합 main `aa335df4d485deca8c36ccae7dd283ef2f9cef36` 통합 후 파생 산출물을 재생성했다. 전체 직렬 검사 636건(635 pass·0 fail·기존 skip 1), 검색·읽기용 카탈로그 검사, Pages 검증(276장비·273상세·477 WebP·132 PDF 항목)을 통과했다.
- [x] Work가 지정한 순서(#461 다음)로 PR #462를 진행했다. 필수 Builder CI run `38380129587` 성공 후 병합 SHA `4de07abbd4ff4c4924daeaec8fb8805d19c8c35c`를 확인했다.
- [x] Pages run `38380523810` 성공. 공개 HG55U800FNFXKR 화면을 1280px·390px에서 확인했다(HTTP 200, 지도와 설명 10개, 가로 넘침·브라우저 오류 없음).

[근거와 보류 사유](기록/W-20261013-007-C-근거표.md) · [Work 인계](기록/W-20261013-007-C-Work-인계.md)

## W-20261013-007 — WMF 2종 · BEHHL 매뉴얼 재조사

- 상태: MERGED (WMF 2종 배포 확인, BEHHL 6종 근거 부족으로 보류)
- 명세: `Work/작업/W-20261013-007.md` (읽은 main `aee3364d45c33c9a8d251908eb3e024bb2526910`)
- 브랜치: `codex/W-20261013-007-wmf-c`; 전용 워크트리 `codex-c`
- 범위: WMF 두 모델의 공식 한글 매뉴얼 Diagram·Port Map 및 BEHHL 여섯 모델의 추가 매뉴얼 조사. LED·BEHHL 제품 JSON·세션 A/B 진행 파일은 변경하지 않는다.
- [x] 한글 사용설명서 BN81-28453F-02 표지의 WM55FX·WM75FX 적용 모델과 13·14쪽의 별도 후면 도면을 확인했다.
- [x] WMF 두 모델에 각자의 Diagram과 후면 7개 표식을 등록했다. 기존 I/O 9행 중 도면에 위치가 없는 USB-C 허브·RS-232C는 지도에 넣지 않았다.
- [x] 두 모델의 점검 이미지를 열어 표식 1–7의 단자 정체·범위를 눈으로 확인했다. 대표 55형 로컬 1280px·390px 캡처에서 가로 넘침과 브라우저 오류가 없음을 확인했다.
- [x] BEHHL 국내 공용 사용설명서 276쪽, 설치가이드 2쪽, 간단 사용설명서 2쪽, 글로벌 공용 사용설명서 333쪽을 재조사했다. HDMI 3개를 보여 주는 정확 모델 후면 도면은 찾지 못해 기존 보류를 유지한다.
- [x] 선택적 되감기 함수·제품별 검사 및 전체 직렬 검사 638건(637 pass·0 fail·기존 skip 1)을 통과했다.
- [x] 최신 main `f7766a37bed10f9873c51364ab5dae45b94479b0` 통합 후 검색 인덱스·스냅샷·읽기용 카탈로그를 재생성했다. 전체 직렬 검사 638건(637 pass·0 fail·기존 skip 1), 검색 인덱스 `--check`, Pages 검증(276 장비·273 상세·479 WebP·132 PDF 항목), `git diff --check origin/main...HEAD`를 통과했다.
- [x] Work가 지정한 순서(#468 먼저)로 PR #468을 진행했다. 필수 Builder CI run `38385565965` 성공 후 병합 SHA `9edaaa095b448961524898bb9c28e7a789689b5b`를 확인했다.
- [x] Pages run `38385924163` 성공. 공개 LH55WMFWBGCXKR 화면을 1280px·390px에서 확인했다(HTTP 200, Diagram과 지도·설명 7개, 가로 넘침·브라우저 오류 없음).

[WMF 근거표](기록/W-20261013-007-C-WMF-근거표.md) · [BEHHL 재조사](기록/W-20261013-007-C-BEHHL-재조사.md)

### BEHHL 사용자 제공 BEFX-H 가이드 추가 판정

- [x] 사용자 제공 BN68-23476A-01 PDF SHA-256 일치·2쪽 원본 시각 확인. 1쪽 범례는 HDMI(eARC)+HDMI의 2개, 2쪽 적용 표기는 BE43/50/55/65/75/85FX-**다.
- [x] 기존 BEHX-H BN68-26620A-01과 다른 시리즈의 가이드이며, 국내 BEHHL HDMI 3개와의 불일치도 해소하지 못해 6종 Port Map 보류를 유지했다. 제품 JSON과 PDF 게시 목록은 변경하지 않았다.
