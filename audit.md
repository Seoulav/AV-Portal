# AI-DLC Audit Log — 

<!--
작성 가이드
- 제목의 대시(—) 뒤에 프로젝트명을 입력합니다.
- 아래 "Audit Entry Template"을 작업 이벤트마다 복사해 시간순으로 추가합니다.
- 결정, 승인, 변경, 검증 결과처럼 추적 가치가 있는 사실만 기록합니다.
- 비밀번호, 접근 토큰, 주민등록번호 등 민감정보는 기록하지 않습니다.
- 확정되지 않은 정보는 사실처럼 쓰지 말고 "확인 필요"로 표시합니다.
- Timestamp는 ISO 8601 형식(예: YYYY-MM-DDThh:mm:ssZ)을 권장합니다.
- 해당하지 않는 항목은 삭제하지 말고 N/A와 사유를 적으면 추적하기 쉽습니다.
-->

## Initial User Request

**Timestamp**: 

**User Input**: 

**AI Response**: 

**Context**: 

<!--
작성 가이드
- Timestamp: 최초 요청을 받은 시각
- User Input: 요청의 핵심 목적, 범위, 제약사항을 요약
- AI Response: 최초 분석, 착수한 작업, 생성한 문서를 요약
- Context: 시작 단계와 당시 상태를 기록
-->

---

## Audit Entry Template

<!-- 이 절 전체를 복사한 뒤 실제 단계명이나 이벤트명으로 제목을 바꾸세요. -->

### 

**Timestamp**: 

**User Input**: 

**AI Response**: 

**Context**: 

**Decision**: 

**Artifacts**: 

**Approval Status**: 

**Verification**: 

**Open Items**: 

**Compliance**: 

<!--
항목별 작성 가이드
- 제목: 단계 또는 사건을 짧고 고유하게 작성
- User Input: 사용자가 제공한 요구, 답변, 승인 또는 변경 요청
- AI Response: 수행 내용과 결과를 객관적으로 요약
- Context: 현재 단계, 이전 단계와의 관계, 작업 상태
- Decision: 확정된 선택과 근거. 결정이 없으면 N/A
- Artifacts: 생성·수정한 문서나 코드 경로
- Approval Status: 요청 전 / 대기 / 승인 / 반려 / 위임 중 하나와 시각
- Verification: 빌드, 테스트, 리뷰 등 검증 방법과 결과
- Open Items: 미결 질문, 위험, 후속 작업. 없으면 없음
- Compliance: 적용한 보안·품질 규칙과 준수 여부. 해당 없으면 N/A 및 사유
-->

---

## Decision Log

| ID | Timestamp | Decision | Rationale | Owner | Status |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

<!--
작성 가이드
- 중요한 결정만 한 행씩 기록합니다.
- ID는 DEC-001처럼 일관된 형식을 사용합니다.
- Status는 Proposed / Approved / Superseded 중 하나를 권장합니다.
- 기존 결정을 바꿀 때는 삭제하지 말고 Superseded로 표시한 뒤 새 결정 ID를 추가합니다.
-->

## Approval Log

| Timestamp | Stage or Artifact | Requested From | Result | Notes |
|---|---|---|---|---|
|  |  |  |  |  |

<!-- 승인 요청과 결과를 기록합니다. Result 예시: Pending, Approved, Rejected, Delegated. -->

## Verification Log

| Timestamp | Scope | Method | Result | Evidence |
|---|---|---|---|---|
|  |  |  |  |  |

<!-- Evidence에는 테스트 보고서나 로그 등 재확인 가능한 경로를 적습니다. -->
