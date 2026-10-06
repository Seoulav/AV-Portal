import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProduct, classifyIoRow, libraryReport, normalizeConnector, serializeLibrary, txRxUnits } from '../beta/builder-library.mjs';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';
import { BASE_LINE_TYPE_IDS, SIGNAL_BY_ID } from '../beta/port-vocabulary.mjs';

// 규칙·회귀 시험은 실제 원문 문자열을 옮긴 행으로 검사한다. 현재 데이터 파일에 의존하지 않는다.
const row = (connector, signal, direction = 'IN', quantity = '1', extra = {}) => ({ group: '', connector, signal, direction, quantity, protocol: '', availability: '', condition: '', ...extra });
const port = (r, connector, signals, direction, count) => assert.deepEqual(
  (({ kind, connector: c, signals: s, direction: d, count: n }) => ({ kind, connector: c, signals: s, direction: d, count: n }))(classifyIoRow(r)),
  { kind: 'port', connector, signals, direction, count },
);
const kind = (r, expected, reason) => {
  const result = classifyIoRow(r);
  assert.equal(result.kind, expected);
  if (reason) assert.equal(result.reasons[0], reason);
};

test('A1 rows that are not ports keep their kind', () => {
  kind(row('DisplayPort', '비디오 입력', 'IN', '1', { availability: '미지원(사양표 "No")' }), 'unsupported');
  kind(row('Security Lock Slot', '물리적 보안 잠금'), 'service');
  kind(row('Reset Slot', '리셋 버튼'), 'service');
  kind(row('USB Type-C', 'Firmware update & ez-Control'), 'service');
  kind(row('Wireless LAN', '무선 LAN', ''), 'wireless');
  kind(row('IR 수신부', 'IR remote'), 'wireless');
  kind(row('RF', '리모컨'), 'wireless');
  kind(row('무선(물리 단자 없음)', '무선 미러링(Apple AirPlay)'), 'wireless');
  kind(row('출력 카드(HDMI 2.0 등)', '4K60p output', 'OUT', '8'), 'slot');
  kind(row('HDMI Type A (19-pin Female)', 'HDMI', 'IN', '6', { condition: '모듈 칸마다 1개(HDMI IN/OUT) · TX 모듈은 소스 입력' }), 'slot');
  port(row('USB Type-A(WiFi)', 'USB', 'IN', '1'), 'USB-A', ['USB'], 'in', 1);
  port(row('온보드 Dante 카드', 'Dante audio networking', 'I/O', '1'), 'UNKNOWN', ['DANTE', 'ETHERNET'], 'both', 1);
});

test('A2 connectors are taken only from stated shapes', () => {
  assert.equal(normalizeConnector('Ethernet(LAN)'), 'UNKNOWN');
  assert.equal(normalizeConnector('RS-232C 입력'), 'UNKNOWN');
  assert.equal(normalizeConnector('D-SUB 9핀 (본체 단자 성별 정보 없음)'), 'DSUB-9');
  assert.equal(normalizeConnector('VISCA RS-422 9핀 단자'), 'UNKNOWN');
  assert.equal(normalizeConnector('3.5mm Screw Terminal(4-pin)'), 'TERMINAL-BLOCK');
  assert.equal(normalizeConnector('DC IN XLR 4핀'), 'XLR4');
  assert.equal(normalizeConnector('IEC C20 inlet (20A max)'), 'IEC-C20');
  assert.equal(normalizeConnector('Combo (XLR-3-31 / TRS phone)'), 'XLR-COMBO');
  assert.equal(normalizeConnector('Micro-USB'), 'USB-MICRO');
  assert.equal(normalizeConnector('VISCA RS-422 OUT RJ-45'), 'RJ45');
  assert.equal(normalizeConnector('DB9 (XLR 브레이크아웃)'), 'DSUB-9');
  assert.equal(normalizeConnector('커넥터 규격 정보 없음'), 'UNKNOWN');
  assert.equal(normalizeConnector('커넥터 없음(3.7 m 무단말 케이블 직결)'), 'CAPTIVE');
  for (const multi of ['HDMI 1.4 또는 3G-SDI', 'HDMI 2.0 + 12G-SDI(미러링)', 'USB Type-C / RJ45-DB9', 'XLR ×1, 1/4"(6.35 mm) ×1 (inst/aux)', '1/4" (6.35 mm) 및 XLR', '3-pin XLR 또는 5-pin XLR (LED 모델)']) {
    assert.equal(normalizeConnector(multi), 'MULTI', multi);
  }
  assert.equal(normalizeConnector('XLR (채널당 1개, 다이렉트 또는 합산 출력 가능)'), 'XLR');
});

