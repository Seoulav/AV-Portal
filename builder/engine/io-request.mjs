// Portal 반영 요청 파일(B-20261013-02). 장비 설정 창에서 고친 단자를 Portal 상세 JSON의 I/O 행 변경으로 묶는다.
// 화면은 이 파일을 내려받기만 하고, 저장소에서 node beta/apply-builder-io-request.mjs <파일>로 적용해 PR로 올린다.
//
// 묶는 규칙(라이브러리 1.2.0의 단자 portalIo.ioIndex로 단자 → 원본 행을 찾는다)
//   - 행 하나에서 나온 라이브러리 단자가 모두 지워졌다 → remove
//   - 남은 단자를 같은 (커넥터·신호·방향)끼리 나눈다. 원래 값과 같은 묶음(없으면 첫 묶음)이 그 행에 남고 → update(바뀐 칸만 고침, 수가 바뀌면 quantity)
//     나머지 묶음은 같은 group의 새 행 → add
//   - 사용자가 추가한 단자(origin "user")는 같은 (커넥터·신호·방향)끼리 새 행 하나 → add
//   - 고친 행·새 행의 원문은 생성기 규칙(beta/port-classify.mjs)으로 다시 판정해 같은 단자가 나올 때만 넣는다. 아니면 notReflected
// 반영하지 않는 것(notReflected): 단자 이름(생성기가 매긴다), 개별 지정(IO_OVERRIDES) 행, Portal 원문으로 나타낼 수 없는 값,
//   행을 지우면 뒤 행의 개별 지정 번호가 밀리는 경우
import { classifyIoRow } from '../../beta/port-classify.mjs';
import { CONNECTOR_COUNT, IO_OVERRIDES, ON_ETHERNET } from '../../beta/port-vocabulary.mjs';
import { PORT_LISTS } from './normalize.mjs';

export const IO_REQUEST_SCHEMA = 'av-portal.builder-io-request';
export const IO_REQUEST_SCHEMA_VERSION = '1.0.0';
export const ROW_FIELDS = Object.freeze(['group', 'connector', 'signal', 'direction', 'quantity']);

// ── 표준값 → Portal 원문. 생성기가 같은 표준값으로 읽는지는 tests/builder-io-request.test.mjs가 모두 확인한다 ──
// 표에 없는 커넥터는 ID 그대로 쓴다(HDMI·RJ45 등은 ID가 곧 원문)
export const CONNECTOR_TEXT = Object.freeze({
  UNKNOWN: '정보 없음',
  // 유로블록(어휘 1.0.1, B-20261013-07): 피닉스·유로블럭 표기를 하나로 묶은 Portal 표기
  'TERMINAL-BLOCK': '유로블록',
  'BINDING-POST': 'Binding Post',
  'IEC-C13': 'IEC C13',
  SCHUKO: 'CEE7/7',
  XLR4: 'XLR 4pin',
  'DSUB-15': 'D-SUB 15',
  'DSUB-25': 'DB-25',
  'DSUB-9': 'D-SUB 9',
  'MINI-DIN-8': 'Mini DIN 8',
  'USB-MICRO': 'Micro USB',
  'USB-MINI': 'Mini USB',
  'MINI-XLR': 'Mini XLR',
  'TRS-6.3': '6.3mm TRS',
  'TRS-3.5': '3.5mm TRS',
  PROPRIETARY: 'Proprietary modular',
});
// 표에 없는 신호는 어휘 표시명 그대로 쓴다. AVB는 원문 규칙이 없어(개별 지정으로만 생긴다) 나타낼 수 없다
export const SIGNAL_TEXT = Object.freeze({
  'BLU-LINK': 'BLU link',
  SYNC: 'Sync (Reference)',
  'ANALOG-VIDEO': 'Analog video',
  'MIC-AUDIO': 'Mic Audio',
  'LINE-AUDIO': 'Line Audio',
  SPDIF: 'S/PDIF',
  POE: 'PoE',
});
export const DIRECTION_TEXT = Object.freeze({ in: 'IN', out: 'OUT', both: 'IN/OUT' });
// 사용자 단자로 만든 새 행의 group
export const GROUP_TEXT = Object.freeze({ in: 'Input', out: 'Output', both: 'Input/Output' });

export const connectorText = connector => CONNECTOR_TEXT[connector] ?? connector;
// signalVocabulary: 라이브러리 vocabulary.signals. 여러 신호면 " / "로 잇는다
export const signalText = (signals, signalVocabulary = []) => signals.map(id => SIGNAL_TEXT[id] ?? signalVocabulary.find(signal => signal.id === id)?.label ?? id).join(' / ');

