// 구성도 안에서 장비 노드 하나의 단자를 고친다(B-20261013-01). Portal 데이터·라이브러리는 바꾸지 않는다.
// - 사용자가 추가한 단자: origin "user", id `<in|out|both>-user-<n>`
// - 라이브러리 단자를 고친 경우: edited true, id는 그대로(기존 연결 유지)
// - 노드: portsEdited true(라이브러리와 단자가 달라졌다)
// 단자를 지우거나 방향·신호를 바꿔 기존 연결이 규칙에 맞지 않게 되면, removeEdges를 주지 않는 한 아무것도 바꾸지 않고
// 걸리는 엣지 목록을 돌려준다. 화면은 이 목록으로 "연결 n개도 함께 지웁니다"를 확인받는다(구 Builder의 끊어진 엣지 버그 방지).
import { DEFAULT_RULES } from './defaults.mjs';
import { equipmentPorts } from './library.mjs';
import { PORT_LISTS, clone } from './normalize.mjs';
import { judgeConnection, parseHandle, sourceHandleOf, targetHandleOf } from './rules.mjs';

// 커넥터만으로 광 단자가 되는 형상(beta/port-vocabulary.mjs FIBER_CONNECTORS와 같은 값. 테스트가 확인한다)
export const FIBER_CONNECTORS = Object.freeze(['SFP', 'LC', 'SC']);
export const DIRECTION_LABELS = Object.freeze({ in: 'In', out: 'Out', both: 'I/O' });
export const USER_PORT_ID = /^(in|out|both)-user-([1-9]\d*)$/;

// 단자 type(선 종류): 광 커넥터면 fiber, 아니면 주 신호의 선 종류(기반명세 §5.3, 생성기 portLineType과 같은 규칙).
// signalVocabulary: 라이브러리 vocabulary.signals([{id, label, lineType}]). 모르는 신호면 null
export function portLineType(connector, signals, signalVocabulary = []) {
  if (FIBER_CONNECTORS.includes(connector)) return 'fiber';
  return signalVocabulary.find(signal => signal.id === signals?.[0])?.lineType ?? null;
}

// 같은 단자인지: 연결 판정·화면에 쓰이는 값만 본다(verification·portalIo·표시는 빼고)
const portCore = port => JSON.stringify([port.label, port.type, port.direction, port.connector, port.signals]);
const listsOf = data => Object.keys(PORT_LISTS).map(list => data?.[list] ?? []);
// 세 목록의 단자 id·순서·값이 모두 같은지
export function samePorts(a, b) {
  const x = listsOf(a);
  const y = listsOf(b);
  return x.every((list, i) => list.length === y[i].length && list.every((port, j) => port.id === y[i][j].id && portCore(port) === portCore(y[i][j])));
}

const userNumber = id => Number(USER_PORT_ID.exec(id ?? '')?.[2] ?? 0);

// "HDMI In 5…8"처럼 이어지는 이름. list: 그 섹션의 단자들(편집 중인 값). 같은 이름 틀의 가장 큰 번호 다음부터 매긴다
export function nextPortLabels(list, signalLabel, direction, count) {
  const prefix = `${signalLabel} ${DIRECTION_LABELS[direction]} `;
  let last = 0;
  for (const port of list) {
    if (!port.label?.startsWith(prefix)) continue;
    const n = Number(/^(\d+)/.exec(port.label.slice(prefix.length))?.[1] ?? 0);
    if (n > last) last = n;
  }
  return Array.from({ length: count }, (_, i) => `${prefix}${last + i + 1}`);
}

const findNodeIndex = (diagram, nodeId) => diagram.nodes.findIndex(node => node.id === nodeId && node.type === 'equipment');
const problem = (code, detail) => ({ ok: false, code, detail, removedEdgeIds: [] });