test('A3 signals come from the signal column first and stay out of digital video', () => {
  port(row('HDMI', '비디오/오디오 입력', 'IN', '3'), 'HDMI', ['HDMI'], 'in', 3);
  port(row('XLR-F', 'Balanced analog audio in', 'IN', '2'), 'XLR', ['LINE-AUDIO'], 'in', 2);
  port(row('옵티컬(광출력)', '디지털 오디오 출력', 'OUT'), 'OPTICAL', ['SPDIF'], 'out', 1);
  port(row('D-sub HD 15-pin (female)', 'COMPUTER IN'), 'DSUB-15', ['ANALOG-VIDEO'], 'in', 1);
  port(row('TALLY IN / CONTACT OUT 9핀', 'Tally/Contact', 'I/O'), 'UNKNOWN', ['GPIO'], 'both', 1);
  // 팬텀·PoE 전원은 어느 칸에 적혀 있어도 전원 단자가 아니다
  kind(row('XLR (팬텀 전원)', 'Power input'), 'review', 'no-signal');
  port(row('RJ45 (PoE)', 'Power input'), 'RJ45', ['ETHERNET', 'POE'], 'both', 1);
  port(row('IEC 320', 'Mains power'), 'IEC', ['POWER'], 'in', 1);
  // signal 칸에 USB가 없으면 전원 출력 단자다. USB가 함께 적혀 있으면 USB가 주 신호
  port(row('USB Type-A', 'DC OUT', 'OUT'), 'USB-A', ['POWER'], 'out', 1);
  port(row('USB Type-A', 'Memory Viewer / USB DC OUT', 'OUT'), 'USB-A', ['USB', 'POWER'], 'out', 1);
  port(row('BNC 75Ω', 'Reference in (Tri-level/Black Burst, Genlock)'), 'BNC', ['SYNC'], 'in', 1);
  port(row('Phoenix/Combicon 스크류 단자', 'Mic/Line 아날로그 입력', 'IN', '4채널'), 'TERMINAL-BLOCK', ['MIC-AUDIO', 'LINE-AUDIO'], 'in', 4);
  port(row('RJ-45', 'Ethernet (제어/구성/모니터링/PoE 전원)'), 'RJ45', ['ETHERNET', 'POE'], 'both', 1);
});

test('review regressions from the independent review stay fixed', () => {
  // 공용 RJ45의 채널 수로 단자를 지어내지 않는다
  kind(row('RJ45(네트워크 포트 공용)', 'Dante/AES67 audio', 'IN', '4채널'), 'review', 'quantity');
  port(row('1 x RJ45', 'Dante/AES67 audio', 'I/O', '4채널'), 'RJ45', ['DANTE', 'AES67', 'ETHERNET'], 'both', 1);
  // AUX 제어 단자는 오디오가 아니다
  port(row('6핀 유로블록 x2 (GPI 1-4, GPI 5-8, 5V)', 'GPIO/AUX 제어 입출력', 'I/O', ''), 'TERMINAL-BLOCK', ['GPIO'], 'both', 2);
  // DIGITAL LINK는 protocol의 100Base-TX로 이더넷이 되지 않는다
  port(row('RJ-45', 'DIGITAL LINK', 'IN', '1', { protocol: 'HDBaseT / 100Base-TX' }), 'RJ45', ['HDBASET'], 'in', 1);
  // 독자 회의 버스는 이더넷이 아니다
  kind(row('RJ45 (Conference Network, Upstream)', '중앙 유닛(CU) 방향 연결', 'IN', '2', { protocol: 'Plixus 독자 프로토콜' }), 'review', 'no-signal');
  // 광 연장기 링크와 광 이더넷 SFP를 구분한다
  port(row('2LC 광 커넥터', 'Fiber Optical', 'OUT'), 'LC', ['FIBER'], 'out', 1);
  port(row('SFP', '1G Fiber', 'IN/OUT', '8'), 'SFP', ['ETHERNET'], 'both', 8);
  // 동시 출력 (미러링)은 무선이 아니다
  kind(row('HDMI 2.0 + 12G-SDI(미러링)', 'Program out', 'OUT', '2'), 'review', 'multi-connector');
  // 대칭 신호는 원문 방향과 관계없이 both
  port(row('RJ45(LAN)', '유선 네트워크', 'IN'), 'RJ45', ['ETHERNET'], 'both', 1);
  port(row('RJ45', 'LAN CONTROL', 'N/A'), 'RJ45', ['ETHERNET'], 'both', 1);
  // HDBaseT·BLU link는 대칭 신호가 아니다
  port(row('RJ45 (IN·OUT)', 'HARMAN BLU link digital audio bus', 'OUT'), 'RJ45', ['BLU-LINK'], 'out', 1);
  // 빈 수량을 1로 보지 않는다
  kind(row('RJ-45', 'HARMAN BLU link digital audio bus', 'I/O', ''), 'review', 'quantity');
});

