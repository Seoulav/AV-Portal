# 구성도 JSON 1.2 예제와 안내 (견적 담당자용)

새 Builder가 저장하는 구성도 JSON 1.2의 예제와 읽는 법이다. 정식 명세는 [기반 명세](../../Work/빌더/기반명세.md) §7·§8이고, 구조는 [JSON Schema](../schema/diagram-1.2.schema.json)로 정의돼 있다.

## 한 줄 요약

**1.1을 읽던 프로그램은 1.2도 그대로 읽는다.** 1.1의 키는 이름·위치·의미가 같고, 1.2는 키를 **추가만** 했다. 새 키는 무시해도 된다.

## 파일

| 파일 | 내용 |
|---|---|
| `legacy-1.1.example.json` | 구 Builder 1.1 키 구조의 가상 예시. 비교용이다 |
| `small-room.diagram.json` | 소회의실 영상: 카메라 HDMI → 사이니지, LAN → 스위치 |
| `auditorium-audio.diagram.json` | 중강당 오디오: 무선 수신기 → 앰프 → 천장 스피커 4대, Dante → 스위치 |
| `rtcom-extender.diagram.json` | RTCOM 연장기: 카메라 → CT101-U(TX) → HDBaseT → CR101-U(RX) → 사이니지 |

- 장비는 실제 Portal 제품이다. 현장명은 모두 가상이다.
- 실제 고객 구성도는 저장소에 올리지 않는다.

## 검증

```powershell
node builder/cli/validate.mjs builder/examples/small-room.diagram.json
node builder/cli/validate.mjs <파일> --library https://seoulav.github.io/AV-Portal/builder-library.json
```

- 오류(저장을 막는 문제)가 있으면 종료 코드 1이다.
- 이슈(경고·안내)는 종료 코드에 영향이 없다.
- `--library`를 주면 파일을 만든 뒤 Portal 데이터가 바뀌었는지도 본다.

## 견적에서 읽을 곳

| 알고 싶은 것 | 위치 |
|---|---|
| 장비 목록과 대수 | `nodes[]` 중 `type: "equipment"`. **노드 1개 = 장비 1대**다. 같은 제품이 4대면 노드가 4개 있다 |
| 정확한 제품 | 노드 `data.portal.productId`(Portal 제품 ID). TX/RX 세트는 `data.id`가 `<제품ID>:tx`·`:rx`이고 `data.model`이 단위 모델명(예: `CT101-U`)이다 |
| 구매하지 않는 장비 | 노드 `data.isReused: true`(기존 장비 재사용) |
| 케이블 | `edges[]`. **엣지 1개 = 단자 쌍 1개 = 케이블 한 가닥**이다. 케이블 정보는 1.1과 같은 `data.bomRows`에 있다(`cableType` `ready-made`는 `quantity`, `manufactured`는 `length`(m)) |
| 케이블 계열 | 엣지 `data.lineTypeId`. 이름·색은 파일의 `lineTypes[]`에 있다 |
| 케이블을 아직 안 정한 선 | `issues[]`의 `cable-unspecified` |
| 장비 카탈로그 | `equipmentDB[]`. **1.1과 달리 이 구성도에 쓴 장비만** 들어 있다 |

## 1.1 대비 바뀐 점

| 키 | 1.1 | 1.2 |
|---|---|---|
| `version` | `"1.1"` | `"1.2"` |
| 노드 `data.id` | 구 Builder 카탈로그 ID(`eq-…`) | Portal 제품 ID. TX/RX·시리즈는 `:`가 붙는다 |
| `equipmentDB` | 로컬 카탈로그 전체 | 이 구성도에 쓴 장비만 |
| 노드 배열 순서 | 만든 순서 | 영역 → 장비 → 메모, 각 묶음 안에서 `id` 순 |
| `lineTypes` | 운영 7종 | 기존 7종 + 쓰인 새 ID(`speaker`·`fiber`·`analog-video`·`rf`) |

**추가된 키** (무시해도 된다):
- 최상위: `generator`, `library`, `issues`
- 노드 `data.portal`
- 단자: `connector`, `signals`, `verification`, `portalIo`
- 엣지 `data.signal`

**없어진 값**:
- 노드 `data.quantity`(노드 하나로 N대 기능은 취소됐다)
- 옵션 카드 필드(`selectedOptionQuantities`·`optionPortIds`)
- 화면 상태(`selected`·`dragging`·`dimmed`)

## 이슈 코드

| 코드 | 뜻 |
|---|---|
| `cable-unspecified` | 케이블(`bomRows`)이 아직 없다 |
| `connector-adapter` | 두 단자의 커넥터가 달라 변환 케이블·젠더가 필요하다 |
| `connector-unknown` | 원문에 커넥터 형상이 없어 모른다 |
| `signal-level` | 마이크·라인처럼 레벨이 다른 신호를 이었다 |
| `unverified-port` | 단자 정보가 Portal에서 아직 확인 중이다 |
| `no-ports` | Portal에 단자 정보가 없는 제품이다 |
| `series-config-pending` | 매트릭스 시리즈의 카드 구성이 정해지지 않았다 |
| `product-removed` | 파일을 만든 뒤 Portal에서 제품이 빠졌다(단종 등) |
| `library-drift` | 파일을 만든 뒤 Portal의 장비 정보가 바뀌었다 |

## 예제를 다시 만들 때

```powershell
node builder/examples/make-examples.mjs
```

이 명령은 예제를 의도적으로 바꿀 때만 쓴다. 예제는 만든 시점의 스냅샷이고, Portal 데이터가 바뀌어도 파일만으로 검증된다.
