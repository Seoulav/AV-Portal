// Portal 장비 데이터 → Builder 결선용 라이브러리(builder-library.json).
// 화면과 파일 입출력이 없는 순수 함수만 둔다. 근거: Work/빌더/기반명세.md §2~§6, 부록 A.
import { createHash } from 'node:crypto';
import * as V from './port-vocabulary.mjs';

export const LIBRARY_SCHEMA = 'av-portal.builder-library';
// 1.1.0 (B-20261013-03): 배치 단위에 프레임 슬롯(slots)·카드 장착 정보(card) 추가
export const LIBRARY_SCHEMA_VERSION = '1.1.0';
export const PORTAL_BASE = 'https://seoulav.github.io/AV-Portal/';

const text = value => String(value ?? '').trim();
const normalizeNewlines = value => String(value ?? '').replaceAll('\r\n', '\n');
export const sha256 = value => createHash('sha256').update(normalizeNewlines(value)).digest('hex');
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

// ── §6 배치 단위 ──
const TX_PREFIX = /^TX · /;
const RX_PREFIX = /^RX · /;
const modelSlug = model => text(model).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const conditionHead = row => text(row.condition).split(' · ')[0];

// TX/RX 판정(§6.1). 데이터 모양 문제는 예외 대신 status로 돌려준다.
//   none: 나눌 대상 아님 · split: 나눔 · partial: 일부 행에만 접두어 · mismatch: condition 모델명이 맞지 않음
export function txRxUnits(productId, model, io) {
  const tagged = io.map((row, ioIndex) => ({ row, ioIndex, tx: TX_PREFIX.test(text(row.group)), rx: RX_PREFIX.test(text(row.group)) }));
  const txRows = tagged.filter(item => item.tx);
  const rxRows = tagged.filter(item => item.rx);
  if (!txRows.length && !rxRows.length) return { status: 'none' };
  if (!txRows.length || !rxRows.length || txRows.length + rxRows.length !== io.length) return { status: 'partial' };
  const parts = text(model).split(' / ').map(text).filter(Boolean);
  const heads = rows => [...new Set(rows.map(({ row }) => conditionHead(row)))];
  const txHeads = heads(txRows);
  const rxHeads = heads(rxRows);
  let txModel;
  let rxModel;
  if (parts.length === 2) {
    // 모든 TX 행의 condition 첫 조각이 같은 모델명이고, RX도 마찬가지이며, 두 이름이 model의 두 조각이어야 한다
    if (txHeads.length !== 1 || rxHeads.length !== 1 || txHeads[0] === rxHeads[0] || !parts.includes(txHeads[0]) || !parts.includes(rxHeads[0])) return { status: 'mismatch' };
    [txModel, rxModel] = [txHeads[0], rxHeads[0]];
  } else {
    if (txHeads.some(value => value !== 'TX') || rxHeads.some(value => value !== 'RX')) return { status: 'mismatch' };
    txModel = `${text(model)} (TX)`;
    rxModel = `${text(model)} (RX)`;
  }
  return {
    status: 'split',
    units: [
      { unit: 'tx', model: txModel, rows: txRows.map(({ row, ioIndex }) => ({ row, ioIndex })), strip: TX_PREFIX },
      { unit: 'rx', model: rxModel, rows: rxRows.map(({ row, ioIndex }) => ({ row, ioIndex })), strip: RX_PREFIX },
    ],
  };
}

const unresolvedItem = (row, ioIndex, reasons) => ({ ioIndex, group: text(row.group), connector: text(row.connector), signal: text(row.signal), reason: reasons[0], reasons });