test('overrides replace rule output for a single row', () => {
  const result = classifyIoRow(row('BNC', '디지털 비디오 입력'), { connector: 'BNC', signals: ['SDI'], direction: 'in', quantity: 1 });
  assert.equal(result.kind, 'port');
  assert.deepEqual(result.signals, ['SDI']);
});

test('TX/RX units follow group prefixes and condition model names', () => {
  const io = [
    { group: 'TX · Video', connector: 'HDMI', signal: 'HDMI', direction: 'IN', quantity: '1', condition: 'CT101-U' },
    { group: 'TX · Control', connector: 'Phoenix', signal: 'RS-232', direction: 'BIDIR', quantity: '1', condition: 'CT101-U · 커넥터 핀 수 미기재' },
    { group: 'RX · Video', connector: 'HDMI', signal: 'HDMI', direction: 'OUT', quantity: '1', condition: 'CR101-U' },
    { group: 'RX · Control', connector: 'Phoenix', signal: 'RS-232', direction: 'BIDIR', quantity: '1', condition: 'CR101-U' },
  ];
  const units = txRxUnits('rtcom-x', 'CT101-U / CR101-U', io);
  assert.deepEqual(units.map(unit => [unit.unit, unit.model, unit.rows.length]), [['tx', 'CT101-U', 2], ['rx', 'CR101-U', 2]]);
  assert.throws(() => txRxUnits('rtcom-x', 'CR101-U / CT101-U', [{ ...io[0], condition: 'CT101-U' }, { ...io[2], condition: 'CT101-U' }]), /condition/);
  assert.equal(txRxUnits('rtcom-x', 'A / B', [io[0], { ...io[2], group: 'Video' }]), null);
  const product = buildProduct({ productId: 'rtcom-x', source: 'rtcom', brand: 'RTCOM', product: 'X', categories: ['영상', 'Video', 'Extender'], detail: { model: 'CT101-U / CR101-U', io } }, {});
  assert.deepEqual(product.units.map(unit => unit.unitId), ['rtcom-x:tx', 'rtcom-x:rx']);
  assert.deepEqual(product.units.map(unit => unit.equipment.bidirectional[0].id), ['both-rs-232-1', 'both-rs-232-1']);
});

test('port ids and labels number per direction and signal with group suffixes', () => {
  const io = [
    { group: 'Front', connector: 'HDMI', signal: 'HDMI IN', direction: 'IN', quantity: '1' },
    { group: 'Rear', connector: 'HDMI', signal: 'HDMI IN', direction: 'IN', quantity: '2' },
    { group: 'Rear', connector: 'HDMI', signal: 'HDMI OUT', direction: 'OUT', quantity: '1' },
  ];
  const product = buildProduct({ productId: 'x', source: 'portal', brand: 'B', product: 'P', categories: ['영상', 'Video', 'Converter'], detail: { model: 'P', io } }, {});
  const equipment = product.units[0].equipment;
  assert.deepEqual(equipment.inputs.map(p => [p.id, p.label]), [['in-hdmi-1', 'HDMI In 1 (Front)'], ['in-hdmi-2', 'HDMI In 2 (Rear)'], ['in-hdmi-3', 'HDMI In 3 (Rear)']]);
  assert.deepEqual(equipment.outputs.map(p => [p.id, p.label]), [['out-hdmi-1', 'HDMI Out 1']]);
  assert.deepEqual(Object.keys(equipment), ['id', 'category', 'name', 'model', 'manufacturer', 'description', 'inputs', 'outputs', 'bidirectional', 'portal']);
  assert.deepEqual(Object.keys(equipment.inputs[0]), ['id', 'label', 'type', 'direction', 'connector', 'signals', 'portalIo']);
});

