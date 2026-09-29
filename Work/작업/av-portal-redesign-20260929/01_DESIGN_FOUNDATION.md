# 1단계 — 디자인 기반 (토큰·글꼴·공통 부품)

- 선행: 없음
- 바꾸는 것: 공통 CSS 파일(새로 만들어 두 화면이 함께 읽음), `fonts/`
- 바꾸지 않는 것: 화면 HTML 구조, JavaScript 동작, 데이터
- 참고: `ref/rtcom-rt-pg-styles.css`, `ref/screens/goal-rtcom-hd-210u.png`

## 1. 공통 CSS 파일

- 새 파일 `shared/pg.css`(이름은 저장소 관례에 맞게 조정 가능)를 만들고, 루트 `index.html`과 `detail/index.html`이 모두 읽게 합니다.
- 이 단계에서는 토큰과 부품 클래스만 정의합니다. 기존 화면에 적용하는 일은 2·3단계에서 합니다.
- 기존 `styles.css`의 `--blue`, `--ink`, `--muted`, `--line` 변수는 2·3단계에서 새 토큰으로 대체합니다.

## 2. 디자인 토큰

값은 그대로 씁니다. 접두어(`--pg-`)는 바꿔도 됩니다.

```css
:root{
  --pg-paper:#EEF1F6; --pg-ink:#1C1C1E; --pg-ink-2:#3A3A3C; --pg-muted:#8A8A8E;
  --pg-line:rgba(60,60,67,.12); --pg-line-2:rgba(60,60,67,.20);
  --pg-accent:#007AFF; --pg-accent-2:#0057D8; --pg-accent-tint:rgba(0,122,255,.12);
  --pg-violet:#5E5CE6; --pg-purple:#BF5AF2; --pg-purple-ink:#8944AB; --pg-purple-tint:rgba(137,68,171,.09);
  --pg-glass-fill:rgba(255,255,255,.62); --pg-glass-stroke:rgba(255,255,255,.7);
  --pg-glass-blur:saturate(180%) blur(30px);
  --pg-field-fill:rgba(118,118,128,.10); --pg-seg-track:rgba(118,118,128,.14);
  --pg-shadow-card:0 1px 2px rgba(20,26,40,.04),0 18px 48px -20px rgba(20,26,40,.28);
  --pg-r-card:24px; --pg-r-inner:16px; --pg-r-pill:980px;
  --pg-sans:"Pretendard Variable",Pretendard,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;
  --pg-sig-hdmi:#007AFF; --pg-sig-dp:#5E5CE6; --pg-sig-sdi:#E08A20;
  --pg-sig-cat:#1E9E52; --pg-sig-fiber:#30B0C7; --pg-sig-quad:#BF5AF2;
  --pg-sig-audio:#FF9500; --pg-sig-control:#8A8A8E; --pg-sig-power:#FF3B30;
}
body{background:var(--pg-paper);color:var(--pg-ink);font-family:var(--pg-sans);font-size:14px;line-height:1.45;
  font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased;color-scheme:light}
```

- `--pg-sig-audio`·`--pg-sig-control`·`--pg-sig-power`는 AV Portal용으로 추가한 값입니다(RTCOM은 영상 제품만 있어 없음).

## 3. 글꼴

- 받을 곳: https://seoulav.github.io/rtcom-configurator/fonts/PretendardVariable.woff2 (약 2MB)
- 라이선스: https://seoulav.github.io/rtcom-configurator/fonts/OFL.txt (SIL Open Font License 1.1)
- 두 파일을 `fonts/`에 넣습니다. 하나라도 받지 못하면 멈추고 보고합니다. 다른 글꼴로 대체하지 않습니다.

```css
@font-face{font-family:"Pretendard Variable";font-weight:45 920;font-style:normal;font-display:swap;
  src:url("../fonts/PretendardVariable.woff2") format("woff2-variations")}
```

## 4. 배경 색 번짐

`filter:blur()`는 쓰지 않습니다(크롬 합성 버그).

```css
.pg-orbs{position:fixed;inset:0;z-index:0;pointer-events:none;
  background:radial-gradient(58vw 58vw at 12% -8%,rgba(0,122,255,.28),transparent 60%),
    radial-gradient(50vw 50vw at 92% 4%,rgba(191,90,242,.22),transparent 60%),
    radial-gradient(60vw 60vw at 78% 96%,rgba(48,209,196,.20),transparent 62%),
    radial-gradient(46vw 46vw at 6% 92%,rgba(255,149,0,.16),transparent 60%)}
.pg-wrap{position:relative;z-index:1;max-width:1180px;margin:0 auto;padding:30px 22px 50px}
@media(max-width:720px){.pg-wrap{padding:18px 16px 40px}}
```

## 5. 공통 부품

