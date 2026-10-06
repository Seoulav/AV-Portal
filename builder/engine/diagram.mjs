// 구성도 JSON 1.2 만들기(기반명세 §8). 노드·엣지 객체의 키 순서는 serialize.mjs가 최종으로 맞춘다.
import { DEFAULT_RULES } from './defaults.mjs';
import { findPort } from './library.mjs';
import { clone } from './normalize.mjs';
import { judgeConnection, parseHandle, sourceHandleOf, targetHandleOf } from './rules.mjs';

export const DIAGRAM_VERSION = '1.2';
export const GENERATOR_APP = 'av-portal-builder';

// ── ID: 접두어 + 소문자 ULID. 시험·예제는 seed와 now를 넘겨 결정적으로 만든다 ──
const CROCKFORD = '0123456789abcdefghjkmnpqrstvwxyz';
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function createIdFactory({ seed, now } = {}) {
  const random = seed === undefined ? () => (globalThis.crypto?.getRandomValues ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 : Math.random()) : mulberry32(seed);
  let lastTime = -1;
  let counter = 0;
  const ulid = () => {
    let time = now === undefined ? Date.now() : now + counter;
    if (time <= lastTime) time = lastTime + 1;
    lastTime = time;
    counter += 1;
    let head = '';
    for (let i = 9; i >= 0; i -= 1) { head = CROCKFORD[time % 32] + head; time = Math.floor(time / 32); }
    let tail = '';
    for (let i = 0; i < 16; i += 1) tail += CROCKFORD[Math.floor(random() * 32)];
    return head + tail;
  };
  return {
    node: () => `node_${ulid()}`,
    annotation: () => `annotation_${ulid()}`,
    shape: () => `shape_${ulid()}`,
    edge: (source, target) => `e-${source}-${target}-${ulid()}`,
  };
}

// ids를 넘기지 않으면 모듈 하나가 공유하는 생성기를 쓴다. 호출마다 새로 만들면 같은 밀리초 안에서 순서가 뒤집힌다
const sharedIds = createIdFactory();

export function createDiagram({ library = null, generatorVersion = '0.1.0' } = {}) {
  return {
    version: DIAGRAM_VERSION,
    nodes: [],
    edges: [],
    lineTypes: [],
    equipmentDB: [],
    generator: { app: GENERATOR_APP, version: generatorVersion },
    library: library ? { schemaVersion: library.schemaVersion, source: { ...library.source } } : null,
    issues: [],
  };
}

const findNode = (diagram, nodeId) => diagram.nodes.find(node => node.id === nodeId) ?? null;

// 장비 노드. equipment는 라이브러리 units[].equipment(노드 data에서 isReused를 뺀 모양)
export function addEquipmentNode(diagram, equipment, { position = { x: 0, y: 0 }, isReused = false, ids = sharedIds } = {}) {
  const { portal, ...rest } = clone(equipment);
  const node = { id: ids.node(), type: 'equipment', position: { x: position.x, y: position.y }, data: { ...rest, isReused, portal } };
  diagram.nodes.push(node);
  return node;
}

// 메모 노드: 구 Builder(App.tsx)의 기본값
export function addAnnotationNode(diagram, { position = { x: 100, y: 100 }, label = 'New note (Double-click to edit)', width = 200, height = 60, style = {}, ids = sharedIds } = {}) {
  const node = {
    id: ids.annotation(),
    type: 'annotation',
    position: { x: position.x, y: position.y },
    style: { width, height },
    data: { label, fontSize: 14, fontColor: '#ffffff', bgColor: '#1e293b', bgOpacity: 0.8, borderColor: '#38bdf8', borderStyle: 'dashed', borderRadius: 8, textAlign: 'center', ...style },
  };
  diagram.nodes.push(node);
  return node;
}

