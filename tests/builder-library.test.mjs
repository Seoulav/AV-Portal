import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildProduct, classifyIoRow, libraryReport, normalizeConnector, serializeLibrary, txRxUnits, validateOverride } from '../beta/builder-library.mjs';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';
import * as V from '../beta/port-vocabulary.mjs';

// 규칙·회귀 시험은 실제 원문 문자열을 옮긴 행으로 검사한다. 현재 데이터 파일에 의존하지 않는다.
const row = (connector, signal, direction = 'IN', quantity = '1', extra = {}) => ({ group: '', connector, signal, direction, quantity, protocol: '', availability: '', condition: '', ...extra });
const port = (r, connector, signals, direction, count) => assert.deepEqual(
  (({ kind, connector: c, signals: s, direction: d, count: n }) => ({ kind, connector: c, signals: s, direction: d, count: n }))(classifyIoRow(r)),
  { kind: 'port', connector, signals, direction, count },
);
const kind = (r, expected, reason) => {
  const result = classifyIoRow(r);
  assert.equal(result.kind, expected, JSON.stringify(r));
  if (reason) assert.equal(result.reasons[0], reason);
};
const product = (overrides = {}, input = {}) => buildProduct({ productId: 'x', source: 'portal', brand: 'B', product: 'P', categories: ['영상', 'Video', 'Converter'], detail: { model: 'P', io: [] }, ...input }, overrides);

test('A1 rows that are not ports keep their kind (one case per rule)', () => {
  kind(row('DisplayPort', '비디오 입력', 'IN', '1', { availability: '미지원(사양표 "No")' }), 'unsupported');
  kind(row('SERVICE(서비스 전용)', 'Service'), 'service');
  kind(row('Security Lock Slot', '물리적 보안 잠금'), 'service');
  kind(row('USB Type-C', 'Firmware update & ez-Control'), 'service');
  kind(row('Wireless LAN', '무선 LAN', ''), 'wireless');
  kind(row('IR 수신부', 'IR remote'), 'wireless');
  kind(row('Ex-Link', '무선 미러링(Google Cast)'), 'wireless');
  kind(row('RF', '리모컨'), 'wireless');
  kind(row('출력 카드(HDMI 2.0 등)', '4K60p output', 'OUT', '8'), 'slot');
  kind(row('HDMI Type A (19-pin Female)', 'HDMI', 'IN', '6', { condition: '모듈 칸마다 1개(HDMI IN/OUT) · TX 모듈은 소스 입력' }), 'slot');
  // 제외 정규식
  port(row('USB Host Type A', 'USB 메모리 펌웨어 업데이트/미디어 재생'), 'USB-A', ['USB'], 'in', 1);
  port(row('USB Type-A(WiFi)', 'USB'), 'USB-A', ['USB'], 'in', 1);
  port(row('온보드 Dante 카드', 'Dante audio networking', 'I/O'), 'UNKNOWN', ['DANTE', 'ETHERNET'], 'both', 1);
});