| 클래스(예) | 규칙 |
|---|---|
| `.pg-card` 글래스 카드 | `background:var(--pg-glass-fill); backdrop-filter:var(--pg-glass-blur); -webkit-backdrop-filter:var(--pg-glass-blur); border:1px solid var(--pg-glass-stroke); border-radius:var(--pg-r-card); padding:22px; box-shadow:var(--pg-shadow-card); min-width:0` |
| `.pg-card h2` 카드 제목 | 15px/700, `letter-spacing:.04em`, 대문자, `--pg-muted`, 아래 여백 16px |
| `.pg-idx` 카드 번호 | 14px/700, `--pg-accent`. `<h2><span class="pg-idx">01</span>한눈에 보기</h2>` |
| `.pg-note` 제목 보조 설명 | 대문자 변환 없음, 500 굵기. 예: `— 제조사 공식 사진` |
| `.pg-swatch` 아이콘 타일 | 52×52px, 모서리 14px, `linear-gradient(150deg,#0A84FF,#5E5CE6 55%,#BF5AF2)`, `box-shadow:inset 0 0 0 1px rgba(255,255,255,.35),0 8px 20px -6px rgba(10,132,255,.6)`, `::after`로 윗부분 흰 광택(`linear-gradient(180deg,rgba(255,255,255,.28),transparent 46%)`), 안에 흰 선 아이콘 26px |
| `.pg-title h1` 페이지 제목 | 27px/800, `letter-spacing:-.02em`, `line-height:1.1` |
| `.pg-sub` 부제 | 11px, 대문자, `--pg-muted`, 위 여백 3px |
| `.pg-btn` 알약 버튼 | `font:600 13px/1 var(--pg-sans); padding:9px 16px; border-radius:var(--pg-r-pill); background:var(--pg-field-fill); color:var(--pg-accent); border:0; white-space:nowrap` |
| `.pg-btn.pg-primary` 주요 버튼 | `background:var(--pg-accent); color:#fff; box-shadow:0 6px 16px -6px var(--pg-accent)`. 화면당 하나만 |
| `.pg-doc` 문서 버튼 | 알약 하나를 둘로 나눔: 왼쪽 "매뉴얼 PDF"(새 탭), 오른쪽 ↓(내려받기), 사이 `1px solid var(--pg-line-2)`. 누르면 `--pg-seg-track` 배경 |
| `.pg-facts` 핵심 수치 | 2×2 격자, 칸 사이 8px, 칸 배경 `--pg-field-fill`, 모서리 13px, 여백 `10px 12px`. 라벨 11px/600 대문자 `--pg-muted`, 값 18px/800, 단위 12px/600 `--pg-ink-2` |
| `.pg-table` 표 | 감싸는 칸 `border:1px solid var(--pg-line); border-radius:16px; overflow:auto`. `th` 10.5px/700 대문자 `--pg-muted` + `--pg-field-fill` 배경, `td` 12.5px `--pg-ink-2`, 칸 여백 `9px 8px`, 줄 사이 `--pg-line`. 첫 열 `--pg-muted` 600, 폭 34%, 줄바꿈 없음. 값 아래 조건은 11px `--pg-muted` 한 줄 |
| `.pg-checks` 체크 목록 | 항목 사이 9px, 글자 13px/600 `--pg-ink-2`, 앞에 18px 파란 사각(모서리 6px) 안 흰 체크 |
| `.pg-seg` 세그먼트 버튼 | 트랙 `--pg-seg-track`, 안쪽 여백 2px, 모서리 11px. 버튼 13px/600, 여백 `7px 14px`, 모서리 9px. 선택 칸 흰 배경 + `0 3px 8px rgba(0,0,0,.14),0 1px 2px rgba(0,0,0,.10)` |
| `.pg-photo` 사진 칸 | 흰 배경, 모서리 16px, `1px solid rgba(60,60,67,.10)`, 여백 14px, 사진 `object-fit:contain`, 최대 높이 PC 320px·휴대폰 220px |
| `.pg-pill` 작은 표시 | 11px/600, 여백 `3px 10px`, `background:var(--pg-accent-tint); color:var(--pg-accent-2)` |
| `.pg-port` 단자 카드 | 배경 `--pg-field-fill`, 모서리 13px, 여백 `10px 12px`, 글자 12px. 제목 줄 13px/700 앞에 신호 색 점 9px |
| `.pg-state-*` 상태 배지 | 기존 `.state-*` 색은 유지하고 모양만 작은 알약(10.5px/700, 여백 `3px 8px`)으로 |
| `.pg-more` 더 보기 | 12px/600 `--pg-accent`, 배경·테두리 없음 |
| `.pg-details` 접힘 영역 | 글래스 카드 모양의 `<details>`, `summary` 14px/700, 앞에 ▸ 표시 |

- 초점 표시: 모든 버튼·링크에 `outline:2px solid var(--pg-accent); outline-offset:2px`(`:focus-visible`)
- 글자 크기는 휴대폰에서도 11px 아래로 내리지 않습니다.

## 6. 견본 화면

- `shared/pg-sample.html`에 위 부품을 모두 한 번씩 배치한 견본 화면을 만듭니다(배포에 포함해도 되고, 빼도 됩니다. 저장소 관례를 따릅니다).
- 이 견본을 1280px·390px로 캡처해 `ref/screens/goal-rtcom-hd-210u.png`와 나란히 보고합니다.

## 7. 완료 조건

- 두 화면(`index.html`, `detail/index.html`)이 공통 CSS와 글꼴을 읽고, 기존 모습이 깨지지 않습니다(이 단계에서는 거의 그대로여야 합니다).
- 개발자 도구 Network 탭에서 `PretendardVariable.woff2`가 200으로 받아지고, 본문 글꼴이 Pretendard Variable로 표시됩니다.
- 콘솔 오류 0, 390px 가로 스크롤 없음.
