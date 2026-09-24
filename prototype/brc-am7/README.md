# Product Detail 로컬 시안과 임시 UI 데이터

현재 입력은 `content.json`의 SONY BRC-AM7 **한 제품**입니다. `product-detail-model.mjs`가 한 제품 데이터 객체에서 화면용 Quick Documents 4칸, 추가 문서, 가변 사양 그룹, 가변 I/O 그룹과 Rear 이미지 위치를 준비하고 `app.js`가 같은 UI로 렌더링합니다. 이는 최종 제품 스키마, DB 또는 API 계약이 아닙니다. 다른 실제 제품 데이터는 아직 등록하지 않았습니다.

저장소 루트에서 Node.js 20 이상으로 실행합니다.

```powershell
node prototype/brc-am7/fetch-images.mjs
node prototype/brc-am7/serve.mjs --port 4185
```

회사 PC 브라우저에서 `http://127.0.0.1:4185/`를 엽니다. `fetch-images.mjs`는 BRC-AM7의 공식 이미지를 **로컬 전용** `outputs/brc-am7-detail/images/`에 확보할 때만 사용합니다. 이미 저장돼 있다면 다시 실행할 필요가 없습니다. 루프백 서버는 정해진 시안 파일과 전용 이미지 폴더의 안전한 파일명만 제공합니다. 이미지/PDF/CAD 원본은 Git에서 제외하며 공개 URL에서 핫링크하지 않습니다.

2026-09-24 이미지 중심 시안은 `serve.mjs`가 로컬 요청에만 `local-visual.css`를 덧씌웁니다. 흰색·파란색 2열 레이아웃과 사진 4장 갤러리를 검토하기 위한 것이며, `beta/site/detail/` 생성물이나 GitHub Pages에는 이 스타일과 사진을 포함하지 않습니다. 사진의 외부 재게시·핫링크 권한은 아직 미확인입니다.

향후 Work가 승인된 다른 제품의 자료를 넘기면, 이 UI가 실제로 쓰는 필드만 가진 제품 객체를 `content.json` 입력 대신 연결하면 됩니다. 기본 식별·설명·카테고리, `images`, `documents`, `features`, `specifications`, `io`, `sources`, `issues`와 선택적인 `presentation` 표시 문구를 전달합니다. `specifications[].group`은 입력에 있는 이름으로만 묶고, I/O는 `io[].group` 또는 `presentation.ioSignalGroups`의 신호 매핑으로 묶습니다. 화면에 쓸 그룹이 없는 I/O는 원래 `signal` 이름을 그룹으로 사용합니다. 특정 제품군의 그룹 목록은 코드에 없습니다. BRC-AM7의 고유 문구와 PoE++ 참조 안내는 `content.json`의 `presentation`에 있습니다.

Quick Documents는 User Manual/Independent Specification/Specification/Technical Document 네 종류만 고정 슬롯으로 표시합니다. 독립 시방서처럼 문서가 없거나 상태가 MISSING이면 열기 링크가 없습니다. Official Product Page는 카드 밖에 따로 표시하고, 나머지 확인된 문서는 Additional / Supplemental Documents에 남깁니다. `images`가 비거나 Front/Rear가 일부만 있으면 있는 썸네일만 표시하며, 이미지가 전혀 없을 때는 빈 상태를 보여 줍니다. Rear 버튼은 Rear 사진이 있을 때만 보입니다. 로컬 이미지 파일이 없는 경우에도 가짜 이미지를 만들지 않습니다.

BRC-AM7 기준 Features 8·사양 27·I/O 14, 사진 네 역할, 기존 검증·출처·문서 정보는 유지합니다. 확장 줌 충돌은 확정 사양에 넣지 않았고, 이미지/PDF/CAD의 재게시 권한은 미확인입니다. 다른 24개 제품 확장, 최종 Schema/DB/Storage, Pages 재배포는 포함하지 않습니다.