test('A2 every connector rule has a real-text case', () => {
  const cases = [
    ['커넥터 없음(3.7 m 무단말 케이블 직결)', 'CAPTIVE'], ['Barrier strip(4극 터치 방지 단자대)', 'TERMINAL-BLOCK'], ['Binding Post', 'BINDING-POST'],
    ['Neutrik NL4 (Speakon)', 'SPEAKON'], ['32A PowerCON', 'POWERCON'], ['IEC C20 inlet (20A max)', 'IEC-C20'], ['IEC 320-C14', 'IEC-C14'],
    ['IEC C13', 'IEC-C13'], ['15A IEC', 'IEC'], ['CEE7/7', 'SCHUKO'], ['DC IN XLR 4핀', 'XLR4'], ['DC Jack', 'DC'], ['HD-BNC', 'HD-BNC'],
    ['BNC 75Ω', 'BNC'], ['HDMI Type-A', 'HDMI'], ['DisplayPort 1.2', 'DP'], ['DVI-D', 'DVI'], ['D-sub HD 15-pin (female)', 'DSUB-15'],
    ['DB-25(Female)', 'DSUB-25'], ['D-sub 9-pin (female)', 'DSUB-9'], ['VISCA RS-232C OUT Mini DIN 8핀', 'MINI-DIN-8'], ['SFP+', 'SFP'],
    ['2LC 광 커넥터', 'LC'], ['SC simplex', 'SC'], ['RJ-11(6포지션)', 'RJ11'], ['etherCON Cat5e', 'RJ45'], ['USB Type-C', 'USB-C'],
    ['USB Type-B', 'USB-B'], ['Micro-USB', 'USB-MICRO'], ['Mini USB(S/P)', 'USB-MINI'], ['USB Type-A', 'USB-A'], ['USB 2.0', 'USB'],
    ['TA4M (4핀 수 미니 커넥터)', 'MINI-XLR'], ['Combo (XLR-3-31 / TRS phone)', 'XLR-COMBO'], ['XLR 4-pin', 'XLR4'], ['XLR 3-pin chassis', 'XLR'],
    ['1/4인치 TRS', 'TRS-6.3'], ['3.5mm 스테레오 미니잭', 'TRS-3.5'], ['RCA (Cinch)', 'RCA'], ['옵티컬(광출력)', 'OPTICAL'], ['SMA', 'SMA'],
    ['10-pin modular connector', 'PROPRIETARY'],
  ];
  const covered = new Set(cases.map(([, id]) => id));
  for (const [id] of V.CONNECTOR_RULES) assert.ok(covered.has(id), `사례 없는 커넥터 규칙: ${id}`);
  for (const [raw, expected] of cases) assert.equal(normalizeConnector(raw), expected, raw);
  // 형상이 적히지 않은 칸은 추정하지 않는다
  for (const raw of ['Ethernet(LAN)', 'RS-232C 입력', 'VISCA RS-422 9핀 단자', 'headphone', '커넥터 규격 정보 없음', 'MISSING', '']) assert.equal(normalizeConnector(raw), 'UNKNOWN', raw);
  assert.equal(normalizeConnector('D-SUB 9핀 (본체 단자 성별 정보 없음)'), 'DSUB-9');
  // 다중 커넥터와 예외
  for (const multi of ['HDMI 1.4 또는 3G-SDI', 'HDMI 2.0 + 12G-SDI(미러링)', 'USB Type-C / RJ45-DB9', 'XLR ×1, 1/4"(6.35 mm) ×1 (inst/aux)', '1/4" (6.35 mm) 및 XLR', '3-pin XLR 또는 5-pin XLR (LED 모델)', 'SDI BNC / XLR R']) {
    assert.equal(normalizeConnector(multi), 'MULTI', multi);
  }
  assert.equal(normalizeConnector('XLR (채널당 1개, 다이렉트 또는 합산 출력 가능)'), 'XLR');
  assert.equal(normalizeConnector('DB9 (XLR 브레이크아웃)'), 'DSUB-9');
  assert.equal(normalizeConnector('RJ-45(RS-232 배선)'), 'RJ45');
  assert.equal(normalizeConnector('3G-SDI (BNC 75Ω)'), 'BNC');
  assert.equal(normalizeConnector('3.5mm Screw Terminal(4-pin)'), 'TERMINAL-BLOCK');
});

