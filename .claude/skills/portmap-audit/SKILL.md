---
name: portmap-audit
description: AV Portal 제품 상세의 Port Map(사진 위 단자 번호·괄호선)이 실제 단자를 정확히 가리키고 덮는지 사진으로 대조하고, 틀린 좌표를 고치고, 점검표에 남긴다. Port Map을 새로 만들었거나 고쳤을 때, 사진을 바꿨을 때, "단자 번호가 안 맞는다"는 지적을 받았을 때, 전수 점검을 돌릴 때 쓴다.
---

# Port Map 위치 점검 (`portmap-audit`)

AV Portal 상세 페이지의 **02 Port Map**은 제품 사진 위에 괄호선을 긋고 여백의 번호로 지시선을 잇는다. 지금 자동 검사(`beta/site/detail/detail-enhancements.mjs`의 `validMarker`·`validMap`)는 **경계 안·구간 방향·번호 중복**만 본다. **괄호선이 실제 단자 위에 있는지는 사람이 사진을 열어 봐야만 안다.** 이 스킬은 그 확인을 매번 같은 방법으로 하게 만든다.

처음 만든 작업: [W-20261012-001](../../../Work/작업/W-20261012-001.md) · 계획: [전수 점검 계획](../../../Work/기획/포트맵·주요기능전수점검계획-2026-10-12.md)

## 0. 시작 전에

1. `git fetch origin` 후 최신 `origin/main` 기준 브랜치인지 확인한다.
2. **같은 제품 파일을 고치는 열린 PR**이 있는지 본다: `gh pr list --state open` → 각 PR의 `beta/site/detail/data/*.json`. 겹치는 제품은 **판정만 하고 수정은 그 PR 병합 뒤**에 한다.
3. `Work/지시서.md`의 진행 중 작업과 공유 작업노트(`git rev-parse --path-format=absolute --git-common-dir`/`agent-notes.md`) 끝부분을 읽는다.
4. 대상 목록을 만든다.
   ```
   python scripts/portmap-audit.py --list            # portMap 있는 제품·표식 수·사진 파일
   ```

## 1. 데이터가 그림이 되는 방식 — 이것을 알아야 판정할 수 있다

`portMap`은 `beta/site/detail/data/<slug>.json` 안에 있다. 렌더러 원본은 `prototype/brc-am7/detail-enhancement-view.mjs`의 `portMapGeometry`·`renderPortMap`이고 `beta/site/detail/`에 그대로 복사된다(`beta/detail-asset-transforms.mjs`).

```json
"portMap": {
  "image": "Rear",                                   // images[] 중 이 role의 사진 위에 그린다 (Front·Rear·Diagram)
  "measuredImage": { "file": "blu-101-rear.webp", "width": 4096, "height": 410 },
  "crop": { "top": 120, "bottom": 100 },             // 선택. 사진 위아래를 잘라 보여 준다
  "items": [
    { "n": 1, "label": "아날로그 입력 A · 1–4", "desc": "…", "x1": 3638, "x2": 4050, "y": 295, "side": "bottom" },
    { "n": 4, "label": "HDMI IN 1", "desc": "…", "y1": 412, "y2": 455, "side": "left" }
  ]
}
```

**좌표는 모두 `measuredImage`의 원본 픽셀**이다. 화면 크기와 상관없다.

| `side` | 괄호선 | 지시선·번호 | 판정에 쓰는 좌표 |
|---|---|---|---|
| `top` | `x1`~`x2` 가로 괄호, 높이 `y`, 다리가 아래로 8px | `y`에서 사진 **위** 여백의 번호로 | 구간 `x1`~`x2`, 높이 `y` |
| `bottom` | `x1`~`x2` 가로 괄호, 높이 `y`, 다리가 위로 8px | `y`에서 사진 **아래** 여백의 번호로 | 구간 `x1`~`x2`, 높이 `y` |
| `left`/`right` | `y1`~`y2` 세로 괄호, 가로 위치 `x`(없으면 사진 왼쪽/오른쪽 끝) | 바깥 여백의 번호로 | 구간 `y1`~`y2` (삼성 도면 13종이 이 방식, `x`는 현재 모두 비어 있음) |

