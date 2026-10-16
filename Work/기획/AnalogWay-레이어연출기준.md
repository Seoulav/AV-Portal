# Analog Way 레이어 연출 기준

이 문서는 Aquilon RS·C, Alta 4K, Midra 4K의 공식 레이어 자원 규칙을 같은 순서로 정리합니다. 제품별 수량은 공개 제품 JSON의 `layerPlan` 또는 `videoLayerPlan`을 읽으며, 이 문서는 계산 규칙과 미확인 범위를 설명합니다.

## Aquilon RS · Aquilon C

### 1. 화면(Screen)·출력·AUX의 관계

화면은 하나 이상의 프로그램 출력으로 구성합니다. Aquilon VPU 한 개에는 출력 링크 8개가 있고, 화면에서 출력 링크를 8개보다 많이 쓰면 다른 VPU가 필요합니다. C 시리즈 수량은 주문형(BTO) 최대 구성을 표시하므로 실제 장착 카드·VPU에 따라 달라질 수 있습니다.

- 원문: “Each VPU contains 8 source links and 8 outputs links.” — Aquilon User Manual v6.2, 66쪽.
- 원문: “A Screen using more than 8 outputs uses another VPU.” — Aquilon User Manual v6.2, 68쪽.
- 4K60 출력의 용량 표 — 같은 매뉴얼, 61쪽.

### 2. 레이어 종류

라이브 입력이나 정지 이미지를 배경·전경 및 믹싱·분할 레이어에 사용할 수 있습니다. 믹싱 레이어는 용량을 소비하고, 분할 레이어는 두 개가 한 쌍으로 같은 용량을 씁니다.

- 원문: “4 mixer layers (or 4 pairs of split layers) spread over 4 outputs, in capacity 2.” — Aquilon User Manual v6.2, 66쪽.
- 배경의 라이브 입력·정지 화면 조건 — 같은 매뉴얼, 100쪽.
- 원문: “The content and output capacities must match.” — 같은 매뉴얼, 101쪽.

### 3. 화면당·장비 전체 레이어 수와 나눠 쓰는 방식

용량 2(4K60) 믹싱 레이어 한 개는 소스 링크 두 개를, 분할 레이어 한 쌍도 소스 링크 두 개를 씁니다. VPU 하나의 소스 링크는 8개이므로, VPU 하나에 2×2 4K60 화면 하나를 연결하면 화면당 최대 믹싱 4개 또는 분할 8개입니다. 모델 전체 화면 수와 레이어 총량은 각 모델의 공개 `layerPlan` 값에 따릅니다. 큰 모델은 이 화면 구성을 여러 개 만들 수 있으며, 화면 하나의 상한 자체를 늘리지는 않습니다.

- 원문: “Each VPU contains 8 source links and 8 outputs links.” — 66쪽.
- 원문: “Capacity 1 uses one link and capacity 2 uses two links, etc.” — 66쪽.
- 원문: “4 mixer layers (or 4 pairs of split layers) spread over 4 outputs, in capacity 2.” — 66쪽.
- 용량 2 레이어 구성 — 같은 매뉴얼, 79쪽.

### 4. 화면 크기·해상도(용량)에 따른 차이

용량은 출력 형식에 따라 정해집니다. 4K60은 용량 2이며, 다른 해상도에 대한 일반 조합 계산은 이번 카드에서 제공하지 않습니다.

- 출력 해상도별 용량 표 — Aquilon User Manual v6.2, 61쪽.
- 원문: “Capacity 1 uses one link and capacity 2 uses two links, etc.” — 66쪽.
- 원문: “When Optimized mode is enabled in one Screen, use only layers of capacity 2.” — 69쪽.

### 5. 여러 출력에 걸친 화면의 계산

2×2 4K60 화면 하나는 출력 4개, 출력 링크 8개를 씁니다. 한 화면이 출력 링크 5개 이상을 쓰고 용량 2 레이어가 하나 이상이면 해당 VPU의 Optimized mode가 적용되어 4링크 경계를 없앱니다. 화면이 8개 초과 출력 링크를 쓰면 다른 VPU가 필요합니다.

- 원문: “An Optimized mode is enabled for the whole VPU when one Screen uses at least 5 outputs links and at least one layer of capacity 2.” — Aquilon User Manual v6.2, 69쪽.
- 원문: “The Optimized mode removes the 4 links boundary and configures the links to bring the best performance for layers of capacity 2.” — 69쪽.
- 원문: “A Screen using more than 8 outputs uses another VPU.” — 68쪽.