// ── §3 단자 ──
// cardIo: 슬롯 정보(slots)가 있는 프레임이면 카드를 꽂아야 생기는 행을 단자 대신 슬롯 행으로 둔다.
//   이 행의 개별 지정(예: BLU-160 "최대 16채널" 펼침)도 적용하지 않는다. 단자는 장착한 카드 제품에서 온다.
export function buildPorts(rows, { overrides = {}, productId, strip = null, issues = [], cardIo = false } = {}) {
  const ports = [];
  const unresolved = [];
  const nonPort = [];
  for (const { row, ioIndex } of rows) {
    if (cardIo && V.CARD_IO_AVAILABILITY.test(text(row.availability))) {
      nonPort.push({ ioIndex, kind: 'slot' });
      continue;
    }
    const key = `${productId}#${ioIndex}`;
    let override = overrides[key] ?? null;
    if (override) {
      validateOverride(key, override);
      // 원문이 바뀌었으면(행 이동·수정) 개별 지정을 적용하지 않고 알린다
      if (override.match.connector !== text(row.connector) || override.match.signal !== text(row.signal)) {
        issues.push({ code: 'override-stale', ioIndex });
        override = null;
      }
    }
    const result = classifyIoRow(row, override);
    if (result.kind === 'port') {
      const portSpecs = result.portSpecs ?? [result];
      for (const spec of portSpecs) {
        for (let i = 0; i < spec.count; i += 1) ports.push({ row, ioIndex, result: spec, group: strip ? text(row.group).replace(strip, '') : text(row.group) });
      }
    } else if (result.kind === 'review') {
      unresolved.push(unresolvedItem(row, ioIndex, result.reasons));
    } else {
      nonPort.push({ ioIndex, kind: result.kind });
    }
  }
  const counters = new Map();
  const groupsByKey = new Map();
  for (const port of ports) {
    const key = `${port.result.direction}-${signalKey(port.result.signals[0])}`;
    if (!groupsByKey.has(key)) groupsByKey.set(key, new Set());
    groupsByKey.get(key).add(port.group);
  }
  const built = ports.map(({ row, result, group }) => {
    const key = `${result.direction}-${signalKey(result.signals[0])}`;
    const n = (counters.get(key) ?? 0) + 1;
    counters.set(key, n);
    const signal = V.SIGNAL_BY_ID.get(result.signals[0]);
    const suffix = groupsByKey.get(key).size > 1 && group ? ` (${group})` : '';
    const port = { id: `${key}-${n}`, label: `${signal.label} ${V.DIRECTION_LABELS[result.direction]} ${n}${suffix}`, type: portLineType(result.connector, result.signals), direction: result.direction, connector: result.connector, signals: result.signals };
    const verification = text(row.verification);
    if (verification) port.verification = verification;
    port.portalIo = { group: text(row.group), connector: text(row.connector), signal: text(row.signal) };
    return port;
  });
  return { ports: built, unresolved, nonPort };
}

// ── §4·§8.2 장비 객체. 노드 data에서 isReused를 뺀 모양이다(isReused는 Builder가 노드에 붙인다) ──
export function equipmentObject({ unitId, category, name, model, manufacturer, description, series, ports, imageUrl, portal }) {
  const equipment = { id: unitId, category, name, model, manufacturer, description };
  if (series) equipment.series = series;
  equipment.inputs = ports.filter(port => port.direction === 'in');
  equipment.outputs = ports.filter(port => port.direction === 'out');
  equipment.bidirectional = ports.filter(port => port.direction === 'both');
  if (imageUrl) equipment.imageUrl = imageUrl;
  equipment.portal = portal;
  return equipment;
}

// 2단계 카테고리를 1.1 category로 옮길 수 없으면 1.1의 'etc'로 두고 제품 이슈로 남긴다(예외를 내지 않는다)
export function categoryFields(categories) {
  const category = V.CATEGORY_BY_LEVEL2[categories[1]];
  return { category: category ?? 'etc', name: text(categories[2]), mapped: Boolean(category) };
}