알아 둘 렌더러 동작:

- **`y`가 없으면** 괄호선이 사진 가장자리에 붙는다. 현재 위아래 변 표식은 전부 `y`가 있다.
- **촘촘한 번호는 여러 줄(`lane`)로 쌓인다.** 번호 중심이 22px 안이면 다음 줄로 간다. 번호끼리 겹치지 않으니 **결함이 아니다.**
- `crop`이 있으면 `y`(좌우 변은 `y1`·`y2`)가 잘린 범위 안이어야 한다. 밖이면 검사(`validMap`)가 지도를 버린다.
- 사진 파일이 바뀌어 크기가 달라지면 `measuredImage`와 `images[].resolution`이 어긋나 지도가 사라진다. 사진 교체 작업이면 **모든 좌표를 다시 잰다.**

## 2. 도구 — `scripts/portmap-audit.py`

> 도구는 W-20261012-001 구현에서 만든다. 아래가 그 사양이다. Pillow(`python -c "import PIL"`)만 쓴다.

```
python scripts/portmap-audit.py --list
python scripts/portmap-audit.py <slug> [<slug> …]   # 제품 지정
python scripts/portmap-audit.py --all               # portMap 있는 전 제품
python scripts/portmap-audit.py --manufacturer Crown
python scripts/portmap-audit.py <slug> --lint-only  # 숫자 검사만
```

출력은 `.portmap-audit/<slug>/`(커밋하지 않음, `.gitignore`)에 만든다.

| 파일 | 내용 | 용도 |
|---|---|---|
| `overview.png` | 원본 사진(가로 최대 2000px로 축소) 위에 모든 표식을 **렌더러와 같은 모양**으로: 구간은 반투명 파란 띠(높이 = 사진 높이의 6% 또는 최소 12px, 중심 `y`), 괄호선 `#007AFF`, 번호 원. `crop` 바깥은 회색 덮개 | 전체 배치·순서·빠진 단자 확인 |
| `m<n>.png` | 표식 하나 확대. 구간 좌우로 **구간 폭만큼**, 위아래로 **구간 폭의 0.8배(최소 사진 높이의 15%)** 여유를 두고 원본 해상도로 잘라 가로 600px로 맞춤. 구간 경계 세로선 2개 + 높이 `y` 가로선 + 위에 `n · label` 글자 | 경계·높이 판정 |
| `sheet.png` | `m*.png`를 번호순으로 한 장에 모음(3열) | 한 번에 훑기 |
| `lint.json` | 숫자 검사 결과 | 아래 표 |

숫자 검사(`lint.json`) — **보조 신호일 뿐 판정이 아니다.**

| 코드 | 조건 | 흔한 원인 |
|---|---|---|
| `OUT_OF_IMAGE` | 좌표가 `measuredImage` 밖 | 사진 교체 |
| `OUT_OF_CROP` | `y`가 `crop` 범위 밖 | crop 수정 |
| `INVERTED`·`ZERO_WIDTH` | `x2 <= x1` / `y2 <= y1` | 입력 실수 |
| `SAME_COORD` | 같은 변에서 구간이 글자 그대로 같고 `y`도 같음 | 복사 실수. `y`가 다르면 위아래 두 줄 단자일 수 있음 → `STACKED` |
| `STACKED` | 같은 구간, 다른 `y` | `ki-pro-go2`·`vs10`처럼 2단 단자. 사진으로 확인 |
| `OVERLAP` | 같은 변·같은 높이(±사진 높이 3%)에서 구간이 겹침 | 이웃 단자를 덮음 |
| `SHARED_WITH` | 다른 제품과 좌표가 통째로 같음 | 형제 모델 공유(삼성 QMC·QHC). 한 제품의 오류가 여럿에 퍼짐 → **같이 본다** |

