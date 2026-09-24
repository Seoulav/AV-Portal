# AV Portal — Claude 독립 검증 인계

- 기준일: 2026-09-24
- 기준 브랜치/커밋: `main` / `d782d4e585be57ed42801fd4cba95b02cd96348f`
- 공개 사이트: https://seoulav.github.io/AV-Portal/
- 최근 Pages 성공 실행: [#35960465573](https://github.com/Seoulav/AV-Portal/actions/runs/35960465573)

이 문서는 **현재 구현을 독립적으로 검증**하기 위한 안내다. 검증 결과를 미리 합격으로 간주하지 않는다. 코드를 수정하거나 다시 배포하기 전에 결함의 재현 절차와 영향을 먼저 보고해 달라. 검증 중 로컬 비공개 자료를 업로드하거나 공개 저장소에 추가하지 않는다.

## 현재 구현 범위

- GitHub Pages 정적 공개 베타: 선별된 **장비 27개, 서비스 0개**. Library의 각 항목은 `brand`, `product`, `categories`, `kind`, `official_links` 다섯 필드만 가진다. 검색, 브랜드 필터, 복수 카테고리 필터, 장비/서비스 보기가 있다.
- 공통 Product Detail 화면에 연결된 제품은 **5개**: Sony BRC-AM7, Yamaha DM7, AJA Ki Pro GO2, Panasonic PT-MZ17K, Logitech Rally Bar. 제품별 HTML을 따로 만들지 않고 공통 렌더러와 제품별 공개 데이터 파일을 사용한다.
- 상세에는 Header, 이미지 상태, Quick Documents 4종(매뉴얼·시방서·사양서·기술문서), 별도 공식 제품 페이지 링크, Overview, Features, Specifications, I/O, 보조 문서, Sources & Verification, 모바일 sticky section navigation이 있다. I/O 커넥터는 그룹을 펼치지 않아도 보여야 한다.
- AV System Builder와 LED Configurator는 상단의 **외부 링크**다. 이 저장소에서 두 도구를 수정하지 않는다.
- 별도의 내부 로컬 서버는 Git 제외 원본 목록 338개(장비 336·서비스 2)를 읽을 수 있다. **이 338개가 공개된 것은 아니다.** 공개 범위는 위의 선별된 27개뿐이다.

| 상세 제품 | Features | Specifications | I/O | 검토 상태 |
| --- | ---: | ---: | ---: | --- |
| BRC-AM7 | 8 | 27 | 14 | READY FOR CODEX; 일부 개별 검토 사항 유지 |
| DM7 | 8 | 16 | 15 | READY WITH REVIEW FLAGS |
| Ki Pro GO2 | 8 | 16 | 11 | READY WITH REVIEW FLAGS |
| PT-MZ17K | 7 | 13 | 4 | READY WITH REVIEW FLAGS |
| Rally Bar | 8 | 16 | 9 | READY WITH REVIEW FLAGS |

`READY WITH REVIEW FLAGS`는 모든 값이 확정됐다는 뜻이 아니다. `VERIFIED`, `FOUND`, `READY`, `PARTIAL`, `MISSING`, `REVIEW REQUIRED`, `CONFLICTED`를 서로 구분해야 한다. 사진·PDF의 재게시 권한 미확인도 사실 검증과 별개다.

## 검증에 필요한 파일

1. 협업·범위: [AGENTS.md](../../AGENTS.md), [Work/README.md](../README.md), [Work/지시서.md](../지시서.md), [Work/기획/UI_UX_SPEC.md](../기획/UI_UX_SPEC.md), [Work/기획/PORTAL_MVP_SPEC.md](../기획/PORTAL_MVP_SPEC.md). 초기 기획과 오래된 완료 기록은 현재 공개 상태와 다를 수 있으므로 최신 `main` 코드·최근 진행 기록과 대조한다.
2. 공개 Library: [beta/site/index.html](../../beta/site/index.html), [beta/site/app.js](../../beta/site/app.js), [beta/site/detail-links.js](../../beta/site/detail-links.js), [beta/site/catalog.json](../../beta/site/catalog.json).
3. 공통 상세: [beta/site/detail/index.html](../../beta/site/detail/index.html), [beta/site/detail/app.js](../../beta/site/detail/app.js), [beta/site/detail/product-detail-model.mjs](../../beta/site/detail/product-detail-model.mjs), `beta/site/detail/data/`의 공개 JSON 5개. 재사용 가능한 원본 UI 코드는 `prototype/brc-am7/`에 있다.
4. 공개 아티팩트 검사·배포: [beta/verify-pages.mjs](../../beta/verify-pages.mjs), [.github/workflows/pages.yml](../../.github/workflows/pages.yml), [tests/](../../tests/). Pages가 업로드하는 경로는 `beta/site`뿐이다.
5. 최신 화면 변경 기록: [W-20260924-007](W-20260924-007-Work-인계.md)과 [W-20260924-008](W-20260924-008-Work-인계.md)의 Work 인계, [PR #40](https://github.com/Seoulav/AV-Portal/pull/40), [PR #42](https://github.com/Seoulav/AV-Portal/pull/42), [PR #43](https://github.com/Seoulav/AV-Portal/pull/43). 검토 시 기준 커밋 이후 새 병합이 있으면 먼저 확인한다.

## 재현 방법

Node.js 20 이상을 사용한다. 공개본 확인에는 비공개 원본이나 별도 npm 패키지 설치가 필요 없다. 저장소 루트에서 실행한다.

```text
node beta/verify-pages.mjs
npm test
```

2026-09-24 기준 실행 결과는 공개 아티팩트 검사 통과, 테스트 **42 pass / 1 skip / 0 fail**이다. 건너뛴 1건은 비공개 원본 목록 경로가 설정되지 않은 로컬 전용 검사다. 이 결과는 출처의 모든 사양이나 재게시 권한을 독립적으로 입증하지 않는다.

화면 검증은 [공개 Library](https://seoulav.github.io/AV-Portal/)와 다음 다섯 상세에서 직접 한다.

- [BRC-AM7](https://seoulav.github.io/AV-Portal/detail/?product=brc-am7)
- [DM7](https://seoulav.github.io/AV-Portal/detail/?product=dm7)
- [Ki Pro GO2](https://seoulav.github.io/AV-Portal/detail/?product=ki-pro-go2)
- [PT-MZ17K](https://seoulav.github.io/AV-Portal/detail/?product=pt-mz17k)
- [Rally Bar](https://seoulav.github.io/AV-Portal/detail/?product=rally-bar)

권장 뷰포트는 Desktop 1440px, Mobile 390px이다. 직접 주소 진입과 새로고침을 모두 확인한다. 로컬에서 정적 공개본을 띄울 때 `beta/serve.mjs`는 초기 Library 파일만 제공하므로 **상세 화면까지 검증할 서버로 사용하지 않는다**. 정적 디렉터리 전체와 쿼리 문자열을 제공하는 서버를 사용하거나 위 공개 URL에서 검증한다.

## 우선 검증 항목

- **공개 경계·보안:** Pages 업로드 파일에 원본 Excel, 업체/공급처 정보, 내부 메모, private provenance, 원본 행 ID, 개인 경로, 비공개 직접 제공 파일, 결정표, 비밀키가 없는지 확인한다. 공개 링크의 URL 처리, HTML 삽입/XSS 가능성, GitHub Actions의 업로드 범위를 확인한다.
- **Library 회귀:** 장비 27·서비스 0, 제품 중복 없음, 기존 25개 보존, 검색·브랜드·복수 카테고리 필터, 다섯 상세 진입을 확인한다.
- **상세 사실성:** Quick Documents가 정확히 4칸이고 MISSING에 가짜 열기 링크가 없는지, 공식 제품 페이지가 별도 링크인지, REVIEW REQUIRED/CONFLICTED가 VERIFIED처럼 보이지 않는지 확인한다. 상세 JSON의 검토 상태와 화면 표시가 일치하는지도 확인한다.
- **정보 구조·사용성:** 다섯 상세의 Features/Specs/I/O 수량, 가변 그룹, I/O 커넥터의 첫 진입 즉시 표시, 1440px·390px 수평 넘침, 모바일 sticky 탭, 키보드 탐색·접근성, 새로고침·상대경로·캐시 갱신을 확인한다.
- **검사 범위의 빈틈:** 자동 검사에서 놓칠 수 있는 공개 필드, 링크 도메인·권한, 모바일 동작, 문서와 현재 구현의 불일치를 찾아낸다. 사양의 진위를 검토하려면 실제 제조사 공식 근거와 비교하고, 근거가 부족하면 미확인으로 남긴다.

## 알려진 제한 및 후속 검토

- 초기 338개 중 기존 보류 제품 313개와 미확정 옵션 19행을 일괄 공개하거나 추가하지 않았다. 공개 Library는 현재 27개이므로 초기 25개 이후 연결된 Group 1 신규 항목을 포함한다.
- 이미지와 PDF 원본은 사이트에 재게시하지 않았다. 재사용 권한을 추정하지 않는다. 이미지가 없거나 역할 검토 중인 상태는 화면에서 그대로 보여야 한다.
- BRC-AM7 확장 줌 충돌·일부 펌웨어 조건, DM7 문서 분류/개정·이미지 역할, Ki Pro GO2 이미지 역할, PT-MZ17K 지역 접미어·물리 I/O·후면 이미지, Rally Bar Mic Pod 수량·SKU는 검토 상태로 남아 있다.
- 최종 Product Schema, 영구 DB, Storage 구조는 미확정이다. 내부 로컬 338개와 공개 27개의 연결·공개 승인 절차도 별도 영역이다.
- 열린 Draft PR의 내용은 병합 전까지 현재 공개 동작으로 취급하지 않는다. 특히 지역별 공식 링크 우선순위 정책은 검토 중일 수 있으므로 현재 `main`과 열린 PR을 대조한다.

## Claude에 전달할 프롬프트

> Seoulav/AV-Portal 프로젝트를 독립적으로 검증해 주세요. 먼저 최신 `main`과 이 문서 `Work/기록/AV-PORTAL-CLAUDE-REVIEW-2026-09-24.md`를 읽고, 문서의 기준 커밋 이후 변경을 확인하세요. 공개 GitHub Pages와 저장소의 공개 아티팩트, 자동 테스트를 대조해 보안·정보 누출, Library 회귀, Group 1 상세 5개, 상태 표시, I/O 즉시 표시, Desktop/Mobile 사용성을 검증해 주세요. 발견한 결함은 심각도순으로 파일:행 또는 공개 URL, 재현 단계, 실제/기대 결과, 영향과 근거를 적어 주세요. 확인되지 않은 제품 사실이나 게시 권한은 확정하지 말고, 자동 검사만으로 확인되지 않는 사항도 구분해 주세요. 이번에는 읽기 전용 검증만 하고 코드 수정·비공개 자료 업로드·배포는 하지 마세요.