// ── 슬롯·카드 (B-20261013-03). Portal 상세 최상위와 RTCOM lineup 항목이 같은 모양이다 ──
//   프레임: slots { input?, output?, shared?, source, verification, note? }
//   카드:   slotType "input"|"output"|"shared", compatibleFrames [Portal slug | RTCOM 메인프레임 model]
// 형식 오류는 데이터를 잘못 읽은 결선이 나가지 않도록 생성기 오류로 멈춘다.
const SLOT_KINDS = [['input', 'IN'], ['output', 'OUT'], ['shared', 'S']];
const SLOT_TYPES = SLOT_KINDS.map(([kind]) => kind);
const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function frameSlots(where, raw) {
  const fail = message => { throw new Error(`slots ${where}: ${message}`); };
  if (!isPlainObject(raw)) fail('객체가 아니다');
  const counts = {};
  for (const kind of SLOT_TYPES) {
    const value = raw[kind] ?? 0;
    if (!Number.isInteger(value) || value < 0) fail(`${kind}는 0 이상의 정수다`);
    counts[kind] = value;
  }
  if (!counts.input && !counts.output && !counts.shared) fail('input·output·shared가 모두 0이다');
  if (!text(raw.source)) fail('source(출처 기호)가 필요하다');
  if (!text(raw.verification)) fail('verification이 필요하다');
  const slots = { ...counts, source: text(raw.source), verification: text(raw.verification) };
  if (text(raw.note)) slots.note = text(raw.note);
  slots.list = SLOT_KINDS.flatMap(([slotType, prefix]) => Array.from({ length: counts[slotType] }, (_, i) => ({ id: `${prefix}${i + 1}`, slotType })));
  slots.compatibleCards = [];
  return slots;
}

// compatibleFrames는 원문 이름 그대로 둔다. 배치 단위 ID로 바꾸는 일은 linkSlotCards가 한다
export function cardInfo(where, slotType, compatibleFrames) {
  const fail = message => { throw new Error(`card ${where}: ${message}`); };
  if (!SLOT_TYPES.includes(slotType)) fail(`slotType은 ${SLOT_TYPES.join('·')} 중 하나다 (${slotType})`);
  if (!Array.isArray(compatibleFrames)) fail('compatibleFrames는 배열이다');
  if (!compatibleFrames.every(name => typeof name === 'string' && text(name))) fail('compatibleFrames에 빈 이름이 있다');
  if (new Set(compatibleFrames).size !== compatibleFrames.length) fail('compatibleFrames에 중복이 있다');
  return { slotType, compatibleFrames: [...compatibleFrames] };
}

const hasCardFields = value => value.slotType !== undefined || value.compatibleFrames !== undefined;