### 6. 레이어 없는 화면

레이어를 배치하지 않는 화면은 처리 자원을 쓰지 않습니다. 다만 프로그램 출력·물리 커넥터 수 한도에는 포함됩니다.

- 원문: “Consume zero processing resources: Yes.” — Aquilon User Manual v6.2, 66쪽.

### 7. PiP

화면 전체 레이어와 출력 내부 PiP는 같은 처리 링크를 사용하므로, PiP를 만든다고 링크가 절약되지는 않습니다. Region Captive PiPs라는 용어는 RS1 데이터시트 3쪽에 있으며 매뉴얼 83쪽은 화면 영역 제한을 설명하지만 절감 산식은 제시하지 않습니다.

- Region Captive PiPs 용어 — Aquilon RS1 Technical Datasheet, 3쪽.
- 원문: “Set Screen regions to optimize layer resources by limiting layers to specific outputs of a Screen.” — Aquilon User Manual v6.2, 83쪽.
- 레이어·출력 연결 예시 — 같은 매뉴얼, 67–68쪽 그림.

### 8. 확인되지 않은 점

- 출력 링크가 8개 이하인 화면의 레이어를 두 VPU에 나눠 배치할 수 있는지.
- 용량 1(HD)과 용량 2(4K60) 레이어를 섞을 때의 자원 비용. 매뉴얼은 Optimized mode에서 용량 2만 사용할 것을 권고합니다(69쪽).
- Region Captive PiP의 레이어 절감 산식.
- 배경 콘텐츠는 출력 용량과 맞아야 하며 확대·축소되지 않습니다. 예를 들어 2×2 4K60 화면에는 각 출력마다 4K60 소스가 필요합니다(101쪽).
- 관련 원문: “When Optimized mode is enabled in one Screen, use only layers of capacity 2.” — Aquilon User Manual v6.2, 69쪽; “The content and output capacities must match.” — 같은 매뉴얼, 101쪽. 이 문장들은 혼합 용량 비용이나 Region Captive 절감량의 산식을 제시하지 않습니다.

## Alta 4K · Zenith 100 · Zenith 200

### 1. 화면(Screen)·출력·AUX의 관계

모델마다 만들 수 있는 4K60 프로그램 화면 수가 다릅니다. Zenith 100은 최대 3개, Zenith 200은 최대 4개이며, 화면 수가 최대인 구성에서 AUX 수는 각각 1개·2개입니다. 별도 출력은 화면 또는 AUX 용도로 배정합니다.

- Alta 4K User Manual의 화면·출력 한도 표 — 50쪽.
- 출력별 화면 수와 AUX 배분표 — 같은 매뉴얼, 43쪽.
- 2×2 격자 구성은 같은 매뉴얼, 52쪽.
- 원문: “Max Program Screen outputs” / “Max Aux outputs” — Alta 4K User Manual, 25쪽 표. 화면 최대 수는 50쪽, 출력 배분은 43쪽 표를 따른다.

### 2. 레이어 종류

한 개의 레이어 자원은 믹싱 레이어 하나 또는 분할 레이어 한 쌍입니다. 각 라이브 화면에는 표의 레이어와 별도로 배경 하나와 전경 하나가 있습니다.

- 원문: “One Layer resource = one Mixing layer or one pair of Split layers allocated to a Screen.” — Alta 4K User Manual, 42쪽.
- 원문: “A live Screen always has one background layer and one foreground layer.” — 같은 매뉴얼, 46쪽.
- 배경 콘텐츠 — Zenith Technical Datasheet 1쪽: “Background layer live or still image”.
- 원문: “Mixing layers allow cross transitions with both contents visible at the same time during the transition (seamless transition).” — Alta 4K User Manual, 46쪽.
- 원문: “In Split layers mode, seamless transitions are not possible, one content will disappear before the new one is visible.” — 같은 매뉴얼, 46쪽.

### 3. 화면당·장비 전체 레이어 수와 나눠 쓰는 방식

레이어 자원은 장비 전체 풀에서 화면별로 나눠 배정합니다. 최대 화면 수 구성에서는 화면마다 자원 하나(믹싱 1개 또는 분할 2개)를 배정하며, 한 화면에 집중하면 Zenith 100은 믹싱 3개 또는 분할 6개, Zenith 200은 믹싱 4개 또는 분할 8개까지입니다.