test('A3 signal rules each have a case and stay out of digital video', () => {
  port(row('RJ45 (IN·OUT)', 'HARMAN BLU link digital audio bus', 'OUT'), 'RJ45', ['BLU-LINK'], 'out', 1);
  port(row('RJ45', 'Dante/AES67 audio + PoE', 'I/O'), 'RJ45', ['DANTE', 'AES67', 'ETHERNET', 'POE'], 'both', 1);
  port(row('etherCON/RJ-45', 'CobraNet', 'I/O'), 'RJ45', ['COBRANET', 'ETHERNET'], 'both', 1);
  port(row('RJ45 (HDBaseT)', 'HDBaseT 입력'), 'RJ45', ['HDBASET'], 'in', 1);
  port(row('HDMI', '비디오/오디오 입력', 'IN', '3'), 'HDMI', ['HDMI'], 'in', 3);
  port(row('HDMI', 'DVI / HDMI (TMDS)', 'OUT'), 'HDMI', ['HDMI', 'DVI'], 'out', 1);
  port(row('DisplayPort', '비디오 입력'), 'DP', ['DP'], 'in', 1);
  port(row('BNC', '12G-SDI 입력'), 'BNC', ['SDI'], 'in', 1);
  port(row('BNC 75Ω', 'Reference in (Tri-level/Black Burst, Genlock)'), 'BNC', ['SYNC'], 'in', 1);
  port(row('D-sub 15pin', '아날로그 비디오 입력'), 'DSUB-15', ['ANALOG-VIDEO'], 'in', 1);
  port(row('D-sub HD 15-pin (female)', 'COMPUTER IN'), 'DSUB-15', ['ANALOG-VIDEO'], 'in', 1);
  port(row('TALLY IN / CONTACT OUT 9핀', 'Tally/Contact', 'I/O'), 'UNKNOWN', ['GPIO'], 'both', 1);
  port(row('Barrier strip(4극 터치 방지 단자대)', 'Speaker output', 'OUT', '4채널'), 'TERMINAL-BLOCK', ['SPEAKER'], 'out', 4);
  port(row('Phoenix/Combicon 스크류 단자', 'Mic/Line 아날로그 입력', 'IN', '4채널'), 'TERMINAL-BLOCK', ['MIC-AUDIO', 'LINE-AUDIO'], 'in', 4);
  port(row('XLR 3-pin', 'Microphone input'), 'XLR', ['MIC-AUDIO'], 'in', 1);
  port(row('XLR-F', 'Balanced analog audio in', 'IN', '2'), 'XLR', ['LINE-AUDIO'], 'in', 2);
  port(row('XLR 3-pin chassis', 'AES/EBU out', 'OUT'), 'XLR', ['AES3'], 'out', 1);
  port(row('옵티컬(광출력)', '디지털 오디오 출력', 'OUT'), 'OPTICAL', ['SPDIF'], 'out', 1);
  port(row('RJ-45', 'Ethernet (제어/구성/모니터링/PoE 전원)'), 'RJ45', ['ETHERNET', 'POE'], 'both', 1);
  port(row('RS-232C 입력', '외부 제어'), 'UNKNOWN', ['RS-232'], 'in', 1);
  port(row('VISCA RS-422 OUT RJ-45', 'PTZ control RS-422', 'OUT'), 'RJ45', ['RS-422'], 'out', 1);
  port(row('RS-485 (4-pin terminal)', 'RS-485', 'I/O'), 'TERMINAL-BLOCK', ['RS-485'], 'both', 1);
  port(row('IR 입력', 'IR 수신/외부 IR'), 'UNKNOWN', ['IR'], 'in', 1);
  port(row('Terminal block', 'Relay contact', 'OUT'), 'TERMINAL-BLOCK', ['RELAY'], 'out', 1);
  port(row('Terminal block', 'Remote turn-on trigger', 'IN'), 'TERMINAL-BLOCK', ['GPIO'], 'in', 1);
  port(row('USB Type-B', 'USB'), 'USB-B', ['USB'], 'in', 1);
  port(row('BNC ×2 (antenna A/B)', 'Antenna input', 'IN', '2'), 'BNC', ['RF'], 'in', 2);
  port(row('IEC 320', 'Mains power'), 'IEC', ['POWER'], 'in', 1);
  // 커넥터가 신호를 정하는 경우와 광 링크
  port(row('HDMI', '디지털 비디오 입력', 'IN', '2'), 'HDMI', ['HDMI'], 'in', 2);
  port(row('Neutrik NL4 (Speakon)', '출력', 'OUT'), 'SPEAKON', ['SPEAKER'], 'out', 1);
  port(row('2LC 광 커넥터', 'Fiber Optical', 'OUT'), 'LC', ['FIBER'], 'out', 1);
  // 전원과 USB
  port(row('USB Type-A', 'DC OUT', 'OUT'), 'USB-A', ['POWER'], 'out', 1);
  port(row('USB Type-A', 'Memory Viewer / USB DC OUT', 'OUT'), 'USB-A', ['USB', 'POWER'], 'out', 1);
  // 팬텀·PoE 전원은 어느 칸에 적혀 있어도 전원 단자가 아니다
  kind(row('XLR (팬텀 전원)', 'Power input'), 'review', 'no-signal');
  port(row('RJ45 (PoE)', 'Power input'), 'RJ45', ['ETHERNET', 'POE'], 'both', 1);
  // 다중 신호
  kind(row('SFP (AUX A, AUX B)', '추가 SDI, HDMI 또는 64채널 MADI', 'I/O'), 'review', 'multi-signal');
  kind(row('HDMI 2.0', '멀티뷰어 out', 'OUT'), 'review', 'multi-signal');
});