## 3. 판정 — 표식마다 이 순서로

`overview.png`를 먼저 보고 전체 순서·빠진 단자를 확인한 뒤, `m<n>.png`를 하나씩 본다. **반드시 이미지를 직접 연다(Read 도구로 png를 읽는다).** 숫자만 보고 OK를 주지 않는다.

| # | 질문 | 아니면 |
|---|---|---|
| 1 | **정체** — 구간 안의 물체가 `label`·`desc`가 말하는 단자 종류인가? (패널 인쇄 글자가 보이면 글자로 대조) | **확인 요청** |
| 2 | **개수** — `label`이 묶음(`1–4`, `A–D`)이면 구간 안 단자 수가 그 수와 같은가? 단일이면 1개인가? | 개수가 라벨과 다르면 **확인 요청**, 구간만 모자라거나 넘치면 **좌표 수정** |
| 3 | **덮는 범위** — 구간 양 끝이 단자(묶음이면 첫 단자와 끝 단자)의 바깥 테두리와 맞는가? | **좌표 수정** |
| 4 | **가리키기** — 높이 `y`가 단자 몸체 위인가? (좌우 변은 `y1`~`y2`가 단자 높이 범위) | **좌표 수정** |
| 5 | **이웃** — 구간이 이웃 단자의 몸체를 침범하지 않는가? | **좌표 수정** |

### 허용 오차

- 구간 끝과 단자 테두리의 차이가 **min(단자 폭 × 15%, 이웃 단자와의 간격 ÷ 2)** 안이면 맞는 것으로 본다.
- 높이 `y`는 단자 몸체(커넥터 하우징)의 **위아래 테두리 사이**면 맞다. 인쇄 라벨 글자 위는 몸체 밖이다.
- 단자 테두리를 정할 때는 **커넥터 하우징(금속 셸·플라스틱 몸체)** 기준이다. 나사 구멍·라벨 인쇄·패널 홈은 넣지 않는다. 피닉스(Combicon) 단자는 블록 전체 폭.
- 위아래 두 줄로 쌓인 단자: 같은 가로 구간이 정상이다. **`y`가 각자의 줄을 가리키면 OK.** 같은 `y`면 한쪽이 틀린 것이다.

### 판정 값

| 판정 | 뜻 | 처리 |
|---|---|---|
| `OK` | 1~5 모두 맞음 | 없음 |
| `좌표 수정` | 정체·개수는 맞고 3~5 중 하나가 틀림 | §4대로 고침 |
| `확인 요청` | 1 또는 2가 틀림, 또는 사진에 해당 단자가 안 보임 | **고치지 않는다.** 점검표에 이유와 무엇을 봤는지 적고 사용자에게 모아서 보고 |
| `판정 불가` | 해상도·각도·그림자로 테두리를 못 읽음 | 사유 기록. 더 나은 사진은 별도 작업 |

**추측 금지**(AGENTS.md). 사진에서 단자 이름이 안 읽히면 `label`이 맞다고도 틀리다고도 하지 않는다 — 1번은 「형상 일치(글자 미확인)」로 적고 3~5만 판정한다.

## 4. 고치기

**바꾸는 필드는 좌표뿐이다.** 위아래 변은 `x1`·`x2`·`y`, 좌우 변은 `y1`·`y2`(필요하면 `x`).

**바꾸지 않는다:** `n`·`label`·`desc`·`side`·`image`·`measuredImage`·`crop`, 사진 파일, 렌더러·검증기. 이것들이 틀렸으면 `확인 요청`으로 올리고 별도 작업으로 한다.

