// 구성도 이슈(기반명세 §8.5). 저장할 때마다 다시 계산하는 값이다. 사람이 손으로 쓰지 않는다.
import { DEFAULT_RULES } from './defaults.mjs';
import { equipmentPorts, findPort } from './library.mjs';
import { normalizeEquipmentData } from './normalize.mjs';
import { legacyCardPortCount, slotEquipment } from './slots.mjs';
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
// 사용자 단자 번호 기록은 단자를 되돌린 뒤에도 남는 값이라 늘 뺀다. 슬롯 카드 구성은 라이브러리 장비에 없는 값이라 뺀다(단자는 프레임 + 카드와 비교)
const EDIT_KEYS = ['userPortSeq', 'slotAssignments'];
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
    const entry = library?.units.get(data.id) ?? null;
    const slots = entry?.unit?.slots ?? null;
    const assigned = Object.keys(data.slotAssignments ?? {}).length > 0;
    // 슬롯 정보가 있는 시리즈 프레임·카드는 슬롯 장착 흐름을 쓴다(B-20261013-04). 그 밖의 시리즈 모델만 구성 대기다
    if (data.portal?.variant && !slots && !entry?.unit?.card && !assigned) issues.push({ code: 'series-config-pending', severity: 'warning', target: { node: node.id }, detail: data.portal.variant });
    // 구성도 안에서 단자를 고친 노드: 라이브러리 차이(library-drift) 대신 이 안내를 낸다
    const portsEdited = data.portsEdited === true;
    if (portsEdited) issues.push({ code: 'ports-edited', severity: 'info', target: { node: node.id }, detail: data.id });
    if (library) {
      const current = library.units.get(data.id);
      if (!current || !library.products.has(data.portal?.productId)) {
        issues.push({ code: 'product-removed', severity: 'warning', target: { node: node.id }, detail: data.id });
      } else {
        // 카드를 꽂은 프레임은 프레임 + 카드 단자가 라이브러리 값이다. 라이브러리에 없는 카드는 product-removed로 알린다
        const composed = slots && assigned ? slotEquipment(library, data.id, data.slotAssignments) : { equipment: current.equipment, missing: [] };
        for (const missing of composed.missing) issues.push({ code: 'product-removed', severity: 'warning', target: { node: node.id }, detail: missing });
        // 예전에 펼쳐 둔 카드 단자(BLU-160 등): 자동으로 옮기지 않고 안내만 한다(결정 D1). 단자 차이는 이 안내가 대신한다
        const legacy = legacyCardPortCount(library, data);
        if (legacy) issues.push({ code: 'slot-legacy-ports', severity: 'info', target: { node: node.id }, detail: `${data.id}: ${legacy}` });
        // 슬롯이 있는데 하나도 채우지 않았다. 호환 카드 정보가 없는 프레임(SPX-R6 등)은 그 사실을 detail에 적는다
        if (slots && !assigned) issues.push({ code: 'slot-empty', severity: 'info', target: { node: node.id }, detail: slots.compatibleCards?.length ? data.id : `${data.id}: 장착 가능 모듈 정보 없음` });
        // 예전 카드 단자 안내와 별개로 단자 차이(library-drift)는 그대로 본다
        const withoutPorts = portsEdited;
        if (comparable(composed.equipment, { withoutPorts }) !== comparable(data, { withoutPorts })) issues.push({ code: 'library-drift', severity: 'info', target: { node: node.id }, detail: data.id });
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
