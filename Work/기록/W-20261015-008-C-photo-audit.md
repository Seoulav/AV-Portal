# 02 제품사진 전수 점검 · 지도 없는 Rear 사진 묶음

2026-10-15 세션 C 로컬 `tmp/photo-audit/unmapped-rear/`에서 Shure 제외 21종의 게시 Rear 사진을 접촉 시트로 모아 확인했다. 포털 상세 281종 가운데 지도 167종·지도 없음 114종이며, 지도 없는 제품 중 Rear 사진이 있는 제품은 23종(Shure 2종 포함)이다. 지도 167종의 `portmap-audit --all --lint-only` 결과 100개 수동 검토 알림: 공용 사진 68, 표식 간격 28, 범위 겹침 4. 범위 겹침 4건은 DM7의 PY 카드 슬롯 묶음과 별도 AES 포트 지시선이 다른 높이에서 만나는 구조임을 사진으로 확인했다. Aquilon 간격 알림은 PR #522 공개 화면 보정과 함께 검토했다. 자동 경고 0이 곧 실제 단자 일치를 증명하지는 않는다.

| 담당 후보·제품 | 사진에 보이는 것 | 다음 확인 |
|---|---|---|
| 세션 C · Sony `brc-am7`, `rm-ip10`, `rm-ip500` | 후면 커넥터와 모델별 공식 단자 자료 | W-20261015-008에서 보이는 단자만 지도화 |
| 세션 A · JBL `control-23-1`, `control-25-1`, `control-28-1` | 후면 입력 터미널 및 탭 셀렉터 일부 | 공식 자료로 단자·탭 의미와 정확 좌표 대조 |
| 세션 A · JBL `control-412ct`, `control-414ct`, `control-416ct`, `control-418ct`, `control-419cst`, `control-424ct`, `control-424lp`, `control-426ct`, `control-426lp`, `control-440cst`, `control-447ct` | 게시 Rear 사진에는 본체 배면판이 주로 보임. 단자가 가장자리에 가려지거나 판독이 어려움 | 단자가 보이는 다른 공식 사진·설치 도면 확보 전 좌표 생성 금지 |
| 세션 B · AMX `varia-sl50`, `varia-sl80` | 후면 RJ-45가 보임 | 모델별 공식 설치 자료로 정확 이름·좌표 대조 |
| 세션 B · AMX `varia-100`, `varia-80` | 게시 Rear 사진에 연결 단자가 보이지 않음 | 포트가 드러나는 다른 공식 면 사진·도면 조사 전 좌표 생성 금지 |

접촉 시트: [1 · Sony BRC-AM7/JBL 23·25·28/412·414](W-20261015-008-C-unmapped-rear-01.png) · [2 · JBL 416–426CT](W-20261015-008-C-unmapped-rear-02.png) · [3 · JBL 426LP–447CT/Sony RM-IP10·500/AMX Varia-100](W-20261015-008-C-unmapped-rear-03.png) · [4 · AMX Varia-80·SL50·SL80](W-20261015-008-C-unmapped-rear-04.png).

시트는 기존 게시 WebP를 축소해 보기 좋게 모은 내부 검수 자료이며, 원본 사진·원본 해상도 판정은 각 제품 JSON의 `images[]`와 `beta/site/detail/images/`를 따른다. 사진 속 모델명이 안 보이는 제품은 제조사별 첨부 링크까지 대조해야 하며 시트만으로 모델이 확정되지는 않는다. JBL·AMX 제품 JSON은 세션 C가 수정하지 않는다.
