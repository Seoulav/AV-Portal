// B-20261013-02: 장비 설정 창의 단자 편집 → Portal 반영 요청 파일(builder/engine/io-request.mjs) → 상세 io 적용(beta/apply-builder-io-request.mjs).
// 실제 상세 파일은 바꾸지 않는다. 적용은 메모리 위의 사본과 임시 파일로만 한다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { addEquipmentNode, createDiagram, createIdFactory } from '../builder/engine/diagram.mjs';
import { createLibraryIndex } from '../builder/engine/library.mjs';
import { updateEquipmentPorts } from '../builder/engine/ports.mjs';
import { CONNECTOR_TEXT, DIRECTION_TEXT, GROUP_TEXT, buildIoRequest, connectorText, ioRequestFileName, rowYields, signalText, validateIoRequest } from '../builder/engine/io-request.mjs';
import { activeTasks, describeChange, instructionOverlaps, main, planIoRequest, pullRequestBody, pullRequestOverlaps, replaceIoText } from '../beta/apply-builder-io-request.mjs';
import { buildProduct, normalizeConnector } from '../beta/builder-library.mjs';
import * as V from '../beta/port-vocabulary.mjs';

const root = new URL('../', import.meta.url);
const SIGNALS = V.SIGNALS.map(signal => ({ ...signal }));
const SOURCE = { catalogSha: 'c'.repeat(64), detailSetSha: 'd'.repeat(64), rtcomSha: 'r'.repeat(64), vocabularyVersion: '1.0.0' };
const LISTS = ['inputs', 'outputs', 'bidirectional'];
const row = (group, connector, signal, direction, quantity, extra = {}) => ({ group, connector, signal, direction, quantity, protocol: '', availability: '', condition: '', source: 'A', verification: 'VERIFIED', ...extra });
const fixtureDetail = () => ({
  model: 'FX-1',
  io: [
    row('Input', 'HDMI Type-A', 'HDMI 2.0 입력', 'IN', '3'),
    row('Output', 'HDMI Type-A', 'HDMI 출력', 'OUT', '2'),
    row('Network', 'RJ-45', '10/100 Ethernet(LAN)', 'IN/OUT', '1', { protocol: 'TCP/IP' }),
    row('Audio', 'Phoenix 3-pin', 'Line out (Balanced)', 'OUT', '2'),
  ],
});
const fixtureProduct = (detail, overrides = {}) => buildProduct({ productId: 'fx-1', source: 'portal', brand: 'Test', product: 'FX-1', categories: ['영상', 'Video', 'Switcher'], detail }, overrides);

// 라이브러리·구성도 위에 제품 하나를 놓는다
function place(product) {
  const library = createLibraryIndex({ schema: 'av-portal.builder-library', schemaVersion: '1.2.0', source: SOURCE, lineTypes: V.LINE_TYPES.map(item => ({ ...item })), vocabulary: { signals: SIGNALS, connectors: [...V.CONNECTORS] }, products: [product] });
  const diagram = createDiagram({ library });
  const equipment = product.units[0].equipment;
  const node = addEquipmentNode(diagram, equipment, { position: { x: 0, y: 0 }, ids: createIdFactory({ seed: 3, now: 0 }) });
  const options = { rules: library.rules, signalVocabulary: SIGNALS, libraryEquipment: equipment };
  return { library, diagram, node, equipment, options };
}
const editable = data => Object.fromEntries(LISTS.map(list => [list, data[list].map(({ id, label, connector, signals, origin }) => ({ id, label, connector, signals: [...signals], ...(origin ? { origin } : {}) }))]));
const nodeData = (diagram, node) => diagram.nodes.find(item => item.id === node.id).data;
const requestFor = (data, equipment, extra = {}) => buildIoRequest({ lists: editable(data), data, libraryEquipment: equipment, librarySource: SOURCE, signalVocabulary: SIGNALS, ...extra });
// 왕복 비교: 단자 목록별로 (커넥터·주 신호·방향·선 종류) 여러 벌 집합이 같고, 다시 만든 단자가 노드 단자의 신호를 모두 갖는다
const shape = port => `${port.connector}|${port.signals[0]}|${port.direction}|${port.type}`;
function assertRoundTrip(rebuilt, data) {
  for (const list of LISTS) {
    assert.deepEqual(rebuilt[list].map(shape).sort(), data[list].map(shape).sort(), list);
    for (const port of data[list]) assert.ok(rebuilt[list].some(other => shape(other) === shape(port) && port.signals.every(signal => other.signals.includes(signal))), `${list} ${port.label}`);
  }
}

