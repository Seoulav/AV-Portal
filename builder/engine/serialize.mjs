// 결정적 직렬화(기반명세 §8.4). 같은 구성은 같은 바이트가 된다.
// 키 순서를 객체를 다시 만들어 고정하고, 화면 전용 값과 모르는 키는 버린다.
import { BASE_LINE_TYPE_IDS, DEFAULT_RULES } from './defaults.mjs';
import { NODE_WIDTH, nodeHeight } from './geometry.mjs';
import { computeIssues } from './issues.mjs';
import { equipmentPorts } from './library.mjs';
import { ANNOTATION_DATA_KEYS, BOM_ROW_KEYS, SHAPE_DATA_KEYS, normalizeEquipmentData, pick } from './normalize.mjs';

export { normalizeEquipmentData, normalizePort } from './normalize.mjs';

// 좌표·크기는 0.1 단위로 반올림한다
const round = value => Math.round(Number(value) * 10) / 10;
const position = p => ({ x: round(p?.x ?? 0), y: round(p?.y ?? 0) });

function normalizeNode(node) {
  if (node.type === 'equipment') {
    const data = normalizeEquipmentData(node.data ?? {});
    return { id: node.id, type: 'equipment', position: position(node.position), data, measured: { width: NODE_WIDTH, height: nodeHeight(data) }, sourcePosition: 'right', targetPosition: 'left' };
  }
  if (node.type !== 'annotation' && node.type !== 'shape') throw new Error(`알 수 없는 노드 type: ${node.type} (${node.id})`);
  const keys = node.type === 'annotation' ? ANNOTATION_DATA_KEYS : SHAPE_DATA_KEYS;
  const style = { width: round(node.style?.width ?? 0), height: round(node.style?.height ?? 0) };
  return { id: node.id, type: node.type, position: position(node.position), style, data: pick(node.data ?? {}, keys), measured: { ...style } };
}

function normalizeEdge(edge, colorOf) {
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
    // 선 색은 저장된 값이 아니라 선 종류에서 정한다(1.1의 style.stroke 자리)
    style: { stroke: colorOf(edge.data.lineTypeId), strokeWidth: 2 },
    data,
  };
}

const NODE_ORDER = { shape: 0, equipment: 1, annotation: 2 };
const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

// 선 종류 정의: 규칙 묶음의 정의를 먼저 보고, 없으면 파일에 적힌 정의를 쓴다
function lineTypeCatalog(rules, diagram) {
  const known = new Map((diagram.lineTypes ?? []).filter(item => item && typeof item.id === 'string').map(item => [item.id, item]));
  for (const item of rules.lineTypes) known.set(item.id, item);
  return known;
}

// 파생 값(lineTypes·equipmentDB)만 계산한다. 검증기가 저장된 값과 대조할 때도 쓴다
export function derivedParts(nodes, edges, known) {
  const used = new Set(BASE_LINE_TYPE_IDS);
  for (const node of nodes) if (node.type === 'equipment') for (const port of equipmentPorts(node.data)) used.add(port.type);
  for (const edge of edges) used.add(edge.data.lineTypeId);
  const lineTypes = [...used].sort().map(id => {
    const lineType = known.get(id);
    if (!lineType) throw new Error(`정의가 없는 선 종류: ${id}`);
    return { id: lineType.id, name: lineType.name, color: lineType.color };
  });
  const units = new Map();
  for (const node of nodes) if (node.type === 'equipment' && !units.has(node.data.id)) units.set(node.data.id, normalizeEquipmentData(node.data, { withReused: false }));
  return { lineTypes, equipmentDB: [...units.values()].sort(byId) };
}

// 1.2 파일 객체를 만든다. library(createLibraryIndex 결과)를 주면 library-drift·product-removed까지 계산한다
export function normalizeDiagram(diagram, { library = null, rules = library?.rules ?? DEFAULT_RULES } = {}) {
  const known = lineTypeCatalog(rules, diagram);
  const colorOf = id => known.get(id)?.color;
  const nodes = diagram.nodes.map(normalizeNode).sort((a, b) => (NODE_ORDER[a.type] - NODE_ORDER[b.type]) || byId(a, b));
  const edges = diagram.edges.map(edge => normalizeEdge(edge, colorOf)).sort(byId);
  const { lineTypes, equipmentDB } = derivedParts(nodes, edges, known);
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