const specKey = spec => JSON.stringify([spec.connector, spec.signals, spec.direction]);
const sameSpec = (a, b) => specKey(a) === specKey(b);
const rowOf = portalIo => Object.fromEntries(ROW_FIELDS.map(field => [field, String(portalIo?.[field] ?? '')]));
const labels = ports => ports.map(port => port.label);
const reasonOf = ports => [...new Set(ports.map(port => String(port.reason ?? '').trim()).filter(Boolean))].join('; ');

// 원문 행이 바라는 단자로 읽히는지: 커넥터·방향·수·신호가 같아야 한다.
// 생성기가 덧붙이는 보조 신호는 Dante·AES67 등 이더넷 위 신호의 Ethernet만 받아들인다(그 밖에 신호가 늘면 다른 단자다)
export function rowYields(row, spec, count) {
  const result = classifyIoRow(row);
  if (result.kind !== 'port') return false;
  const extra = result.signals.filter(signal => !spec.signals.includes(signal));
  const extraAllowed = extra.every(signal => signal === 'ETHERNET' && spec.signals.some(id => ON_ETHERNET.includes(id)));
  return result.connector === spec.connector && result.direction === spec.direction && result.count === count
    && result.signals[0] === spec.signals[0] && spec.signals.every(signal => result.signals.includes(signal)) && extraAllowed;
}

// before 원문을 바탕으로 바뀐 칸만 고친 행. 그대로 둔 원문으로 판정이 어긋나면 표준 원문으로 바꿔 다시 본다.
// protocol: 그 행의 protocol 원문(고치지 않는다. 신호 판정에 쓰이므로 확인에 넣는다). 나타낼 수 없으면 null
function rewriteRow(before, protocol, original, spec, count, signalVocabulary) {
  // 수를 커넥터 원문("XLR x4")에서 읽는 행은 quantity만 고치면 원문끼리 어긋난다. 추측해 고치지 않는다
  if (count !== original.count && CONNECTOR_COUNT.test(before.connector)) return null;
  const candidate = { ...before };
  if (spec.connector !== original.connector) candidate.connector = connectorText(spec.connector);
  if (JSON.stringify(spec.signals) !== JSON.stringify(original.signals)) candidate.signal = signalText(spec.signals, signalVocabulary);
  if (spec.direction !== original.direction) candidate.direction = DIRECTION_TEXT[spec.direction];
  if (count !== original.count) candidate.quantity = String(count);
  const attempts = [
    candidate,
    { ...candidate, signal: signalText(spec.signals, signalVocabulary) },
    { ...candidate, connector: connectorText(spec.connector), signal: signalText(spec.signals, signalVocabulary) },
    { ...candidate, connector: connectorText(spec.connector), signal: signalText(spec.signals, signalVocabulary), direction: DIRECTION_TEXT[spec.direction], quantity: String(count) },
  ];
  // 단자 값이 바뀌었는데 원문이 그대로면(예: 생성기가 덧붙인 신호만 뺐다) 반영할 수 없다
  return attempts.find(row => ROW_FIELDS.some(field => row[field] !== before[field]) && rowYields({ ...row, protocol, availability: '', condition: '' }, spec, count)) ?? null;
}

// 새 행 원문
function newRow(group, spec, count, signalVocabulary) {
  const row = { group, connector: connectorText(spec.connector), signal: signalText(spec.signals, signalVocabulary), direction: DIRECTION_TEXT[spec.direction], quantity: String(count) };
  return rowYields({ ...row, protocol: '', availability: '', condition: '' }, spec, count) ? row : null;
}

// 같은 값끼리 나눈다(처음 나온 순서)
function partition(ports) {
  const groups = new Map();
  for (const port of ports) {
    const key = specKey(port);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(port);
  }
  return [...groups.values()];
}

// 개별 지정이 그 행에 실제로 쓰이는지(생성기와 같이 match 원문이 맞아야 쓰인다)
export function overrideApplies(overrides, key, row) {
  const override = Object.hasOwn(overrides, key) ? overrides[key] : null;
  return Boolean(override && override.match?.connector === String(row?.connector ?? '').trim() && override.match?.signal === String(row?.signal ?? '').trim());
}

