// 결정적 직렬화(기반명세 §8.4). 같은 구성은 같은 바이트가 된다.
// 키 순서를 객체를 다시 만들어 고정하고, 화면 전용 값은 버린다.
import { BASE_LINE_TYPE_IDS, DEFAULT_RULES } from './defaults.mjs';
import { NODE_WIDTH, nodeHeight } from './geometry.mjs';
import { computeIssues } from './issues.mjs';
import { equipmentPorts } from './library.mjs';

const round = value => Math.round(Number(value) * 10) / 10;
const position = p => ({ x: round(p?.x ?? 0), y: round(p?.y ?? 0) });
const pick = (source, keys) => {
  const out = {};
  for (const key of keys) if (source[key] !== undefined) out[key] = source[key];
  return out;
};

export const PORT_KEYS = ['id', 'label', 'type', 'direction', 'connector', 'signals', 'verification', 'portalIo'];
export const EQUIPMENT_DATA_KEYS = ['id', 'category', 'name', 'model', 'manufacturer', 'description', 'series', 'inputs', 'outputs', 'bidirectional', 'imageUrl', 'isReused', 'portal'];
export const PORTAL_KEYS = ['productId', 'source', 'unit', 'variant', 'detailUrl'];
export const ANNOTATION_DATA_KEYS = ['label', 'fontSize', 'fontColor', 'bgColor', 'bgOpacity', 'borderColor', 'borderStyle', 'borderRadius', 'textAlign', 'locked'];
export const SHAPE_DATA_KEYS = ['shapeType', 'label', 'fontSize', 'fontColor', 'bgColor', 'bgOpacity', 'borderColor', 'borderStyle', 'borderWidth'];
export const BOM_ROW_KEYS = ['cableType', 'productName', 'lineTypeId', 'length', 'quantity'];

export function normalizePort(port) {
  const out = pick(port, PORT_KEYS);
  if (out.signals) out.signals = [...out.signals];
  if (out.portalIo) out.portalIo = pick(out.portalIo, ['group', 'connector', 'signal']);
  return out;
}

export function normalizeEquipmentData(data) {
  const out = pick(data, EQUIPMENT_DATA_KEYS);
  if (!out.series) delete out.series;
  if (!out.imageUrl) delete out.imageUrl;
  for (const key of ['inputs', 'outputs', 'bidirectional']) out[key] = (data[key] ?? []).map(normalizePort);
  out.isReused = Boolean(data.isReused);
  if (data.portal) out.portal = pick(data.portal, PORTAL_KEYS);
  // pick이 키 순서를 정하지만 isReused를 기본값으로 채운 뒤 순서를 다시 맞춘다
  return pick(out, EQUIPMENT_DATA_KEYS);
}

function normalizeNode(node) {
  if (node.type === 'equipment') {
    const data = normalizeEquipmentData(node.data);
    return { id: node.id, type: 'equipment', position: position(node.position), data, measured: { width: NODE_WIDTH, height: nodeHeight(data) }, sourcePosition: 'right', targetPosition: 'left' };
  }
  const keys = node.type === 'annotation' ? ANNOTATION_DATA_KEYS : SHAPE_DATA_KEYS;
  const style = { width: round(node.style?.width ?? 0), height: round(node.style?.height ?? 0) };
  return { id: node.id, type: node.type, position: position(node.position), style, data: pick(node.data ?? {}, keys), measured: { ...style } };
}

function normalizeEdge(edge) {
  const data = { lineTypeId: edge.data.lineTypeId, signal: edge.data.signal };
  if (edge.data.label) data.label = edge.data.label;
  if (edge.data.bomRows?.length) data.bomRows = edge.data.bomRows.map(row => pick(row, BOM_ROW_KEYS));
  return {
    id: edge.id,
    type: 'smoothstep',
    source: edge.source,
    sourceHandle: edge.sourceHandle,
    target: edge.target,
    targetHandle: edge.targetHandle,
    animated: false,
    style: { stroke: edge.style?.stroke, strokeWidth: 2 },
    data,
  };
}

const NODE_ORDER = { shape: 0, equipment: 1, annotation: 2 };
const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

// 1.2 파일 객체를 만든다. library(createLibraryIndex 결과)를 주면 library-drift·product-removed까지 계산한다
export function normalizeDiagram(diagram, { library = null, rules = library?.rules ?? DEFAULT_RULES } = {}) {
  const nodes = diagram.nodes.map(normalizeNode).sort((a, b) => (NODE_ORDER[a.type] - NODE_ORDER[b.type]) || byId(a, b));
  const edges = diagram.edges.map(normalizeEdge).sort(byId);
  const used = new Set(BASE_LINE_TYPE_IDS);
  for (const node of nodes) if (node.type === 'equipment') for (const port of equipmentPorts(node.data)) used.add(port.type);
  for (const edge of edges) used.add(edge.data.lineTypeId);
  const known = new Map([...rules.lineTypes, ...(diagram.lineTypes ?? [])].map(lineType => [lineType.id, lineType]));
  const lineTypes = [...used].sort().map(id => {
    const lineType = known.get(id);
    if (!lineType) throw new Error(`정의가 없는 선 종류: ${id}`);
    return { id: lineType.id, name: lineType.name, color: lineType.color };
  });
  const units = new Map();
  for (const node of nodes) if (node.type === 'equipment' && !units.has(node.data.id)) {
    const { isReused, ...rest } = node.data;
    units.set(node.data.id, rest);
  }
  const equipmentDB = [...units.values()].sort(byId);
  const normalized = {
    version: '1.2',
    nodes,
    edges,
    lineTypes,
    equipmentDB,
    generator: pick(diagram.generator ?? {}, ['app', 'version']),
    library: diagram.library ? { schemaVersion: diagram.library.schemaVersion, source: pick(diagram.library.source ?? {}, ['catalogSha', 'detailSetSha', 'rtcomSha', 'vocabularyVersion']) } : null,
    issues: [],
  };
  if (!normalized.library) delete normalized.library;
  normalized.issues = computeIssues(normalized, { library, rules });
  return normalized;
}

export const serializeDiagram = (diagram, options) => `${JSON.stringify(normalizeDiagram(diagram, options), null, 2)}\n`;
