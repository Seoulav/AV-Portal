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

## Sony 지도 반영 후 남은 범위

PR #527로 Sony 3종을 지도화한 후 상세 281종 중 지도 170종, 지도 없음 111종이다. 지도 없는 제품 가운데 게시 Rear 사진이 있는 것은 20종: **JBL 14종(세션 A), AMX Varia 4종(세션 B), Shure 2종**(`mxa925w-r`, `mxcw640`). Shure 2종은 이전 Shure 사진 검토 범위로, 본 접촉 시트 21종에는 넣지 않았다. 사진이 없는 나머지 91종을 아래에 열거한다. 이 목록은 새 지도 제작 지시가 아니며, 특히 삼성 LED 6종은 사용자가 Port Map 제외를 결정했다. 사진·도면과 모델별 단자 근거를 찾기 전 번호 좌표를 만들지 않는다.

| 제조사 | Rear 사진 없는 미지도 제품 |
|---|---|
| Analog Way | `rc400t` |
| Audinate | `avio-2ch-in`, `avio-2ch-out`, `avio-bt`, `avio-usb-c` |
| BSS Audio | `blu-aec-in`, `blucard-in`, `blucard-out`, `ec-4bv` |
| Blackmagic Design | `hyperdeck-studio-hd-mini`, `hyperdeck-studio-hd-plus`, `hyperdeck-studio-hd-pro` |
| HDCVT | `hdf-ccf` |
| Insta360 | `insta360-connect`, `insta360-link-2`, `insta360-wave-business`, `insta360-wave` |
| JBL | `ac18-26`, `ac18-95` |
| Lightware | `hdmi20-optj-rx90`, `hdmi20-optj-tx90` |
| Logitech | `rally-mic-pod-extension-cable` |
| Lumantek | `ez-hsv-plus`, `ez-md-plus`, `ez-shv-plus`, `ez-umd-plus` |
| Magnimage | `led-780h` |
| NovaStar | `h-800w-psu`, `h-input-card-12g-sdi`, `h-input-card-2xhdmi20-2xdp12`, `h-input-card-4x3g-sdi`, `h-input-card-4xhdmi`, `h-input-card-dp12-4k`, `h-input-card-hdmi20-4k`, `h-input-card-hdmi20-dp12-4k`, `h-output-card-4xhdmi-dl`, `h-output-card-hdmi20-4k`, `h-preview-card-2xrj45-1xhdmi13` |
| Roland | `uvc-01`, `v-02hd-mk-ii`, `v-160hd`, `v-1hd-plus`, `v-80hd`, `v-8hd`, `vr-6hd` |
| Ross Video | `ultrimix-dante`, `ultrimix-mxr`, `ultripower-ps`, `ultriscape`, `ultrisync-18`, `ultrix-hdx-io`, `ultrix-ns-fr2` |
| SD컴퍼니 | `emision-media-server`, `emision-pixelfit` |
| Samsung | `ie015a-e`, `ie020a-e`, `if015r-m`, `mp008f`, `mp012f`, `mp016f` — LED Port Map 제외 |
| Shure | `a900w-r-gm`, `mx392-c`, `mx395`, `mx418d-c`, `mxc420-c`, `qlxd1`, `qlxd2-beta58`, `qlxd2-beta87a`, `slxd2-plus-58`, `slxd2-plus-b58`, `slxd2-plus-b87a`, `ua874xa`, `ulxd2-beta58`, `ulxd2-beta87`, `ulxd2-ksm9`, `ulxd8` |
| Televic | `confidea-flex`, `d-cerno-ae`, `d-mic-40-sl`, `d-mic-50-sl`, `plixus-ae-r-dante`, `plixus-ae-r-ps`, `plixus-next` |
| Yealink | `avhub`, `cm20`, `cpe40`, `cs10`, `smartvision40`, `uvc85-byod`, `uvc86`, `vcm35` |

기존 지도 170종에는 렌더·자동 lint 결과가 있으나 **전체의 모델별 후면 사진과 각 지시선 의미를 사람이 모두 대조한 상태는 아니다.** 현재 발견·수정한 오류는 TOGGLE DOCK 연결 예시 화살표 혼동과 사진 크롭, Epson PQ2213B·2216B HDMI 2 괄호 및 REMOTE·AC 누락, Crown DCi 4|600DA 공용 사진 좌표 어긋남, Analog Way 후면 사진·번호 누락 및 Aquilon 번호 겹침이다. Sony 세 제품은 본 작업에서 추가·대조했다. 그 외 기존 지도는 전수 육안 검수의 남은 범위로 유지한다.
