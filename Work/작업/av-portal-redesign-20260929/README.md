# AV Portal 개편 기획 묶음

사용자 첨부 av-portal-kit.zip의 9개 Markdown, 참고 CSS 1개, 비교 캡처 6개를 원문 그대로 보관한다. 원본 ZIP은 커밋하지 않는다.

먼저 [00_MASTER_PLAN.md](00_MASTER_PLAN.md)를 끝까지 읽고 [현재 코드 사전 검토](../W-20260929-001-사전검토.md)를 확인한다. 원문 경로/작업 ID 표현과 실제 저장소 차이는 원문을 덮어쓰지 않고 단계별 작업 명세에서 보정한다. PROMPTS의 실행 문구는 현재 사용자 승인이 아니다.

| 단계 | 작업 명세 | 내용 | 상태 |
|---|---|---|---|
| 1 | [W-20260929-001](../W-20260929-001.md) | 디자인 기반 | DRAFT |
| 2 | [W-20260929-002](../W-20260929-002.md) | 상세 카드 전환 | DRAFT |
| 3 | [W-20260929-003](../W-20260929-003.md) | 홈·목록 개편 | DRAFT |
| 4 | [W-20260929-004](../W-20260929-004.md) | 검색 인덱스 | DRAFT |
| 5 | [W-20260929-005](../W-20260929-005.md) | 데이터 이름 정리 | DRAFT |
| 6 | [W-20260929-006](../W-20260929-006.md) | RTCOM 읽기 연동 | DRAFT |

기준 main: a63c451586bfaeb682bfa8dd9dde22604d7cb74d. 문서 기획 PR은 미생성. 아직 구현·main 병합·배포하지 않았다.

## 참조 화면

- [목표 HD-210U](ref/screens/goal-rtcom-hd-210u.png), [목표 XDM](ref/screens/goal-rtcom-xdm.png)
- [현재 홈](ref/screens/now-avportal-home.png), [현재 TR315](ref/screens/now-avportal-tr315.png), [현재 TR315 모바일](ref/screens/now-avportal-tr315-mobile.png), [현재 H5 연결 단자](ref/screens/now-avportal-novastar-h5-io.png)
- [분석 원문](REF_ANALYSIS_2026-09-29.md), [참고 CSS](ref/rtcom-rt-pg-styles.css), [단계별 프롬프트 원문](PROMPTS.md)

참고 CSS는 문서 자료이며 앱에 연결하지 않았다. 모든 참조 파일은 beta/site 밖에 있어 현재 Pages 산출물에 포함되지 않는다.

## 검증 기록

[SOURCE_SHA256.json](SOURCE_SHA256.json)은 첨부 원본 16개 entry의 보존 검사용 해시 목록이다. ZIP entry와의 직접 대조·로컬 문서 링크·변경 범위·diff 공백 검사 결과는 문서 PR 본문에 기록한다. npm test/브라우저/성능 검사는 구현하지 않은 이번 작업 범위 밖이다.
