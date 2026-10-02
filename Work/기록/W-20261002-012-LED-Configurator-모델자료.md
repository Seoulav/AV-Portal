# 삼성 LED 사이니지 모델 자료 — 보관 기록 (2026-10-02)

- 수집 담당: Work
- 사용자 지시: 2026-10-02 **"다른 LED는 주소에서 정보를 좀 취합해 줘"**, 이어 **"일단 내가 준 사이트를 통해서 자료를 가지고 있어줘"**
- 기계 판독용 자료: [W-20261002-012-LED-Configurator-모델자료.json](W-20261002-012-LED-Configurator-모델자료.json)

**이 문서는 보관용이다. 제품 등록이 아니며 Library에 반영하지 않았다.**

## 출처

| 항목 | 값 |
|---|---|
| 시스템 | SVT LED Configurator — AV Portal이 외부 링크로 연결하는 도구 |
| 화면 | https://hkkim0454.github.io/svt-led-calculator/src/index.html |
| 저장소 | https://github.com/hkkim0454/svt-led-calculator |
| 파일 | `src/models.js` |
| 원자료 표기 | `Source: Samsung official configurator (display-configurator.biz.samsung.com), observed 2026-07-23` |

## 자료 등급 — 중요

**삼성전자가 발행한 1차 자료가 아니다.** 삼성 configurator 화면을 관찰해 옮긴 기록이며, 원본 머리말이 직접 이렇게 적고 있다.

> `weight, maxPower, typicalPower (per cabinet) = DATASHEET REQUIRED unless verified`
> `Fill weight/power from official datasheets before using for quotes.`

| 신뢰도 | 종수 | 의미 |
|---|---:|---|
| `verified` | **12** | 캐비닛·전력 수치를 삼성 도구와 교차 확인 |
| `derived` | **7** | 치수는 관찰, **전력·무게는 미확정** |

Library에 반영하려면 **제조사 데이터시트로 다시 확인**해야 한다. 특히 `derived` 7종.

## 수집 결과 — 19종

| 수명주기 | 종수 |
|---|---:|
| 현행 | 10 |
| 단종(`discontinued`) | 4 |
| 신규(`new`) | 5 |

### MPF — The Wall 실내용, 캐비닛 806.4 × 453.6

| 모델 | 피치 | 해상도 | 밝기 피크/저감 | 무게 | 최대 전력 | S-Box | 부품번호 | 신뢰도 |
|---|---|---|---|---|---|---|---|---|
| MP008F | 0.84 | 960×540 | 1800 / 1000 | 9.2 | 122 W | SBB-CS4BPGS | LH008MPFAAA | verified |
| MP012F | 1.26 | 640×360 | 1800 / 1000 | 9.2 | 146 W | SBB-CS4BPGS | LH012MPFAAA | verified |
| MP016F | 1.68 | 480×270 | 1600 / 1200 | 9.2 | 161 W | SBB-CS4BPGS | LH016MPFAAA | verified |

**MPF 3종은 삼성전자 발행 제품가이드라는 더 나은 근거가 있어** [W-20261002-012](../작업/W-20261002-012.md)에서 따로 등록한다.

### IFR — 실내 평면형, 캐비닛 960 × 540

| 모델 | 피치 | 해상도 | 밝기 | 무게 | 최대 전력 | 부품번호 | 신뢰도 | 수명주기 |
|---|---|---|---|---|---|---|---|---|
| IF015R | 1.5 | 640×360 | 1600 / 800 | 11.8 | 360 W | LH015IFRCLS | verified | **단종** |
| IF020R | 2.0 | 480×270 | 1600 / 1000 | **미상** | 260 W | LH020IFRCLS | derived | 현행 |
| IF025R | 2.5 | 384×216 | 2000 / 1000 | 12.4 | 260 W | LH025IFRCLS | verified | 현행 |
| IF040R | 4.0 | 240×135 | 1500 | **미상** | 260 W | LH040IFRCLS | derived | 현행 |

