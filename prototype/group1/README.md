# Group 1 Product Detail 로컬 검토본

이 검토본은 Work의 Git 제외 `outputs/product-detail-group1-20260924/` 내 통합 인덱스·제품별 Markdown 5개를 실행 시 읽어 공통 Product Detail renderer에 전달합니다. 최종 스키마·DB·Storage 계약이 아니며, 패키지 원문을 수정하거나 Git에 복제하지 않습니다. 기존 공개 Library 25개를 유지하고 **로컬 화면에서만** Ki Pro GO2와 PT-MZ17K 두 카드를 추가하여 27개 중 5개가 상세로 이동합니다. `beta/site/`와 GitHub Pages 배포 파일은 건드리지 않습니다.

저장소 루트에서 Node.js 20 이상으로 실행합니다. 환경변수에는 이 PC의 Git 제외 Group 1 패키지 폴더를 지정합니다. BRC 이미지 폴더를 지정하지 않으면 BRC도 이미지 없음 상태로 표시됩니다. 다른 네 제품의 이미지 메타데이터는 방향별 FOUND/REVIEW REQUIRED/MISSING 상태 카드와 공식 출처 링크로 표시하고, 이미지 자체는 재게시·핫링크하지 않습니다.

```powershell
$env:AV_PORTAL_GROUP1_PACKAGES='<로컬 Group 1 패키지 폴더>'
$env:AV_PORTAL_BRC_IMAGES='<로컬 BRC-AM7 이미지 폴더>'
node prototype/group1/serve.mjs --port 4186
```

회사 PC 브라우저에서 `http://127.0.0.1:4186/`을 엽니다. 제품명 또는 Product Detail 링크로 들어갑니다. 공식 제품 페이지는 Quick Documents 밖에 두고, 검토가 필요한 링크는 상태를 함께 표시합니다. `MISSING` 문서나 검토 중인 문서에는 빠른 열기 버튼이 없습니다. 제품별 문서·사양·I/O의 상태와 수량은 Work 패키지 기준입니다.

검증 명령은 `npm test`와 위 환경변수를 설정한 상태의 `node scripts/verify-group1-local.mjs`입니다. 재게시 권한·자료 개정·모델 및 SKU 검토 상태는 패키지 그대로 유지합니다. 로컬 화면의 27개는 공개 범위 승인이나 Pages 배포를 뜻하지 않습니다.