// 영역 노드: 구 Builder(App.tsx)의 기본값
export function addShapeNode(diagram, { position = { x: 100, y: 100 }, label = 'ZONE BOX', width = 350, height = 250, style = {}, ids = sharedIds } = {}) {
  const node = {
    id: ids.shape(),
    type: 'shape',
    position: { x: position.x, y: position.y },
    style: { width, height },
    data: { shapeType: 'rectangle', label, fontSize: 14, fontColor: '#94a3b8', bgColor: '#1e293b', bgOpacity: 0.25, borderColor: '#475569', borderStyle: 'solid', borderWidth: 2, ...style },
  };
  diagram.nodes.push(node);
  return node;
}

// 이미 쓰인 단자: '<노드ID>::<단자ID>'. 양방향 단자는 source_/target_ 어느 쪽으로 쓰여도 한 번으로 센다
export function occupiedPorts(diagram, { exceptEdgeId = null } = {}) {
  const used = new Set();
  for (const edge of diagram.edges) {
    if (edge.id === exceptEdgeId) continue;
    const s = parseHandle(edge.sourceHandle);
    const t = parseHandle(edge.targetHandle);
    if (s) used.add(`${edge.source}::${s.portId}`);
    if (t) used.add(`${edge.target}::${t.portId}`);
  }
  return used;
}

const portRef = (diagram, { nodeId, portId }) => {
  const node = findNode(diagram, nodeId);
  if (!node || node.type !== 'equipment') return null;
  const port = findPort(node.data, portId);
  return port ? { nodeId, port } : null;
};

const colorOf = (rules, lineTypeId) => (rules.lineTypes.find(lineType => lineType.id === lineTypeId)?.color ?? '#64748b');

// from·to: { nodeId, portId }. 판정을 통과하면 엣지를 넣고 { ok: true, edge, judgement }를 돌려준다
export function connectPorts(diagram, from, to, { ids = sharedIds, powerEnabled = false, rules = DEFAULT_RULES } = {}) {
  const a = portRef(diagram, from);
  const b = portRef(diagram, to);
  if (!a || !b) return { ok: false, code: 'port-missing' };
  const used = occupiedPorts(diagram);
  const judgement = judgeConnection(a, b, { occupied: (nodeId, portId) => used.has(`${nodeId}::${portId}`), powerEnabled, rules });
  if (!judgement.allowed) return { ok: false, code: judgement.code, judgement };
  const { source, target } = judgement;
  const edge = {
    id: ids.edge(source.nodeId, target.nodeId),
    type: 'smoothstep',
    source: source.nodeId,
    sourceHandle: sourceHandleOf(source.port),
    target: target.nodeId,
    targetHandle: targetHandleOf(target.port),
    animated: false,
    style: { stroke: colorOf(rules, judgement.lineTypeId), strokeWidth: 2 },
    data: { lineTypeId: judgement.lineTypeId, signal: judgement.signal },
  };
  diagram.edges.push(edge);
  return { ok: true, edge, judgement };
}

const findEdge = (diagram, edgeId) => {
  const edge = diagram.edges.find(item => item.id === edgeId);
  if (!edge) throw new Error(`없는 엣지: ${edgeId}`);
  return edge;
};

// 케이블 정보(1.1 bomRows 형식 그대로). 빈 배열이면 키를 지운다
export function setEdgeCable(diagram, edgeId, bomRows) {
  const edge = findEdge(diagram, edgeId);
  if (bomRows?.length) edge.data.bomRows = clone(bomRows);
  else delete edge.data.bomRows;
  return edge;
}

export function setEdgeLabel(diagram, edgeId, label) {
  const edge = findEdge(diagram, edgeId);
  if (label) edge.data.label = label;
  else delete edge.data.label;
  return edge;
}

export function removeEdge(diagram, edgeId) {
  diagram.edges = diagram.edges.filter(edge => edge.id !== edgeId);
}

export function removeNode(diagram, nodeId) {
  diagram.nodes = diagram.nodes.filter(node => node.id !== nodeId);
  diagram.edges = diagram.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
}