test('vocabulary → Portal text: every connector reads back as itself', () => {
  for (const connector of V.CONNECTORS) assert.equal(normalizeConnector(connectorText(connector)), connector, connector);
  // 어휘 1.0.1(B-20261013-07): 유로블록은 Portal 한글 표기로 쓰고 TERMINAL-BLOCK으로 다시 읽힌다
  assert.equal(connectorText('TERMINAL-BLOCK'), '유로블록');
  assert.equal(normalizeConnector('유로블록'), 'TERMINAL-BLOCK');
  assert.ok(Object.keys(CONNECTOR_TEXT).every(id => V.CONNECTORS.includes(id)));
  assert.deepEqual(Object.keys(DIRECTION_TEXT), ['in', 'out', 'both']);
  assert.deepEqual(Object.keys(GROUP_TEXT), ['in', 'out', 'both']);
});

test('vocabulary → Portal text: every signal (but AVB and PoE as main signal) reads back on a typical connector', () => {
  // 신호별 대표 커넥터·방향. 대칭 신호(Dante·Ethernet 등)는 생성기가 언제나 양방향으로 읽는다
  const typical = { POWER: ['IEC', 'in'], 'BLU-LINK': ['RJ45', 'both'], DANTE: ['RJ45', 'both'], AES67: ['RJ45', 'both'], COBRANET: ['RJ45', 'both'], HDBASET: ['RJ45', 'out'], HDMI: ['HDMI', 'in'], DVI: ['DVI', 'in'], DP: ['DP', 'out'], SDI: ['BNC', 'in'], SYNC: ['BNC', 'in'], 'ANALOG-VIDEO': ['DSUB-15', 'in'], SPEAKER: ['SPEAKON', 'out'], 'MIC-AUDIO': ['XLR', 'in'], 'LINE-AUDIO': ['TERMINAL-BLOCK', 'out'], AES3: ['XLR', 'in'], SPDIF: ['RCA', 'out'], ETHERNET: ['RJ45', 'both'], 'RS-232': ['DSUB-9', 'both'], 'RS-422': ['TERMINAL-BLOCK', 'both'], 'RS-485': ['TERMINAL-BLOCK', 'both'], IR: ['TRS-3.5', 'out'], GPIO: ['TERMINAL-BLOCK', 'in'], RELAY: ['TERMINAL-BLOCK', 'out'], USB: ['USB-B', 'in'], RF: ['BNC', 'in'], FIBER: ['LC', 'both'] };
  for (const signal of V.SIGNALS) {
    if (signal.id === 'AVB' || signal.id === 'POE') {
      // AVB는 원문 규칙이 없고(개별 지정으로만 생긴다), PoE 원문은 Ethernet이 주 신호가 된다
      assert.equal(typical[signal.id], undefined);
      continue;
    }
    const [connector, direction] = typical[signal.id];
    const text = { group: 'G', connector: connectorText(connector), signal: signalText([signal.id], SIGNALS), direction: DIRECTION_TEXT[direction], quantity: '2' };
    assert.ok(rowYields(text, { connector, signals: [signal.id], direction }, 2), `${signal.id}: ${JSON.stringify(text)}`);
  }
});

test('library 1.2.0 ports carry the source row number, direction and quantity text', () => {
  const product = fixtureProduct(fixtureDetail());
  const { inputs, bidirectional } = product.units[0].equipment;
  assert.deepEqual(inputs[0].portalIo, { group: 'Input', connector: 'HDMI Type-A', signal: 'HDMI 2.0 입력', ioIndex: 0, direction: 'IN', quantity: '3', protocol: '' });
  assert.equal(bidirectional[0].portalIo.ioIndex, 2);
  assert.equal(bidirectional[0].portalIo.protocol, 'TCP/IP');
});

