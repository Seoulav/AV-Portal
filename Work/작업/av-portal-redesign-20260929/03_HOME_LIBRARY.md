# 3단계 — 홈·목록 화면 개편

- 선행: 2단계 완료·사용자 확인
- 바꾸는 것: 루트 `index.html`, `styles.css`, `app.js`(그리기 부분)
- 바꾸지 않는 것: `catalog.json`, `catalog.html`, `llms.txt`, 검색·필터·정렬 로직(`parseExploreState` 등), 주소 `?q=`
- 참고: `ref/screens/now-avportal-home.png`, RTCOM 제품 목록 https://seoulav.github.io/rtcom-configurator/#products

## 1. 배치

```
[사이트 머리 바]  (2단계와 같은 모양, 메뉴: 제품 · 제조사 · AV System Builder ↗ · LED Configurator ↗)
[제목 영역: 아이콘 타일 · "AV 장비 라이브러리" · 부제 "247개 장비 · 28개 제조사"]
[큰 알약 검색칸 + 파란 "제품 검색" 주요 버튼]
[01 카테고리로 찾기 — 글래스 카드 안에 카테고리 타일 6개]
[02 제조사로 찾기 — 글래스 카드 안에 제조사 알약 28개]
[결과 영역: 필터 줄 + 제품 카드 격자]
[03 설계 도구 — AV System Builder, LED Configurator 카드 2개]
[04 텍스트 목록 — catalog.html · llms.txt 내려받기]
```

- 기존 홈의 큰 문구("찾고, 비교하고, 바로 확인하세요.")는 제목 영역 부제 아래 15px 한 줄 설명으로 줄입니다. 67px 대형 문구는 쓰지 않습니다.
- 기존 오른쪽 "설계 도구 바로가기" 패널은 아래쪽 03 카드로 옮깁니다.

## 2. 부품

| 영역 | 규칙 |
|---|---|
| 검색칸 | 높이 52px 알약, `--pg-field-fill` 배경, 왼쪽 돋보기, 오른쪽 `.pg-btn.pg-primary` "제품 검색". 검색 추천 목록은 글래스 카드 모양 |
| 카테고리 타일 | `--pg-field-fill` 칸, 모서리 16px, 위에 36px 아이콘 타일(`.pg-swatch` 축소판), 이름 14px/700, 개수 12px `--pg-muted`. PC 6열, 1000px 이하 3열, 720px 이하 2열 |
| 제조사 알약 | `.pg-btn` 모양에 글자색 `--pg-ink`, 오른쪽에 개수 작은 알약. 선택 시 `--pg-accent` 배경·흰 글자 |
| 필터 줄 | 제조사·자료 유무·정렬 선택은 알약 모양 선택칸, 카테고리는 `.pg-seg`(많으면 가로 스크롤) |
| 결과 수 | 12px `--pg-muted` "N개 제품" |
| 제품 카드 | 위 흰 사진 칸(높이 150px, `object-fit:contain`, 모서리 위쪽 24px) + 아래 글래스 본문(분류 11px/750 `--pg-accent-2` → 제품명 16px/800 → 제조사 12px `--pg-muted` → 한 줄 요약 12.5px 두 줄 말줄임). PC 4열, 1000px 이하 3열, 720px 이하 2열, 420px 이하 1열 |
| 빈 결과 | 글래스 카드 안 "검색 결과가 없습니다" + `검색 초기화` 알약 |

- 제품 카드의 한 줄 요약은 상세의 `korean`을 씁니다. 4단계 전까지는 기존처럼 상세 JSON에서 읽고, 4단계 뒤에는 검색용 목록 파일에서 읽습니다.
- 상태 배지(`REVIEW REQUIRED`)는 카드에 표시하지 않습니다.

## 3. 검증

1. 홈을 1280px·390px로 캡처하고, 검색어 "HDMI"·제조사 "Shure"·카테고리 "영상"을 각각 적용한 결과 화면도 캡처합니다.
2. `?q=` 주소로 들어왔을 때 검색 결과가 바로 보이는지, 뒤로 가기 뒤 필터 상태가 유지되는지 확인합니다.
3. 콘솔 오류 0, 깨진 카드 사진 0, 390px 가로 스크롤 없음
4. `git diff --stat -- catalog.json catalog.html llms.txt detail/data` 결과가 비어 있어야 합니다.
