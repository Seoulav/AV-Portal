// Portal 장비 데이터 → Builder 결선용 라이브러리(builder-library.json).
// 화면과 파일 입출력이 없는 순수 함수만 둔다. 근거: Work/빌더/기반명세.md §2~§6, 부록 A.
import { createHash } from 'node:crypto';
import * as V from './port-vocabulary.mjs';

export const LIBRARY_SCHEMA = 'av-portal.builder-library';
export const LIBRARY_SCHEMA_VERSION = '1.0.0';
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

// 한 I/O 행의 판정. override는 IO_OVERRIDES 항목(부록 A 밖의 개별 지정)
export function classifyIoRow(row, override = null) {
  if (override) {
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

export function txRxUnits(productId, model, io) {
  if (!io.length || !io.every(row => TX_PREFIX.test(text(row.group)) || RX_PREFIX.test(text(row.group)))) return null;
  if (!io.some(row => TX_PREFIX.test(text(row.group))) || !io.some(row => RX_PREFIX.test(text(row.group)))) return null;
  const parts = text(model).split(' / ').map(text).filter(Boolean);
  let txModel, rxModel;
  if (parts.length === 2) {
    const conditionModels = prefix => new Set(io.filter(row => prefix.test(text(row.group))).map(row => text(row.condition).split(' · ')[0]).filter(value => parts.includes(value)));
    const txSeen = conditionModels(TX_PREFIX), rxSeen = conditionModels(RX_PREFIX);
    [txModel, rxModel] = txSeen.has(parts[1]) || rxSeen.has(parts[0]) ? [parts[1], parts[0]] : parts;
    for (const value of txSeen) if (value !== txModel) throw new Error(`${productId}: TX 행 condition의 모델명(${value})이 TX 단위(${txModel})와 다르다`);
    for (const value of rxSeen) if (value !== rxModel) throw new Error(`${productId}: RX 행 condition의 모델명(${value})이 RX 단위(${rxModel})와 다르다`);
  } else {
    txModel = `${text(model)} (TX)`;
    rxModel = `${text(model)} (RX)`;
  }
  return [
    { unit: 'tx', model: txModel, rows: io.map((row, ioIndex) => ({ row, ioIndex })).filter(({ row }) => TX_PREFIX.test(text(row.group))), strip: TX_PREFIX },
    { unit: 'rx', model: rxModel, rows: io.map((row, ioIndex) => ({ row, ioIndex })).filter(({ row }) => RX_PREFIX.test(text(row.group))), strip: RX_PREFIX },
  ];
}

// ── §3 단자 ──
export function buildPorts(rows, { overrides = {}, productId, strip = null } = {}) {
  const ports = [];
  const unresolved = [];
  const nonPort = [];
  for (const { row, ioIndex } of rows) {
    const result = classifyIoRow(row, overrides[`${productId}#${ioIndex}`] ?? null);
    if (result.kind === 'port') {
      for (let i = 0; i < result.count; i += 1) ports.push({ row, ioIndex, result, group: strip ? text(row.group).replace(strip, '') : text(row.group) });
    } else if (result.kind === 'review') {
      unresolved.push({ ioIndex, group: text(row.group), connector: text(row.connector), signal: text(row.signal), reason: result.reasons[0], reasons: result.reasons });
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

// ── §4·§8.2 장비 객체 ──
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

export function categoryFields(categories, productId) {
  const category = V.CATEGORY_BY_LEVEL2[categories[1]];
  if (!category) throw new Error(`${productId}: 2단계 카테고리를 1.1 category로 옮길 수 없다(${categories[1]})`);
  return { category, name: text(categories[2]) };
}

// 제품 하나 → 라이브러리 항목. input은 목록·상세에서 필요한 값만 모은 객체
export function buildProduct(input, overrides = V.IO_OVERRIDES) {
  const { productId, source, brand, product, categories, detail, imageUrl } = input;
  const detailUrl = `${PORTAL_BASE}detail/?product=${productId}`;
  const { category, name } = categoryFields(categories, productId);
  const io = Array.isArray(detail.io) ? detail.io : [];
  const description = text(detail.korean) || text(input.korean) || text(detail.english) || text(input.english);
  const base = { category, name, manufacturer: brand, description, series: text(detail.series), imageUrl };
  const units = [];
  const unresolved = [];
  const nonPort = [];
  const split = txRxUnits(productId, detail.model ?? input.model, io);
  if (split) {
    for (const part of split) {
      const built = buildPorts(part.rows, { overrides, productId, strip: part.strip });
      const unitId = `${productId}:${part.unit}`;
      units.push({ unitId, unit: part.unit, equipment: equipmentObject({ ...base, unitId, model: part.model, ports: built.ports, portal: { productId, source, unit: part.unit, detailUrl } }) });
      unresolved.push(...built.unresolved.map(item => ({ ...item, unit: part.unit })));
      nonPort.push(...built.nonPort.map(item => ({ ...item, unit: part.unit })));
    }
  } else if (detail.itemType === 'SERIES') {
    for (const entry of (detail.lineup ?? []).filter(item => item.kind === '메인프레임')) {
      const unitId = `${productId}:${modelSlug(entry.model)}`;
      units.push({ unitId, variant: entry.model, equipment: equipmentObject({ ...base, unitId, model: entry.model, description: text(entry.summary) || description, ports: [], portal: { productId, source, variant: entry.model, detailUrl } }) });
    }
  } else {
    const built = buildPorts(io.map((row, ioIndex) => ({ row, ioIndex })), { overrides, productId });
    units.push({ unitId: productId, equipment: equipmentObject({ ...base, unitId: productId, model: text(detail.model ?? input.model), ports: built.ports, portal: { productId, source, detailUrl } }) });
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
  entry.readiness = { ioRows: io.length, ports, unresolvedRows: unresolved.length, nonPortRows: nonPort.length };
  return entry;
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
  let ports = 0, all = 0, partial = 0, noPort = 0, noIo = 0;
  for (const product of library.products) {
    const r = product.readiness;
    ports += r.ports;
    for (const item of product.nonPort) rows[item.kind] += 1;
    rows.review += r.unresolvedRows;
    rows.port += r.ioRows - r.unresolvedRows - r.nonPortRows;
    for (const item of product.unresolved) { reasons[item.reason] += 1; brands[product.brand] = (brands[product.brand] ?? 0) + 1; }
    if (r.ioRows === 0) noIo += 1;
    else if (r.ports === 0) noPort += 1;
    else if (r.unresolvedRows === 0) all += 1;
    else partial += 1;
  }
  const total = Object.values(rows).reduce((a, b) => a + b, 0);
  return { products: library.products.length, ioRows: total, rows, ports, productsWithPorts: all + partial, productsAllResolved: all, productsPartial: partial, productsNoPort: noPort, productsNoIo: noIo, reviewByReason: reasons, reviewByBrand: Object.fromEntries(Object.entries(brands).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))) };
}