- 원문: “Three Layer resources can be allocated to four different outputs.” / “Four Layer resources can be allocated to six different outputs.” — Alta 4K User Manual, 42쪽.
- 원문: “One Layer resource = one Mixing layer or one pair of Split layers allocated to a Screen.” — 42쪽.
- 화면별 자원 배분 표 및 예 — 같은 매뉴얼, 43쪽.
- 원문: “The number of live layers is set by the user when assigning layer resources to live Screens.” — 같은 매뉴얼, 46쪽.

### 4. 화면 크기·해상도(용량)에 따른 차이

이번 기준 카드는 공개 데이터의 4K 레이어 수를 표시합니다. 4K와 HD 레이어를 섞을 때 자원 비용은 공식 자료에 산식이 없어 미확인으로 둡니다.

- 원문: “4K layers in total” — Alta 4K User Manual, 25쪽 표.
- 모델별 4K 레이어 총량은 Zenith 100·200 Technical Datasheet, 6쪽.
- 원문: “One Layer resource = one Mixing layer or one pair of Split layers allocated to a Screen.” — Alta 4K User Manual, 42쪽. (레이어 자원 단위)
- 원문: “This layer mode consumes half the processing resources compared to mixing layers and doubles the number of layers available on Screen.” — 같은 매뉴얼, 46쪽.

### 5. 여러 출력에 걸친 화면의 계산

여러 출력을 한 화면으로 묶어도 그 화면에 배정한 레이어 자원을 사용합니다. Zenith 200은 2×2 격자를 지원합니다. Zenith 100은 최대 프로그램 출력이 3개여서 출력 4개가 필요한 2×2를 만들 수 없습니다.

- 화면별 레이어 자원 배정 — Alta 4K User Manual, 42–43쪽.
- 2×2 격자 지원 — 같은 매뉴얼, 52쪽.
- Zenith 100 출력 한도 — 같은 매뉴얼, 25쪽 표.
- 원문: “One Layer resource = one Mixing layer or one pair of Split layers allocated to a Screen.” — Alta 4K User Manual, 42쪽.
- 원문: “A live Screen always has one background layer and one foreground layer.” — 같은 매뉴얼, 46쪽. 화면에 배정된 라이브 레이어 수는 이 두 레이어와 별도로 계산한다.

### 6. 레이어 없는 화면

Alta AUX는 레이어 자원을 소비하지 않는 출력으로 구성할 수 있습니다.

- 원문: “Up to two outputs without layer resources can be used as Aux.” (Zenith 100) / “Up to four outputs without layer resources can be used as Aux.” (Zenith 200) — Alta 4K User Manual, 42쪽.

### 7. PiP

화면 안 작은 창(PiP)은 화면에 배정한 레이어 자원을 사용합니다. 공식 자료는 별도 PiP 최대 개수를 제시하지 않습니다.

- 라이브 화면 레이어 구조 — Alta 4K User Manual, 46쪽.
- 원문: “A live Screen always has one background layer and one foreground layer.” — Alta 4K User Manual, 46쪽.
- 별도 PiP 개수 표기는 해당 매뉴얼·모델 데이터시트에 없음.

### 8. 확인되지 않은 점

- 레이어 하나가 여러 출력 경계를 가로지를 때 자원이 추가되는지.
- 4K와 HD 레이어를 함께 쓸 때 추가되는 자원 비용.
- 표에 없는 별도 PiP 자원 풀이나 추가 PiP 최대 개수.
- 관련 원문: “One Layer resource = one Mixing layer or one pair of Split layers allocated to a Screen.” — Alta 4K User Manual, 42쪽. 매뉴얼은 자원 단위를 설명하지만 화면 경계 초과나 HD 혼합 비용은 제시하지 않습니다.

## Midra 4K · Pulse 4K · Eikos 4K

### 1. 화면(Screen)·출력·AUX의 관계

Mixer는 단일 출력 프로그램 화면, Matrix는 독립된 단일 출력 화면 두 개를 구성합니다. Pulse 4K·Eikos 4K 모두 Matrix는 출력 두 개를 각각 별도 화면으로 사용합니다. Eikos 4K는 별도로 출력 두 개를 이어 블렌딩 화면 하나를 만들 수 있습니다. Mixer에서만 1080p60 AUX 한 개를 함께 구성할 수 있습니다.

