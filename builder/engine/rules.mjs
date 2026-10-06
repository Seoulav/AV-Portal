// 연결 판정(기반명세 §7.1). 화면의 연결 가능 표시와 검증기가 이 모듈 하나를 쓴다.
import { DEFAULT_RULES, POWER_SIGNAL } from './defaults.mjs';

const ACCEPTED_VERIFICATION = new Set(['VERIFIED', 'FOUND']);
const UNKNOWN_CONNECTORS = new Set(['UNKNOWN', 'CAPTIVE']);

// 두 커넥터를 같은 것으로 볼지(§2.8)
export function connectorsCompatible(a, b, rules = DEFAULT_RULES) {
  if (a === b) return true;
  const wildcards = rules.connectorWildcards;
  const matches = (wild, other) => wildcards[wild] === '*' || (Array.isArray(wildcards[wild]) && wildcards[wild].includes(other));
  if (Object.hasOwn(wildcards, a) && matches(a, b)) return true;
  if (Object.hasOwn(wildcards, b) && matches(b, a)) return true;
  return rules.connectorEquivalents.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

const isLevelPair = (a, b, rules) => rules.levelPairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

// 연결 신호: 공통 신호 중 source.signals 순서에서 가장 앞선 것. 없으면 레벨 차이 쌍의 source 쪽 신호
export function connectionSignal(source, target, rules = DEFAULT_RULES) {
  const common = source.signals.find(signal => target.signals.includes(signal));
  if (common) return { signal: common, level: false };
  for (const a of source.signals) for (const b of target.signals) if (isLevelPair(a, b, rules)) return { signal: a, level: true };
  return null;
}

// 엣지 선 종류(§5.3): 어느 쪽이 광이면 fiber, 아니면 source 단자의 type
export const edgeLineType = (source, target) => (source.type === 'fiber' || target.type === 'fiber' ? 'fiber' : source.type);

// 경고·안내(§7.1 6~9번). 차단 판정을 통과한 쌍에만 쓴다
export function connectionFindings(source, target, level, rules = DEFAULT_RULES) {
  const findings = [];
  if (!connectorsCompatible(source.connector, target.connector, rules)) findings.push({ code: 'connector-adapter', severity: 'warning', detail: `${source.connector} → ${target.connector}` });
  if (UNKNOWN_CONNECTORS.has(source.connector) || UNKNOWN_CONNECTORS.has(target.connector)) findings.push({ code: 'connector-unknown', severity: 'info', detail: `${source.connector} → ${target.connector}` });
  if (level) findings.push({ code: 'signal-level', severity: 'warning', detail: `${source.signals[0]} → ${target.signals[0]}` });
  for (const port of [source, target]) {
    if (!ACCEPTED_VERIFICATION.has(port.verification)) findings.push({ code: 'unverified-port', severity: 'warning', detail: `${port.id} ${port.verification ?? '검증 상태 없음'}` });
  }
  return findings;
}

// from·to: { nodeId, port }. occupied(nodeId, portId) → boolean
// 결과: { allowed, code?, source, target, flipped, signal, lineTypeId, findings }
export function judgeConnection(from, to, { occupied = () => false, powerEnabled = false, rules = DEFAULT_RULES } = {}) {
  // 0. 거꾸로 그은 선은 바꾼다
  const flip = (from.port.direction === 'in' && (to.port.direction === 'out' || to.port.direction === 'both'))
    || (from.port.direction === 'both' && to.port.direction === 'out');
  const source = flip ? to : from;
  const target = flip ? from : to;
  const base = { source, target, flipped: flip };
  // 1. 단자 1개 = 연결 1개
  if (occupied(source.nodeId, source.port.id) || occupied(target.nodeId, target.port.id)) return { ...base, allowed: false, code: 'port-occupied' };
  // 2. 같은 노드
  if (source.nodeId === target.nodeId) return { ...base, allowed: false, code: 'self-loop' };
  // 3. 신호
  const matched = connectionSignal(source.port, target.port, rules);
  if (!matched) return { ...base, allowed: false, code: 'signal-mismatch' };
  // 4. 방향
  const sourceOk = source.port.direction === 'out' || source.port.direction === 'both';
  const targetOk = target.port.direction === 'in' || target.port.direction === 'both';
  if (!sourceOk || !targetOk) return { ...base, allowed: false, code: 'direction' };
  // 5. 전원 결선은 1단계에서 막는다(D5)
  if (matched.signal === POWER_SIGNAL && !powerEnabled) return { ...base, allowed: false, code: 'power-disabled' };
  return {
    ...base,
    allowed: true,
    signal: matched.signal,
    lineTypeId: edgeLineType(source.port, target.port),
    findings: connectionFindings(source.port, target.port, matched.level, rules),
  };
}

// 양방향 단자는 핸들에 접두어를 붙인다(1.1 규칙)
export const sourceHandleOf = port => (port.direction === 'both' ? `source_${port.id}` : port.id);
export const targetHandleOf = port => (port.direction === 'both' ? `target_${port.id}` : port.id);

// 핸들 → { portId, role }. role은 'source'·'target'·null(접두어 없음)
export function parseHandle(handle) {
  if (typeof handle !== 'string') return null;
  if (handle.startsWith('source_')) return { portId: handle.slice(7), role: 'source' };
  if (handle.startsWith('target_')) return { portId: handle.slice(7), role: 'target' };
  return { portId: handle, role: null };
}
