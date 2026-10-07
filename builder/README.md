# AV System Builder (AV Portal)

AV Portal 장비 데이터로 구성도 JSON 1.2를 만드는 화면이다. 방향과 범위는 [통합 재구축 기획](../Work/기획/시스템빌더통합기획-2026-10-06.md), 작업 흐름은 [Builder 작업 흐름](../Work/빌더/README.md)을 따른다.

- 공개 주소: `https://seoulav.github.io/AV-Portal/builder/`
- 아직 Portal 메뉴에 연결하지 않았다. 구 Builder 수준이 되는 P5 뒤에 기존 링크와 바꾼다(B-20261006-04 결정 G-b).
- 가격·견적은 범위 밖이다. 견적 쪽은 이 앱이 내보내는 JSON만 읽는다([예제와 안내](examples/README.md)).

## 구조

| 위치 | 내용 |
|---|---|
| `engine/` | 구성도 엔진(의존성 없는 ESM). 연결 규칙·직렬화·검증. 앱과 CLI가 함께 쓴다 |
| `schema/diagram-1.2.schema.json` | 구성도 JSON 1.2 형식 정의 |
| `cli/validate.mjs` | 구성도 파일 검증 CLI |
| `examples/` | 예제 구성도 3종과 견적 담당자용 안내 |
| `src/engine.ts` | 엔진에 TypeScript 타입을 붙여 다시 내보낸다. 규칙을 앱에 따로 두지 않는다 |
| `src/state/` | 상태 저장소(zustand), 자동 저장 |
| `src/proximity.ts` | 근접 연결: 선을 놓은 곳에서 붙을 단자를 고른다. 좌표는 엔진 `geometry.portAnchors` |
| `src/components/` | 장비 목록, 캔버스·노드, 연결 미리보기, 연결 편집 패널, 이슈 패널, 상단 막대 |
| `test/` | vitest(상태 저장소·자동 저장·근접 연결·케이블 검사·목록 필터) |
| `e2e/` | Playwright 브라우저 시험과 합성 라이브러리 픽스처 |
| `scripts/check-schema.mjs` | ajv로 스키마를 컴파일하고 예제·깨진 사본을 검사한다 |

장비 목록은 같은 출처의 `../builder-library.json`을 읽는다. 이 파일은 Pages 배포 때 `beta/build-builder-library.mjs`가 만들고 저장소에는 커밋하지 않는다.

## 실행

Node.js 24를 쓴다(CI와 같은 버전). npm 의존성은 이 폴더에만 있다(루트는 의존성 0개).

```powershell
cd builder
npm ci
npm run dev        # 라이브러리를 beta/.generated/에 만들고 개발 서버를 연다
npm run build      # dist/에 빌드(소스맵 없음)
npm run preview    # 라이브러리를 만들고 빌드 결과를 연다
```

개발·미리보기 서버는 `/AV-Portal/builder-library.json` 요청에 로컬 생성본(`beta/.generated/builder-library.json`)을 내준다. 주소는 `http://localhost:5173/AV-Portal/builder/`(미리보기는 4173)다.

## 테스트

```powershell
npm run typecheck
npm test
npm run check:schema
npm run build; npm run e2e   # 빌드한 앱을 Chrome으로 연다(합성 라이브러리)
node cli/validate.mjs examples/small-room.diagram.json examples/auditorium-audio.diagram.json examples/rtcom-extender.diagram.json --library ../beta/.generated/builder-library.json
```

엔진·라이브러리 생성기 테스트는 루트의 `tests/builder-engine.test.mjs`, `tests/builder-library.test.mjs`다. PR에서는 `.github/workflows/builder-ci.yml`이 위 검사와 빌드, 브라우저 시험을 모두 돌린다. 브라우저 시험은 Pages 배포에는 넣지 않는다(B-20261006-05 결정 H-b).

브라우저 시험은 설치된 Chrome을 쓴다(`PW_CHANNEL`로 바꿀 수 있다). `vite preview`를 4319번 포트로 띄우며, 이미 떠 있으면 그 서버를 쓴다(CI 제외).

