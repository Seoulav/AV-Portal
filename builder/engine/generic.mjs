// 빌더 전용 일반 장비(B-20261016-02). Portal 제품이 아닌 소스 기기(PC·노트북)를 구성도에 놓기 위한 것이다.
// 사용자 결정(2026-10-16): "빌더 전용 '일반 장비'로 추가", 영상 출력은 "HDMI 또는 DP를 내가 직접 선택해서 불러오면 좋겠어".
// - 라이브러리 목록에만 나타나고 Portal 카탈로그·상세에는 없다(portal.source 'builder').
// - 견적 앱은 이 장비로 장비 행을 만들지 않는다(고객 지참·별도 장비). 연결선의 케이블은 그대로 산정한다.
// - 단자는 고른 영상 출력 하나다. 더 필요하면 장비 설정 창에서 단자를 더한다.

export const GENERIC_SOURCE = 'builder';
export const GENERIC_CATEGORY = '소스 기기';

// 일반 장비 단자의 검증 상태. Portal 근거가 아니라 빌더가 정한 표준 단자라서 확인 배지·경고를 내지 않는다
export const GENERIC_VERIFICATION = 'GENERIC';

const VIDEO_OUTPUTS = Object.freeze({
  hdmi: { label: 'HDMI', port: { id: 'out-hdmi-1', label: 'HDMI Out 1', type: 'video', direction: 'out', connector: 'HDMI', signals: ['HDMI'], verification: GENERIC_VERIFICATION } },
  dp: { label: 'DP', port: { id: 'out-dp-1', label: 'DP Out 1', type: 'lt-1784014150344', direction: 'out', connector: 'DP', signals: ['DP'], verification: GENERIC_VERIFICATION } },
});

const KINDS = Object.freeze([
  { productId: 'generic-pc', product: 'PC', description: '빌더 전용 일반 장비(PC). Portal 제품이 아니며 견적 장비 행을 만들지 않는다.' },
  { productId: 'generic-laptop', product: '노트북', description: '빌더 전용 일반 장비(노트북). Portal 제품이 아니며 견적 장비 행을 만들지 않는다.' },
]);

function unitOf(kind, outputKey) {
  const output = VIDEO_OUTPUTS[outputKey];
  const unitId = `${kind.productId}:${outputKey}`;
  return {
    unitId,
    equipment: {
      id: unitId,
      category: 'etc',
      name: GENERIC_CATEGORY,
      model: `${kind.product} (${output.label})`,
      manufacturer: '일반',
      description: kind.description,
      inputs: [],
      outputs: [{ ...output.port, signals: [...output.port.signals] }],
      bidirectional: [],
      // variant는 "시리즈에서 고른 모델"이라 쓰지 않는다(시리즈 구성 미정 경고가 난다). HDMI·DP 구분은 unitId·model로 한다
      portal: { productId: kind.productId, source: GENERIC_SOURCE, detailUrl: '' },
    },
  };
}

export const GENERIC_PRODUCTS = Object.freeze(KINDS.map(kind => ({
  productId: kind.productId,
  source: GENERIC_SOURCE,
  brand: '일반',
  product: kind.product,
  categories: [GENERIC_CATEGORY, GENERIC_CATEGORY, kind.product],
  detailUrl: '',
  placeable: true,
  units: Object.keys(VIDEO_OUTPUTS).map(key => unitOf(kind, key)),
  readiness: { ioRows: 0, ports: 1, unresolvedRows: 0, nonPortRows: 0 },
})));

export const isGenericEquipment = data => data?.portal?.source === GENERIC_SOURCE;

// Portal 라이브러리 뒤에 일반 장비를 붙인다. 같은 productId가 이미 있으면(앞으로 Portal이 낼 경우) Portal 쪽을 둔다
export function withGenericProducts(library) {
  const known = new Set(library.products.map(product => product.productId));
  return { ...library, products: [...library.products, ...GENERIC_PRODUCTS.filter(product => !known.has(product.productId)).map(product => structuredClone(product))] };
}