test('port edits group into io-row changes: quantity, split-off row, removal, user rows; labels are not reflected', () => {
  const detail = fixtureDetail();
  const { diagram, node, equipment, options } = place(fixtureProduct(detail));
  const lists = editable(node.data);
  lists.inputs.pop(); // HDMI 입력 3 → 2
  lists.outputs[1] = { ...lists.outputs[1], connector: 'DP', signals: ['DP'] }; // HDMI 출력 하나를 DP로
  lists.bidirectional = []; // LAN 행 삭제
  lists.inputs.push({ label: 'SDI In 1', connector: 'BNC', signals: ['SDI'] }, { label: 'SDI In 2', connector: 'BNC', signals: ['SDI'] });
  lists.outputs[2] = { ...lists.outputs[2], label: '메인 L' }; // 이름만 바꿈
  assert.equal(updateEquipmentPorts(diagram, node.id, lists, options).ok, true);
  const data = nodeData(diagram, node);
  const reasons = new Map([['in-user-1', 'FX-1 매뉴얼 12쪽'], ['in-user-2', 'FX-1 매뉴얼 12쪽']]);
  const result = buildIoRequest({ lists: Object.fromEntries(LISTS.map(list => [list, editable(data)[list].map(port => ({ ...port, reason: reasons.get(port.id) }))])), data, libraryEquipment: equipment, librarySource: SOURCE, signalVocabulary: SIGNALS, createdAt: '2026-10-13T00:00:00.000Z' });
  assert.equal(result.ok, true);
  const { request } = result;
  assert.deepEqual(validateIoRequest(request), []);
  assert.deepEqual({ productId: request.productId, source: request.source, unitId: request.unitId, library: request.library }, { productId: 'fx-1', source: 'portal', unitId: 'fx-1', library: { catalogSha: SOURCE.catalogSha, detailSetSha: SOURCE.detailSetSha, rtcomSha: SOURCE.rtcomSha } });
  assert.deepEqual(request.changes, [
    { op: 'update', ioIndex: 0, before: { group: 'Input', connector: 'HDMI Type-A', signal: 'HDMI 2.0 입력', direction: 'IN', quantity: '3' }, after: { group: 'Input', connector: 'HDMI Type-A', signal: 'HDMI 2.0 입력', direction: 'IN', quantity: '2' }, reason: '' },
    { op: 'update', ioIndex: 1, before: { group: 'Output', connector: 'HDMI Type-A', signal: 'HDMI 출력', direction: 'OUT', quantity: '2' }, after: { group: 'Output', connector: 'HDMI Type-A', signal: 'HDMI 출력', direction: 'OUT', quantity: '1' }, reason: '' },
    { op: 'remove', ioIndex: 2, before: { group: 'Network', connector: 'RJ-45', signal: '10/100 Ethernet(LAN)', direction: 'IN/OUT', quantity: '1' }, reason: '' },
    { op: 'add', fromIoIndex: 1, row: { group: 'Output', connector: 'DP', signal: 'DP', direction: 'OUT', quantity: '1' }, reason: '' },
    { op: 'add', row: { group: 'Input', connector: 'BNC', signal: 'SDI', direction: 'IN', quantity: '2' }, reason: 'FX-1 매뉴얼 12쪽' },
  ]);
  assert.deepEqual(result.notReflected, [{ code: 'label', ports: ['메인 L'] }]);

  // 적용 → 다시 만든 라이브러리 단자가 편집한 노드 단자와 같다(왕복)
  const plan = planIoRequest(request, detail, { overrides: {} });
  assert.equal(plan.applied.length, 5);
  assert.deepEqual(plan.skipped, []);
  assert.equal(plan.io.length, 5);
  assert.deepEqual(plan.io.slice(3).map(item => [item.group, item.connector, item.verification, item.source]), [['Output', 'DP', 'REVIEW REQUIRED', ''], ['Input', 'BNC', 'REVIEW REQUIRED', '']]);
  // 고친 행은 다른 칸(protocol 등)을 그대로 두고 상태만 바꾼다. 근거는 상세에 쓰지 않는다
  assert.deepEqual(plan.io[0], { ...detail.io[0], quantity: '2', source: '', verification: 'REVIEW REQUIRED' });
  assert.deepEqual(plan.io[2], detail.io[3]);
  assert.ok(!JSON.stringify(plan.io).includes('매뉴얼'));
  const rebuilt = fixtureProduct({ ...detail, io: plan.io });
  assert.deepEqual(rebuilt.unresolved, []);
  assertRoundTrip(rebuilt.units[0].equipment, data);
});

test('connector, signal and direction edits rewrite only the changed cells and still read back', () => {
  const detail = fixtureDetail();
  const { diagram, node, equipment, options } = place(fixtureProduct(detail));
  const lists = editable(node.data);
  // 출력 HDMI 2개를 모두 SDI(BNC)로, 오디오 출력 2개를 마이크 입력으로 옮긴다
  lists.outputs = lists.outputs.map(port => (port.signals[0] === 'HDMI' ? { ...port, connector: 'BNC', signals: ['SDI'] } : port));
  const audio = lists.outputs.filter(port => port.signals[0] === 'LINE-AUDIO');
  lists.outputs = lists.outputs.filter(port => port.signals[0] !== 'LINE-AUDIO');
  lists.inputs.push(...audio.map(port => ({ ...port, signals: ['MIC-AUDIO'] })));
  assert.equal(updateEquipmentPorts(diagram, node.id, lists, options).ok, true);
  const data = nodeData(diagram, node);
  const { request } = requestFor(data, equipment);
  assert.deepEqual(request.changes.map(change => [change.op, change.ioIndex, change.after]), [
    ['update', 1, { group: 'Output', connector: 'BNC', signal: 'SDI', direction: 'OUT', quantity: '2' }],
    ['update', 3, { group: 'Audio', connector: 'Phoenix 3-pin', signal: 'Mic Audio', direction: 'IN', quantity: '2' }],
  ]);
  const plan = planIoRequest(request, detail, { overrides: {} });
  assertRoundTrip(fixtureProduct({ ...detail, io: plan.io }).units[0].equipment, data);
});