## 사용법

| 하는 일 | 방법 |
|---|---|
| 장비 놓기 | 왼쪽 목록에서 끌어다 놓거나 ＋를 누른다. ＋는 화면 가운데에 놓고, 자리가 차 있으면 오른쪽 옆에 놓는다 |
| 연결 | 단자 행 어디서든(점이 아니어도) 끌기 시작해 다른 단자 행에 놓는다. 입력에서 시작해도 출력→입력으로 저장된다 |
| 근접 연결 | 단자 행 밖에 놓아도 화면 기준 40px 안의 연결 가능한 빈 단자 중 가장 가까운 것에 붙는다. 다른 장비 위(헤더 등)에 놓으면 그 장비에서 가장 가까운 연결 가능 단자에 붙는다. 끄는 동안 붙을 단자에 고리가 보인다 |
| 막히는 연결 | 같은 방향, 신호 불일치, 이미 연결된 단자, 같은 장비, 전원선. 이미 쓴 단자와 막힌 단자는 건너뛴다. 가까운 단자가 모두 막혔으면 선이 붉은 점선이 되고, 놓으면 막힌 이유를 알린다. 캔버스 밖에서 놓으면 취소다 |
| 장비 옮기기 | 헤더나 사진을 잡고 끈다. 단자 행은 선 긋기 영역이다 |
| 범위 선택 | 빈 캔버스에서 왼쪽 드래그. 장비·메모는 걸치기만 해도 고르고, 영역은 사각형 안에 다 들어와야 고른다. 고른 장비들은 그중 하나의 헤더를 끌어 함께 옮긴다 |
| 화면 이동 | 가운데 버튼 드래그, 또는 Space를 누른 채 왼쪽 드래그. 확대·축소는 휠 |
| 이슈 | 연결을 하나 고르지 않았을 때 오른쪽에 이슈 목록이 보인다. 내보낸 파일의 `issues`와 같다. 누르면 그 장비·연결로 화면을 옮긴다 |
| 케이블 | 연결을 누르면 오른쪽 패널에서 라벨과 케이블을 넣는다. 제품명은 꼭 넣고, 기성은 1 이상의 정수 수량, 제작은 0보다 큰 길이(m)를 넣는다. 맞지 않으면 저장하지 않고 알린다. 검증 CLI도 같은 규칙으로 막는다(`bom-row-invalid`) |
| 메모·영역 | 상단 막대에서 넣고 두 번 눌러 글을 바꾼다. 서식 편집은 P5 |
| 삭제·되돌리기 | 장비나 연결을 고르고 Delete 또는 Backspace로 지운다. 장비를 지우면 붙은 연결도 함께 지워지고, 실행 취소 한 번에 모두 돌아온다. Ctrl+Z로 되돌리고 Ctrl+Y로 다시 한다. 끌기·방향키 이동·열기·새 구성도도 되돌릴 수 있고, 최근 50단계까지 남는다 |
| 저장 | 브라우저에 자동 저장된다(`localStorage` 키 `av-portal-builder:current`). 파일은 내보내기로 받는다. 저장본이 검증에 걸려 불러오지 못하면 원문을 `av-portal-builder:rejected`에 옮겨 두고 알린다 |
| 열기 | 1.2 파일만 연다. 검증 오류가 있으면 열지 않고 지금 구성도를 그대로 둔다 |

구 Builder 1.1 파일은 열지 않는다. 구 Builder의 데이터는 가져오지 않는다(통합 기획 §0).

## 지킬 규칙

- 구성도 JSON은 구 Builder 1.1과 호환된다. 필드는 추가만 한다.
- 노드 1개는 장비 1대이고, 단자 1개에는 연결 1개다. 분배는 분배기 장비로 그린다.
- 실제 구성도 파일을 저장소에 커밋하지 않는다. `.gitignore`가 `*.diagram.json`을 막고 `examples/`만 허용한다.
