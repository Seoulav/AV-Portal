# 공개 베타 로컬 검토본

W-20260923-012는 기존 로컬 제품 목록에서 **명시적으로 채택한 항목만** 별도 정적 화면으로 만듭니다. 기존 내부 탐색 서버, 원본 목록, 자료대장은 변경하지 않습니다. 생성에는 Node.js 20 이상과 Git이 필요하며 추가 패키지 설치는 필요하지 않습니다. 생성된 화면의 실행에는 Git이나 원본 파일이 필요하지 않습니다.

1. 검토한 원본 목록의 SHA-256을 확인하고, Git 제외 `outputs/` 아래에 `decisions.json`을 만듭니다. `approved`에는 공개 대상으로 판정한 기존 ID와 **원본의 `official_sources`에 이미 있는** 모델별 제조사 HTTPS 웹페이지 URL, 확인한 제조사 호스트만 넣습니다. 아래 값은 형식 설명을 위한 합성 예시입니다.

```json
{
  "source_sha256": "<원본 파일의 SHA-256 소문자>",
  "approved": [
    { "id": "<기존 제품 ID>", "urls": ["https://example.com/products/example-model"], "official_hosts": ["example.com"] }
  ]
}
```

2. 저장소 루트에서 실제 로컬 경로를 지정해 생성합니다. 출력 폴더는 반드시 Git 제외 `outputs/` 아래에 두고 기존 출력과 겹치지 않는 새 이름을 사용합니다. 생성기는 기존 `catalog.json`을 덮어쓰지 않습니다.

```powershell
node beta/build.mjs --catalog '<로컬 원본 JSON 절대 경로>' --decisions '<로컬 decisions.json 절대 경로>' --out '<로컬 outputs 아래의 새 site 폴더 절대 경로>'
node beta/serve.mjs --dir '<위 site 폴더 절대 경로>' --port 4174
```

브라우저에서 `http://127.0.0.1:4174/`를 엽니다. 생성된 `site` 폴더에는 화면 파일 3개와 공개 검토용 `catalog.json`만 있습니다. 이 폴더만으로 원본 목록 없이 실행되며 서버는 이 PC의 루프백 주소에만 연결됩니다. 제품명·브랜드 검색, 브랜드·복수 카테고리 필터, 장비/서비스 보기, 제조사 웹페이지 링크를 확인합니다. 선별된 서비스가 없으면 서비스 탭에 0건 이유가 표시됩니다.

생성기는 `brand`, `product`, `categories`, `kind`, `official_links`만 출력합니다. 제품 ID·원본 행·별칭·내부 메모·공급처·로컬 경로·보조 링크·사진/PDF는 출력하지 않습니다. 확인된 모델 본문 기록, 공식 호스트, HTTPS, 허용 웹페이지 형식을 검사합니다. 결정표·생성 데이터·로컬 상세 검토표는 GitHub에 올리지 않습니다.

외부 배포는 사용자 최종 승인 이후 별도 작업입니다. 후보 방식은 [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)의 수동 정적 파일 업로드로, Git 자동 연결 없이 이 폴더만 올릴 수 있습니다. [무료 플랜은 $0](https://www.cloudflare.com/developer-platform/products/pages/)이며 정적 요청에 별도 비용이 없지만, 대시보드 드래그 업로드는 1,000개 파일·개별 25 MiB 제한이 있습니다. 이 묶음은 4개 파일이고 가장 큰 파일도 8 KiB 미만입니다. [무료 플랜 한도](https://developers.cloudflare.com/pages/platform/limits/)를 배포 직전에 다시 확인해야 합니다. 이번 작업에서는 프로젝트 생성·외부 업로드·결제를 하지 않았습니다.

## W-20260923-013 — GitHub Pages 공개 배포

W-012의 위 설명은 당시 로컬 검토 범위의 기록입니다. 이후 사용자가 2026-09-23에 **선별된 장비 25개와 다섯 공개 필드만** GitHub Pages에 게시하도록 승인했습니다. W-013은 이 폴더의 네 파일(`index.html`, `styles.css`, `app.js`, `catalog.json`)만 Pages 아티팩트로 올립니다. `node beta/verify-pages.mjs`가 파일 목록·25개·다섯 필드·승인 스냅샷 해시를 배포 직전에 검사합니다. 내부 원본·결정표·로컬 미리보기 출력은 배포에 포함되지 않습니다.
실제 공개 주소: [https://seoulav.github.io/AV-Portal/](https://seoulav.github.io/AV-Portal/). GitHub Actions 실행 #35879374484 배포 성공과 실주소 검증을 W-013 결과에 기록했습니다.