- 원문: “One single output Program Screen with a format up to 4096 x 2160 @60Hz.” — Midra 4K User Manual, 42쪽.
- 원문: “Two independent single output Program Screens with formats up to 4096 x 2160 @60Hz.” — 같은 매뉴얼, 42쪽.
- 원문: “One single output Aux. Screen with a format up to 1920 x 1080 @60Hz.” — 같은 매뉴얼, 42쪽.
- Eikos 블렌딩: “One Program Screen using two outputs with a total resolution up to 2x 4096 x 2160 @60Hz.” — 같은 매뉴얼, 42쪽.
- Mixer·Matrix·AUX 수치 — Pulse 4K Technical Datasheet, 5쪽; Eikos 4K Technical Datasheet, 6쪽.
- 원문: “1 PGM output up to 4K60, with 1 live background + 2 mixing 4K layers (or 4 split layers) + 1 foreground 4K image layer.” — Pulse 4K Technical Datasheet, 5쪽.

### 2. 레이어 종류

라이브 화면마다 배경 하나와 전경 하나가 따로 있습니다. 배경은 라이브 입력이나 이미지입니다. 믹싱·분할 레이어는 화면 위의 영상 레이어이며, 분할은 믹싱 대비 절반의 자원을 써서 두 배의 레이어를 구성합니다. AUX 화면에는 크기 조절이 되지 않는 레이어 하나가 있습니다.

- 원문: “The Pulse 4K and the Eikos 4K can use Images or Live Inputs as Background content.” — Midra 4K User Manual, 25쪽.
- 원문: “This layer mode consumes half the processing resources compared to mixing layers and doubles the number of layers available on Screen.” — 같은 매뉴얼, 44쪽.
- 원문: “An Aux. Screen has only one unscalable layer…” — 같은 매뉴얼, 44쪽.
- 라이브 화면 배경·전경 — Alta 4K User Manual, 46쪽.
- 원문: “This Screen has one Background layer, up to four Live layers* and one Foreground layer.” — Midra 4K User Manual, 42쪽.

### 3. 화면당·장비 전체 레이어 수와 나눠 쓰는 방식

모드에 따라 고정된 레이어 수를 사용합니다. Mixer는 화면 하나에 믹싱 2개 또는 분할 4개, Matrix는 두 화면 각각 믹싱 1개 또는 분할 2개입니다. 이때 장비 전체 합계는 믹싱 2개 또는 분할 4개입니다. Eikos의 두 출력 블렌딩 화면도 믹싱 2개 또는 분할 4개입니다.

- 모드별 레이어 수 — Pulse 4K Technical Datasheet, 5쪽; Eikos 4K Technical Datasheet, 6쪽.
- 원문: “2 PGM outputs up to 4K60, with 1 live background + 1 mixing 4K layer (or 2 split layers) + 1 foreground 4K image layer per output.” — Pulse 4K Technical Datasheet, 5쪽.
- 분할 모드 설명 — Midra 4K User Manual, 44쪽.

### 4. 화면 크기·해상도(용량)에 따른 차이

Midra 4K의 공식 구성은 4K60 화면 기준입니다. 공개 데이터에는 모델별 모드 수를 표시하고, 4K·HD 레이어 혼합 비용은 미확인입니다.

- 원문: “One single output Program Screen with a format up to 4096 x 2160 @60Hz.” — Midra 4K User Manual, 42쪽.
- 원문: “One single output Aux. Screen with a format up to 1920 x 1080 @60Hz.” — 같은 매뉴얼, 42쪽. 모델별 레이어 수와 모드는 제품 데이터시트의 운영 모드 표를 따른다.
- Mixer·Matrix 출력 및 레이어 조건 — Pulse 4K Technical Datasheet, 5쪽; Eikos 4K Technical Datasheet, 6쪽.

### 5. 여러 출력에 걸친 화면의 계산

두 출력 블렌딩은 한 개의 화면으로 계산하며 독립 화면 두 개와 구분합니다. 이 구성은 Eikos 4K에서 지원됩니다.

- 원문: “One Program Screen using two outputs with a total resolution up to 2x 4096 x 2160 @60Hz.” — Midra 4K User Manual, 42쪽.
- Eikos 4K의 화면당 레이어 수 — Eikos 4K Technical Datasheet, 6쪽.
- 원문: “1 hard/soft edge PGM (Horizontal or Vertical) with 2 outputs up to 4K60, with live background + 2 mixing 4K layers (or 4 split layers) + 1 foreground 4K image layer.” — Eikos 4K Technical Datasheet, 6쪽.

### 6. 레이어 없는 화면

Midra 문서에는 레이어 없는 프로그램 화면의 비용 규칙이 없습니다. Mixer 모드의 AUX는 레이어 없는 화면이 아니며, 크기 조절 불가 레이어 하나를 사용합니다.