test('A4 and A5 direction and quantity', () => {
  kind(row('USB B', 'REMOTE USB', 'N/A'), 'review', 'direction');
  kind(row('BNC', 'SDI IN/LOOP', 'IN/LOOP'), 'review', 'direction');
  port(row('RJ45', 'LAN CONTROL', 'N/A'), 'RJ45', ['ETHERNET'], 'both', 1);
  port(row('RJ45(LAN)', '유선 네트워크', 'IN'), 'RJ45', ['ETHERNET'], 'both', 1);
  port(row('HDMI', 'HDMI IN', '입력', '2 x HDMI'), 'HDMI', ['HDMI'], 'in', 2);
  port(row('RJ45 x 2', 'Network / Dante audio', 'I/O', ''), 'RJ45', ['DANTE', 'ETHERNET'], 'both', 2);
  kind(row('3.5mm stereo', 'Stereo Audio', 'OUT', '2채널'), 'review', 'quantity');
  kind(row('HDMI', 'HDMI', 'IN', '1/1'), 'review', 'quantity');
});

test('review regressions from the independent reviews stay fixed', () => {
  kind(row('RJ45(네트워크 포트 공용)', 'Dante/AES67 audio', 'IN', '4채널'), 'review', 'quantity');
  port(row('1 x RJ45', 'Dante/AES67 audio', 'I/O', '4채널'), 'RJ45', ['DANTE', 'AES67', 'ETHERNET'], 'both', 1);
  port(row('6핀 유로블록 x2 (GPI 1-4, GPI 5-8, 5V)', 'GPIO/AUX 제어 입출력', 'I/O', ''), 'TERMINAL-BLOCK', ['GPIO'], 'both', 2);
  port(row('RJ-45', 'DIGITAL LINK', 'IN', '1', { protocol: 'HDBaseT / 100Base-TX' }), 'RJ45', ['HDBASET'], 'in', 1);
  kind(row('RJ45 (Conference Network, Upstream)', '중앙 유닛(CU) 방향 연결', 'IN', '2', { protocol: 'Plixus 독자 프로토콜' }), 'review', 'no-signal');
  port(row('SFP', '1G Fiber', 'IN/OUT', '8'), 'SFP', ['ETHERNET'], 'both', 8);
  kind(row('HDMI 2.0 + 12G-SDI(미러링)', 'Program out', 'OUT', '2'), 'review', 'multi-connector');
  kind(row('RJ-45', 'HARMAN BLU link digital audio bus', 'I/O', ''), 'review', 'quantity');
});

