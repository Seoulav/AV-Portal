# Changelog — AV System Builder (AV Portal)

## [v0.1.0] — 2026-10-07

[B-20261006-04](../Work/빌더/작업/B-20261006-04.md). P4의 1차로 화면 골격을 만들었다.

### Added
- Builder 앱(React 19, `@xyflow/react` 12, zustand 5, Vite, TypeScript). 배포 주소는 `/AV-Portal/builder/`다
- 장비 목록
  - `builder-library.json`을 분류별로 묶어 보여 주고 검색한다
  - TX/RX·시리즈 모델은 단위별 항목으로 나온다
  - 단자 없음·확인 필요 배지를 단다
- 캔버스
  - 장비 노드는 엔진 `geometry`의 치수와 1.1 핸들 규칙을 따른다
  - 연결 가능 여부는 엔진 `judgeConnection`이 판정하고 연결은 `connectPorts`가 만든다. 입력에서 끌어도 출력→입력으로 저장된다
  - 막힌 연결은 놓을 단자를 빨갛게 표시하고, 놓으면 이유를 알린다
  - 메모·영역 노드를 두고, 두 번 눌러 글을 바꾼다
- 연결 편집 패널: 라벨, 케이블(`bomRows`: 기성·제작, 제품명, 길이·수량). 라벨과 케이블은 한 번의 실행 취소 단위로 저장한다. 제품명이 없거나 수량·길이가 맞지 않으면 저장하지 않는다
- 상단 막대: 새 구성도, 열기(검증 후), 내보내기(JSON 1.2), 실행 취소·다시 실행(50단계)
- 브라우저 자동 저장(`av-portal-builder:current`). 열 때 검증하고, 오류가 있으면 불러오지 않고 원문을 `av-portal-builder:rejected`에 보관한다. 라이브러리를 읽기 전에는 편집 버튼을 막는다
- 장비 삭제는 붙은 연결과 함께 실행 취소 한 번에 돌아온다. 방향키 이동, 열기·새 구성도(파일 전체)도 되돌린다
- vitest 14건(상태 저장소, 자동 저장, 케이블 검사, 목록 필터), ajv 스키마 검사(`npm run check:schema`)
- `.github/workflows/builder-ci.yml`: PR에서 라이브러리 생성, 엔진 테스트, 타입 검사, vitest, 스키마 검사, 빌드, 예제 검증을 돌린다
- Pages 배포에서 Builder를 빌드해 `beta/site/builder/`로 함께 올린다
