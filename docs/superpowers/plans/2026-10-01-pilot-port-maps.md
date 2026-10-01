# W-20261001-001 후면 지도 보완 계획

승인 근거: 최신 사용자 Port Map·빈 수량 보완 지시. 명세: Work/작업/W-20261001-001.md 마지막 보완. 기존 시범 구현은 완료되어 재사용한다.

1. 저장소 PDF/manifest와 게시 사진을 대조한다. 원본은 수정하지 않는다. 좌표·쪽·수량 수정 목록을 만든다.
2. tests/detail-enhancements.test.mjs에 게시 파일 좌표 검증 실패 테스트 → detail-enhancements.mjs·detail-enhancement-view.mjs·app.js·styles.css 보완. 번호/괄호/모바일 스크롤/중복 사진 제거. beta/build-detail-assets.mjs로 생성본 동기화.
3. 시범4종 detail/data만 map을 채우고 승인된 빈 수량만 변경. pilot-evidence/신규 port-map-evidence로 원래 값 보호 검사를 유지. snapshot/search-index 재생성.
4. Rear 전 제품 현황표를 기존 manifest와 이미지 픽셀로 생성한다. 확대 구현은 하지 않는다.
5. Playwright 1280/390: ULXD4D와 실제 RTCOM 비교, 시범4종, 비시범 대표3종, 오류·겹침·사진 전환·확대·표·문서 유지 검사. 전체 자동검증 및 독립 리뷰.
6. Work 진행/근거/인계/캡처를 수행 PR에 포함한다. 최신 main·CI 확인 후 승인된 범위에서 병합하고 실제 공개 결과를 확인한다.

변경 제외: 사진/PDF 원본, RTCOM 원본, 기존 비어 있지 않은 수량/기술값/검증 상태, 시범외 데이터, H5 레이어 샘플, 2·3단계.
