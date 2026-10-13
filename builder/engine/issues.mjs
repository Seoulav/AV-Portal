// 구성도 이슈(기반명세 §8.5). 저장할 때마다 다시 계산하는 값이다. 사람이 손으로 쓰지 않는다.
import { DEFAULT_RULES } from './defaults.mjs';
import { equipmentPorts, findPort } from './library.mjs';
import { normalizeEquipmentData } from './normalize.mjs';
import { connectionFindings, connectionSignal, parseHandle } from './rules.mjs';

const compareText = (a = '', b = '') => (a < b ? -1 : a > b ? 1 : 0);
export function sortIssues(issues) {
  return issues.sort((x, y) => compareText(x.code, y.code)
    || compareText(x.target.node, y.target.node)
    || compareText(x.target.edge, y.target.edge)
    || compareText(x.target.port, y.target.port)
    || compareText(x.detail, y.detail));
}

// 라이브러리와 비교할 때 쓰는 장비 정보: 키 순서를 맞추고 isReused를 뺀 것.
// 견적 정보(시스템명·옵션)는 사용자가 넣는 값이라 빼고, 구성도에서 고친 단자(portsEdited)는 단자를 빼고 본다(B-20261013-01)
const QUOTE_KEYS = ['systemName', 'selectedOptionQuantities', 'optionPortIds'];
const PORT_KEYS_OF_NODE = ['inputs', 'outputs', 'bidirectional', 'portsEdited'];
// 사용자 단자 번호 기록은 단자를 되돌린 뒤에도 남는 값이라 늘 뺀다
const EDIT_KEYS = ['userPortSeq'];
const comparable = (data, { withoutPorts = false } = {}) => {
  const out = normalizeEquipmentData(data, { withReused: false });
  for (const key of [...QUOTE_KEYS, ...EDIT_KEYS, ...(withoutPorts ? PORT_KEYS_OF_NODE : [])]) delete out[key];
  return JSON.stringify(out);
};

// library: createLibraryIndex 결과(없으면 라이브러리 비교 이슈는 계산하지 않는다)
export function computeIssues(diagram, { library = null, rules = DEFAULT_RULES } = {}) {
  const issues = [];
  const nodes = new Map(diagram.nodes.map(node => [node.id, node]));
  for (const node of diagram.nodes) {
    if (node.type !== 'equipment') continue;
    const data = node.data;
    if (equipmentPorts(data).length === 0) issues.push({ code: 'no-ports', severity: 'warning', target: { node: node.id }, detail: data.id });
    if (data.portal?.variant) issues.push({ code: 'series-config-pending', severity: 'warning', target: { node: node.id }, detail: data.portal.variant });
    // 구성도 안에서 단자를 고친 노드: 라이브러리 차이(library-drift) 대신 이 안내를 낸다
    const portsEdited = data.portsEdited === true;
    if (portsEdited) issues.push({ code: 'ports-edited', severity: 'info', target: { node: node.id }, detail: data.id });
    if (library) {
      const current = library.units.get(data.id);
      if (!current || !library.products.has(data.portal?.productId)) {
        issues.push({ code: 'product-removed', severity: 'warning', target: { node: node.id }, detail: data.id });
      } else if (comparable(current.equipment, { withoutPorts: portsEdited }) !== comparable(data, { withoutPorts: portsEdited })) {
        issues.push({ code: 'library-drift', severity: 'info', target: { node: node.id }, detail: data.id });
      }
    }
  }
  for (const edge of diagram.edges) {
    const sourceNode = nodes.get(edge.source);
    const targetNode = nodes.get(edge.target);
    const s = parseHandle(edge.sourceHandle);
    const t = parseHandle(edge.targetHandle);
    const source = sourceNode && s ? findPort(sourceNode.data, s.portId) : null;
    const target = targetNode && t ? findPort(targetNode.data, t.portId) : null;
    if (source && target) {
      const matched = connectionSignal(source, target, rules);
      for (const finding of connectionFindings(source, target, Boolean(matched?.level), rules)) issues.push({ code: finding.code, severity: finding.severity, target: { edge: edge.id }, detail: finding.detail });
    }
    if (!edge.data?.bomRows?.length) issues.push({ code: 'cable-unspecified', severity: 'info', target: { edge: edge.id }, detail: edge.data?.lineTypeId ?? '' });
  }
  return sortIssues(issues);
}