// 편집한 단자 목록 → 요청 파일.
// input
//   lists: { inputs, outputs, bidirectional } — 단자 { id?, label, connector, signals, origin?, reason? }. 방향은 목록이 정한다. id가 없거나 origin "user"면 사용자 단자
//   data: 노드 data(portal·model)
//   libraryEquipment: 이 노드의 라이브러리 장비(1.2.0, 단자 portalIo에 ioIndex). librarySource: 라이브러리 source(catalogSha·detailSetSha·rtcomSha)
//   signalVocabulary: 라이브러리 vocabulary.signals. overrides: 개별 지정 표(시험용으로 바꿔 넣을 수 있다)
// 결과: { ok, code?, detail?, request, notReflected: [{ code, ports, detail? }] }
//   code 'library-missing' · 'library-old'(portalIo.ioIndex 없음) · 'library-changed'(라이브러리에 없는 라이브러리 단자)
//        'generic-equipment'(빌더 전용 일반 장비 — Portal 원본이 없다)
//        'unit-unsupported'(Portal 제품의 TX/RX·시리즈 배치 단위 — 적용 스크립트가 아직 다루지 않는다. RTCOM은 전달용으로 만든다)
export function buildIoRequest({ lists, data, libraryEquipment, librarySource, signalVocabulary = [], overrides = IO_OVERRIDES, createdAt }) {
  const fail = (code, detail) => ({ ok: false, code, detail, request: null, notReflected: [] });
  if (!libraryEquipment) return fail('library-missing', data?.model);
  const portal = data?.portal ?? libraryEquipment.portal;
  if (portal?.source === 'builder') return fail('generic-equipment', libraryEquipment.id);
  if (portal?.source !== 'rtcom' && libraryEquipment.id !== portal?.productId) return fail('unit-unsupported', libraryEquipment.id);
  const libraryPorts = Object.keys(PORT_LISTS).flatMap(list => libraryEquipment[list] ?? []);
  if (libraryPorts.some(port => !Number.isInteger(port.portalIo?.ioIndex))) return fail('library-old', '라이브러리 1.2.0 이상이 필요하다');
  const libraryById = new Map(libraryPorts.map(port => [port.id, port]));
  // 원본 행별 라이브러리 단자
  const rows = new Map();
  for (const port of libraryPorts) {
    const { ioIndex } = port.portalIo;
    if (!rows.has(ioIndex)) rows.set(ioIndex, { ioIndex, before: rowOf(port.portalIo), protocol: String(port.portalIo.protocol ?? ''), library: [], kept: [] });
    rows.get(ioIndex).library.push(port);
  }
  const users = [];
  for (const [list, direction] of Object.entries(PORT_LISTS)) {
    for (const input of lists[list] ?? []) {
      const port = { id: input.id, label: input.label, connector: input.connector, signals: [...(input.signals ?? [])], direction, reason: input.reason };
      if (!input.id || input.origin === 'user') { users.push(port); continue; }
      const reference = libraryById.get(input.id);
      if (!reference) return fail('library-changed', input.label);
      rows.get(reference.portalIo.ioIndex).kept.push(port);
    }
  }
  // 개별 지정 키: 시리즈 단위는 '<배치 단위 ID>#<행>', 나머지는 '<제품 ID>#<행>'(생성기 buildPorts와 같다)
  const overrideKey = ioIndex => `${portal?.variant ? libraryEquipment.id : portal?.productId}#${ioIndex}`;
  const ordered = [...rows.values()].sort((a, b) => a.ioIndex - b.ioIndex);
  const originalOf = row => ({ connector: row.library[0].connector, signals: row.library[0].signals, direction: row.library[0].direction, count: row.library.length });
  // 라이브러리 단자를 지우고 같은 값의 사용자 단자를 더했다면 그 행에 되돌려 넣는다(행 수량을 줄이고 새 행을 만드는 대신)
  for (const row of ordered) {
    if (overrideApplies(overrides, overrideKey(row.ioIndex), row.before)) continue;
    const original = originalOf(row);
    let missing = row.library.length - row.kept.filter(port => sameSpec(port, original)).length;
    for (let i = 0; i < users.length && missing > 0;) {
      if (sameSpec(users[i], original)) { row.kept.push(...users.splice(i, 1)); missing -= 1; } else i += 1;
    }
  }
  const notReflected = [];
  const updates = [];
  const removes = [];
  // 새 행은 (원래 행·group·커넥터·신호·방향)이 같으면 하나로 모은다(수량 = 단자 수).
  // fromIoIndex: 고친 행에서 갈라진 새 행이면 원래 행 번호. 적용 스크립트가 원래 행 변경을 건너뛰면 이 행도 건너뛴다
  const adds = new Map();
  const addPorts = (group, ports, fromIoIndex) => {
    const key = JSON.stringify([fromIoIndex ?? null, group, specKey(ports[0])]);
    if (!adds.has(key)) adds.set(key, { group, ports: [], fromIoIndex });
    adds.get(key).ports.push(...ports);
  };
  for (const row of ordered) {
    const original = originalOf(row);
    const renamed = row.kept.filter(port => port.id && libraryById.has(port.id) && port.label !== libraryById.get(port.id).label);
    // 개별 지정 행은 단자마다 값이 다를 수 있어 단자별 라이브러리 값과 견준다(되돌려 넣은 사용자 단자는 원래 값과)
    const unchanged = row.kept.length === row.library.length && row.kept.every(port => sameSpec(port, libraryById.get(port.id) ?? original));
    if (unchanged) {
      if (renamed.length) notReflected.push({ code: 'label', ports: labels(renamed) });
      continue;
    }
    if (overrideApplies(overrides, overrideKey(row.ioIndex), row.before)) {
      notReflected.push({ code: 'override', ports: labels(row.kept.length ? row.kept : row.library), detail: overrideKey(row.ioIndex) });
      continue;
    }
    if (!row.kept.length) {
      removes.push({ ioIndex: row.ioIndex, before: row.before, ports: row.library });
      continue;
    }
    const parts = partition(row.kept);
    const keepIndex = Math.max(0, parts.findIndex(part => sameSpec(part[0], original)));
    const keep = parts[keepIndex];
    const spec = { connector: keep[0].connector, signals: keep[0].signals, direction: keep[0].direction };
    const same = sameSpec(spec, original) && keep.length === original.count;
    const after = same ? row.before : rewriteRow(row.before, row.protocol, original, spec, keep.length, signalVocabulary);
    if (!after) {
      notReflected.push({ code: 'not-representable', ports: labels(keep) });
      // 원래 행을 고칠 수 없으면 갈라진 단자만 새 행으로 내면 단자 수가 어긋난다. 이 행 전체를 반영하지 않는다
      parts.forEach((part, index) => { if (index !== keepIndex) notReflected.push({ code: 'not-representable', ports: labels(part) }); });
      continue;
    }
    if (renamed.length) notReflected.push({ code: 'label', ports: labels(renamed) });
    if (!same) updates.push({ ioIndex: row.ioIndex, before: row.before, after, ports: keep });
    // 갈라진 단자: 방향이 같으면 원래 행의 group, 다른 목록으로 옮겼으면 방향에 따른 group
    parts.forEach((part, index) => {
      if (index !== keepIndex) addPorts(part[0].direction === original.direction ? row.before.group : GROUP_TEXT[part[0].direction], part, same ? undefined : row.ioIndex);
    });
  }
  for (const part of partition(users)) addPorts(GROUP_TEXT[part[0].direction], part);
  const added = [];
  for (const { group, ports, fromIoIndex } of adds.values()) {
    const row = newRow(group, ports[0], ports.length, signalVocabulary);
    if (row) added.push({ row, ports, fromIoIndex });
    else notReflected.push({ code: 'not-representable', ports: labels(ports) });
  }
  // 행을 지우면 뒤 행 번호가 하나씩 당겨진다. 그 제품의 개별 지정이 뒤에 있으면 번호가 어긋나므로 지우지 않는다
  const prefix = overrideKey('');
  const overrideIndexes = Object.keys(overrides).filter(key => key.startsWith(prefix)).map(key => Number(key.slice(prefix.length))).filter(Number.isInteger);
  const keptRemoves = [];
  for (const item of removes) {
    if (overrideIndexes.some(index => index > item.ioIndex)) notReflected.push({ code: 'override-shift', ports: labels(item.ports), detail: overrideKey(item.ioIndex) });
    else keptRemoves.push(item);
  }
  const changes = [
    ...updates.map(item => ({ op: 'update', ioIndex: item.ioIndex, before: item.before, after: item.after, reason: reasonOf(item.ports) })),
    ...keptRemoves.map(item => ({ op: 'remove', ioIndex: item.ioIndex, before: item.before, reason: '' })),
    ...added.map(item => ({ op: 'add', ...(item.fromIoIndex === undefined ? {} : { fromIoIndex: item.fromIoIndex }), row: item.row, reason: reasonOf(item.ports) })),
  ];
  const library = { catalogSha: String(librarySource?.catalogSha ?? ''), detailSetSha: String(librarySource?.detailSetSha ?? '') };
  if (librarySource?.rtcomSha) library.rtcomSha = String(librarySource.rtcomSha);
  const request = { schema: IO_REQUEST_SCHEMA, schemaVersion: IO_REQUEST_SCHEMA_VERSION, productId: String(portal?.productId ?? ''), source: portal?.source === 'rtcom' ? 'rtcom' : 'portal', unitId: String(libraryEquipment.id), model: String(data?.model ?? libraryEquipment.model ?? '') };
  if (createdAt) request.createdAt = createdAt;
  request.library = library;
  request.changes = changes;
  return { ok: true, request, notReflected };
}