test('values the Portal text cannot express, override rows and index-shifting removals stay out of the request', () => {
  const detail = fixtureDetail();
  // io[1](HDMI 출력)은 개별 지정 행이다
  const overrides = { 'fx-1#1': { match: { connector: 'HDMI Type-A', signal: 'HDMI 출력' }, connector: 'HDMI', signals: ['HDMI'], direction: 'out', quantity: 2, note: '시험' } };
  const { diagram, node, equipment, options } = place(fixtureProduct(detail, overrides));
  const lists = editable(node.data);
  lists.outputs = lists.outputs.filter(port => port.signals[0] !== 'HDMI'); // 개별 지정 행의 단자를 모두 지움
  lists.inputs = []; // io[0]을 지우면 뒤의 개별 지정(io[1]) 번호가 밀린다
  lists.bidirectional = [{ ...lists.bidirectional[0], signals: ['ETHERNET'], connector: 'RJ45' }, { label: 'AVB 1', connector: 'RJ45', signals: ['AVB'] }];
  assert.equal(updateEquipmentPorts(diagram, node.id, lists, options).ok, true);
  const result = requestFor(nodeData(diagram, node), equipment, { overrides });
  assert.deepEqual(result.request.changes, []);
  assert.deepEqual(result.notReflected.map(item => item.code).sort(), ['not-representable', 'override', 'override-shift']);
  assert.deepEqual(validateIoRequest(result.request), ['changes가 비었다']);
  // 적용 스크립트도 같은 이유로 거부한다
  const forged = { ...result.request, changes: [
    { op: 'remove', ioIndex: 0, before: { group: 'Input', connector: 'HDMI Type-A', signal: 'HDMI 2.0 입력', direction: 'IN', quantity: '3' }, reason: '' },
    { op: 'update', ioIndex: 1, before: { group: 'Output', connector: 'HDMI Type-A', signal: 'HDMI 출력', direction: 'OUT', quantity: '2' }, after: { group: 'Output', connector: 'HDMI Type-A', signal: 'HDMI 출력', direction: 'OUT', quantity: '1' }, reason: '' },
  ] };
  assert.deepEqual(planIoRequest(forged, detail, { overrides }).skipped.map(item => item.code), ['override-shift', 'override']);
});

// 리뷰 반영(독립 리뷰 지적 1·5~9)
test('protocol text takes part in the check: edits it would undo are reported, not silently dropped', () => {
  const detail = { model: 'NET-1', io: [row('Network', 'RJ-45', 'Audio network', 'IN/OUT', '1', { protocol: 'Dante' }), row('Network', 'RJ-45', 'Ethernet', 'IN/OUT', '2', { protocol: 'Dante' })] };
  const product = buildProduct({ productId: 'net-1', source: 'portal', brand: 'Test', product: 'NET-1', categories: ['오디오', 'Audio', 'DSP'], detail }, {});
  const { diagram, node, equipment, options } = place(product);
  assert.deepEqual(equipment.bidirectional.map(port => port.signals), [['DANTE', 'ETHERNET'], ['DANTE', 'ETHERNET'], ['DANTE', 'ETHERNET']]);
  // 첫 행: Ethernet만으로 / 둘째 행: Dante를 빼려 함(protocol이 Dante라 원문으로 나타낼 수 없다)
  const lists = editable(node.data);
  lists.bidirectional = lists.bidirectional.map(port => ({ ...port, signals: ['ETHERNET'] }));
  assert.equal(updateEquipmentPorts(diagram, node.id, lists, options).ok, true);
  const result = requestFor(nodeData(diagram, node), equipment, { overrides: {} });
  assert.deepEqual(result.request.changes, []);
  assert.deepEqual(result.notReflected.map(item => item.code), ['not-representable', 'not-representable']);

  // 수량만 바꾸면 protocol 덕분에 원문 signal은 그대로 둔다
  const again = place(product);
  const fewer = editable(again.node.data);
  fewer.bidirectional.pop();
  assert.equal(updateEquipmentPorts(again.diagram, again.node.id, fewer, again.options).ok, true);
  assert.deepEqual(requestFor(nodeData(again.diagram, again.node), again.equipment, { overrides: {} }).request.changes.map(change => change.after), [{ group: 'Network', connector: 'RJ-45', signal: 'Ethernet', direction: 'IN/OUT', quantity: '1' }]);
});

