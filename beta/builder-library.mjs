// Portal 장비 데이터 → Builder 결선용 라이브러리(builder-library.json).
// 화면과 파일 입출력이 없는 순수 함수만 둔다. 근거: Work/빌더/기반명세.md §2~§6, 부록 A.
import { createHash } from 'node:crypto';
import * as V from './port-vocabulary.mjs';
import { classifyIoRow, portLineType, signalKey, validateOverride } from './port-classify.mjs';

// 행 판정 규칙(부록 A1~A5)은 port-classify.mjs에 있다(B-20261013-02: Builder 화면도 같은 규칙을 쓴다). 기존 가져오기 경로를 위해 다시 내보낸다
export { classifyIoRow, nonPortKind, normalizeConnector, normalizeDirection, normalizeQuantity, normalizeSignals, portLineType, signalKey, validateOverride } from './port-classify.mjs';

export const LIBRARY_SCHEMA = 'av-portal.builder-library';
// 1.1.0 (B-20261013-03): 배치 단위에 프레임 슬롯(slots)·카드 장착 정보(card) 추가
// 1.2.0 (B-20261013-02): 단자 portalIo에 원본 행 번호(ioIndex)·방향(direction)·수량(quantity) 원문 추가 — Portal 반영 요청이 행 단위로 묶는 데 쓴다
export const LIBRARY_SCHEMA_VERSION = '1.2.0';
export const PORTAL_BASE = 'https://seoulav.github.io/AV-Portal/';

