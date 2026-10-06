// 키 순서·필드 정리(기반명세 §3.4·§8.2·§8.3). serialize·issues가 함께 쓴다.

export const PORT_KEYS = ['id', 'label', 'type', 'direction', 'connector', 'signals', 'verification', 'portalIo'];
export const EQUIPMENT_DATA_KEYS = ['id', 'category', 'name', 'model', 'manufacturer', 'description', 'series', 'inputs', 'outputs', 'bidirectional', 'imageUrl', 'isReused', 'portal'];
export const PORTAL_KEYS = ['productId', 'source', 'unit', 'variant', 'detailUrl'];
export const ANNOTATION_DATA_KEYS = ['label', 'fontSize', 'fontColor', 'bgColor', 'bgOpacity', 'borderColor', 'borderStyle', 'borderRadius', 'textAlign', 'locked'];
export const SHAPE_DATA_KEYS = ['shapeType', 'label', 'fontSize', 'fontColor', 'bgColor', 'bgOpacity', 'borderColor', 'borderStyle', 'borderWidth', 'locked'];
export const BOM_ROW_KEYS = ['cableType', 'productName', 'lineTypeId', 'length', 'quantity'];
export const PORT_LISTS = Object.freeze({ inputs: 'in', outputs: 'out', bidirectional: 'both' });

// 순수 데이터 복사. structuredClone은 Proxy(상태 관리 라이브러리의 초안 객체 등)에서 실패하므로 쓰지 않는다
export const clone = value => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

export function pick(source, keys) {
  const out = {};
  for (const key of keys) if (source?.[key] !== undefined) out[key] = source[key];
  return out;
}

export function normalizePort(port) {
  const out = pick(port, PORT_KEYS);
  if (Array.isArray(out.signals)) out.signals = [...out.signals];
  if (out.portalIo) out.portalIo = pick(out.portalIo, ['group', 'connector', 'signal']);
  return out;
}

// 장비 노드 data(또는 라이브러리 equipment). withReused=false면 isReused를 넣지 않는다
export function normalizeEquipmentData(data, { withReused = true } = {}) {
  const out = pick(data, EQUIPMENT_DATA_KEYS);
  if (!out.series) delete out.series;
  if (!out.imageUrl) delete out.imageUrl;
  for (const key of Object.keys(PORT_LISTS)) out[key] = Array.isArray(data[key]) ? data[key].map(normalizePort) : [];
  if (withReused) out.isReused = Boolean(data.isReused);
  else delete out.isReused;
  if (data.portal) out.portal = pick(data.portal, PORTAL_KEYS);
  return pick(out, EQUIPMENT_DATA_KEYS);
}
