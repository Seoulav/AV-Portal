# Shure 화면 검증

`local.json`은 11종 × 4개 너비(1280/390/1024/721)의 측정·기능 결과다. `local-<slug>-1280.png`와 `local-<slug>-390.png`는 각 제품 갤러리 캡처다. UA864A는 `local-ua864a-390-end.png`로 모바일 가로 이동 끝의 번호도 확인한다.

확정 6종: qlxd4, slxd4-plus, ua864a, ulxd4, ulxd4q, ulxd4d. Fallback 5종: mxcw640, mxcwapt-w, slxd4d-plus, slxd1-plus, mxa925w-r.

재현: 저장소 루트에서 Playwright 모듈 경로를 `NODE_PATH`, 설치된 Chromium 실행 파일을 `AV_PORTAL_BROWSER_PATH`로 설정하고 다음을 실행한다. 프로그램은 로컬 읽기 전용 HTTP 서버를 자동으로 열고 닫는다. 기준 Git 커밋과 현재 파일의 본문을 비교한다.

```text
node Work/기록/W-20261002-001-shure-port-map-screens/verify.cjs
node Work/기록/W-20261002-001-shure-port-map-screens/verify.cjs https://seoulav.github.io/AV-Portal/
```

공개 검증은 배포 성공 후 실행하며 11종 × 1280/390 = 22화면과 해당 공개 JSON을 실행 시 HEAD의 Git blob에 대조한다. `public.json`·`public-*.png`는 실제 실행 후 종료 기록에 추가한다. 병합 전 문서에서 공개 검증을 미리 통과 처리하지 않는다.
