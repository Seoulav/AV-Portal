// 단자 판정 규칙(기반명세 부록 A1~A5)과 단자 선 종류. 화면과 파일 입출력이 없는 순수 함수만 둔다.
// builder-library.mjs(생성기)와 Builder 화면의 Portal 반영 요청(B-20261013-02)이 함께 쓴다.
// 그래서 브라우저에서 못 쓰는 모듈(node:crypto 등)을 불러오지 않는다.
import * as V from './port-vocabulary.mjs';

const text = value => String(value ?? '').trim();
const sortSignals = signals => [...signals].sort((a, b) => V.SIGNAL_ORDER.indexOf(a) - V.SIGNAL_ORDER.indexOf(b));

// ── A1 ──
export function nonPortKind(row) {
  for (const [kind, field, pattern, exclude] of V.NON_PORT_RULES) {
    const value = field === 'connector+signal' ? `${text(row.connector)} ${text(row.signal)}` : text(row[field]);
    if (pattern.test(value) && !(exclude && exclude.test(value))) return kind;
  }
  return null;
}

// ── A2 ──
export function normalizeConnector(raw) {
  const value = text(raw);
  if (V.UNKNOWN_CONNECTOR.test(value)) return 'UNKNOWN';
  let connector = 'UNKNOWN';
  for (const [id, pattern] of V.CONNECTOR_RULES) if (pattern.test(value)) { connector = id; break; }
  let families = V.CONNECTOR_FAMILIES.filter(([, pattern]) => pattern.test(value)).map(([family]) => family);
  for (const [condition, ignored] of V.FAMILY_EXEMPTIONS) {
    if (condition.test(value)) families = ignored === '*' ? families.slice(0, 1) : families.filter(family => !ignored.includes(family));
  }
  if (connector === 'TERMINAL-BLOCK') families = families.filter(family => family !== 'TRS' && family !== 'DSUB');
  if (families.includes('BNC')) families = families.filter(family => family !== 'SDI');
  const pieces = value.split(V.MULTI_SPLIT).filter(piece => V.CONNECTOR_FAMILIES.some(([, pattern]) => pattern.test(piece)));
  if (families.length >= 2 || (pieces.length >= 2 && !V.MULTI_SPLIT_EXEMPT.test(value))) return 'MULTI';
  return connector;
}

// ── A3 ──
function scanSignals(value, connector, powerExcluded = V.POWER_EXCLUDE.test(value)) {
  const found = [];
  const add = id => { if (!found.includes(id)) found.push(id); };
  if (V.POWER_CONNECTORS.includes(connector) || (V.POWER_TEXT.test(value) && !powerExcluded)) add('POWER');
  for (const [id, pattern] of V.SIGNAL_RULES) {
    if (id === 'AUDIO') {
      const analog = V.ANALOG_AUDIO_CONNECTORS.includes(connector) && !found.some(signal => V.DIGITAL_VIDEO_SIGNALS.includes(signal));
      if (analog) {
        if (V.MIC_LINE.test(value)) { add('MIC-AUDIO'); add('LINE-AUDIO'); }
        else if (V.MIC.test(value)) add('MIC-AUDIO');
        if (V.LINE.test(value) && !found.includes('SPEAKER') && !V.LINE_EXCLUDE.test(value)) add('LINE-AUDIO');
      }
      continue;
    }
    if (id === 'ETHERNET' && V.ETHERNET_SKIP.test(value)) continue;
    if (pattern.test(value)) add(id);
  }
  if (connector === 'OPTICAL' && V.OPTICAL_AUDIO.test(value)) add('SPDIF');
  if (connector === 'DSUB-15' && V.DSUB15_VIDEO.test(value)) add('ANALOG-VIDEO');
  return found;
}

export function normalizeSignals(row, connector) {
  const signal = text(row.signal), connectorText = text(row.connector), protocol = text(row.protocol);
  // 팬텀·PoE 전원은 signal·connector 어느 칸에 적혀 있어도 전원 단자로 보지 않는다
  const powerExcluded = V.POWER_EXCLUDE.test(`${signal} ${connectorText}`);
  let signals = scanSignals(signal, connector, powerExcluded);
  if (!signals.length) signals = scanSignals(connectorText, connector, powerExcluded);
  if (signals.some(id => V.SYMMETRIC_SIGNALS.includes(id)) || V.PROTOCOL_TRIGGER_CONNECTORS.includes(connector)) {
    for (const id of scanSignals(protocol, connector)) if (V.PROTOCOL_ADDABLE.includes(id) && !signals.includes(id)) signals.push(id);
  }
  if (V.PROPRIETARY_TEXT.test(`${signal} ${protocol}`)) signals = signals.filter(id => id !== 'ETHERNET' && id !== 'POE');
  if (!signals.length) {
    if (V.CONNECTOR_DEFINES_SIGNAL[connector]) signals.push(V.CONNECTOR_DEFINES_SIGNAL[connector]);
    else if (connector.startsWith('USB')) signals.push('USB');
  }
  if (!signals.length && (V.FIBER_TEXT.test(`${signal} ${connectorText}`) || V.FIBER_CONNECTORS.includes(connector))) signals.push('FIBER');
  if (signals.some(id => V.ON_ETHERNET.includes(id)) && !signals.includes('ETHERNET')) signals.push('ETHERNET');
  signals = sortSignals(signals);
  if (signals[0] === 'POWER' && signals.includes('USB')) signals = ['USB', ...signals.filter(id => id !== 'USB')];
  return signals;
}

