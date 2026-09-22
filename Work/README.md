# Work와 Codex 사용 안내

이 폴더에 작업 준비 문서와 구현 인계 기록을 보관한다. 우선 [AGENTS.md](../AGENTS.md)를 따른다.

## 기획 문서 목록

- [프로젝트 개요](기획/AV_PLATFORM_PROJECT_BRIEF.md)
- [기존 시스템 분석](기획/EXISTING_SYSTEM_ASSESSMENT.md)
- [핵심 도메인 개념](기획/CORE_DOMAIN_CONCEPTS.md)
- [Portal MVP](기획/PORTAL_MVP_SPEC.md)
- [UI/UX](기획/UI_UX_SPEC.md)
- [제품 분류](기획/PRODUCT_TAXONOMY.md)
- [데이터 스키마 초안](기획/PRODUCT_DATA_SCHEMA_SKELETON.md)
- [RTCOM 자료 준비](기획/RTCOM_DATA_PREPARATION.md)
- [기존 인계와 보류 조건](기획/WORK_HANDOFF.md)
- [기존 감사 기록 양식](기록/audit.md)

기존 문서는 당시 상태의 기록이다. 그 안의 루트 파일명은 위 위치로 이동했다. `MODEL_ROUTING.md`는 저장소 루트에 있다. `02_사양서.zip`, 최종 `PRODUCT_DATA_SCHEMA.md`, 앱 소스는 현재 저장소에 없으므로 확보된 것으로 간주하지 않는다.

## 두 채팅을 위한 폴더 설정

이미 복제한 저장소 루트에서 아래 PowerShell 명령을 실행한다. 예시 ID는 실제 작업 ID로 바꾸고, 기존 폴더·브랜치를 덮어쓰지 않는다. 최초 설정은 문서 구조 PR이 main에 병합된 뒤 수행한다.

```powershell
git status --short
git fetch origin
git worktree add ../AV-Portal-Work -b work/W-20260922-002-prepare origin/main
git worktree add ../AV-Portal-Codex -b codex/W-20260922-002-implement origin/main
git worktree list
```

Work 채팅에는 `AV-Portal-Work` 폴더를, Codex 채팅에는 `AV-Portal-Codex` 폴더를 연결한다. 이 예시는 폴더를 준비할 뿐 제품 구현을 승인하지 않는다. 현재 W-20260922-002는 DRAFT이므로 Codex는 READY와 필요한 승인까지 기다린다. 해당 명세가 병합된 후 구현 시작 전에 `git fetch origin`과 `git merge origin/main`으로 갱신한다.

웹 Work는 로컬 워크트리에 직접 접근할 수 없다. GitHub 연결의 읽기·쓰기 기능을 확인하고 `work/...` 브랜치에서 문서 PR을 만들도록 한다. 쓰기가 지원되지 않으면 Work가 작성한 문서와 대상 경로를 전달받아 Codex가 **별도 기획 브랜치/PR**에 반영한다. GitHub 연결만으로 로컬 폴더와 동기화되지는 않는다.

Codex 앱의 Worktree 기능을 사용할 때도 각 작업의 시작 브랜치와 작업 폴더를 확인한다. detached HEAD로 시작했다면 push/PR 전에 `codex/<작업ID>-<설명>` 브랜치를 만든다.

## 반복 작업

1. Work가 [현재 지시서](지시서.md)와 병합된 구현 PR을 읽는다.
2. [템플릿](템플릿/작업지시서.md)을 `작업/<새ID>.md`로 복사하고 실제 내용을 채운다.
3. 승인과 선행 조건을 충족하면 READY 명세를 기획 PR로 병합한다.
4. Codex가 최신 main에서 해당 ID를 구현하며 지시서에 체크와 근거를 남긴다.
5. 동시에 Work는 **다른 ID 파일**에서 다음 계획을 작성한다. 구현 중인 명세를 고치지 않는다.
6. Codex PR 병합 후 Work는 실제 결과를 다음 계획에 반영한다.

작업 도중 공유할 진척은 커밋·push하고 상대에게 브랜치·커밋 SHA 또는 PR URL을 전달한다. Work는 구현 브랜치를 자신의 폴더에 체크아웃하지 않고 `git show <SHA>:Work/지시서.md` 또는 GitHub에서 읽는다. SHA를 사용하면 어떤 시점의 정보를 읽었는지 추적할 수 있다.

병합 전 자신의 브랜치에서 다음을 실행한다. 변경 파일이 있으면 먼저 자신의 작업을 커밋한다.

```powershell
git fetch origin
git merge origin/main
git diff --check origin/main...HEAD
```

이후 변경 범위에 맞는 검증과 필수 CI·리뷰를 확인한다. 오래 유지한 역할 브랜치를 계속 재사용하기보다, 종료된 작업 다음에는 최신 main에서 새 작업 ID의 브랜치를 만든다.

## 채팅 시작 문구

**Work**

> AGENTS.md와 Work/지시서.md, 병합된 구현 PR을 읽어줘. Work/작업/에 다음 작업을 새 ID로 작성해줘. 현재 구현 중인 명세와 지시서는 수정하지 말고, 의존 결과가 아직 병합되지 않았다면 DRAFT로 유지해줘. 기획 문서만 별도 work/ 브랜치와 PR로 관리해줘.

**Codex**

> AGENTS.md와 Work/지시서.md를 읽고 내가 지정한 READY 작업을 확인해줘. 명세의 승인·선행 조건을 충족한 범위에서 별도 codex/ 브랜치와 워크트리로 구현해줘. 지시서에 실제 수행 항목을 체크하고 검증 결과·장애·후속 사항을 기록해줘. 코드와 진행 기록을 같은 PR에 넣어줘.