test('overrides are validated and ignored when the original text changed', () => {
  const ok = { match: { connector: 'BNC', signal: '디지털 비디오 입력' }, connector: 'BNC', signals: ['SDI'], direction: 'in', quantity: 1, note: '제조사 매뉴얼 p.12' };
  assert.doesNotThrow(() => validateOverride('k', ok));
  for (const bad of [{ ...ok, match: undefined }, { ...ok, connector: 'BNCX' }, { ...ok, signals: ['NOPE'] }, { ...ok, direction: 'up' }, { ...ok, quantity: 0 }, { ...ok, note: '' }]) {
    assert.throws(() => validateOverride('k', bad), /IO_OVERRIDES/);
  }
  const io = [{ group: 'Video', connector: 'BNC', signal: '디지털 비디오 입력', direction: 'IN', quantity: '1' }];
  const applied = product({ 'x#0': ok }, { detail: { model: 'P', io } });
  assert.deepEqual(applied.units[0].equipment.inputs.map(p => p.id), ['in-sdi-1']);
  const stale = product({ 'x#0': { ...ok, match: { connector: 'BNC', signal: '예전 원문' } } }, { detail: { model: 'P', io } });
  assert.deepEqual(stale.issues, [{ code: 'override-stale', ioIndex: 0 }]);
  assert.equal(stale.unresolved[0].reason, 'no-signal');
});

test('data-shape problems become issues, not exceptions', () => {
  const unmapped = product({}, { categories: ['조명', 'Lighting', 'Fixture'] });
  assert.equal(unmapped.units[0].equipment.category, 'etc');
  assert.deepEqual(unmapped.issues, [{ code: 'category-unmapped', detail: 'Lighting' }]);
  const tx = { group: 'TX · Video', connector: 'HDMI', signal: 'HDMI', direction: 'IN', quantity: '1', condition: 'CT101-U' };
  const rx = { group: 'RX · Video', connector: 'HDMI', signal: 'HDMI', direction: 'OUT', quantity: '1', condition: 'CR101-U' };
  const partial = product({}, { detail: { model: 'CT101-U / CR101-U', io: [tx, rx, { ...rx, group: 'Power', condition: '' }] } });
  assert.deepEqual(partial.issues, [{ code: 'txrx-unresolved', detail: 'partial' }]);
  assert.deepEqual(partial.unresolved.map(u => u.reason), ['txrx', 'txrx', 'txrx']);
  assert.equal(partial.readiness.ports, 0);
  const mismatch = product({}, { detail: { model: 'CT101-U / CR101-U', io: [tx, { ...rx, condition: 'CT999-X' }] } });
  assert.deepEqual(mismatch.issues, [{ code: 'txrx-unresolved', detail: 'mismatch' }]);
  const series = product({}, { detail: { itemType: 'SERIES', model: 'S', io: [tx], lineup: [{ model: 'S-1', kind: '메인프레임' }, { model: 'S 1', kind: '메인프레임' }, { model: 'C', kind: '입력 카드' }] } });
  assert.deepEqual(series.units.map(u => u.unitId), ['x:s-1', 'x:s-1-2']);
  assert.deepEqual(series.issues, [{ code: 'variant-slug-duplicate', detail: 'S 1' }]);
  assert.deepEqual(series.unresolved.map(u => u.reason), ['series-io']);
});