test('counts written in the connector text, moved directions, re-added ports and stale overrides', () => {
  const detail = { model: 'MIX-1', io: [row('Input', 'XLR x4', 'Mic input', 'IN', ''), row('Output', 'HDMI', 'HDMI out', 'OUT', '2'), row('Input', 'HDMI', 'HDMI in', 'IN', '1')] };
  // io[2]의 개별 지정은 원문이 바뀌어 생성기가 쓰지 않는다(stale) → 편집을 막지 않는다
  const overrides = { 'mix-1#2': { match: { connector: 'HDMI Type-A', signal: '옛 원문' }, connector: 'HDMI', signals: ['HDMI'], direction: 'in', quantity: 1, note: '시험' } };
  const product = buildProduct({ productId: 'mix-1', source: 'portal', brand: 'Test', product: 'MIX-1', categories: ['오디오', 'Audio', 'Mixer'], detail }, overrides);
  const { diagram, node, equipment, options } = place(product);
  const lists = editable(node.data);
  lists.inputs = lists.inputs.filter((port, index) => index !== 0); // "XLR x4"에서 하나 지움 → 원문끼리 어긋나므로 반영하지 않는다
  const moved = lists.outputs.pop(); // HDMI 출력 하나를 양방향으로 옮김 → 갈라진 새 행의 group은 방향을 따른다
  lists.bidirectional.push(moved);
  const hdmiIn = lists.inputs.find(port => port.signals[0] === 'HDMI');
  lists.inputs = lists.inputs.filter(port => port !== hdmiIn);
  lists.inputs.push({ label: 'HDMI In 9', connector: 'HDMI', signals: ['HDMI'] }); // 지운 HDMI 입력을 같은 값으로 다시 더함 → 그 행에 되돌려 넣어 변경 없음
  lists.inputs.push({ label: 'HDMI In 10', connector: 'HDMI', signals: ['HDMI'] }); // 하나 더 → 사용자 단자 새 행
  assert.equal(updateEquipmentPorts(diagram, node.id, lists, options).ok, true);
  const result = requestFor(nodeData(diagram, node), equipment, { overrides });
  assert.deepEqual(result.request.changes.map(change => [change.op, change.ioIndex ?? change.fromIoIndex, change.after?.quantity ?? change.row?.group]), [
    ['update', 1, '1'],
    ['add', 1, 'Input/Output'],
    ['add', undefined, 'Input'],
  ]);
  assert.deepEqual(result.notReflected, [{ code: 'not-representable', ports: lists.inputs.filter(port => port.signals[0] === 'MIC-AUDIO').map(port => port.label) }]);
  // stale 개별 지정 행(io[2])은 지우거나 고칠 수 있다
  const again = place(product);
  const gone = editable(again.node.data);
  gone.inputs = gone.inputs.filter(port => port.signals[0] !== 'HDMI');
  assert.equal(updateEquipmentPorts(again.diagram, again.node.id, gone, again.options).ok, true);
  assert.deepEqual(requestFor(nodeData(again.diagram, again.node), again.equipment, { overrides }).request.changes.map(change => [change.op, change.ioIndex]), [['remove', 2]]);
  assert.deepEqual(planIoRequest({ productId: 'mix-1', changes: [{ op: 'remove', ioIndex: 2, before: { group: 'Input', connector: 'HDMI', signal: 'HDMI in', direction: 'IN', quantity: '1' }, reason: '' }] }, detail, { overrides }).skipped, []);
});

test('apply: split-off rows follow their source row, and re-applying the same request is detected', () => {
  const detail = fixtureDetail();
  const { diagram, node, equipment, options } = place(fixtureProduct(detail));
  const lists = editable(node.data);
  lists.outputs[1] = { ...lists.outputs[1], connector: 'DP', signals: ['DP'] };
  assert.equal(updateEquipmentPorts(diagram, node.id, lists, options).ok, true);
  const { request } = requestFor(nodeData(diagram, node), equipment, { overrides: {} });
  // 요청 뒤 원래 행(io[1])이 바뀌면 그 update와 갈라진 add를 함께 건너뛴다
  const drifted = structuredClone(detail);
  drifted.io[1].quantity = '3';
  assert.deepEqual(planIoRequest(request, drifted, { overrides: {} }).skipped.map(item => item.code), ['before-mismatch', 'source-skipped']);
  // 한 번 적용한 결과에 다시 적용하면 이미 반영됐다고 알린다(행이 겹치지 않는다)
  const once = planIoRequest(request, detail, { overrides: {} });
  const twice = planIoRequest(request, { ...detail, io: once.io }, { overrides: {} });
  assert.equal(twice.alreadyApplied, true);
  assert.deepEqual(twice.applied, []);
});

test('Portal products split into TX/RX or series units cannot export yet; RTCOM units can (to forward)', () => {
  const detail = fixtureDetail();
  const { node, equipment } = place(fixtureProduct(detail));
  const tx = { ...structuredClone(equipment), id: 'fx-1:tx' };
  assert.equal(requestFor({ ...node.data, portal: { ...node.data.portal, unit: 'tx' } }, tx).code, 'unit-unsupported');
  const rtcom = { ...structuredClone(equipment), id: 'rtcom-fx:tx', portal: { productId: 'rtcom-fx', source: 'rtcom', unit: 'tx', detailUrl: '' } };
  const data = { ...structuredClone(node.data), portal: rtcom.portal };
  data.inputs.pop();
  const result = requestFor(data, rtcom, { overrides: {} });
  assert.equal(result.ok, true);
  assert.deepEqual([result.request.source, result.request.unitId], ['rtcom', 'rtcom-fx:tx']);
});

