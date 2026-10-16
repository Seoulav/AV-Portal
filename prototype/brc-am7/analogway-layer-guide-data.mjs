// W-20261016-019: Analog Way 화면·레이어 설계 가이드의 모델 데이터.
// 수치는 포털 제품 JSON의 layerPlan(W-010)·videoLayerPlan(W-011)과 같은 값이며, 근거 쪽은 아래 evidence에 적는다.
// 공식 문서에 없는 규칙은 쓰지 않는다. 가정은 assumptions에 적고 화면에 "미확인"으로 표시한다.

// Aquilon: Aquilon User Manual v6.2 61쪽(4K60 출력·레이어 = 용량 2), 66쪽(VPU 소스 링크 8·출력 링크 8, 용량 n = 링크 n개),
// 67쪽(VPU 하나가 화면 최대 8개), 68쪽(출력 링크 5개 이상 + 용량 2 레이어 = Optimized mode, 용량 2 레이어만 권고).
// 모델별 VPU·PGM 출력·입력·출력 커넥터: 브로슈어 7쪽·데이터시트 가족표(W-010 layerPlan과 동일).
// AUX: 데이터시트 "Ability to create layers on AUX outputs without using processing resources".
export const AQUILON_RULES = Object.freeze({
  vpuSourceLinks: 8,
  vpuOutputLinks: 8,
  output4k60Capacity: 2,
  mixingLayerLinks: 2,
  splitLayerLinks: 1,
  maxScreensPerVpu: 8,
  evidence: 'Aquilon User Manual v6.2 61·66·67·68쪽'
});

// Alta 4K: Alta 4K User Manual 25쪽(가족표), 42쪽(Layer resource = 믹싱 1 또는 분할 1쌍, Zenith 100 자원 3/출력 4, Zenith 200 자원 4/출력 6, 자원 없는 출력 = AUX 최대 2/4), 43쪽(구성 예시).
// Midra 4K: Midra 4K User Manual 41–42쪽(Mixer·Matrix·Blend 모드), 데이터시트 5·6쪽(시스템당 분할 4 = 믹싱 2).

export const models = Object.freeze([
  { slug: 'pulse-4k', model: 'Pulse 4K', series: 'Midra 4K', family: 'midra', order: 10, inputs4k: 8, inputs2k: 2, outputs: 2, blendMode: false, liveLayersPerSystem: 4, evidence: 'Midra 4K User Manual 41–42쪽 · Pulse 4K 데이터시트 5쪽' },
  { slug: 'eikos-4k', model: 'Eikos 4K', series: 'Midra 4K', family: 'midra', order: 20, inputs4k: 8, inputs2k: 2, outputs: 2, blendMode: true, liveLayersPerSystem: 4, evidence: 'Midra 4K User Manual 41–42쪽 · Eikos 4K 데이터시트 6쪽' },
  { slug: 'zenith-100', model: 'Zenith 100', series: 'Alta 4K', family: 'alta', order: 30, inputs4k: 11, inputs2k: 2, outputs: 4, maxPgmOutputs: 3, maxAux: 2, layerResources: 3, evidence: 'Alta 4K User Manual 25·42–43쪽 · Zenith 100 데이터시트 6쪽' },
  { slug: 'zenith-200', model: 'Zenith 200', series: 'Alta 4K', family: 'alta', order: 40, inputs4k: 14, inputs2k: 2, outputs: 6, maxPgmOutputs: 4, maxAux: 4, layerResources: 4, evidence: 'Alta 4K User Manual 25·42–43쪽 · Zenith 200 데이터시트 6쪽' },
  { slug: 'aquilon-rsalpha', model: 'Aquilon RS alpha', series: 'Aquilon RS', family: 'aquilon', order: 50, inputs4k: 8, outputConnectors4k: 4, programOutputs4k: 4, vpus: 1, mixingLayers4k: 4, evidence: 'Aquilon 브로슈어 7쪽 · 포털 layerPlan' },
  { slug: 'aquilon-rs1', model: 'Aquilon RS1', series: 'Aquilon RS', family: 'aquilon', order: 60, inputs4k: 16, outputConnectors4k: 8, programOutputs4k: 4, vpus: 1, mixingLayers4k: 4, evidence: 'Aquilon RS1 데이터시트 1쪽 · 포털 layerPlan' },
  { slug: 'aquilon-rs2', model: 'Aquilon RS2', series: 'Aquilon RS', family: 'aquilon', order: 70, inputs4k: 16, outputConnectors4k: 12, programOutputs4k: 8, vpus: 2, mixingLayers4k: 8, evidence: 'Aquilon RS2 데이터시트 1쪽 · 포털 layerPlan' },
  { slug: 'aquilon-rs3', model: 'Aquilon RS3', series: 'Aquilon RS', family: 'aquilon', order: 80, inputs4k: 24, outputConnectors4k: 12, programOutputs4k: 8, vpus: 2, mixingLayers4k: 8, evidence: 'Aquilon 브로슈어 7쪽 · 포털 layerPlan' },
  { slug: 'aquilon-rs4', model: 'Aquilon RS4', series: 'Aquilon RS', family: 'aquilon', order: 90, inputs4k: 24, outputConnectors4k: 16, programOutputs4k: 12, vpus: 3, mixingLayers4k: 12, evidence: 'Aquilon RS4 데이터시트 1쪽 · 포털 layerPlan' },
  { slug: 'aquilon-rs5', model: 'Aquilon RS5', series: 'Aquilon RS', family: 'aquilon', order: 100, inputs4k: 32, outputConnectors4k: 16, programOutputs4k: 12, vpus: 3, mixingLayers4k: 12, evidence: 'Aquilon 브로슈어 7쪽 · 포털 layerPlan' },
  { slug: 'aquilon-rs6', model: 'Aquilon RS6', series: 'Aquilon RS', family: 'aquilon', order: 110, inputs4k: 32, outputConnectors4k: 20, programOutputs4k: 16, vpus: 4, mixingLayers4k: 16, evidence: 'Aquilon RS6 데이터시트 1쪽 · 포털 layerPlan' }
]);