### IFRM — IFR 후속

| 모델 | 피치 | 해상도 | 밝기 | 무게 | 최대 전력 | 부품번호 | 신뢰도 |
|---|---|---|---|---|---|---|---|
| IF015RM | 1.5 | 640×360 | 1700 | 11.8 | 190 W | LH015IFRILS | verified |

사용자가 알려준 **IFR → IFRM 전환**이 자료에도 반영돼 있다. 원본 주석은 IF015R 단종의 후속이 IF015R-M이며 2026-09-29 확인이라고 적고 있다.

### IEA — 캐비닛 960 × 540

| 모델 | 피치 | 해상도 | 밝기 | 무게 | 최대 전력 | 부품번호 | 신뢰도 | 수명주기 |
|---|---|---|---|---|---|---|---|---|
| IE015A | 1.5 | 640×360 | 1000 | 11.8 | 190 W | LH015IEACLS | verified | **단종** |
| IE020A | 2.0 | 480×270 | 1000 | 12.4 | 190 W | LH020IEACLS | verified | 현행 |
| IE025A | 2.5 | 384×216 | 1000 | 10.8 | 180 W | LH025IEACLS | verified | 현행 |
| IE040A | 4.0 | 240×135 | 800 | 10.8 | 180 W | LH040IEACLS | verified | 현행 |
| IE015AE | 1.5 | 640×360 | **미상** | 12.4 | 190 W | LH015IEAELS | derived | 신규 |
| IE020AE | 2.0 | 480×270 | **미상** | 12.4 | 177 W | LH020IEAELS | derived | 신규 |

### MMF — 캐비닛 600 × 337.5

| 모델 | 피치 | 해상도 | 밝기 | 무게 | 최대 전력 | 부품번호 | 신뢰도 | 수명주기 |
|---|---|---|---|---|---|---|---|---|
| MM009F | 0.9375 | 640×360 | 600 | 5.1 | 85.8 W | LH009MMFRGS | derived | 현행 |
| MM012F | 1.25 | 480×270 | 600 | 5.1 | 92.8 W | LH012MMFRGS | verified | **단종** |
| MM015F | 1.5625 | 384×216 | 600 | 5.1 | 94.6 W | LH015MMFRGS | verified | **단종** |
| MM012FS | 1.25 | 480×270 | 800 | 5.2 | 89 W | LH012MMFYGS | derived | 신규 |
| MM015FS | 1.5625 | 384×216 | 800 | 5.2 | 83 W | LH015MMFYGS | derived | 신규 |

## 자료에 들어 있는 필드

`pitch`, `cabW`·`cabH`·`depth`, `resW`·`resH`, `brightnessPeak`·`brightnessReduced`, `refreshHz`, `ovd_m`(최적 시청거리), `weight`, `maxPower`·`typicalPower`, `maxInputW/H`(S-Box 최대 입력), `sbox`, `cabinetPart`, `dataStatus`, `lifecycle`

**Library에 없는 것**: 제품 이미지, 연결 단자 구성, 공식 제품 페이지 URL, 매뉴얼 링크, 인증 정보

## 반영 전에 정해야 할 것

1. **자료 등급** — 이 자료를 근거로 쓸지, 제조사 데이터시트를 다시 확보할지
2. **단종 4종**(IF015R, IE015A, MM012F, MM015F) 등록 여부. LH98QEC를 단종으로 제외한 결정과 일관성이 필요하다
3. **`derived` 7종**의 전력·무게를 비워 둘지, 이 값을 쓰되 미확정으로 표시할지
4. **AV Portal 범위** — [WORK_HANDOFF §2](../기획/WORK_HANDOFF.md)는 LED Configurator를 **외부 링크로만 유지**하고 Product Data를 통합하지 않는다고 정했다. 반영은 그 결정의 변경이다
5. 이미지·단자 정보 확보 방안

**현재는 보관만 한다.** 사용자 지시가 "일단 가지고 있어줘"였다.
