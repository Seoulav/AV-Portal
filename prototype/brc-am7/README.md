# SONY BRC-AM7 Product Detail 로컬 시안

PR #33의 BRC-AM7 원고(기준 커밋 `3217646c5ba1b612c0520cc4492bb7a0bcc4462d`)와 2026-09-24 사용자 구현 지시를 바탕으로 한 **단일 제품 시안**입니다. 공개 Library의 `beta/site`와 GitHub Pages 워크플로는 수정하지 않습니다.

저장소 루트에서 Node.js 20 이상으로 실행합니다.

```powershell
node prototype/brc-am7/fetch-images.mjs
node prototype/brc-am7/serve.mjs --port 4185
```

회사 PC 브라우저에서 `http://127.0.0.1:4185/`를 엽니다. 서버는 `127.0.0.1`에만 연결되고, 정해진 시안 파일과 네 역할의 이미지 파일만 제공합니다. Main·Front·Rear·Perspective Sony 공식 이미지는 `outputs/brc-am7-detail/images/`에 **로컬 전용**으로 저장되며 Git에서 제외됩니다. 이 폴더가 없으면 Gallery는 로컬 이미지 없음 상태와 공식 출처 링크를 보여 줍니다. 이미지·PDF·CAD 원본을 Git에 커밋하거나 Pages에 올리지 않습니다. 이미지 URL은 브라우저에서 외부 핫링크로 사용하지 않습니다.

화면에는 공식 제품 페이지, 한국어 Manual·Specification, 지원 페이지를 Quick Documents 상단에 두고, free-d·CAD는 검토 필요인 리소스 소개 페이지로 표시합니다. 없는 Datasheet·Brochure·Installation·Quick Start는 링크 없는 MISSING 상태입니다. Features 8, 사양 27, I/O 14는 PR #33 원고의 조건·근거를 유지합니다. 확장 줌 C1 충돌은 확정 사양에서 제외했습니다.

이 시안은 레이아웃과 정보 밀도를 검토하기 위한 결과입니다. 다른 24개 제품 확장, 최종 Schema/DB/Storage, 이미지·PDF 재게시 권한 결정은 포함하지 않습니다.