// 편집한 목록으로 새 단자 목록을 만든다. 입력 단자: { id?, label, connector, signals } (direction은 목록이 정한다).
// id가 없으면 새 사용자 단자다. 문제가 있으면 { error }
function buildPorts(oldData, lists, { signalVocabulary, libraryEquipment }) {
  const oldPorts = new Map(equipmentPorts(oldData).map(port => [port.id, port]));
  const libraryPorts = libraryEquipment ? new Map(equipmentPorts(libraryEquipment).map(port => [port.id, port])) : null;
  // 사용자 단자 번호는 노드 안에서 하나로 이어 간다. 지운 번호는 다시 쓰지 않는다(노드 userPortSeq에 마지막 번호를 남긴다)
  let lastUser = Math.max(0, lastUserNumber(oldData), ...Object.keys(PORT_LISTS).flatMap(list => (lists[list] ?? []).map(port => userNumber(port.id))));
  const seen = new Set();
  const out = {};
  for (const [list, direction] of Object.entries(PORT_LISTS)) {
    out[list] = [];
    for (const input of lists[list] ?? []) {
      const label = typeof input.label === 'string' ? input.label.trim() : '';
      const connector = typeof input.connector === 'string' ? input.connector.trim() : '';
      const signals = Array.isArray(input.signals) ? input.signals.filter(signal => typeof signal === 'string' && signal) : [];
      if (!label) return { error: problem('port-invalid', `${list}: 이름이 비었다`) };
      if (!connector) return { error: problem('port-invalid', `${label}: 커넥터가 비었다`) };
      if (!signals.length) return { error: problem('port-invalid', `${label}: 신호가 비었다`) };
      // 지웠던 라이브러리 단자를 되살리는 경우(되돌리기 뒤 편집 등)는 라이브러리 단자를 이전 값으로 본다
      const old = input.id ? (oldPorts.get(input.id) ?? libraryPorts?.get(input.id) ?? null) : null;
      if (input.id && !old) return { error: problem('port-unknown', input.id) };
      // 커넥터·신호가 그대로면 저장된 type을 그대로 둔다. 바뀌었으면 생성기와 같은 규칙으로 다시 정한다
      const same = old && old.connector === connector && JSON.stringify(old.signals) === JSON.stringify(signals);
      const type = same ? old.type : portLineType(connector, signals, signalVocabulary);
      if (!type) return { error: problem('signal-unknown', `${label}: ${signals[0]}`) };
      const id = old ? old.id : `${direction}-user-${(lastUser += 1)}`;
      if (seen.has(id)) return { error: problem('duplicate-port-id', id) };
      seen.add(id);
      const port = { id, label, type, direction, connector, signals: [...signals] };
      if (old?.verification !== undefined) port.verification = old.verification;
      if (old?.portalIo !== undefined) port.portalIo = clone(old.portalIo);
      if (!old || old.origin === 'user') port.origin = 'user';
      else {
        // 라이브러리를 알면 라이브러리 단자와 비교한다(값을 되돌리면 표시도 사라진다). 모르면 한 번 고친 표시를 유지한다
        const reference = libraryPorts?.get(id);
        const edited = reference ? portCore(port) !== portCore(reference) : (Boolean(old.edited) || portCore(port) !== portCore(old));
        if (edited) port.edited = true;
      }
      out[list].push(port);
    }
  }
  return { ports: out, lastUser };
}

// 지금까지 쓴 사용자 단자 번호 중 가장 큰 것(저장된 userPortSeq와 남은 단자 id 중 큰 값)
const lastUserNumber = data => Math.max(0, Number.isSafeInteger(data?.userPortSeq) ? data.userPortSeq : 0, ...equipmentPorts(data ?? {}).map(port => userNumber(port.id)));

// 이 노드에 걸린 엣지를 새 단자로 다시 판정한다. 맞지 않는 엣지 id 목록과, 핸들·선 종류·신호를 새로 맞춘 엣지를 돌려준다
function reconcileEdges(diagram, nodeId, nextData, { rules, powerEnabled }) {
  const nodes = new Map(diagram.nodes.map(node => [node.id, node]));
  const dataOf = id => (id === nodeId ? nextData : nodes.get(id)?.data);
  const portIn = (id, handle) => {
    const parsed = parseHandle(handle);
    const data = dataOf(id);
    return parsed && data ? equipmentPorts(data).find(port => port.id === parsed.portId) ?? null : null;
  };
  const colorOf = lineTypeId => rules.lineTypes.find(lineType => lineType.id === lineTypeId)?.color ?? '#64748b';
  const removed = [];
  const updated = new Map();
  for (const edge of diagram.edges) {
    if (edge.source !== nodeId && edge.target !== nodeId) continue;
    const source = portIn(edge.source, edge.sourceHandle);
    const target = portIn(edge.target, edge.targetHandle);
    if (!source || !target) { removed.push(edge.id); continue; }
    // 단자 1개 = 연결 1개는 다른 엣지와의 관계라 여기서 보지 않는다(단자 id가 바뀌지 않으므로 늘지 않는다)
    const judgement = judgeConnection({ nodeId: edge.source, port: source }, { nodeId: edge.target, port: target }, { rules, powerEnabled });
    if (!judgement.allowed || judgement.flipped) { removed.push(edge.id); continue; }
    const sourceHandle = sourceHandleOf(source);
    const targetHandle = targetHandleOf(target);
    const { lineTypeId } = judgement;
    // signal은 이미 적혀 있는 엣지만 고친다(없는 옛 엣지에 새로 쓰지 않는다)
    const signal = edge.data?.signal === undefined ? undefined : judgement.signal;
    if (edge.sourceHandle === sourceHandle && edge.targetHandle === targetHandle && edge.data?.lineTypeId === lineTypeId && edge.data?.signal === signal) continue;
    const data = { ...edge.data, lineTypeId };
    if (signal !== undefined) data.signal = signal;
    updated.set(edge.id, { ...edge, sourceHandle, targetHandle, style: { ...edge.style, stroke: colorOf(lineTypeId) }, data });
  }
  return { removed, updated };
}

