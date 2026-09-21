# AI Model Routing Policy

## 1. 목적

이 프로젝트에서는 AI 모델을 작업 난이도와 위험도에 따라 선택한다.

고성능·고비용 모델을 모든 작업에 일괄적으로 사용하지 않는다. 대부분의
일반적인 개발 작업은 기본 모델을 사용하고, 기본 모델로 안정적인 해결이
어렵거나 높은 수준의 추론이 필요한 경우에만 Astra를 선택적으로 사용한다.

핵심 원칙:

> Use the simplest model that can reliably complete the task.

Astra는 기본 모델이 아니다. Astra 사용은 "필요성이 있는 경우의 선택적
escalation"으로 취급한다.

------------------------------------------------------------------------

## 2. Default Model Policy

별도의 특별한 이유가 없다면 기본 모델을 사용한다.

다음 작업은 원칙적으로 Astra를 사용하지 않는다.

-   일반적인 HTML / CSS 수정
-   단순 JavaScript / TypeScript 구현
-   UI 컴포넌트 작성
-   텍스트 및 Label 수정
-   색상 / 간격 / 크기 조정
-   단순 Responsive UI 수정
-   기존 패턴을 따르는 기능 추가
-   명확한 Bug Fix
-   테스트 추가
-   테스트 실패 원인 수정
-   단순 Refactoring
-   문서 수정
-   README 업데이트
-   AIDLC-STATE 업데이트
-   코드 Formatting
-   Lint 수정
-   파일 정리
-   명확하게 정의된 반복 작업
-   기존 Schema에 제품 데이터 추가
-   기존 Component를 이용한 페이지 추가
-   이미 결정된 디자인의 구현

이러한 작업에서 단순히 "더 좋은 결과가 나올 수 있다"는 이유만으로
Astra를 선택하지 않는다.

------------------------------------------------------------------------

## 3. Astra Escalation Criteria

다음 조건 중 하나 이상이 명확하게 해당될 경우 Astra 사용을 고려할 수
있다.

### 3.1 Architecture

프로젝트 전체 구조에 영향을 미치는 중요한 Architecture 결정이 필요한
경우.

예:

-   Product Data Architecture 재설계
-   Database Schema의 대규모 변경
-   여러 Application 간 데이터 공유 구조
-   AV Equipment Library ↔ System Builder 연동 Architecture
-   LED Configurator ↔ Product Database 연동
-   대규모 Migration 설계

### 3.2 Complex Reasoning

여러 시스템이나 조건을 동시에 고려해야 하며 기본 모델의 분석만으로
신뢰성 있는 결론을 내리기 어려운 경우.

예:

-   복잡한 AV Signal Routing Algorithm
-   Port Compatibility Engine
-   자동 결선 검증 Logic
-   장비 자동 추천 Algorithm
-   복잡한 Constraint Solver
-   BOM 자동 생성 Logic

### 3.3 Difficult Debugging

일반적인 debugging으로 원인을 찾지 못한 경우.

다음 순서를 우선한다.

1.  기본 모델 분석
2.  관련 코드 조사
3.  테스트 실행
4.  로그 분석
5.  가설 검증
6.  수정 시도

위 과정으로도 원인이 명확하지 않거나, 여러 subsystem에 걸친 복합적인
문제라고 판단되는 경우에만 Astra 사용을 고려한다.

### 3.4 High-Risk Refactoring

변경 범위가 넓고 기존 기능에 영향을 줄 가능성이 높은 경우.

예:

-   핵심 Data Model 변경
-   Routing Architecture 변경
-   State Management 교체
-   Product Schema Migration
-   여러 Tool이 공유하는 공통 Library 변경

### 3.5 Independent Deep Review

중요한 Release 또는 Architecture 변경을 완료한 뒤 일반적인 Self Review
이상의 독립적인 심층 검토가 필요한 경우.

예:

-   Major Release 전 Architecture Review
-   대규모 Migration 검토
-   중요한 Data Integrity 검증
-   System Builder Integration 최종 검토

------------------------------------------------------------------------

## 4. Astra 사용 금지 원칙

다음과 같은 이유만으로 Astra를 사용하지 않는다.

-   더 강력한 모델이니까
-   더 좋은 결과가 나올 것 같아서
-   작업이 조금 복잡해 보여서
-   코드 양이 많아서
-   파일 수가 많아서
-   이전 작업에서 Astra를 사용했기 때문에
-   사용 가능한 모델 중 가장 강력하기 때문에

