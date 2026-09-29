# 4단계 — 홈 검색 속도 개선 (검색용 목록 파일)

- 선행: 3단계 완료·사용자 확인
- 바꾸는 것: 새 빌드 스크립트, 새 파일 `search-index.json`, 루트 `app.js`의 데이터 읽기 부분
- 바꾸지 않는 것: `catalog.json`, `detail/data/*.json`, 검색 결과(같은 검색어에 같은 결과)

## 1. 문제

루트 `app.js`는 홈을 열 때 `catalog.json` 외에 상세 JSON 240개를 모두 받습니다(요청 245번, 약 3.8MB). 검색어(`publicDetailSearchTerms`), 별칭(`model`·`productName`·`series`), 카드 사진(`card_image`) 정보를 얻기 위해서입니다.

## 2. 해결

1. 스크립트 `scripts/build-search-index.mjs`(이름은 저장소 관례에 맞게)를 만듭니다. `catalog.json`과 상세 JSON을 읽어 제품마다 아래 필드만 모은 `search-index.json`을 만듭니다.

```json
{
  "schema": "avportal.search-index.v1",
  "generatedAt": "2026-09-29T00:00:00Z",
  "items": [
    {"slug": "tr315", "aliases": ["TR315", "TR3xx series"], "searchTerms": ["..."],
     "cardImage": {"file": "tr315-perspective.webp", "alt": "..."}, "summary": "TR315는 ..."}
  ]
}
```

- `searchTerms`는 지금 `publicDetailSearchTerms(detail)`이 만드는 값과 **똑같이** 만듭니다(같은 함수를 공유 모듈로 빼서 스크립트와 화면이 함께 씁니다).
- `summary`는 `korean`입니다(3단계 제품 카드용).
- `verificationState`는 화면에 쓰지 않으므로 넣지 않습니다.

2. 홈은 `catalog.json`과 `search-index.json` 두 파일만 받습니다. `search-index.json`을 못 받으면 지금처럼 상세 JSON을 읽는 방식으로 돌아갑니다(안전장치).
3. 스크립트에 `--check` 옵션을 두어, 저장된 `search-index.json`이 현재 데이터와 다르면 실패하게 합니다. 기존 검사(있다면 CI)에 추가합니다.
4. 상세 JSON이나 `catalog.json`을 바꾸는 모든 작업은 이 스크립트를 다시 실행해야 한다고 README·AGENTS.md에 적습니다.

## 3. 검증

1. 작업 전·후 홈 요청 수와 받은 용량, 로딩 시간을 표로 비교합니다(목표: 요청 10번 이하).
2. 검색어 20개(제조사명, 모델명, 시리즈명, "HDMI", "Dante", "4K", 한글 카테고리 등)로 작업 전·후 결과 목록이 같은지 스크립트로 비교합니다.
3. `node scripts/build-search-index.mjs --check` 통과