test('a request built on an old library or with ports the library no longer has is refused', () => {
  const detail = fixtureDetail();
  const { node, equipment } = place(fixtureProduct(detail));
  const old = structuredClone(equipment);
  for (const list of LISTS) for (const port of old[list]) delete port.portalIo.ioIndex;
  assert.equal(requestFor(node.data, old).code, 'library-old');
  const data = structuredClone(node.data);
  data.inputs[0].id = 'in-hdmi-9';
  assert.equal(requestFor(data, equipment).code, 'library-changed');
  assert.equal(buildIoRequest({ lists: editable(node.data), data: node.data, libraryEquipment: null }).code, 'library-missing');
});

test('apply skips rows that changed since the request (before mismatch, missing index) and rejects non-port text', () => {
  const detail = fixtureDetail();
  const before = { group: 'Input', connector: 'HDMI Type-A', signal: 'HDMI 2.0 입력', direction: 'IN', quantity: '3' };
  const request = { productId: 'fx-1', changes: [
    { op: 'update', ioIndex: 0, before: { ...before, quantity: '4' }, after: { ...before, quantity: '2' }, reason: '' },
    { op: 'remove', ioIndex: 9, before, reason: '' },
    { op: 'add', row: { group: 'Input', connector: '정보 없음', signal: '무선 수신', direction: 'IN', quantity: '1' }, reason: '' },
    { op: 'update', ioIndex: 0, before: { ...before, signal: ' HDMI 2.0 입력 ' }, after: { ...before, quantity: '1' }, reason: '앞뒤 공백은 같은 값' },
  ] };
  const plan = planIoRequest(request, detail, { overrides: {} });
  assert.deepEqual(plan.skipped.map(item => item.code), ['before-mismatch', 'index-missing', 'not-port']);
  assert.equal(plan.applied.length, 1);
  assert.equal(plan.io[0].quantity, '1');
  assert.equal(detail.io[0].quantity, '3');
});

test('the request schema check matches the documented shape', () => {
  const good = { schema: 'av-portal.builder-io-request', schemaVersion: '1.0.0', productId: 'fx-1', source: 'portal', unitId: 'fx-1', library: { catalogSha: 'c', detailSetSha: 'd' }, changes: [{ op: 'add', row: { group: 'G', connector: 'HDMI', signal: 'HDMI', direction: 'IN', quantity: '1' }, reason: '' }] };
  assert.deepEqual(validateIoRequest(good), []);
  const broken = [
    { ...good, schemaVersion: '1.1.0' },
    { ...good, extra: 1 },
    { ...good, source: 'other' },
    { ...good, changes: [{ op: 'add', row: { group: 'G' }, reason: '' }] },
    { ...good, changes: [{ op: 'update', ioIndex: -1, before: good.changes[0].row, after: good.changes[0].row, reason: '' }] },
    { ...good, changes: [{ op: 'remove', ioIndex: 0, before: good.changes[0].row }] },
    { ...good, changes: [{ op: 'remove', ioIndex: 0, before: good.changes[0].row, reason: '' }, { op: 'remove', ioIndex: 0, before: good.changes[0].row, reason: '' }] },
    { ...good, library: { catalogSha: 'c' } },
  ];
  for (const request of broken) assert.notDeepEqual(validateIoRequest(request), [], JSON.stringify(request));
  assert.equal(ioRequestFileName('fx-1', new Date(2026, 9, 3)), 'builder-io-request-fx-1-20261003.json');
});