모델 선택은 항상 실제 작업 난이도를 기준으로 한다.

------------------------------------------------------------------------

## 5. Escalation Before Astra

Astra를 사용하기 전에 먼저 다음을 확인한다.

1.  문제를 충분히 작은 단위로 분해할 수 있는가?
2.  기존 Architecture 또는 Pattern으로 해결할 수 있는가?
3.  Repository에 이미 비슷한 구현이 존재하는가?
4.  테스트 또는 로그를 통해 문제 범위를 좁힐 수 있는가?
5.  기본 모델로 해결 가능한 하위 작업으로 분리할 수 있는가?

위 방법으로 안정적으로 해결할 수 있다면 Astra를 사용하지 않는다.

------------------------------------------------------------------------

## 6. Partial Escalation

복잡한 작업 전체를 Astra에 맡길 필요는 없다.

가능하면 어려운 부분에만 Astra를 사용한다.

예:

**BAD**

전체 Product Library를 Astra로 개발한다.

**GOOD**

기본 모델: - UI 구현 - Product Card - Search UI - Filter UI - Tests -
Documentation

Astra: - 새로운 Product Schema Architecture 검토

기본 모델: - 승인된 Schema를 실제 코드로 구현

즉:

DEFAULT MODEL\
→ Complex Problem Detected\
→ Astra Analysis / Review\
→ Decision\
→ DEFAULT MODEL Implementation

방식을 우선한다.

------------------------------------------------------------------------

## 7. Human Decision Gate

Astra가 제안한 내용이라고 해서 자동으로 정답으로 취급하지 않는다.

다음과 같은 중요한 변경은 사용자 승인 없이 진행하지 않는다.

-   전체 Architecture 변경
-   Product Taxonomy 변경
-   Product Data Schema 변경
-   기존 데이터 Migration
-   기존 기능 제거
-   주요 Dependency 교체
-   Database 변경
-   System Builder Interface 변경

Astra는 의사결정을 지원하는 도구이며, 프로젝트의 최종 의사결정자가
아니다.

------------------------------------------------------------------------

## 8. AV Domain Accuracy

AV Equipment Library에서는 AI 모델의 추론보다 공식 제조사 자료를
우선한다.

다음 정보는 추측해서 생성하지 않는다.

-   Port Type
-   Port Count
-   Resolution
-   Bandwidth
-   Protocol
-   Power
-   Dimensions
-   Compatibility
-   Firmware Requirement
-   Product Status

가능하면 다음 공식 자료를 근거로 확인한다.

1.  Manufacturer Product Page
2.  Official Datasheet
3.  Official User Manual
4.  Official Installation Guide
5.  Official API / Protocol Documentation

확인할 수 없는 정보는 추측하지 말고 `UNKNOWN` / `UNVERIFIED` 상태로
기록한다.

------------------------------------------------------------------------

## 9. Model Selection Summary

기본 원칙:

**DEFAULT MODEL FIRST.**

필요할 경우:

DEFAULT\
→ ANALYZE\
→ TEST\
→ REVIEW\
→ COMPLEXITY CONFIRMED\
→ ASTRA\
→ DECISION\
→ DEFAULT IMPLEMENTATION

Astra는 프로젝트의 기본 개발 모델이 아니다.

Astra는 복잡한 Architecture, 고난도 Reasoning, 해결되지 않는 Debugging,
중요한 설계 검증 등에 필요한 경우에만 선택적으로 사용한다.

최종 목표는 특정 모델을 최대한 많이 사용하는 것이 아니라,

**개발 품질, 정확성, 일관성, 비용 효율성을 동시에 유지하는 것이다.**

------------------------------------------------------------------------

## 10. AGENTS.md 연동 권장 규칙

`AGENTS.md`에는 다음과 같은 요약 규칙을 포함하는 것을 권장한다.

> Do not use Astra as the default model.
>
> Use the default model for normal implementation, UI work, testing,
> documentation, routine refactoring, and well-defined development
> tasks.
>
> Escalate to Astra only when the task genuinely requires deeper
> reasoning, such as major architecture decisions, complex cross-system
> design, difficult unresolved debugging, high-risk refactoring, complex
> algorithms, or critical architecture/release review.
>
> Before escalating, first attempt to decompose the problem and solve it
> using the default model.
>
> When Astra is necessary, prefer using it only for the difficult
> analysis or review portion of the task, then return to the default
> model for routine implementation.
>
> See `docs/MODEL_ROUTING.md` for the full policy.
