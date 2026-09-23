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

기존 문서는 당시 상태의 기록이다. 그 안의 루트 파일명은 위 위치로 이동했다. `MODEL_ROUTING.md`는 저장소 루트에 있다. 첫 로컬 탐색 앱 소스와 실행 안내는 루트 `app/`과 `README.md`에 있다. `02_사양서.zip`과 최종 `PRODUCT_DATA_SCHEMA.md`는 GitHub 저장소에 없으며, 로컬 자료 수령과 최종 설계 승인은 구분한다.

## 두 채팅을 위한 폴더 설정

이미 복제한 저장소 루트에서 아래 PowerShell 명령을 실행한다. 예시 ID는 실제 작업 ID로 바꾸고, 기존 폴더·브랜치를 덮어쓰지 않는다. 최초 설정은 문서 구조 PR이 main에 병합된 뒤 수행한다.

```powershell
git status --short
git fetch origin
git worktree add ../AV-Portal-Work -b work/W-20260922-002-prepare origin/main
git worktree add ../AV-Portal-Codex -b codex/W-20260922-002-implement origin/main
git worktree list
```

Work 채팅에는 `AV-Portal-Work` 폴더를, Codex 채팅에는 `AV-Portal-Codex` 폴더를 연결한다. 이 예시는 폴더를 준비할 뿐 제품 구현을 승인하지 않는다. 이 예시의 W-20260922-002는 여전히 DRAFT다. Codex는 다른 작업도 최신 main의 READY·승인·선행 조건을 확인한 뒤 시작한다. 해당 명세가 병합된 후 구현 시작 전에 `git fetch origin`과 `git merge origin/main`으로 갱신한다.

웹 Work는 로컬 워크트리에 직접 접근할 수 없다. GitHub 연결의 읽기·쓰기 기능을 확인하고 `work/...` 브랜치에서 문서 PR을 만들도록 한다. 쓰기가 지원되지 않으면 Work가 완성한 명세의 대상 경로와 Markdown 전문을 **Codex에 전달할 하나의 프롬프트**로 사용자에게 제공한다. 사용자는 그 프롬프트만 Codex 채팅에 붙여 넣고, Codex가 별도 기획 브랜치/PR에 반영한다. GitHub 연결만으로 로컬 폴더와 동기화되지는 않는다.

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

## Work ↔ Codex 작업 인계

사용자는 두 채팅 사이에서 파일을 직접 옮기지 않는다. **GitHub 최신 main에 병합된 문서·코드·PR**이 공동 기준이며, 아래 프롬프트만 각 채팅에 전달한다. 로컬 전용 자료는 자동 동기화되지 않는다.

Codex가 구현 작업을 마칠 때는 `Work/지시서.md`에 실제 검증·PR 상태를 남기고 [Work 인계 템플릿](템플릿/Work-인계.md)으로 `Work/기록/<작업ID>-Work-인계.md`를 작성한다. 완료한 기능, 남은 일, Work의 다음 기획 입력, GitHub에서 읽을 수 없는 로컬 자료를 구분한다. 구현 코드·진행 기록·인계 파일을 같은 PR에 포함한다. 병합 후에만 알 수 있는 PR SHA 등은 별도 종료 기록 PR에서 보완할 수 있다. 첫 인계는 [W-20260923-003 → Work](기록/W-20260923-003-Work-인계.md)다.

Work는 최신 main의 `Work/지시서.md`, 마지막으로 **병합된** 구현 PR, 그 작업 ID의 인계 파일을 먼저 읽는다. Work가 준비하는 다음 작업은 새 ID의 DRAFT 명세로 시작한다. 인계 파일의 제안은 구현 승인이나 READY를 뜻하지 않는다. Work가 승인·선행 조건을 확인하고 READY 명세 PR을 main에 병합하면 Codex가 최신 main에서 독립 브랜치로 구현한다. Work가 GitHub 쓰기 기능을 쓸 수 없으면 완성한 명세 전문과 대상 경로를 포함한 Codex용 프롬프트 하나를 사용자에게 제공하고, Codex가 별도 기획 PR에 반영한다.

### Work 채팅에 전달할 프롬프트

> Seoulav/AV-Portal의 최신 main과 열린 PR을 확인해 주세요. `AGENTS.md`, `Work/README.md`, `Work/지시서.md`, 마지막으로 병합된 Codex 구현 PR 및 해당 `Work/기록/<작업ID>-Work-인계.md`를 읽고, 다음 한 작업을 새 ID의 DRAFT 명세로 준비해 주세요. 현재 실행 중인 명세와 지시서는 수정하지 마세요. 로컬 전용 hkkim/·outputs/ 자료는 GitHub에서 읽을 수 있다고 가정하지 말고, 필요한 구조·근거가 없으면 확보 방법을 명세에 적어 주세요. 사용자 승인과 선행 조건이 확인된 작업만 READY로 바꿔 별도 work/ 브랜치 PR로 main에 병합해 주세요. 완료 보고에는 명세 경로, PR 상태, Codex가 바로 착수할 수 있는지, 사용자에게 정말 필요한 결정이나 자료만 명확히 적어 주세요. GitHub에 쓸 수 없으면 완성한 명세 Markdown 전문과 대상 경로를 포함한 Codex 전달용 프롬프트 하나를 작성해 주세요.

### Codex 채팅에 전달할 프롬프트

> 다음 작업 진행해줘. 최신 main의 AGENTS.md, Work/지시서.md, Work/작업/ 명세와 열린 PR을 대조해 내가 승인했고 선행 조건을 충족한 READY 작업을 직접 찾아줘. 별도 codex/ 브랜치·워크트리에서 구현·검증하고 코드, 실제 진행 기록, `Work/기록/<작업ID>-Work-인계.md`를 같은 PR에 포함해줘. 병합 권한과 저장소 규칙에 따라 PR을 처리하고, 병합 결과와 다음 Work 작업에 필요한 인계 내용을 명확히 보고해줘. 로컬 전용 자료와 비공개 원본은 GitHub에 올리지 마.

사용자가 추가 요구나 승인 범위를 바꾸고 싶으면 해당 프롬프트 뒤에 한 문장으로 덧붙인다. 프롬프트 전달만으로 예약 실행·지속 감시를 만들지 않는다.
