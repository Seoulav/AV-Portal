# W-20261001-001 Port Map 검수 보정 A → Work

사용자 2026-10-02 승인. 기준 main7ebb804, 브랜치 codex/W-20261001-001-port-map-review. B는 이 수정 PR 병합·배포 뒤 별도 PR, Shure 이후 미승인.

## 수정·근거
- PC721px 이상 카드 폭 맞춤, 모바일만 내부 가로 이동. 창크기 변경도 재계산.
- H5 제어줄2/4/6–11 아래쪽(y840). MVR5 범위x1280–2120/y660. 기존PDF7/46 기술설명 불변. 충돌 번호만 세로로 비켜 그리며 괄호 원본좌표 유지.
- Epson Remote8: x462–478/y151. 이후제어9–13, 전원14. [공식 User Guide](https://files.support.epson.com/docid/cpd6/cpd64112.pdf) 표지의 정확 EB-PQ2220B, PDF/인쇄29쪽 Remote controller cable port. 별매 유선 리모컨 케이블 연결, 연결시 본체 수신부 비활성. 사진의 Audio Out 오른쪽 표기 대조. 기존 I/O/수량·사양·문서 상태 불변, 새PDF게시 없음. 과거 Remote미확인 기록은 당시 이력으로 보존.
- DCi 4|600DA 원본2000×1333 불변, 표시 crop top400/bottom360만 추가. 원본좌표·단자·제품영역 보존. Front/확대 원본 유지.
- ULXD4D JSON/이미지/좌표/설명 불변. 1280/390 전후PNG 픽셀 동일 확인. Crown은 여백만 감소하므로 전체화면이 동일하다고 주장하지 않음.

## 실측
| 모델 | 폭 | 내부 가로넘침 전→후 | 번호 전→후 | 카드 높이 전→후 |
|---|---:|---:|---:|---:|
| novastar-h5 | 1280 | 62 → 0 | 13 → 13 | 1190.2 → 1129.0 |
| eb-pq2220b | 1280 | 82 → 0 | 13 → 14 | 1110.7 → 1084.4 |
| ulxd4d | 1280 | 0 → 0 | 11 → 11 | 803.3 → 803.3 |
| dci-4-600da | 1280 | 0 → 0 | 10 → 10 | 1152.0 → 871.6 |
| novastar-h5 | 390 | 510 → 1050 | 13 → 13 | 1656.7 → 1921.1 |
| eb-pq2220b | 390 | 530 → 530 | 13 → 14 | 1426.5 → 1505.0 |
| ulxd4d | 390 | 270 → 270 | 11 → 11 | 1151.8 → 1151.8 |
| dci-4-600da | 390 | 270 → 270 | 10 → 10 | 1388.9 → 1176.1 |
| novastar-h5 | 1600 | 62 → 0 | 13 → 13 | 1190.2 → 1129.0 |
| eb-pq2220b | 1600 | 82 → 0 | 13 → 14 | 1110.7 → 1084.4 |
| ulxd4d | 1600 | 0 → 0 | 11 → 11 | 803.3 → 803.3 |
| dci-4-600da | 1600 | 0 → 0 | 10 → 10 | 1152.0 → 871.6 |

## 검증·화면
표적16pass, 전체179pass/0fail/1기존skip. Pages, 검색index --check, 생성9쌍, diff 통과. 20화면 넘침/번호충돌/깨진사진/JS오류0.
- novastar-h5: [1280](W-20261001-001-map-review-screens/after-novastar-h5-1280.png) / [390](W-20261001-001-map-review-screens/after-novastar-h5-390.png)
- eb-pq2220b: [1280](W-20261001-001-map-review-screens/after-eb-pq2220b-1280.png) / [390](W-20261001-001-map-review-screens/after-eb-pq2220b-390.png)
- dci-4-600da: [1280](W-20261001-001-map-review-screens/after-dci-4-600da-1280.png) / [390](W-20261001-001-map-review-screens/after-dci-4-600da-390.png)
- ulxd4d: [1280](W-20261001-001-map-review-screens/after-ulxd4d-1280.png) / [390](W-20261001-001-map-review-screens/after-ulxd4d-390.png)

## 보존·다음
변경제품3종의 portMap만 변경. 기타237종과 이미지/PDF/사양/I/O/Signal Flow 불변. PR revert로 이전 표시 복구. hkkim 관련 신규자료 없고 이동/업로드 없음. A 공개 확인 후 승인B Crown가능22종 모델별 사진/PDF근거, PDF없는4종 제외. 후보는 검증완료를 뜻하지 않으며 타모델 단자 추정금지.

- 독립리뷰1024px Epson6 번호잘림 발견→이동한 번호 높이에 맞춘 padding으로 해결. 721/1024 추가20화면 재통과, 모든 번호 영역내/겹침0. ULXD4D전후픽셀동일 재확인. 전체npm179pass. 중간1회 기존RTCOM동기화 temp rename EPERM 발생, 코드/테스트변경 없이 재실행 및 최종실행 모두통과.