test('active tasks come from the instruction logs and overlap by slug, detail path or model', () => {
  const a = ['# 지시서', '', '## 현재 상태', '', 'W-20261013-001 Powersoft 앰프 — **REVIEW**. `beta/site/detail/data/fx-1.json`을 고친다.', '- [x] 무엇', '', 'W-20261013-002 RTCOM 화면 — **MERGED·DEPLOYED**. FX-1도 봤다.', '', '## 이전 진행 기록', 'W-20261012-013 **IN_PROGRESS**. fx-1'].join('\n');
  const b = ['# 세션 B', '', '## W-20261012-007 — 링크', '', '- 상태: MERGED · PR #395', 'fx-1', '', '## W-20261013-009 — FX 보강', '', '- 상태: IN_PROGRESS', 'FX-1 사진'].join('\n');
  const tasks = [...activeTasks('지시서.md', a), ...activeTasks('지시서-B.md', b)];
  assert.deepEqual(tasks.map(task => `${task.file} ${task.task} ${task.status}`), ['지시서.md W-20261013-001 REVIEW', '지시서.md W-20261012-013 IN_PROGRESS', '지시서-B.md W-20261013-009 IN_PROGRESS']);
  assert.deepEqual(instructionOverlaps(tasks, { slug: 'fx-1', model: 'FX-1' }).map(task => task.task), ['W-20261013-001', 'W-20261012-013', 'W-20261013-009']);
  assert.deepEqual(instructionOverlaps(tasks, { slug: 'other', model: 'OTHER' }), []);
  const prs = [{ number: 1, title: 'a', files: [{ path: 'beta/site/detail/data/fx-1.json' }] }, { number: 2, title: 'b', files: [{ path: 'beta/site/detail/data/fx-10.json' }] }];
  assert.deepEqual(pullRequestOverlaps(prs, 'fx-1').hits.map(pr => pr.number), [1]);
  // 파일이 100개 이상인 PR은 다 보지 못했으므로 확실하지 않다고 본다
  const big = { number: 3, title: 'c', files: Array.from({ length: 100 }, (_, i) => ({ path: `x/${i}` })) };
  assert.deepEqual(pullRequestOverlaps([...prs, big], 'fx-1').uncertain.map(pr => pr.number), [3]);
  // 진행·끝 표시가 섞이면 진행 중, 알아볼 수 없으면 진행 중(놓치지 않게), 끝 표시만 있으면 끝
  const mixed = ['## W-20261013-010 — A', '- 상태: IN_PROGRESS · 1차 MERGED', '## W-20261013-011 — B', '- 상태: PR 준비', '## W-20261013-012 — C', '- 상태: MERGED · PR #1'].join('\n');
  assert.deepEqual(activeTasks('지시서-B.md', mixed).map(task => task.task), ['W-20261013-010', 'W-20261013-011']);
  assert.deepEqual(instructionOverlaps([{ task: 'W', text: 'Powersoft 앰프 18종' }], { slug: 'x-1', model: 'X 1', brand: 'Powersoft' }).length, 1);
  // 지금 저장소의 지시서도 읽힌다(형식이 바뀌면 여기서 드러난다)
  const real = activeTasks('지시서.md', readFileSync(new URL('Work/지시서.md', root), 'utf8'));
  assert.ok(real.every(task => /^W-\d{8}-\d{3}$/.test(task.task)));
});

test('writing io keeps the rest of the file byte-for-byte, including odd indentation and CRLF', () => {
  for (const slug of ['dm3', 'nx-1200']) {
    const lf = readFileSync(new URL(`beta/site/detail/data/${slug}.json`, root), 'utf8').replaceAll('\r\n', '\n');
    const detail = JSON.parse(lf);
    // 같은 io를 쓰면 파일이 그대로다
    assert.equal(replaceIoText(lf, detail.io), lf, slug);
    const io = [...detail.io, row('Input', 'HDMI', 'HDMI', 'IN', '1')];
    const out = replaceIoText(lf, io);
    assert.deepEqual(JSON.parse(out), { ...detail, io });
    const head = lf.slice(0, lf.indexOf('\n  "io": '));
    assert.ok(out.startsWith(head));
    const crlf = replaceIoText(lf.replaceAll('\n', '\r\n'), io);
    assert.equal(crlf, out.replaceAll('\n', '\r\n'));
  }
});

test('PR body lists each applied change with its reason or "근거 없음", and the skipped ones', () => {
  const request = { productId: 'fx-1', model: 'FX-1', library: SOURCE, changes: [] };
  const add = { op: 'add', row: { group: 'Input', connector: 'BNC', signal: 'SDI', direction: 'IN', quantity: '2' }, reason: '매뉴얼 12쪽' };
  const remove = { op: 'remove', ioIndex: 2, before: { group: 'Network', connector: 'RJ-45', signal: 'LAN', direction: 'IN/OUT', quantity: '1' }, reason: '' };
  const body = pullRequestBody(request, { product: 'FX-1', applied: [{ change: add }, { change: remove }], skipped: [{ change: remove, code: 'before-mismatch' }], shaMismatch: true });
  assert.match(body, /추가: Input · BNC · SDI · IN · 2 \| 매뉴얼 12쪽/);
  assert.match(body, /삭제 io\[2\].*\| 근거 없음/);
  assert.match(body, /적용하지 않은 변경[\s\S]*before 불일치/);
  assert.match(body, /REVIEW REQUIRED/);
  assert.match(describeChange({ op: 'update', ioIndex: 0, before: add.row, after: { ...add.row, quantity: '3' } }), /quantity "2" → "3"/);
});