export const guideSlugs = Object.freeze(models.map(model => model.slug));

// 화면 구성 선택지. outputs = 4K60 출력 수. 매뉴얼 용량표에서 4K60 출력 1개 = 용량 2.
export const screenShapes = Object.freeze([
  { id: 'single', label: '4K60 화면 (출력 1)', outputs: 1 },
  { id: 'dual', label: '2×1 · 1×2 화면 (출력 2)', outputs: 2 },
  { id: 'triple', label: '3×1 화면 (출력 3)', outputs: 3 },
  { id: 'quad', label: '2×2 · 4×1 화면 (출력 4, 8K급)', outputs: 4 }
]);

export const presets = Object.freeze([
  { id: 'led-8k', label: '8K LED월 1면(2×2) + 믹싱 4', screens: [{ shape: 'quad', layerType: 'mixing', layers: 4 }], aux: 0, inputs: 6 },
  { id: 'three-4k', label: '4K 화면 3개 · 믹싱 2씩 + AUX 2', screens: [{ shape: 'single', layerType: 'mixing', layers: 2 }, { shape: 'single', layerType: 'mixing', layers: 2 }, { shape: 'single', layerType: 'mixing', layers: 2 }], aux: 2, inputs: 8 },
  { id: 'one-4k', label: '4K 화면 1개 · 분할 4 + AUX 1', screens: [{ shape: 'single', layerType: 'split', layers: 4 }], aux: 1, inputs: 4 }
]);

export const assumptions = Object.freeze([
  'Aquilon: 화면 하나의 링크는 VPU 하나 안에서만 계산합니다. 한 화면을 VPU 두 개에 나눠 쓸 수 있는지는 매뉴얼에 없어 미확인입니다(W-010).',
  'Aquilon: 레이어는 모두 용량 2(4K60)로 계산합니다. 용량 1(HD) 레이어를 섞을 때의 비용은 미확인이며, 매뉴얼 69쪽은 Optimized mode에서 용량 2 레이어만 쓰도록 권고합니다.',
  'Aquilon: 출력 링크 5개 이상 화면은 Optimized mode(매뉴얼 68쪽)로 보고 4링크 경계 추가 비용을 더하지 않습니다.',
  'Alta 4K: 레이어가 출력 경계를 넘을 때 추가 자원이 드는지는 미확인입니다(W-011). 자원 수는 화면에 배정한 수만 셉니다.',
  'AUX 출력은 처리 자원을 쓰지 않는 것으로 계산합니다(Aquilon 데이터시트, Alta 4K 매뉴얼 42쪽). Midra 4K AUX는 1080p 1개입니다.'
]);