- 원문: “Aux. Screen has only one unscalable layer that can display a Live Input, the Program of Screen, or a solid color.” — Midra 4K User Manual, 44쪽.
- 원문: “One single output Aux. Screen with a format up to 1920 x 1080 @60Hz.” — 같은 매뉴얼, 42쪽.
- 모델별 AUX 지원 — Pulse 4K Technical Datasheet, 5쪽; Eikos 4K Technical Datasheet, 6쪽.
- Pulse 4K의 보조 출력 한도는 1080p60 1개이며, Eikos 4K는 자체 데이터시트의 Mixer 모드 AUX 표기를 따른다(각 제품 데이터시트 5·6쪽).

### 7. PiP

공식 자료에는 화면 레이어 최대 개수만 있고, 별도 PiP 최대 개수는 적혀 있지 않습니다. 화면 표의 레이어 수를 넘는 PiP 수를 추정하지 않습니다.

- 모드별 화면 레이어 — Pulse 4K Technical Datasheet, 5쪽; Eikos 4K Technical Datasheet, 6쪽.
- 관련 원문: “This layer mode consumes half the processing resources compared to mixing layers and doubles the number of layers available on Screen.” — Midra 4K User Manual, 44쪽. 별도의 PiP 최대 수 문장은 두 모델 데이터시트에 없다.

### 8. 확인되지 않은 점

- 4K와 HD 레이어를 섞을 때의 자원 비용.
- 별도 PiP 자원 풀 또는 모드별 레이어 수를 넘어서는 PiP 수.
- 공식 자료에 명시되지 않은 화면·출력 조합.
- 관련 원문: “This Screen has one Background layer, up to four Live layers* and one Foreground layer.” — Midra 4K User Manual, 42쪽. 모드별 레이어 한도와 분할 설명(44쪽)은 PiP 별도 풀이나 HD 혼합 비용을 정량화하지 않습니다.

## 확인 자료

| 자료 | URL | SHA-256 | 쪽 |
|---|---|---|---|
| Aquilon User Manual v6.2 | https://dwn01.analogway.com/Site+Internet/Series/Aquilon/Common/User+Manual/AW_Aquilon_UserManual_v6.2.pdf | `7578752f65ce92616a8d430245cebeed924e683e97f8406c16a5d403967f3779` | 61–69·71·79·83·100–101 |
| Midra 4K User Manual, 2026-05-21 | https://dwn01.analogway.com/Site+Internet/Series/Midra+4k/Common/User+Manual/AW_Midra4K_UserManual_20260521.pdf | `9303207266f76f89afca81601c0cf60e6c24b8ed54ba868d9b2d212842941d5b` | 25·42·44 |
| Alta 4K User Manual, 2026-05-21 | https://dwn01.analogway.com/Site+Internet/Series/Alta+4k/Common/User+Manual/AW_Alta4K_UserManual_20260521.pdf | `07bbed99073102d6e95cd7cb57952d2aa45b58943f72003ef10be96b460daa7b` | 25·42–43·46·50·52 |
| Pulse 4K Technical Datasheet, 2026-05-21 | https://dwn01.analogway.com/Site+Internet/Series/Midra+4k/Products/Pulse+4k/Technical+Datasheet/AW_Midra4K_Pulse4K_Datasheet_en_20260521.pdf | `2b5bf3d89e0effede01722c0a734b8ed06ab695a144e4b1745ab21a8fb65f2e7` | 5 |
| Eikos 4K Technical Datasheet, 2026-05-21 | https://dwn01.analogway.com/Site+Internet/Series/Midra+4k/Products/Eikos+4k/Technical+Datasheet/AW_Midra4K_Eikos4K_Datasheet_en_20260521.pdf | `f9501259f270e17dcdee476a8280bae553ea3648752135b9bec27bd24274ebe2` | 6 |
| Zenith 100 / 200 Technical Datasheet, 2026-05-21 | 제조사 공식 Alta 4K 데이터시트 | 제품별 SHA는 `Work/기록/W-20261016-011-근거표.md` 참조 | 1·6 |

## 해석 범위

표의 수치는 제품 JSON의 `layerPlan`·`videoLayerPlan`에서 읽습니다. 이 문서는 계산을 위해 새로운 제품 수치를 만들지 않으며, XDM-WOS100 비교 범위를 확장하지 않습니다. C 시리즈 표시는 BTO 최대 구성 기준입니다.