// ── 현재 데이터로 만든 라이브러리: 고정 수치가 아니라 구조 불변 조건만 본다 ──
const library = await expectedBuilderLibrary();
const units = library.products.flatMap(product => product.units.map(unit => ({ product, unit })));
const portsOf = equipment => [...equipment.inputs, ...equipment.outputs, ...equipment.bidirectional];

test('the library has the documented top-level shape', () => {
  assert.deepEqual(Object.keys(library), ['schema', 'schemaVersion', 'source', 'lineTypes', 'vocabulary', 'products']);
  assert.equal(library.schema, 'av-portal.builder-library');
  assert.deepEqual(Object.keys(library.source), ['catalogSha', 'detailSetSha', 'rtcomSha', 'vocabularyVersion']);
  for (const id of BASE_LINE_TYPE_IDS) assert.ok(library.lineTypes.some(lineType => lineType.id === id), id);
  assert.deepEqual(library.products.map(p => p.productId), [...library.products.map(p => p.productId)].sort());
});

test('every unit is a 1.1 Equipment with unique, well-formed port ids', () => {
  const unitIds = new Set();
  for (const { product, unit } of units) {
    assert.equal(unitIds.has(unit.unitId), false, unit.unitId);
    unitIds.add(unit.unitId);
    const equipment = unit.equipment;
    for (const key of ['id', 'category', 'name', 'model', 'inputs', 'outputs', 'bidirectional']) assert.ok(Object.hasOwn(equipment, key), `${unit.unitId} ${key}`);
    assert.equal(equipment.id, unit.unitId);
    assert.ok(['audio', 'video', 'display', 'conferencing', 'control', 'network'].includes(equipment.category), unit.unitId);
    assert.equal(equipment.portal.productId, product.productId);
    const ids = new Set();
    for (const p of portsOf(equipment)) {
      assert.match(p.id, /^(in|out|both)-[a-z0-9-]+-[1-9]\d*$/);
      assert.equal(ids.has(p.id), false, `${unit.unitId} ${p.id}`);
      ids.add(p.id);
      assert.ok(SIGNAL_BY_ID.has(p.signals[0]), p.signals[0]);
      assert.ok(library.lineTypes.some(lineType => lineType.id === p.type), p.type);
    }
  }
});

test('TX/RX and series products are split as documented', () => {
  const split = library.products.filter(product => product.units.some(unit => unit.unit));
  assert.ok(split.length > 0);
  for (const product of split) assert.deepEqual(product.units.map(unit => unit.unit), ['tx', 'rx'], product.productId);
  for (const product of library.products.filter(product => product.units.some(unit => unit.variant))) {
    for (const unit of product.units) {
      assert.equal(portsOf(unit.equipment).length, 0, unit.unitId);
      assert.match(unit.unitId, new RegExp(`^${product.productId}:[a-z0-9-]+$`));
    }
  }
});

test('the library is deterministic and carries no private markers', async () => {
  const again = await expectedBuilderLibrary();
  const serialized = serializeLibrary(library);
  assert.equal(serializeLibrary(again), serialized);
  // beta/verify-pages.mjs의 공개 차단 문자열과 같은 목록
  assert.doesNotMatch(serialized, /C:[\\/]|Users[\\/]|hkkim[\\/]|(?:^|["\s])Work[\\/]|outputs[\\/]|원본 행|공급처|단가|내부 메모|private source|READY FOR CODEX|READY WITH REVIEW FLAGS/i);
  const report = libraryReport(library);
  assert.equal(report.rows.port + report.rows.review + report.rows.wireless + report.rows.unsupported + report.rows.slot + report.rows.service, report.ioRows);
});
