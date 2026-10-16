# Codex 세션 D 작업 지시서와 진행 기록

## W-20261016-012 — Sony Port Map 겹침 정리 / W-015 시범

- 상태: **REVIEW — Work 시각 승인·병합 순서 대기**
- 명세: [W-012](작업/W-20261016-012.md), [W-015](작업/W-20261016-015.md), [최초 Codex 인계](기록/W-20261016-012-Codex-인계.md)
- 명세를 읽은 main SHA: `59f2fe495fb2c1522bf3ed99b37435e6814ba4b1`; 추가 명세 통합: `a16ec715`.
- 구현 브랜치: `codex/W-20261016-012-sony-portmaps`; 전용 워크트리 `../codex-d`.
- 승인: 2026-10-16 사용자 직접 배정, Work의 BRC-AM7 위·아래 가장자리 분산 시범 승인.
- **W-012/W-015 적용에 필요한 검증기 한 줄 변경, Work 2026-10-16 승인**.
- 구현: Sony 5종 40표식 내부 y 삭제, side·labelX·crop 조정. validMap의 crop 조건만 y 없음 허용; 원본·공개 복사본 동일.
- 사진·번호·이름·설명·io와 portMapGeometry/renderPortMap 유지. 다른 세션 진행 파일·Analog Way JSON·잠긴 PDF·builder/·cpq/ 무변경.

### 체크리스트

- [x] 시작 폴더 파일·브랜치 무변경, fetch 및 독립 워크트리 생성, READY·승인·기획 PR 병합 확인.
- [x] 시작 시 열린 PR #568과 Sony 대상 파일이 겹치지 않음 확인.
- [x] 기준 전체 시험: 751개 중 750 통과, 실패 0, 기존 제외 1.
- [x] 760px·390px 좌우 전후 PNG 30개와 40개 표식 점검표 작성.
- [x] 선택적 되감기 및 검증기 회귀 3종, source image·비대상 필드 보존 검사.
- [x] 파생 재생성 및 로컬 전체 검사·verify-pages 통과.
- [x] 후 캡처 자체·독립 시각 검토 및 실제 앱 1280px·390px 10화면 표시 확인.
- [ ] PR·CI 초록 확인 뒤 미리보기 경로와 함께 Work에 병합 순서·시각 승인 요청.
- [ ] 승인 후 병합·Pages 배포·공개 확인.

### 검증 결과 (2026-10-16)

- `node --test --test-concurrency=1 tests/*.test.mjs`: **756개, 755 통과, 실패 0, 기존 제외 1**.
- crop 있음/y 없음 통과; 명시 y 범위 밖·null·문자열 거부; 범위 경계 통과.
- 변경 전 지도 175개 및 RTCOM 25개 제품의 통과·거부 결과 일치. crop 없는 168개 결과도 동일.
- `node beta/update-snapshot.mjs`, `node beta/build-search-index.mjs`, `node beta/build-readable-catalog.mjs` 실행.
- `node beta/build-search-index.mjs --check`: 통과, 702812 bytes.
- `node beta/verify-pages.mjs`: 284개 제품, 281개 상세, 509개 사진, PDF 항목 156개 검증 통과.
- `git diff --check`: 통과. 전체 시험의 PDF.js canvas/font 경고는 기준 검사에서도 있었으며 실패 없음.
- 원본·공개 detail-enhancements 복사본 일치 검사는 기존 전체 시험에서 통과.
- 전체 앱 5종 × 1280px/390px: 각 17/7/6/5/5개 표식 표시, 페이지 가로 넘침 없음.

### Work가 직접 확인할 부분

- [점검표·전후 미리보기](기록/W-20261016-012-PortMap-점검.md), [BRC-AM7 예외](기록/W-20261016-015-예외.md).
- 5종 모두 위·아래 각 1 lane. BRC-AM7은 아래 번호 10개로 밀도가 높다.
- BRC-AM7 1·13·7 / 10·16 / 11·12·17 및 SRG-A40 2·4 / 5 위 IR SELECT의 단자 줄 혼동 가능성은 미리보기 주황 설명에 표시했다.
- SRG-X40UH는 3/3 균형 유지, 단자 6개와 단자명 보존. crop 1640으로 LAN 위 흰 보호부 일부가 잘린다.
- 독립 검토에서 선의 단자·단자명 관통은 발견되지 않았으나 위 혼동 가능성은 Work 승인 전이다.
- 공개 사이트는 아직 변경하지 않았다. 병합·배포를 완료로 기록하지 않는다.

## W-20261016-013 — 모든 제품 Port Map 돋보기

- 상태: **선행 작업 대기**. W-012 병합 뒤 최신 origin/main에서 별도 브랜치로 시작한다.
- Sony 216px·3배 유지, 도면·낮은 사진에서도 마우스 돋보기 활성화. 제품 JSON은 변경하지 않는다.