// 제품 하나 → 라이브러리 항목. input은 목록·상세에서 필요한 값만 모은 객체
export function buildProduct(input, overrides = V.IO_OVERRIDES) {
  const { productId, source, brand, product, categories, detail, imageUrl } = input;
  const detailUrl = `${PORTAL_BASE}detail/?product=${productId}`;
  const issues = [];
  const { category, name, mapped } = categoryFields(categories);
  if (!mapped) issues.push({ code: 'category-unmapped', detail: text(categories[1]) });
  const io = Array.isArray(detail.io) ? detail.io : [];
  const description = text(detail.korean) || text(input.korean) || text(detail.english) || text(input.english);
  const base = { category, name, manufacturer: brand, description, series: text(detail.series), imageUrl };
  const units = [];
  const unresolved = [];
  const nonPort = [];
  const indexed = io.map((row, ioIndex) => ({ row, ioIndex }));
  // 시리즈 판정이 먼저다. 시리즈에 TX/RX 접두어 행이 있어도 시리즈로 다룬다
  const split = detail.itemType === 'SERIES' ? { status: 'series' } : txRxUnits(productId, detail.model ?? input.model, io);
  const isFrame = detail.slots !== undefined;
  const isCard = hasCardFields(detail);
  if (isFrame && isCard) throw new Error(`slots ${productId}: 프레임(slots)과 카드(slotType·compatibleFrames)를 함께 둘 수 없다`);
  if ((isFrame || isCard) && split.status !== 'none') throw new Error(`slots ${productId}: 최상위 slots·카드 필드는 나누지 않는 단일 제품에만 둔다 (${split.status})`);
  const extra = {};
  if (isFrame) extra.slots = frameSlots(productId, detail.slots);
  if (isCard) extra.card = cardInfo(productId, detail.slotType, detail.compatibleFrames);
  let cardIoRows = 0;
  if (split.status === 'split') {
    for (const part of split.units) {
      const built = buildPorts(part.rows, { overrides, productId, strip: part.strip, issues });
      const unitId = `${productId}:${part.unit}`;
      units.push({ unitId, unit: part.unit, equipment: equipmentObject({ ...base, unitId, model: part.model, ports: built.ports, portal: { productId, source, unit: part.unit, detailUrl } }) });
      unresolved.push(...built.unresolved.map(item => ({ ...item, unit: part.unit })));
      nonPort.push(...built.nonPort.map(item => ({ ...item, unit: part.unit })));
    }
  } else if (split.status === 'partial' || split.status === 'mismatch') {
    // TX/RX로 나눠야 하는데 근거가 모자라면 한 노드에 섞지 않고 전 행을 확인 필요로 둔다(§6.1)
    issues.push({ code: 'txrx-unresolved', detail: split.status });
    units.push({ unitId: productId, equipment: equipmentObject({ ...base, unitId: productId, model: text(detail.model ?? input.model), ports: [], portal: { productId, source, detailUrl } }) });
    unresolved.push(...indexed.map(({ row, ioIndex }) => unresolvedItem(row, ioIndex, ['txrx'])));
  } else if (split.status === 'series') {
    const seen = new Map();
    // 메인프레임은 모두, 카드는 slotType이 있는 항목만 배치 단위가 된다(카드 단자는 그 항목의 io)
    for (const entry of (detail.lineup ?? []).filter(item => item.kind === '메인프레임' || hasCardFields(item))) {
      let slug = modelSlug(entry.model);
      const count = (seen.get(slug) ?? 0) + 1;
      seen.set(slug, count);
      if (count > 1) {
        issues.push({ code: 'variant-slug-duplicate', detail: entry.model });
        slug = `${slug}-${count}`;
      }
      const unitId = `${productId}:${slug}`;
      const where = `${productId} ${entry.model}`;
      const unitExtra = {};
      if (entry.kind === '메인프레임') {
        if (hasCardFields(entry)) throw new Error(`card ${where}: 메인프레임에 카드 필드를 둘 수 없다`);
        if (entry.slots !== undefined) unitExtra.slots = frameSlots(where, entry.slots);
      } else {
        if (entry.slots !== undefined) throw new Error(`slots ${where}: 카드에 slots를 둘 수 없다`);
        unitExtra.card = cardInfo(where, entry.slotType, entry.compatibleFrames);
      }
      const cardRows = Array.isArray(entry.io) ? entry.io.map((row, ioIndex) => ({ row, ioIndex })) : [];
      cardIoRows += cardRows.length;
      // 개별 지정 키는 '<배치 단위 ID>#<행 번호>'다(예: rtcom-spx:spx-hos10#0)
      const built = buildPorts(cardRows, { overrides, productId: unitId, issues });
      // 시리즈 모델의 설명은 lineup의 모델별 요약을 쓰고, 없으면 시리즈 설명을 쓴다
      units.push({ unitId, variant: entry.model, equipment: equipmentObject({ ...base, unitId, model: entry.model, description: text(entry.summary) || description, ports: built.ports, portal: { productId, source, variant: entry.model, detailUrl } }), ...unitExtra });
      unresolved.push(...built.unresolved.map(item => ({ ...item, variant: entry.model })));
      nonPort.push(...built.nonPort.map(item => ({ ...item, variant: entry.model })));
    }
    // 시리즈에 I/O 행이 생기면 어느 모델의 단자인지 알 수 없으므로 확인 필요로 둔다
    unresolved.push(...indexed.map(({ row, ioIndex }) => unresolvedItem(row, ioIndex, ['series-io'])));
  } else {
    const built = buildPorts(indexed, { overrides, productId, issues, cardIo: isFrame });
    units.push({ unitId: productId, equipment: equipmentObject({ ...base, unitId: productId, model: text(detail.model ?? input.model), ports: built.ports, portal: { productId, source, detailUrl } }), ...extra });
    unresolved.push(...built.unresolved);
    nonPort.push(...built.nonPort);
  }
  const ports = units.reduce((total, unit) => total + unit.equipment.inputs.length + unit.equipment.outputs.length + unit.equipment.bidirectional.length, 0);
  const entry = { productId, source, brand, product, categories: [...categories], detailUrl };
  if (imageUrl) entry.imageUrl = imageUrl;
  entry.placeable = !V.NOT_PLACEABLE_LEVEL3.includes(categories[2]);
  entry.units = units;
  entry.unresolved = unresolved;
  entry.nonPort = nonPort;
  entry.issues = issues;
  entry.readiness = { ioRows: io.length + cardIoRows, ports, unresolvedRows: unresolved.length, nonPortRows: nonPort.length };
  return entry;
}

