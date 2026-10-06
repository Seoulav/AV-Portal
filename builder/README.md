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
| `src/components/` | 장비 목록, 캔버스·노드, 연결 편집 패널, 상단 막대 |
| `test/` | vitest(상태 저장소·자동 저장·목록 필터) |
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
node cli/validate.mjs examples/small-room.diagram.json examples/auditorium-audio.diagram.json examples/rtcom-extender.diagram.json --library ../beta/.generated/builder-library.json
```

엔진·라이브러리 생성기 테스트는 루트의 `tests/builder-engine.test.mjs`, `tests/builder-library.test.mjs`다. PR에서는 `.github/workflows/builder-ci.yml`이 위 검사와 빌드를 모두 돌린다.

## 사용법

| 하는 일 | 방법 |
|---|---|
| 장비 놓기 | 왼쪽 목록에서 끌어다 놓거나 ＋를 누른다. ＋는 화면 가운데에 놓고, 자리가 차 있으면 오른쪽 옆에 놓는다 |
| 연결 | 단자 점을 잡아 다른 단자로 끈다. 입력에서 시작해도 출력→입력으로 저장된다 |
| 막히는 연결 | 같은 방향, 신호 불일치, 이미 연결된 단자, 같은 장비, 전원선. 끄는 동안 놓을 단자가 빨갛게 표시된다 |
| 케이블 | 연결을 누르면 오른쪽 패널에서 라벨과 케이블(기성: 수량, 제작: 길이)을 넣는다 |
| 메모·영역 | 상단 막대에서 넣고 두 번 눌러 글을 바꾼다. 서식 편집은 P5 |
| 삭제·되돌리기 | Delete 또는 Backspace로 지운다. Ctrl+Z로 되돌리고 Ctrl+Y로 다시 한다. 최근 50단계까지 남는다 |
| 저장 | 브라우저에 자동 저장된다(`localStorage` 키 `av-portal-builder:current`). 파일은 내보내기로 받는다 |
| 열기 | 1.2 파일만 연다. 검증 오류가 있으면 열지 않고 지금 구성도를 그대로 둔다 |

구 Builder 1.1 파일은 열지 않는다. 구 Builder의 데이터는 가져오지 않는다(통합 기획 §0).

## 지킬 규칙

- 구성도 JSON은 구 Builder 1.1과 호환된다. 필드는 추가만 한다.
- 노드 1개는 장비 1대이고, 단자 1개에는 연결 1개다. 분배는 분배기 장비로 그린다.
- 실제 구성도 파일을 저장소에 커밋하지 않는다. `.gitignore`가 `*.diagram.json`을 막고 `examples/`만 허용한다.