test('TX/RX units follow group prefixes and condition model names', () => {
  const io = [
    { group: 'TX · Video', connector: 'HDMI', signal: 'HDMI', direction: 'IN', quantity: '1', condition: 'CT101-U' },
    { group: 'TX · Control', connector: 'Phoenix', signal: 'RS-232', direction: 'BIDIR', quantity: '1', condition: 'CT101-U · 커넥터 핀 수 미기재' },
    { group: 'RX · Video', connector: 'HDMI', signal: 'HDMI', direction: 'OUT', quantity: '1', condition: 'CR101-U' },
    { group: 'RX · Control', connector: 'Phoenix', signal: 'RS-232', direction: 'BIDIR', quantity: '1', condition: 'CR101-U' },
  ];
  const split = txRxUnits('rtcom-x', 'CT101-U / CR101-U', io);
  assert.equal(split.status, 'split');
  assert.deepEqual(split.units.map(unit => [unit.unit, unit.model, unit.rows.length]), [['tx', 'CT101-U', 2], ['rx', 'CR101-U', 2]]);
  assert.equal(txRxUnits('rtcom-x', 'SPX-TX / SPX-RX', io.map(r => ({ ...r, condition: r.group.startsWith('TX') ? 'SPX-TX' : 'SPX-RX' }))).units[0].model, 'SPX-TX');
  assert.equal(txRxUnits('rtcom-x', 'OBHD-2C', io.map(r => ({ ...r, condition: r.group.startsWith('TX') ? 'TX' : 'RX · 오디오 추출' }))).units[1].model, 'OBHD-2C (RX)');
  assert.equal(txRxUnits('rtcom-x', 'A', io.map(r => ({ ...r, group: 'Video' }))).status, 'none');
  const built = product({}, { productId: 'rtcom-x', source: 'rtcom', categories: ['영상', 'Video', 'Extender'], detail: { model: 'CT101-U / CR101-U', io } });
  assert.deepEqual(built.units.map(unit => unit.unitId), ['rtcom-x:tx', 'rtcom-x:rx']);
  assert.deepEqual(built.units.map(unit => unit.equipment.bidirectional[0].id), ['both-rs-232-1', 'both-rs-232-1']);
  assert.deepEqual(built.units.map(unit => unit.equipment.inputs[0]?.label ?? unit.equipment.outputs[0].label), ['HDMI In 1', 'HDMI Out 1']);
});

test('port ids and labels number per direction and signal with group suffixes', () => {
  const io = [
    { group: 'Front', connector: 'HDMI', signal: 'HDMI IN', direction: 'IN', quantity: '1' },
    { group: 'Rear', connector: 'HDMI', signal: 'HDMI IN', direction: 'IN', quantity: '2' },
    { group: 'Rear', connector: 'HDMI', signal: 'HDMI OUT', direction: 'OUT', quantity: '1' },
  ];
  const equipment = product({}, { detail: { model: 'P', io } }).units[0].equipment;
  assert.deepEqual(equipment.inputs.map(p => [p.id, p.label]), [['in-hdmi-1', 'HDMI In 1 (Front)'], ['in-hdmi-2', 'HDMI In 2 (Rear)'], ['in-hdmi-3', 'HDMI In 3 (Rear)']]);
  assert.deepEqual(equipment.outputs.map(p => [p.id, p.label]), [['out-hdmi-1', 'HDMI Out 1']]);
  assert.deepEqual(Object.keys(equipment), ['id', 'category', 'name', 'model', 'manufacturer', 'description', 'inputs', 'outputs', 'bidirectional', 'portal']);
  assert.deepEqual(Object.keys(equipment.inputs[0]), ['id', 'label', 'type', 'direction', 'connector', 'signals', 'portalIo']);
  const fiber = product({}, { detail: { model: 'P', io: [{ group: 'Net', connector: 'SFP', signal: '1000BASE-X', direction: 'I/O', quantity: '1' }] } }).units[0].equipment;
  assert.equal(fiber.bidirectional[0].type, 'fiber');
});

test('changing a rule table requires a vocabulary version bump', () => {
  // 규칙 표를 바꾸면 이 지문이 달라진다. VOCABULARY_VERSION을 올리고 기반명세 부록 A를 고친 뒤 지문을 갱신한다
  const serialize = value => JSON.stringify(value, (key, item) => (item instanceof RegExp ? `/${item.source}/${item.flags}` : item));
  const tables = { NON_PORT_RULES: V.NON_PORT_RULES, UNKNOWN_CONNECTOR: V.UNKNOWN_CONNECTOR, CONNECTOR_RULES: V.CONNECTOR_RULES, CONNECTOR_FAMILIES: V.CONNECTOR_FAMILIES, FAMILY_EXEMPTIONS: V.FAMILY_EXEMPTIONS, MULTI_SPLIT: V.MULTI_SPLIT, SIGNALS: V.SIGNALS, SIGNAL_RULES: V.SIGNAL_RULES, LINE: V.LINE, MIC: V.MIC, POWER_TEXT: V.POWER_TEXT, POWER_EXCLUDE: V.POWER_EXCLUDE, DIRECTION_RULES: V.DIRECTION_RULES, CHANNEL_CONNECTORS: V.CHANNEL_CONNECTORS, LINE_TYPES: V.LINE_TYPES };
  const fingerprint = createHash('sha256').update(serialize(tables)).digest('hex').slice(0, 16);
  assert.deepEqual({ version: V.VOCABULARY_VERSION, fingerprint }, { version: '1.0.0', fingerprint: FINGERPRINT_1_0_0 });
});
const FINGERPRINT_1_0_0 = 'aa1f8ed660df8cc0';