const text = value => String(value ?? '').trim();
const normalizeNewlines = value => String(value ?? '').replaceAll('\r\n', '\n');
export const sha256 = value => createHash('sha256').update(normalizeNewlines(value)).digest('hex');

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
  const built = ports.map(({ row, ioIndex, result, group }) => {
    const key = `${result.direction}-${signalKey(result.signals[0])}`;
    const n = (counters.get(key) ?? 0) + 1;
    counters.set(key, n);
    const signal = V.SIGNAL_BY_ID.get(result.signals[0]);
    const suffix = groupsByKey.get(key).size > 1 && group ? ` (${group})` : '';
    const port = { id: `${key}-${n}`, label: `${signal.label} ${V.DIRECTION_LABELS[result.direction]} ${n}${suffix}`, type: portLineType(result.connector, result.signals), direction: result.direction, connector: result.connector, signals: result.signals };
    const verification = text(row.verification);
    if (verification) port.verification = verification;
    // ioIndex: 그 배치 단위의 io 배열 안 행 번호(단일 제품·TX/RX는 상세 io, 시리즈는 lineup 항목 io). direction·quantity: 원문
    port.portalIo = { group: text(row.group), connector: text(row.connector), signal: text(row.signal), ioIndex, direction: text(row.direction), quantity: text(row.quantity) };
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
// 형식 오류 처리
//   Portal 데이터: 생성기 오류로 멈춘다(PR 검사에서 잡힌다).
//   RTCOM 데이터: 원본이 Portal 밖에서 바뀌어 배포가 멈추지 않도록, 그 필드만 빼고 제품 이슈로 남긴다
//     (slot-data-invalid · card-frame-missing · card-slot-mismatch).
const SLOT_KINDS = [['input', 'IN'], ['output', 'OUT'], ['shared', 'S']];
const SLOT_TYPES = SLOT_KINDS.map(([kind]) => kind);
const SLOT_KEYS = [...SLOT_TYPES, 'source', 'verification', 'note'];
const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// fn이 던진 형식 오류를 출처에 따라 멈추거나(Portal) 이슈로 바꾼다(RTCOM)
function slotData(source, issues, fn) {
  if (source !== 'rtcom') return fn();
  try {
    return fn();
  } catch (error) {
    issues.push({ code: 'slot-data-invalid', detail: error.message });
    return undefined;
  }
}

export function frameSlots(where, raw) {
  const fail = message => { throw new Error(`slots ${where}: ${message}`); };
  if (!isPlainObject(raw)) fail('객체가 아니다');
  const unknown = Object.keys(raw).filter(key => !SLOT_KEYS.includes(key));
  if (unknown.length) fail(`알 수 없는 키 ${unknown.join('·')}`);
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
  const extra = slotData(source, issues, () => {
    const isFrame = detail.slots !== undefined;
    const isCard = hasCardFields(detail);
    if (isFrame && isCard) throw new Error(`slots ${productId}: 프레임(slots)과 카드(slotType·compatibleFrames)를 함께 둘 수 없다`);
    if ((isFrame || isCard) && split.status !== 'none') throw new Error(`slots ${productId}: 최상위 slots·카드 필드는 나누지 않는 단일 제품에만 둔다 (${split.status})`);
    if (isFrame) return { slots: frameSlots(productId, detail.slots) };
    if (isCard) return { card: cardInfo(productId, detail.slotType, detail.compatibleFrames) };
    return {};
  }) ?? {};
  const isFrame = Boolean(extra.slots);
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
    const lineup = detail.lineup ?? [];
    // 메인프레임도 카드도 아닌 항목(전송기·전원 등)의 슬롯·카드 필드는 쓰지 않고 알린다
    for (const item of lineup.filter(item => item.kind !== '메인프레임' && !hasCardFields(item) && item.slots !== undefined)) {
      slotData(source, issues, () => { throw new Error(`slots ${productId} ${item.model}: 메인프레임이 아닌 항목(${item.kind})에 slots가 있다`); });
    }
    // 메인프레임은 모두, 카드는 slotType이 있는 항목만 배치 단위가 된다(카드 단자는 그 항목의 io)
    for (const entry of lineup.filter(item => item.kind === '메인프레임' || hasCardFields(item))) {
      let slug = modelSlug(entry.model);
      const count = (seen.get(slug) ?? 0) + 1;
      seen.set(slug, count);
      if (count > 1) {
        issues.push({ code: 'variant-slug-duplicate', detail: entry.model });
        slug = `${slug}-${count}`;
      }
      const unitId = `${productId}:${slug}`;
      const where = `${productId} ${entry.model}`;
      const unitExtra = slotData(source, issues, () => {
        if (entry.kind === '메인프레임') {
          if (hasCardFields(entry)) throw new Error(`card ${where}: 메인프레임에 카드 필드를 둘 수 없다`);
          return entry.slots !== undefined ? { slots: frameSlots(where, entry.slots) } : {};
        }
        if (entry.slots !== undefined) throw new Error(`slots ${where}: 카드에 slots를 둘 수 없다`);
        return { card: cardInfo(where, entry.slotType, entry.compatibleFrames) };
      }) ?? {};
      const entryRows = Array.isArray(entry.io) ? entry.io.map((row, ioIndex) => ({ row, ioIndex })) : [];
      cardIoRows += entryRows.length;
      // 개별 지정 키는 '<배치 단위 ID>#<행 번호>'다(예: rtcom-spx:spx-hos10#0).
      // 슬롯 정보가 있는 메인프레임의 io에서 카드 장착 시 행은 단일 제품과 같이 슬롯 행으로 둔다
      const built = buildPorts(entryRows, { overrides, productId: unitId, issues, cardIo: Boolean(unitExtra.slots) });
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
// 가리키는 프레임이 없거나 그 프레임에 맞는 슬롯이 0이면 Portal은 생성기 오류, RTCOM은 그 대상만 빼고 제품 이슈다.
// 원문 이름을 단위 ID로 바꿔 쓰므로 한 라이브러리에 한 번만 부른다(buildBuilderLibrary).
export function linkSlotCards(products) {
  const frames = { portal: new Map(), rtcom: new Map() };
  const known = { portal: new Set(), rtcom: new Set() };
  for (const product of products) {
    for (const unit of product.units) {
      const key = product.source === 'portal' ? product.productId : unit.equipment.model;
      known[product.source].add(key);
      if (!unit.slots) continue;
      if (frames[product.source].has(key)) {
        slotData(product.source, product.issues, () => { throw new Error(`slots ${unit.unitId}: 프레임 이름 ${key}가 겹친다`); });
        continue;
      }
      frames[product.source].set(key, unit);
    }
  }
  for (const product of products) {
    for (const unit of product.units) {
      if (!unit.card) continue;
      const linked = [];
      for (const name of unit.card.compatibleFrames) {
        const frame = frames[product.source].get(name);
        const { slotType } = unit.card;
        let problem = null;
        if (!frame) problem = { code: 'card-frame-missing', message: `compatibleFrames ${name} — ${known[product.source].has(name) ? `${name}에 slots가 없다` : `${name} 제품이 없다`}` };
        else if (!(frame.slots[slotType] > 0 || (slotType !== 'shared' && frame.slots.shared > 0))) problem = { code: 'card-slot-mismatch', message: `${frame.unitId}에 ${slotType} 카드를 꽂을 슬롯이 없다` };
        if (problem) {
          if (product.source !== 'rtcom') throw new Error(`card ${unit.unitId}: ${problem.message}`);
          product.issues.push({ code: problem.code, detail: `${unit.unitId}: ${problem.message}` });
          continue;
        }
        frame.slots.compatibleCards.push(unit.unitId);
        linked.push(frame.unitId);
      }
      unit.card.compatibleFrames = linked;
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