// 카드의 compatibleFrames(원문 이름)를 프레임 배치 단위 ID로 바꾸고, 프레임에 장착 가능한 카드 목록을 채운다.
//   Portal 카드: Portal 제품 slug · RTCOM 카드: RTCOM 메인프레임·제품 model
// 가리키는 프레임이 없거나 그 프레임에 맞는 슬롯이 0이면 생성기 오류다.
export function linkSlotCards(products) {
  const frames = { portal: new Map(), rtcom: new Map() };
  for (const product of products) {
    for (const unit of product.units) {
      if (!unit.slots) continue;
      const key = product.source === 'portal' ? product.productId : unit.equipment.model;
      if (frames[product.source].has(key)) throw new Error(`slots ${unit.unitId}: 프레임 이름 ${key}가 겹친다`);
      frames[product.source].set(key, unit);
    }
  }
  const portalIds = new Set(products.filter(product => product.source === 'portal').map(product => product.productId));
  for (const product of products) {
    for (const unit of product.units) {
      if (!unit.card) continue;
      unit.card.compatibleFrames = unit.card.compatibleFrames.map(name => {
        const frame = frames[product.source].get(name);
        if (!frame) {
          const why = product.source === 'portal' && portalIds.has(name) ? `${name}에 slots가 없다` : `${name} 제품이 없다`;
          throw new Error(`card ${unit.unitId}: compatibleFrames ${name} — ${why}`);
        }
        const { slotType } = unit.card;
        const fits = frame.slots[slotType] > 0 || (slotType !== 'shared' && frame.slots.shared > 0);
        if (!fits) throw new Error(`card ${unit.unitId}: ${frame.unitId}에 ${slotType} 카드를 꽂을 슬롯이 없다`);
        frame.slots.compatibleCards.push(unit.unitId);
        return frame.unitId;
      });
    }
  }
  for (const unit of [...frames.portal.values(), ...frames.rtcom.values()]) unit.slots.compatibleCards.sort();
  return products;
}

export function vocabularyBlock() {
  return {
    version: V.VOCABULARY_VERSION,
    signals: V.SIGNALS.map(signal => ({ ...signal })),
    connectors: [...V.CONNECTORS],
    connectorWildcards: structuredClone(V.CONNECTOR_WILDCARDS),
    connectorEquivalents: V.CONNECTOR_EQUIVALENTS.map(pair => [...pair]),
    levelPairs: V.LEVEL_PAIRS.map(pair => [...pair]),
    reservedLineTypes: [...V.RESERVED_LINE_TYPE_IDS],
  };
}