// 요청 파일 이름: builder-io-request-<productId>-<YYYYMMDD>.json
export const ioRequestFileName = (productId, date = new Date()) => `builder-io-request-${productId}-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}.json`;

export const serializeIoRequest = request => `${JSON.stringify(request, null, 2)}\n`;

// ── 형식 검사(스키마 builder/schema/builder-io-request-1.0.schema.json과 같은 규칙. 적용 스크립트가 쓴다) ──
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const onlyKeys = (value, keys) => Object.keys(value).every(key => keys.includes(key));
const isRow = value => isObject(value) && onlyKeys(value, ROW_FIELDS) && ROW_FIELDS.every(field => typeof value[field] === 'string');
const isIndex = value => Number.isInteger(value) && value >= 0;
const nonEmpty = value => typeof value === 'string' && value.length > 0;

// 결과: 문제 목록(빈 배열이면 통과)
export function validateIoRequest(request) {
  const errors = [];
  if (!isObject(request)) return ['요청이 객체가 아니다'];
  if (!onlyKeys(request, ['schema', 'schemaVersion', 'productId', 'source', 'unitId', 'model', 'createdAt', 'library', 'changes'])) errors.push('알 수 없는 최상위 키');
  if (request.schema !== IO_REQUEST_SCHEMA) errors.push(`schema는 ${IO_REQUEST_SCHEMA}`);
  if (request.schemaVersion !== IO_REQUEST_SCHEMA_VERSION) errors.push(`schemaVersion은 ${IO_REQUEST_SCHEMA_VERSION}`);
  if (!nonEmpty(request.productId)) errors.push('productId가 비었다');
  if (!['portal', 'rtcom'].includes(request.source)) errors.push('source는 portal 또는 rtcom');
  if (!nonEmpty(request.unitId)) errors.push('unitId가 비었다');
  if (request.model !== undefined && typeof request.model !== 'string') errors.push('model은 문자열');
  if (request.createdAt !== undefined && typeof request.createdAt !== 'string') errors.push('createdAt은 문자열');
  const library = request.library;
  if (!isObject(library) || !onlyKeys(library, ['catalogSha', 'detailSetSha', 'rtcomSha']) || !nonEmpty(library.catalogSha) || !nonEmpty(library.detailSetSha) || (library.rtcomSha !== undefined && !nonEmpty(library.rtcomSha))) errors.push('library는 { catalogSha, detailSetSha, rtcomSha? }');
  if (!Array.isArray(request.changes) || !request.changes.length) errors.push('changes가 비었다');
  (Array.isArray(request.changes) ? request.changes : []).forEach((change, index) => {
    const at = `changes[${index}]`;
    if (!isObject(change)) { errors.push(`${at}: 객체가 아니다`); return; }
    if (typeof change.reason !== 'string') errors.push(`${at}: reason은 문자열`);
    if (change.op === 'add') {
      if (!onlyKeys(change, ['op', 'fromIoIndex', 'row', 'reason']) || !isRow(change.row) || (change.fromIoIndex !== undefined && !isIndex(change.fromIoIndex))) errors.push(`${at}: add는 { op, fromIoIndex?, row, reason }`);
    } else if (change.op === 'update') {
      if (!onlyKeys(change, ['op', 'ioIndex', 'before', 'after', 'reason']) || !isIndex(change.ioIndex) || !isRow(change.before) || !isRow(change.after)) errors.push(`${at}: update는 { op, ioIndex, before, after, reason }`);
    } else if (change.op === 'remove') {
      if (!onlyKeys(change, ['op', 'ioIndex', 'before', 'reason']) || !isIndex(change.ioIndex) || !isRow(change.before)) errors.push(`${at}: remove는 { op, ioIndex, before, reason }`);
    } else errors.push(`${at}: op는 add·update·remove`);
  });
  const indexes = (Array.isArray(request.changes) ? request.changes : []).filter(change => isObject(change) && change.op !== 'add').map(change => change.ioIndex);
  if (new Set(indexes).size !== indexes.length) errors.push('같은 행(ioIndex)을 두 번 바꾼다');
  return errors;
}
