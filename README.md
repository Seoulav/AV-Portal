# AV Portal

AV Equipment Library의 첫 로컬 탐색 화면입니다. [W-20260923-003](Work/작업/W-20260923-003.md)에 승인된 범위로, 현재 제품 목록을 읽어 검색·필터·출처 참조를 보여줍니다. 최종 제품 스키마나 공개 준비 판정은 이 화면에서 확정하지 않습니다.

## 실행

Node.js 20 이상이 필요합니다. 패키지 설치는 필요하지 않습니다. PowerShell에서 저장소 루트로 이동한 뒤, **로컬 전용** `AV_Portal_Product_List_2026-09-23.json`의 실제 경로를 지정합니다.

```powershell
$env:AV_PORTAL_PRODUCT_LIST_PATH = 'C:\path\to\AV_Portal_Product_List_2026-09-23.json'
npm start
```

브라우저에서 [http://127.0.0.1:4173](http://127.0.0.1:4173)을 엽니다. 서버는 이 PC의 루프백 주소에만 연결됩니다. 경로를 지정하지 않으면 현재 저장소의 `outputs/research-master-20260923/AV_Portal_Product_List_2026-09-23.json`을 찾습니다. 별도 워크트리에서는 목록이 복사되지 않으므로 절대 경로를 지정해야 합니다. 파일이 없거나 형식이 잘못되면 화면에 오류가 표시됩니다.

확인할 화면:

1. 상단에 고유 제품 338개, 식별 브랜드 30개, 공식 링크 연결 제품 103개가 표시됩니다.
2. 통합 검색에 브랜드·제품명·별칭을 입력합니다. 브랜드와 카테고리 필터를 함께 사용할 수 있고, 카테고리는 여러 개를 선택할 수 있습니다.
3. 제품 카드의 **자료와 원본 행 보기**에서 공식/보조 출처 URL, 연결 당시 검증 상태, 제조사 직접 제공 자료의 참조, 원본 행을 확인합니다. 예: `BLU-101`의 공식·보조 링크, `XDM-DPO100`의 직접 제공 참조, 브랜드 미식별 제품 `DS-8S`.
4. 헤더의 AV System Builder와 LED Configurator는 각 외부 서비스로 연결됩니다.

목록의 URL은 기존 조사에서 연결된 자료입니다. 화면은 URL의 현재 유효성, 정확 모델 적용 여부, 제품의 정식 공개 준비를 새로 판정하지 않습니다. URL이 없는 제조사 직접 제공 자료는 파일을 게시하지 않고 참조 경로만 표시합니다. RTCOM 웹 조사는 실행하지 않습니다.

## 검증

```powershell
npm test
npm run verify:local
```

`verify:local`은 위 환경 변수의 실제 파일을 대상으로 338개 고유 제품, 342개 원본 행, 브랜드 미식별 4개와 병합된 중복 4묶음을 확인합니다. `npm test`는 합성 자료로 서버·검색·필터·출처 처리 동작을 검사합니다.

## 공동 작업

- [AGENTS.md](AGENTS.md): 역할·브랜치·검증 규칙
- [Work/README.md](Work/README.md): Work와 Codex의 작업 절차
- [Work/지시서.md](Work/지시서.md): 진행 결과와 후속 인계
- [WORK_HANDOFF.md](Work/기획/WORK_HANDOFF.md): 제품 범위와 보류 조건

`hkkim/`과 `outputs/research-master-20260923/`의 원본·로컬 목록은 GitHub에 올리지 않습니다. 코드와 공동 문서만 PR에서 관리합니다.