1. `m<n>.png`에서 단자 테두리의 **원본 픽셀 좌표**를 읽는다. 확대 조각에는 원본 좌표 눈금(구간 경계·`y` 값)이 찍혀 있다. 필요하면 `--zoom <n> --pad <px>`로 더 크게 자른다.
2. 정수로 적는다(기존 데이터가 정수다).
3. **형제 모델이 좌표를 공유하면**(`SHARED_WITH`) 사진이 정말 같은지 먼저 확인한다. 사진 크기·배치가 같을 때만 같은 값을 모두에 넣는다.
4. 고친 뒤 도구를 다시 돌려 `m<n>.png`로 OK를 확인한다. **고친 전후 그림을 둘 다 남긴다**(`.portmap-audit/<slug>/before/`).
5. JSON 서식은 기존과 같게(2칸 들여쓰기, 끝 줄바꿈, LF) 유지한다. `node -e` 로 읽고 쓰면 키 순서가 유지된다.

## 5. 테스트와 생성물

좌표를 바꾸면 다음이 깨질 수 있다. **깨진 테스트를 지우거나 기대값을 대충 맞추지 않는다.**

| 깨지는 곳 | 처리 |
|---|---|
| 좌표를 값으로 고정한 현재 테스트 (`tests/bss-port-map-alignment`, `crown-portmap`, `netgear-port-maps`, `amx-photos-portmap`, `shure-port-maps`, `samsung-qmc-qhc-portmap`, `samsung-115-port-map`, `remaining-port-maps`, `port-map-*` 등) | 새 좌표로 갱신. 갱신 이유(작업 ID)를 주석으로 |
| 과거 시점 파일 해시를 비교하는 테스트 (`tests/*-history.mjs`를 쓰는 것들) | **되감기 모듈**을 추가한다 → [과거 해시 테스트 대응](references/과거해시테스트.md) |
| `beta/site/search-index.json` | `node beta/build-search-index.mjs` 후 `--check` |

`beta/public-snapshot.json`은 좌표를 담지 않는다(제품 수·필드 개수만). 좌표만 바꿨다면 재생성할 필요가 없다 — `node beta/update-snapshot.mjs` 후 diff가 없는지만 본다.

## 6. 기록 — 점검표

`Work/기록/<작업ID>-점검표.md`에 [점검표 양식](references/점검표양식.md)대로 적는다. **모든 표식에 판정이 있어야 한다**(빈 칸 없음). 좌표 수정은 전후 값을, 확인 요청은 무엇을 봤는지를 적는다.

## 7. 검증

```
python scripts/portmap-audit.py --all --lint-only   # 새 OUT_* · INVERTED · SAME_COORD 0건
npm test
node beta/build-search-index.mjs --check
node beta/verify-pages.mjs
git diff --check origin/main...HEAD
```

`npm test`는 Windows에서 RTCOM 테스트가 `EPERM`으로 간헐 실패한 기록이 있다(W-20261006-002). 그 1건이면 다시 돌려 확인하고 결과를 그대로 적는다.

병합·배포 뒤 공개 페이지(`https://seoulav.github.io/AV-Portal/detail/?product=<slug>`, `beta/site/detail/app.js:33`)에서 고친 제품 몇 종을 1280px·390px로 열어 괄호선이 단자 위에 있는지 본다.

## 8. 하위 에이전트에게 나눌 때

- 제조사 묶음 단위로 나눈다. 형제 모델(같은 사진 배치)은 한 에이전트에 몰아준다.
- 에이전트에게 이 스킬 경로, 대상 slug 목록, **판정만 하고 JSON은 고치지 말 것**, 점검표 행 형식을 준다. 수정은 판정을 모아 한 곳에서 한다(같은 파일 동시 수정 방지).
- 좌표 판정은 **높은 추론 강도**로 한다(사람 눈이어야 잡히는 일, [모델·추론 강도 기준](../../../Work/기획/모델추론강도기준-2026-10-05.md)).
- 수정한 표식은 다른 에이전트가 전후 그림으로 **독립 재확인**한다.
