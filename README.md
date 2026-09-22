# AV-Portal

서울영상테크의 AV Equipment Library / RTCOM Configurator 기반 AV Portal 프로젝트입니다. 현재 저장소는 기획·설계 문서를 관리하며 애플리케이션 코드는 아직 없습니다.

## 시작하기

- 모든 작업의 공통 규칙: [AGENTS.md](AGENTS.md)
- Work와 Codex의 병렬 작업 설정: [Work/README.md](Work/README.md)
- Codex 작업 현황과 인계: [Work/지시서.md](Work/지시서.md)
- 기존 프로젝트 현황: [WORK_HANDOFF.md](Work/기획/WORK_HANDOFF.md)
- 모델 운영 정책: [MODEL_ROUTING.md](MODEL_ROUTING.md)

## 폴더 구성

```text
AGENTS.md                  공동 작업 규칙
MODEL_ROUTING.md           모델 운영 정책
Work/
  README.md                사용 방법·브랜치·워크트리 설정
  지시서.md                Codex 실행 체크리스트·결과·인계
  기획/                    기존 조사·요구사항·설계 자료
  작업/                    Work가 작성하는 작업별 명세
  템플릿/                  다음 작업 작성 양식
  기록/                    감사 기록·협업 구성 기록
```

기존 루트의 기획 문서 9개는 `Work/기획/`으로, `audit.md`는 `Work/기록/`으로 이동했습니다. 과거 문서 안의 파일명만 있는 참조는 [기획 문서 목록](Work/README.md)을 통해 찾습니다. 향후 코드는 승인된 기술 설계에 맞춰 추가합니다.
