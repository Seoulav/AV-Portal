# AV Portal

로컬 제품 목록과 선택적 자료 수집대장을 읽는 AV Equipment Library 탐색 화면입니다. [첫 목록 작업](Work/작업/W-20260923-003.md)과 [자료대장 연결 작업](Work/작업/W-20260923-004.md)의 승인 범위로, 제품 검색·필터·원본 행과 자료 출처·확인 수준을 표시합니다. 최종 제품 스키마나 공개 준비 판정은 확정하지 않습니다.

## 실행

Node.js 20 이상이 필요하며 패키지 설치는 필요하지 않습니다. PowerShell에서 저장소 루트로 이동해 **로컬 전용** JSON 두 개의 실제 절대 경로를 지정합니다.

```powershell
$env:AV_PORTAL_PRODUCT_LIST_PATH = 'C:\path\to\AV_Portal_Product_List_2026-09-23.json'
$env:AV_PORTAL_RESOURCE_REGISTER_PATH = 'C:\path\to\resource-register.json'
npm start
```

브라우저에서 [http://127.0.0.1:4173](http://127.0.0.1:4173)을 엽니다. 서버는 이 PC의 루프백 주소에만 연결됩니다. 제품 목록 경로를 지정하지 않으면 현재 저장소의 `outputs/research-master-20260923/AV_Portal_Product_List_2026-09-23.json`을 찾습니다. 별도 워크트리에는 로컬 원본이 복사되지 않으므로 절대 경로를 지정합니다. 제품 목록이 없으면 목록 오류를 표시합니다.

자료대장 설정은 **선택 사항**입니다. `AV_PORTAL_RESOURCE_REGISTER_PATH`를 지정하지 않으면 기존 목록·검색·필터는 그대로 동작하고 상세에 “자료대장 미연결”을 표시합니다. 경로를 지정했으나 파일이 없거나 형식·관계가 손상됐으면 상세에 자료대장 읽기 오류를 표시하되 목록은 유지합니다. 설정·로컬 경로·원본 JSON 전체는 새 자료 API로 보내지 않습니다.

확인할 화면:

1. 상단의 제품·브랜드·공식 링크 연결 현황은 실행 시 읽은 목록에 따라 표시됩니다. 통합 검색에 브랜드·제품명·별칭을 입력하고 브랜드 및 여러 카테고리를 함께 고를 수 있습니다.
2. 제품 카드의 **자료와 원본 행 보기**에서 기존 목록의 공식·보조 URL, 제조사 직접 제공 참조와 원본 행을 확인합니다. 같은 상세 안의 별도 **자료대장**에서는 제품 페이지·사양서/카탈로그·매뉴얼·제어 자료·기타 자료를 구분합니다.
3. 자료대장 기록은 출처 유형, 언어, 개정, 확인일, 확인 수준과 제품 적용 범위를 각각 표시합니다. 명시된 한국어 자료를 같은 종류 안에서 우선 표시합니다. 원문을 열지 못했거나 파일명·검색 결과만 일치한 후보는 확인 완료로 표시하지 않습니다. 자료 ID 하나가 여러 제품에 연결될 수 있습니다.
4. 헤더의 AV System Builder와 LED Configurator는 각 외부 서비스로 연결됩니다.

웹 링크는 허용된 HTTPS URL만 열 수 있습니다. 직접 제공 자료의 로컬 파일은 열거나 다운로드할 수 없으며, `folder`·`local_reference` 같은 개인 경로는 자료 API·화면에 노출하지 않습니다. URL의 현재 유효성, 정확 모델 적용 여부, 제품의 정식 공개 준비를 새로 판정하지 않습니다. RTCOM 웹 조사는 수행하지 않습니다.

## 검증

```powershell
npm test
npm run verify:local
npm run verify:resources:local
```

`npm test`는 합성 자료로 기존 검색·필터와 신규 관계·상태·오류·경로 비노출을 검사합니다. `verify:local`은 `AV_PORTAL_PRODUCT_LIST_PATH`가 설정됐을 때 실제 목록을 검사하며, 없으면 SKIP됩니다. `verify:resources:local`은 두 환경 변수에 실제 파일의 **절대 경로**가 필요하고, 제품·원본 행·자료·관계 수를 실제 입력에서 검증해 출력합니다. 자료 수를 코드에 고정하지 않습니다.

## 공동 작업

- [AGENTS.md](AGENTS.md): 역할·브랜치·검증 규칙
- [Work/README.md](Work/README.md): Work와 Codex의 작업 절차
- [Work/지시서.md](Work/지시서.md): 실제 진행 결과와 후속 인계
- [WORK_HANDOFF.md](Work/기획/WORK_HANDOFF.md): 제품 범위와 보류 조건

`hkkim/`과 `outputs/research-master-20260923/`의 원본·로컬 목록·자료 수집대장은 GitHub에 올리지 않습니다. 코드와 공동 문서만 PR에서 관리합니다.
