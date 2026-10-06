// 구성도 파일 검증. 오류(errors)는 저장을 막는 것이고, 이슈(issues)는 파일에 남는 경고·안내다.
import { DEFAULT_RULES } from './defaults.mjs';
import { computeIssues } from './issues.mjs';
import { equipmentPorts, findPort } from './library.mjs';
import { judgeConnection, parseHandle } from './rules.mjs';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const DIRECTIONS = new Set(['in', 'out', 'both']);

// 1.1에서 항상 있던 키와 그 타입(기반명세 §8.6)
function structureErrors(diagram) {
  const errors = [];
  const need = (condition, path, detail) => { if (!condition) errors.push({ code: 'structure', path, detail }); };
  if (!isObject(diagram)) return [{ code: 'structure', path: '', detail: '최상위가 객체가 아니다' }];
  need(diagram.version === '1.2', 'version', `"1.2"이어야 한다(현재 ${JSON.stringify(diagram.version)})`);
  for (const key of ['nodes', 'edges', 'lineTypes', 'equipmentDB']) need(Array.isArray(diagram[key]), key, '배열이어야 한다');
  if (errors.length) return errors;
  diagram.nodes.forEach((node, i) => {
    const at = `nodes[${i}]`;
    need(isObject(node) && typeof node.id === 'string' && node.id, `${at}.id`, '문자열 ID가 필요하다');
    need(['equipment', 'annotation', 'shape'].includes(node?.type), `${at}.type`, 'equipment·annotation·shape 중 하나여야 한다');
    need(isObject(node?.position) && Number.isFinite(node.position.x) && Number.isFinite(node.position.y), `${at}.position`, '{x, y} 숫자가 필요하다');
    need(isObject(node?.data), `${at}.data`, '객체가 필요하다');
    if (node?.type === 'equipment' && isObject(node.data)) {
      for (const key of ['id', 'category', 'name', 'model']) need(typeof node.data[key] === 'string', `${at}.data.${key}`, '문자열이 필요하다');
      for (const key of ['inputs', 'outputs', 'bidirectional']) {
        need(Array.isArray(node.data[key]), `${at}.data.${key}`, '배열이어야 한다');
        (node.data[key] ?? []).forEach((port, j) => {
          const portAt = `${at}.data.${key}[${j}]`;
          for (const field of ['id', 'label', 'type']) need(typeof port?.[field] === 'string', `${portAt}.${field}`, '문자열이 필요하다');
          need(DIRECTIONS.has(port?.direction), `${portAt}.direction`, 'in·out·both 중 하나여야 한다');
          need(Array.isArray(port?.signals) && port.signals.length > 0, `${portAt}.signals`, '신호 배열이 필요하다');
        });
      }
    }
    if (node?.type === 'annotation' || node?.type === 'shape') need(isObject(node.style), `${at}.style`, '{width, height}가 필요하다');
  });
  diagram.edges.forEach((edge, i) => {
    const at = `edges[${i}]`;
    for (const key of ['id', 'type', 'source', 'sourceHandle', 'target', 'targetHandle']) need(typeof edge?.[key] === 'string', `${at}.${key}`, '문자열이 필요하다');
    need(isObject(edge?.style), `${at}.style`, '객체가 필요하다');
    need(isObject(edge?.data) && typeof edge.data.lineTypeId === 'string', `${at}.data.lineTypeId`, '문자열이 필요하다');
  });
  return errors;
}

export function validateDiagram(diagram, { library = null, rules = library?.rules ?? DEFAULT_RULES, powerEnabled = false } = {}) {
  const errors = structureErrors(diagram);
  if (errors.length) return { errors, issues: [] };
  const nodes = new Map();
  for (const node of diagram.nodes) {
    if (nodes.has(node.id)) errors.push({ code: 'duplicate-node-id', target: { node: node.id } });
    nodes.set(node.id, node);
    if (node.type === 'equipment') {
      const seen = new Set();
      for (const port of equipmentPorts(node.data)) {
        if (seen.has(port.id)) errors.push({ code: 'duplicate-port-id', target: { node: node.id, port: port.id } });
        seen.add(port.id);
      }
    }
  }
  const lineTypes = new Set(diagram.lineTypes.map(lineType => lineType.id));
  for (const node of diagram.nodes) if (node.type === 'equipment') for (const port of equipmentPorts(node.data)) {
    if (!lineTypes.has(port.type)) errors.push({ code: 'linetype-missing', target: { node: node.id, port: port.id }, detail: port.type });
  }
  const edgeIds = new Set();
  const usage = new Map();
  const resolved = [];
  for (const edge of diagram.edges) {
    if (edgeIds.has(edge.id)) errors.push({ code: 'duplicate-edge-id', target: { edge: edge.id } });
    edgeIds.add(edge.id);
    const sourceNode = nodes.get(edge.source);
    const targetNode = nodes.get(edge.target);
    if (!sourceNode || !targetNode || sourceNode.type !== 'equipment' || targetNode.type !== 'equipment') {
      errors.push({ code: 'edge-node-missing', target: { edge: edge.id } });
      continue;
    }
    const s = parseHandle(edge.sourceHandle);
    const t = parseHandle(edge.targetHandle);
    const source = findPort(sourceNode.data, s.portId);
    const target = findPort(targetNode.data, t.portId);
    // 양방향 단자는 source_/target_ 접두어, 나머지는 접두어 없이 단자 ID 그대로(1.1 규칙)
    const handleOk = (port, parsed, role) => port && (port.direction === 'both' ? parsed.role === role : parsed.role === null);
    if (!handleOk(source, s, 'source') || !handleOk(target, t, 'target')) {
      errors.push({ code: 'edge-handle-missing', target: { edge: edge.id }, detail: `${edge.sourceHandle} → ${edge.targetHandle}` });
      continue;
    }
    for (const key of [`${edge.source}::${source.id}`, `${edge.target}::${target.id}`]) usage.set(key, (usage.get(key) ?? 0) + 1);
    if (!lineTypes.has(edge.data.lineTypeId)) errors.push({ code: 'linetype-missing', target: { edge: edge.id }, detail: edge.data.lineTypeId });
    resolved.push({ edge, source, target });
  }
  for (const [key, count] of usage) if (count > 1) {
    const [node, port] = key.split('::');
    errors.push({ code: 'port-occupied', target: { node, port }, detail: `${count}개 연결` });
  }
  for (const { edge, source, target } of resolved) {
    const judgement = judgeConnection({ nodeId: edge.source, port: source }, { nodeId: edge.target, port: target }, { powerEnabled, rules });
    if (!judgement.allowed) { errors.push({ code: judgement.code, target: { edge: edge.id } }); continue; }
    // 저장된 방향은 이미 신호를 내보내는 쪽이 source여야 한다(기반명세 §7.1 0번)
    if (judgement.flipped) { errors.push({ code: 'direction', target: { edge: edge.id }, detail: 'source와 target이 반대다' }); continue; }
    if (edge.data.lineTypeId !== judgement.lineTypeId) errors.push({ code: 'edge-linetype', target: { edge: edge.id }, detail: `${edge.data.lineTypeId} ≠ ${judgement.lineTypeId}` });
    if (edge.data.signal !== undefined && edge.data.signal !== judgement.signal) errors.push({ code: 'edge-signal', target: { edge: edge.id }, detail: `${edge.data.signal} ≠ ${judgement.signal}` });
  }
  return { errors, issues: computeIssues(diagram, { library, rules }) };
}