function isMultiSignal(row, signals) {
  const families = new Set(signals.map(id => (V.SYMMETRIC_SIGNALS.includes(id) ? 'NET' : id)));
  return (V.MULTI_SIGNAL_TEXT.test(text(row.signal)) && families.size >= 2) || V.MULTIVIEWER_TEXT.test(`${text(row.signal)}${text(row.connector)}`);
}

// ── A4 ──
export function normalizeDirection(raw, signals) {
  const value = text(raw);
  const symmetric = signals.length > 0 && signals.every(id => V.SYMMETRIC_SIGNALS.includes(id));
  for (const [id, pattern] of V.DIRECTION_RULES) if (pattern.test(value)) return symmetric ? 'both' : id;
  if (V.DIRECTION_UNSTATED.test(value) && symmetric) return 'both';
  return null;
}

// ── A5 ──
export function normalizeQuantity(row, connector) {
  const quantity = text(row.quantity), connectorText = text(row.connector);
  const counted = connectorText.match(V.CONNECTOR_COUNT);
  const connectorCount = counted ? Number(counted[1] || counted[2]) : null;
  let match;
  if (V.QUANTITY_INTEGER.test(quantity)) return Number(quantity);
  if ((match = quantity.match(V.QUANTITY_CHANNELS))) {
    if (V.CHANNEL_CONNECTORS.includes(connector) && !/공용/.test(connectorText)) return Number(match[1]);
    return connectorCount;
  }
  if ((match = quantity.match(V.QUANTITY_TIMES))) return Number(match[1]);
  if (quantity === '' && connectorCount) return connectorCount;
  return null;
}

// 개별 지정(IO_OVERRIDES) 항목 검사. 이 표는 Builder 작업 흐름만 고치므로 형식 오류는 코드 오류로 본다
export function validateOverride(key, override) {
  const fail = message => { throw new Error(`IO_OVERRIDES ${key}: ${message}`); };
  if (!override.match || typeof override.match.connector !== 'string' || typeof override.match.signal !== 'string') fail('match.connector·match.signal(원문)이 필요하다');
  if (!text(override.note)) fail('note(근거)가 필요하다');
  const ports = Array.isArray(override.ports) ? override.ports : [override];
  if (!ports.length && override.action !== 'already-represented') fail('empty ports require action already-represented');
  if (ports.length && override.action) fail('action is only valid when ports are empty');
  for (const port of ports) {
    if (!V.CONNECTORS.includes(port.connector)) fail(`알 수 없는 커넥터 ${port.connector}`);
    if (!Array.isArray(port.signals) || !port.signals.length || !port.signals.every(id => V.SIGNAL_BY_ID.has(id))) fail('signals가 비었거나 알 수 없는 신호가 있다');
    if (!['in', 'out', 'both'].includes(port.direction)) fail(`알 수 없는 방향 ${port.direction}`);
    if (!Number.isInteger(port.quantity) || port.quantity < 1) fail('quantity는 1 이상의 정수다');
  }
}

// 한 I/O 행의 판정. override는 IO_OVERRIDES 항목(부록 A 밖의 개별 지정)
export function classifyIoRow(row, override = null) {
  if (override) {
    if (override.action === 'already-represented') return { kind: 'port', portSpecs: [], reasons: [], override: true };
    if (Array.isArray(override.ports)) {
      return { kind: 'port', portSpecs: override.ports.map(port => ({ connector: port.connector, signals: sortSignals(port.signals), direction: port.direction, count: port.quantity })), reasons: [], override: true };
    }
    return { kind: 'port', connector: override.connector, signals: sortSignals(override.signals), direction: override.direction, count: override.quantity, reasons: [], override: true };
  }
  const nonPort = nonPortKind(row);
  if (nonPort) return { kind: nonPort, reasons: [] };
  const connector = normalizeConnector(row.connector);
  if (connector === 'MULTI') return { kind: 'review', connector, signals: [], direction: null, count: null, reasons: ['multi-connector'] };
  const signals = normalizeSignals(row, connector);
  const direction = normalizeDirection(row.direction, signals);
  const count = normalizeQuantity(row, connector);
  const reasons = [];
  if (isMultiSignal(row, signals)) reasons.push('multi-signal');
  if (!signals.length) reasons.push('no-signal');
  if (!direction) reasons.push('direction');
  if (!count) reasons.push('quantity');
  return { kind: reasons.length ? 'review' : 'port', connector, signals, direction, count, reasons };
}

// ── §5.3 단자 type ──
export const portLineType = (connector, signals) => (V.FIBER_CONNECTORS.includes(connector) ? 'fiber' : V.SIGNAL_BY_ID.get(signals[0]).lineType);
export const signalKey = id => id.toLowerCase();