test('CLI: RTCOM requests are refused with a forwarding note; bad files and dry-run never touch the detail', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'io-request-'));
  const logs = [];
  const log = line => logs.push(String(line));
  try {
    const rtcom = { schema: 'av-portal.builder-io-request', schemaVersion: '1.0.0', productId: 'rtcom-hd-104u', source: 'rtcom', unitId: 'rtcom-hd-104u', library: { catalogSha: 'c', detailSetSha: 'd' }, changes: [{ op: 'add', row: { group: 'Input', connector: 'HDMI', signal: 'HDMI', direction: 'IN', quantity: '1' }, reason: '' }] };
    writeFileSync(join(dir, 'rtcom.json'), JSON.stringify(rtcom));
    assert.equal(await main([join(dir, 'rtcom.json')], log), 2);
    assert.match(logs.join('\n'), /RTCOM 원본 담당에게 전달/);
    writeFileSync(join(dir, 'bad.json'), JSON.stringify({ ...rtcom, schemaVersion: '9' }));
    assert.equal(await main([join(dir, 'bad.json')], log), 1);
    assert.equal(await main([join(dir, 'rtcom.json'), '--force'], log), 1);

    // 실제 상세 하나에 대한 --dry-run: 계획만 보여 주고 파일은 그대로
    const { expectedBuilderLibrary } = await import('../beta/build-builder-library.mjs');
    const library = await expectedBuilderLibrary();
    const product = library.products.find(entry => entry.productId === 'nx-1200');
    const equipment = product.units[0].equipment;
    const data = structuredClone(equipment);
    // 마지막 행(USB)을 지운다. 앞 행을 지우면 io[1]의 개별 지정 번호가 밀려 요청에 넣지 않는다
    data.bidirectional = data.bidirectional.filter(port => port.id !== 'both-usb-1');
    data.inputs.push({ label: 'HDMI In 1', connector: 'HDMI', signals: ['HDMI'], origin: 'user' });
    const { request } = buildIoRequest({ lists: editable(data), data, libraryEquipment: equipment, librarySource: library.source, signalVocabulary: SIGNALS });
    assert.deepEqual(request.changes.map(change => change.op), ['remove', 'add']);
    writeFileSync(join(dir, 'nx.json'), JSON.stringify(request));
    const path = new URL('beta/site/detail/data/nx-1200.json', root);
    const bytes = readFileSync(path);
    logs.length = 0;
    process.env.AV_PORTAL_NO_GH = '1';
    try {
      // gh를 쓸 수 없으면 확인 목록을 내고 실패로 끝나지만 계획은 보여 준다
      assert.equal(await main([join(dir, 'nx.json'), '--dry-run'], log), 1);
    } finally {
      delete process.env.AV_PORTAL_NO_GH;
    }
    const output = logs.join('\n');
    assert.match(output, /적용 2건 · 건너뜀 0건/);
    assert.match(output, /직접 확인한 뒤 --overlap-checked/);
    assert.match(output, /--dry-run: 파일을 바꾸지 않았습니다/);
    assert.ok(readFileSync(path).equals(bytes));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('real library: an edited NX-1200 node round-trips through the request and the generator', async () => {
  const { expectedBuilderLibrary } = await import('../beta/build-builder-library.mjs');
  const raw = await expectedBuilderLibrary();
  const product = raw.products.find(entry => entry.productId === 'nx-1200');
  const library = createLibraryIndex(raw);
  const equipment = library.units.get('nx-1200').equipment;
  const diagram = createDiagram({ library });
  const node = addEquipmentNode(diagram, equipment, { position: { x: 0, y: 0 }, ids: createIdFactory({ seed: 8, now: 0 }) });
  const options = { rules: library.rules, signalVocabulary: SIGNALS, libraryEquipment: equipment };
  const lists = editable(node.data);
  // 첫 행 단자 하나를 지우고, 사용자 단자 3개(HDMI 입력 2·RS-232 1)를 더한다
  const first = Object.values(lists).flat()[0];
  for (const list of LISTS) lists[list] = lists[list].filter(port => port.id !== first.id);
  lists.inputs.push({ label: 'HDMI In 1', connector: 'HDMI', signals: ['HDMI'] }, { label: 'HDMI In 2', connector: 'HDMI', signals: ['HDMI'] });
  lists.bidirectional.push({ label: 'RS-232 I/O 9', connector: 'DSUB-9', signals: ['RS-232'] });
  assert.equal(updateEquipmentPorts(diagram, node.id, lists, options).ok, true);
  const data = nodeData(diagram, node);
  const result = requestFor(data, equipment);
  assert.equal(result.ok, true);
  assert.deepEqual(validateIoRequest(result.request), []);
  const detail = JSON.parse(readFileSync(new URL('beta/site/detail/data/nx-1200.json', root), 'utf8'));
  const plan = planIoRequest(result.request, detail);
  assert.deepEqual(plan.skipped, []);
  const rebuilt = buildProduct({ productId: 'nx-1200', source: 'portal', brand: product.brand, product: product.product, categories: product.categories, detail: { ...detail, io: plan.io } });
  assertRoundTrip(rebuilt.units[0].equipment, data);
});