// 새 data로 노드를 바꾸고 걸린 연결을 정리한다(update·reset 공용)
function commit(diagram, index, nextData, { removeEdges, rules, powerEnabled }) {
  const node = diagram.nodes[index];
  // 지운 단자를 가리키는 견적 단자 목록(optionPortIds)도 정리한다
  if (Array.isArray(nextData.optionPortIds)) {
    const ids = new Set(equipmentPorts(nextData).map(port => port.id));
    nextData.optionPortIds = nextData.optionPortIds.filter(id => ids.has(id));
  }
  const { removed, updated } = reconcileEdges(diagram, node.id, nextData, { rules, powerEnabled });
  if (removed.length && !removeEdges) return { ok: false, code: 'edges-affected', removedEdgeIds: removed, changed: false };
  const changed = removed.length > 0 || updated.size > 0 || JSON.stringify(nextData) !== JSON.stringify(node.data);
  if (!changed) return { ok: true, removedEdgeIds: [], changed: false };
  // 노드·엣지 객체는 새로 만든다(이전 상태와 공유하지 않게)
  diagram.nodes[index] = { ...node, data: nextData };
  const gone = new Set(removed);
  diagram.edges = diagram.edges.filter(edge => !gone.has(edge.id)).map(edge => updated.get(edge.id) ?? edge);
  return { ok: true, removedEdgeIds: removed, changed: true };
}

// lists: { inputs, outputs, bidirectional } — 편집한 단자 목록 전체(순서 포함).
// options: removeEdges(걸리는 연결을 함께 지울지), rules, powerEnabled, signalVocabulary(라이브러리 vocabulary.signals),
//          libraryEquipment(이 노드의 라이브러리 장비. 주면 표시를 라이브러리와 비교해 정한다. 없으면 한 번 켠 표시는 유지한다)
// 결과: { ok, code?, detail?, removedEdgeIds, changed }
//   code 'edges-affected': removeEdges 없이 걸리는 연결이 있어 바꾸지 않았다. removedEdgeIds가 지울 엣지다
export function updateEquipmentPorts(diagram, nodeId, lists, { removeEdges = false, rules = DEFAULT_RULES, powerEnabled = false, signalVocabulary = [], libraryEquipment = null } = {}) {
  const index = findNodeIndex(diagram, nodeId);
  if (index < 0) return problem('node-missing', nodeId);
  const node = diagram.nodes[index];
  const built = buildPorts(node.data, lists, { signalVocabulary, libraryEquipment });
  if (built.error) return built.error;
  const nextData = { ...node.data, ...built.ports };
  const edited = libraryEquipment ? !samePorts(built.ports, libraryEquipment) : (Boolean(node.data.portsEdited) || !samePorts(built.ports, node.data));
  if (edited) nextData.portsEdited = true;
  else delete nextData.portsEdited;
  if (built.lastUser > 0) nextData.userPortSeq = built.lastUser;
  return commit(diagram, index, nextData, { removeEdges, rules, powerEnabled });
}

// "라이브러리 값으로 되돌리기": 라이브러리 단자를 그대로 복사하고(verification·portalIo 포함) portsEdited·origin·edited를 지운다.
// 연결 처리는 updateEquipmentPorts와 같다. 사용자 단자 번호(userPortSeq)는 남겨 지운 번호를 다시 쓰지 않는다
export function resetEquipmentPorts(diagram, nodeId, libraryEquipment, { removeEdges = false, rules = DEFAULT_RULES, powerEnabled = false } = {}) {
  if (!libraryEquipment) return problem('library-missing', nodeId);
  const index = findNodeIndex(diagram, nodeId);
  if (index < 0) return problem('node-missing', nodeId);
  const node = diagram.nodes[index];
  const nextData = { ...node.data };
  for (const list of Object.keys(PORT_LISTS)) nextData[list] = clone(libraryEquipment[list] ?? []);
  delete nextData.portsEdited;
  const last = lastUserNumber(node.data);
  if (last > 0) nextData.userPortSeq = last;
  return commit(diagram, index, nextData, { removeEdges, rules, powerEnabled });
}