// ── 현재 데이터로 만든 라이브러리: 고정 수치가 아니라 구조 불변 조건만 본다 ──
let cached;
const library = async () => (cached ??= await expectedBuilderLibrary());
const portsOf = equipment => [...equipment.inputs, ...equipment.outputs, ...equipment.bidirectional];

test('the library has the documented top-level shape', async () => {
  const lib = await library();
  assert.deepEqual(Object.keys(lib), ['schema', 'schemaVersion', 'source', 'lineTypes', 'vocabulary', 'products']);
  assert.equal(lib.schema, 'av-portal.builder-library');
  assert.deepEqual(Object.keys(lib.source), ['catalogSha', 'detailSetSha', 'rtcomSha', 'vocabularyVersion']);
  for (const id of V.BASE_LINE_TYPE_IDS) assert.ok(lib.lineTypes.some(lineType => lineType.id === id), id);
  assert.deepEqual(lib.products.map(p => p.productId), [...lib.products.map(p => p.productId)].sort());
});

test('every unit is a 1.1 Equipment with unique, well-formed port ids', async () => {
  const lib = await library();
  const unitIds = new Set();
  for (const p of lib.products) for (const unit of p.units) {
    assert.equal(unitIds.has(unit.unitId), false, unit.unitId);
    unitIds.add(unit.unitId);
    const equipment = unit.equipment;
    for (const key of ['id', 'category', 'name', 'model', 'inputs', 'outputs', 'bidirectional']) assert.ok(Object.hasOwn(equipment, key), `${unit.unitId} ${key}`);
    assert.equal(equipment.id, unit.unitId);
    assert.equal(equipment.portal.productId, p.productId);
    const ids = new Set();
    for (const item of portsOf(equipment)) {
      assert.match(item.id, /^(in|out|both)-[a-z0-9-]+-[1-9]\d*$/);
      assert.equal(ids.has(item.id), false, `${unit.unitId} ${item.id}`);
      ids.add(item.id);
      assert.ok(V.SIGNAL_BY_ID.has(item.signals[0]), item.signals[0]);
      assert.ok(lib.lineTypes.some(lineType => lineType.id === item.type), item.type);
    }
  }
});

test('split and series units keep their documented shape', async () => {
  const lib = await library();
  for (const p of lib.products.filter(item => item.units.some(unit => unit.unit))) assert.deepEqual(p.units.map(unit => unit.unit), ['tx', 'rx'], p.productId);
  for (const p of lib.products.filter(item => item.units.some(unit => unit.variant))) {
    for (const unit of p.units) {
      assert.equal(portsOf(unit.equipment).length, 0, unit.unitId);
      assert.match(unit.unitId, new RegExp(`^${p.productId}:[a-z0-9-]+$`));
    }
  }
});

test('the library is deterministic and leaks no local paths', async () => {
  const lib = await library();
  const serialized = serializeLibrary(lib);
  assert.equal(serializeLibrary(await expectedBuilderLibrary()), serialized);
  // 공개 데이터에서만 만들므로 로컬·비공개 경로가 섞이면 안 된다(beta/verify-pages.mjs의 경로 표식과 같다)
  assert.doesNotMatch(serialized, /C:[\\/]|Users[\\/]|hkkim[\\/]|(?:^|["\s])Work[\\/]|outputs[\\/]/i);
  const report = libraryReport(lib);
  assert.equal(Object.values(report.rows).reduce((a, b) => a + b, 0), report.ioRows);
});