// inputs: { catalogRaw, details: Map<slug, raw>, rtcomIndexRaw, rtcomProducts: Map<id, raw>, rtcomIds: string[] }
export function buildBuilderLibrary({ catalogRaw, details, rtcomIndexRaw, rtcomProducts, rtcomIds }, overrides = V.IO_OVERRIDES) {
  const catalog = JSON.parse(catalogRaw);
  const rtcomIndex = JSON.parse(rtcomIndexRaw);
  const products = [];
  for (const item of catalog.filter(entry => entry.kind === 'equipment' && entry.slug)) {
    const raw = details.get(item.slug);
    if (raw === undefined) throw new Error(`상세 JSON 없음: ${item.slug}`);
    products.push(buildProduct({ productId: item.slug, source: 'portal', brand: item.brand, product: item.product, categories: item.categories, detail: JSON.parse(raw), imageUrl: item.card_image ? `${PORTAL_BASE}detail/images/${item.card_image}` : undefined }, overrides));
  }
  for (const id of rtcomIds) {
    const indexItem = rtcomIndex.products.find(entry => entry.id === id);
    const raw = rtcomProducts.get(id);
    if (!indexItem || raw === undefined) throw new Error(`RTCOM 제품 없음: ${id}`);
    products.push(buildProduct({ productId: `rtcom-${id}`, source: 'rtcom', brand: 'RTCOM', product: indexItem.productName, categories: indexItem.categories, detail: JSON.parse(raw), korean: indexItem.korean, english: indexItem.english, model: indexItem.model, imageUrl: indexItem.cardImage ? `${PORTAL_BASE}rtcom/images/${indexItem.cardImage}` : undefined }, overrides));
  }
  products.sort((a, b) => (a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0));
  linkSlotCards(products);
  // source의 SHA-256. 모두 CRLF를 LF로 바꾼 뒤 계산한다.
  //   catalogSha: catalog.json 원문
  //   detailSetSha: 상세 slug 오름차순으로 (slug + NUL + 상세 원문의 SHA-256)을 줄바꿈으로 이은 값
  //   rtcomSha: index.json 원문의 SHA-256 다음에 RTCOM id 오름차순으로 (id + NUL + 상세 원문의 SHA-256)을 줄바꿈으로 이은 값
  const detailSetSha = sha256([...details.keys()].sort().map(slug => `${slug}\0${sha256(details.get(slug))}`).join('\n'));
  const rtcomSha = sha256([sha256(rtcomIndexRaw), ...[...rtcomProducts.keys()].sort().map(id => `${id}\0${sha256(rtcomProducts.get(id))}`)].join('\n'));
  return {
    schema: LIBRARY_SCHEMA,
    schemaVersion: LIBRARY_SCHEMA_VERSION,
    source: { catalogSha: sha256(catalogRaw), detailSetSha, rtcomSha, vocabularyVersion: V.VOCABULARY_VERSION },
    lineTypes: V.LINE_TYPES.map(lineType => ({ ...lineType })),
    vocabulary: vocabularyBlock(),
    products,
  };
}

export const serializeLibrary = library => `${JSON.stringify(library, null, 2)}\n`;

// 준비도 요약(기반명세 §1.4와 같은 분류)
export function libraryReport(library) {
  const rows = { port: 0, review: 0, wireless: 0, unsupported: 0, slot: 0, service: 0 };
  const reasons = Object.fromEntries(V.REVIEW_REASONS.map(reason => [reason, 0]));
  const brands = {};
  const issues = {};
  let ports = 0, all = 0, partial = 0, noPort = 0, noIo = 0;
  let slotFrames = 0, cards = 0, cardsWithoutFrames = 0;
  for (const product of library.products) {
    for (const unit of product.units) {
      if (unit.slots) slotFrames += 1;
      if (unit.card) {
        cards += 1;
        if (!unit.card.compatibleFrames.length) cardsWithoutFrames += 1;
      }
    }
    const r = product.readiness;
    ports += r.ports;
    for (const item of product.nonPort) rows[item.kind] += 1;
    rows.review += r.unresolvedRows;
    rows.port += r.ioRows - r.unresolvedRows - r.nonPortRows;
    for (const item of product.unresolved) { reasons[item.reason] += 1; brands[product.brand] = (brands[product.brand] ?? 0) + 1; }
    for (const issue of product.issues) issues[issue.code] = (issues[issue.code] ?? 0) + 1;
    if (r.ioRows === 0) noIo += 1;
    else if (r.ports === 0) noPort += 1;
    else if (r.unresolvedRows === 0) all += 1;
    else partial += 1;
  }
  const total = Object.values(rows).reduce((a, b) => a + b, 0);
  return { products: library.products.length, ioRows: total, rows, ports, productsWithPorts: all + partial, productsAllResolved: all, productsPartial: partial, productsNoPort: noPort, productsNoIo: noIo, slotFrames, cards, cardsWithoutFrames, reviewByReason: reasons, productIssues: issues, reviewByBrand: Object.fromEntries(Object.entries(brands).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))) };
}
