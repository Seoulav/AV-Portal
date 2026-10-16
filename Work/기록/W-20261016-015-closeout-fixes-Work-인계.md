# W-015 마감 후속9지도 — Work 인계

## 상태와 범위

REVIEW. Work 2026-10-17 배정. 문서 PR #601은 d960088b6d8ed82c94aa16f1834c57966b07e30e로 병합 완료. 후속 구현 브랜치 codex/W-20261016-015-closeout-fixes. 이 PR은 Work 시각 승인 전 병합하지 않는다.

- RSalpha/RS1~6: LOCK/LAN의 공유 수직 경로 분리, 멀티뷰어/Dante 간격 확보.
- BRC-AM7 #7, SRG-A40 #5 via만 보정. 상대 #1/#4와 단자 식별 유지.
- 총30표식 좌표만 수정. 제품 번호·이름·설명·I/O·사양·사진·비대상 표식·렌더러·검증기 보존. Zenith100은 세션 B 범위로 제외.

## 검증과 검토 자료

- [점검표](W-20261016-015-closeout-fixes-점검표.md) / [72장 전후 갤러리](W-20261016-015-closeout-fixes-preview/index.html). 모든9지도 전후760/390좌우/3배 확대.
- 기준 대상 근접16→0, 번호 원92 유지, 겹침0, 390px 페이지 넘침0. 기존 Sony 장선에는1/4 소급하지 않음.
- 전체872건:871pass/0fail/기존skip1. Pages289/286/529/167, 검색·읽기용카탈로그check 통과.
- 독립 시각 재검토30표식 모두OK. 최초 Dante 끝다리 인쇄 접촉은6종 하향 보정 후 재검토 통과. 독립 코드검토 Blocking/Important0.
- fixture와 exacthash 역복원 시험으로 승인 범위 밖 수정이 가려지지 않도록 검사. 파생물 재생성.

## Work가 할 일

최종 전후 그림을 확인하고 병합 순서를 승인한다. 승인 뒤 병합·Pages 배포·공개 대표/대상 확인을 진행한다. 현재 공개 반영 완료로 표시하지 않는다.

## 로컬 자료와 한계

- 로컬 측정·캡처 스크립트/로그: outputs/w015-closeout-fixes(커밋 제외). 필요한 PNG72장·점검표·검사fixture는 PR에 포함.
- 6px는 사진 안 다른 번호 leader와 bracket/leader에 적용하며 평행길이<=8SVGpx 및 bracket↔bracket는 수치검사에서 제외. 인접 괄호는 확대 시각검토로 확인. 자동검사는 의미상 오인/인쇄 관통을 판단하지 못한다.
- 모델·강도: 현재 세션 기본 모델 유지, 독립 시각 검토는 portmap-audit 절차 적용. 단자 식별·글자 접촉은 자동 검사만으로 잡을 수 없어서 별도 확대 재검토를 수행했다.

## 최신 main 통합

- origin/main f5a7a6b0433166209fca715ad37bd874dd158500 (#602 Zenith100 보정 포함)을 통합. 제품/테스트/사진의 세션 B 변경을 그대로 보존. 검색 인덱스 충돌은 원본에서 재생성으로 해결.
- 본 PR 기준 예외 문서 변경은 세션 D 섹션 8줄 추가뿐. 렌더러·검증기·잠금 PDF·builder/cpq·다른 세션 진행 파일 변경 없음.
- 통합 후 전체872건871pass/0fail/기존skip1(54.8초), 종료0. Pages·검색·읽기용카탈로그check 재통과.

- PR: https://github.com/Seoulav/AV-Portal/pull/603. CI/Work 승인 대기.
