// B-20261013-04: 슬롯 번호별 카드 장착(builder/engine/slots.mjs)과 저장 형식·이슈.
// 라이브러리는 합성 값이다. Portal(Novastar H2 모양)과 RTCOM 시리즈(XDM 모양, 단위 ID에 ':'가 있는 경우)를 함께 본다.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../builder/engine/defaults.mjs';
import { addEquipmentNode, connectPorts, createDiagram, createIdFactory } from '../builder/engine/diagram.mjs';
import { computeIssues } from '../builder/engine/issues.mjs';
import { createLibraryIndex } from '../builder/engine/library.mjs';
import { updateEquipmentPorts } from '../builder/engine/ports.mjs';
import { serializeDiagram } from '../builder/engine/serialize.mjs';
import {
  cardPortId, cardPorts, frameSlots, nodeLibraryEquipment, optionIdOf, resetFramePorts, slotCards, slotOfPort, updateSlotAssignments,
} from '../builder/engine/slots.mjs';
import { validateDiagram } from '../builder/engine/validate.mjs';
import * as V from '../beta/port-vocabulary.mjs';

const SIGNALS = V.SIGNALS.map(signal => ({ ...signal }));
const p = (id, direction, connector, signals, type) => ({ id, label: id.replace(/^in-hdmi-/, 'HDMI In ').replace(/^out-hdmi-/, 'HDMI Out '), type, direction, connector, signals, verification: 'FOUND', portalIo: { group: 'Video', connector, signal: signals[0] } });
const hdmiIn = n => p(`in-hdmi-${n}`, 'in', 'HDMI', ['HDMI'], 'video');
const hdmiOut = n => p(`out-hdmi-${n}`, 'out', 'HDMI', ['HDMI'], 'video');
const lan = p('both-ethernet-1', 'both', 'RJ45', ['ETHERNET'], 'network');
const equipment = (id, model, ports, portal = {}) => ({
  id, category: 'video', name: 'Device', model, manufacturer: 'Test',
  inputs: ports.filter(x => x.direction === 'in'), outputs: ports.filter(x => x.direction === 'out'), bidirectional: ports.filter(x => x.direction === 'both'),
  portal: { productId: id, source: 'portal', detailUrl: `https://example.invalid/${id}`, ...portal },
});
const slotList = (prefix, n, slotType) => Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i + 1}`, slotType }));
const portalProduct = (id, model, ports, extra = {}) => ({ productId: id, source: 'portal', brand: 'Test', product: `${model} 제품`, units: [{ unitId: id, equipment: equipment(id, model, ports), ...extra }] });

function makeLibrary() {
  const xdm = (slug, model, ports, extra) => ({
    unitId: `rtcom-xdm:${slug}`, variant: model,
    equipment: { ...equipment(`rtcom-xdm:${slug}`, model, ports, { productId: 'rtcom-xdm', source: 'rtcom', variant: model }) },
    ...extra,
  });
  const products = [
    portalProduct('h2', 'H2', [lan], { slots: { input: 2, output: 1, shared: 0, source: 'D', verification: 'FOUND', list: [...slotList('IN', 2, 'input'), ...slotList('OUT', 1, 'output')], compatibleCards: ['cin', 'cin4', 'cout'] } }),
    portalProduct('cin', 'CIN', [hdmiIn(1), hdmiIn(2)], { card: { slotType: 'input', compatibleFrames: ['h2', 'blu'] } }),
    portalProduct('cin4', 'CIN4', [1, 2, 3, 4].map(hdmiIn), { card: { slotType: 'input', compatibleFrames: ['h2'] } }),
    portalProduct('cout', 'COUT', [hdmiOut(1), hdmiOut(2)], { card: { slotType: 'output', compatibleFrames: ['h2', 'blu'] } }),
    // 슬롯 공용 프레임(BLU-160 모양): 입력·출력 카드 모두 받는다
    portalProduct('blu', 'BLU', [lan], { slots: { input: 0, output: 0, shared: 2, source: 'P', verification: 'FOUND', list: slotList('S', 2, 'shared'), compatibleCards: ['cin', 'cout'] } }),
    // 호환 카드 정보가 없는 프레임(SPX-R6 모양)
    portalProduct('empty-frame', 'EMPTY', [lan], { slots: { input: 0, output: 0, shared: 2, source: 'S', verification: 'FOUND', list: slotList('S', 2, 'shared'), compatibleCards: [] } }),
    portalProduct('src', 'SRC', [hdmiOut(1), hdmiOut(2)]),
    portalProduct('disp', 'DISP', [hdmiIn(1), hdmiIn(2)]),
    {
      productId: 'rtcom-xdm', source: 'rtcom', brand: 'RTCOM', product: 'XDM Series',
      units: [
        xdm('xdm-12', 'XDM-12', [], { slots: { input: 2, output: 2, shared: 0, source: 'M', verification: 'VERIFIED', list: [...slotList('IN', 2, 'input'), ...slotList('OUT', 2, 'output')], compatibleCards: ['rtcom-xdm:xdm-his100', 'rtcom-xdm:xdm-hos100'] } }),
        xdm('xdm-his100', 'XDM-HIS100', [1, 2, 3, 4].map(hdmiIn), { card: { slotType: 'input', compatibleFrames: ['rtcom-xdm:xdm-12'] } }),
        xdm('xdm-hos100', 'XDM-HOS100', [1, 2].map(hdmiOut), { card: { slotType: 'output', compatibleFrames: ['rtcom-xdm:xdm-12'] } }),
        // 슬롯 정보가 없는 시리즈 모델: 지금처럼 series-config-pending
        xdm('xdm-plain', 'XDM-PLAIN', [hdmiIn(1)]),
      ],
    },
  ];
  return createLibraryIndex({
    schema: 'av-portal.builder-library', schemaVersion: '1.1.0',
    source: { catalogSha: 'c', detailSetSha: 'd', rtcomSha: 'r', vocabularyVersion: '1.0.0' },
    lineTypes: D.DEFAULT_LINE_TYPES.map(item => ({ ...item })),
    vocabulary: { signals: SIGNALS, connectors: [...V.CONNECTORS], connectorWildcards: D.CONNECTOR_WILDCARDS, connectorEquivalents: D.CONNECTOR_EQUIVALENTS, levelPairs: D.LEVEL_PAIRS },
    products,
  });
}

function sample(frameUnit = 'h2') {
  const library = makeLibrary();
  const ids = createIdFactory({ seed: 9, now: Date.UTC(2026, 9, 13) });
  const diagram = createDiagram({ library });
  const frame = addEquipmentNode(diagram, library.units.get(frameUnit).equipment, { position: { x: 400, y: 0 }, ids });
  const src = addEquipmentNode(diagram, library.units.get('src').equipment, { position: { x: 0, y: 0 }, ids });
  const disp = addEquipmentNode(diagram, library.units.get('disp').equipment, { position: { x: 800, y: 0 }, ids });
  const opts = { library, rules: library.rules };
  return { library, ids, diagram, frame, src, disp, opts };
}
const dataOf = (diagram, node) => diagram.nodes.find(item => item.id === node.id).data;
const portIds = (data, list) => data[list].map(port => port.id);
const codes = (issues, nodeId) => issues.filter(issue => issue.target.node === nodeId).map(issue => issue.code);
const saveAndValidate = (diagram, library) => {
  const text = serializeDiagram(diagram, { library });
  const saved = JSON.parse(text);
  return { text, saved, ...validateDiagram(saved, { library }) };
};

test('card port ids and labels carry the slot number (D2: "IN2 HDMI In 3")', () => {
  const library = makeLibrary();
  assert.equal(cardPortId('cin', 'IN2', 'in-hdmi-1'), 'opt-cin-IN2-in-hdmi-1');
  assert.equal(optionIdOf('rtcom-xdm:xdm-his100'), 'portal-option:rtcom-xdm:xdm-his100');
  const ports = cardPorts(library.units.get('cin4').equipment, 'cin4', 'IN2');
  assert.deepEqual(portIds(ports, 'inputs'), ['opt-cin4-IN2-in-hdmi-1', 'opt-cin4-IN2-in-hdmi-2', 'opt-cin4-IN2-in-hdmi-3', 'opt-cin4-IN2-in-hdmi-4']);
  assert.equal(ports.inputs[2].label, 'IN2 HDMI In 3');
  // 카드 단자의 나머지 값(type·connector·signals·verification·portalIo)은 Portal 값 그대로다
  const { id: _a, label: _b, ...rest } = ports.inputs[2];
  const { id: _c, label: _d, ...source } = library.units.get('cin4').equipment.inputs[2];
  assert.deepEqual(rest, source);
});

test('slot card lists follow slot type and frame compatibility', () => {
  const library = makeLibrary();
  assert.deepEqual(frameSlots(library, 'h2').list.map(slot => slot.id), ['IN1', 'IN2', 'OUT1']);
  assert.equal(frameSlots(library, 'src'), null);
  assert.deepEqual(slotCards(library, 'h2', 'IN1').map(card => card.unitId), ['cin', 'cin4']);
  assert.deepEqual(slotCards(library, 'h2', 'OUT1').map(card => card.unitId), ['cout']);
  // 공용 슬롯은 입력·출력 카드를 모두 받는다
  assert.deepEqual(slotCards(library, 'blu', 'S1').map(card => card.unitId), ['cin', 'cout']);
  assert.deepEqual(slotCards(library, 'h2', 'NOPE'), []);
  assert.deepEqual(slotCards(library, 'rtcom-xdm:xdm-12', 'IN2').map(card => card.unitId), ['rtcom-xdm:xdm-his100']);
});

test('mounting 2 input cards and 1 output card adds ports in slot order and saves quote items', () => {
  const { diagram, frame, library, opts } = sample();
  const result = updateSlotAssignments(diagram, frame.id, { OUT1: 'cout', IN2: 'cin4', IN1: 'cin' }, opts);
  assert.equal(result.ok, true);
  assert.equal(result.changed, true);
  const data = dataOf(diagram, frame);
  assert.deepEqual(Object.keys(data.slotAssignments), ['IN1', 'IN2', 'OUT1'], '슬롯 목록 순서로 저장한다');
  assert.deepEqual(portIds(data, 'inputs'), ['opt-cin-IN1-in-hdmi-1', 'opt-cin-IN1-in-hdmi-2', 'opt-cin4-IN2-in-hdmi-1', 'opt-cin4-IN2-in-hdmi-2', 'opt-cin4-IN2-in-hdmi-3', 'opt-cin4-IN2-in-hdmi-4']);
  assert.deepEqual(portIds(data, 'outputs'), ['opt-cout-OUT1-out-hdmi-1', 'opt-cout-OUT1-out-hdmi-2']);
  assert.deepEqual(portIds(data, 'bidirectional'), ['both-ethernet-1'], '프레임 단자는 그대로');
  assert.deepEqual(data.optionPortIds, [...portIds(data, 'inputs'), ...portIds(data, 'outputs')]);
  assert.deepEqual(data.selectedOptionQuantities, { 'portal-option:cin': 1, 'portal-option:cin4': 1, 'portal-option:cout': 1 });
  assert.deepEqual(diagram.options, [
    { id: 'portal-option:cin', model: 'CIN 제품', name: 'CIN 제품', manufacturer: 'Test' },
    { id: 'portal-option:cin4', model: 'CIN4 제품', name: 'CIN4 제품', manufacturer: 'Test' },
    { id: 'portal-option:cout', model: 'COUT 제품', name: 'COUT 제품', manufacturer: 'Test' },
  ]);
  assert.equal(data.portsEdited, undefined, '카드 단자는 라이브러리 값(프레임 + 카드)과 같다');
  const { errors, saved, issues, text } = saveAndValidate(diagram, library);
  assert.deepEqual(errors, []);
  assert.deepEqual(codes(issues, frame.id), [], 'library-drift·slot-empty 없음');
  const savedFrame = saved.nodes.find(node => node.id === frame.id).data;
  assert.deepEqual(Object.keys(savedFrame).slice(-3), ['selectedOptionQuantities', 'optionPortIds', 'slotAssignments'], '1.1 키 뒤에 추가 필드');
  assert.deepEqual(savedFrame.slotAssignments, { IN1: 'cin', IN2: 'cin4', OUT1: 'cout' });
  assert.equal(serializeDiagram(saved, { library }), text, '다시 저장해도 같은 바이트');
  // 같은 카드를 두 슬롯에 꽂으면 수량 2
  updateSlotAssignments(diagram, frame.id, { IN1: 'cin', IN2: 'cin', OUT1: 'cout' }, { ...opts, removeEdges: true });
  assert.deepEqual(dataOf(diagram, frame).selectedOptionQuantities, { 'portal-option:cin': 2, 'portal-option:cout': 1 });
});

test('swapping one slot card asks first and then removes only that slot\'s edges', () => {
  const { diagram, frame, src, disp, ids, library, opts } = sample();
  updateSlotAssignments(diagram, frame.id, { IN1: 'cin', IN2: 'cin4', OUT1: 'cout' }, opts);
  const keep = connectPorts(diagram, { nodeId: src.id, portId: 'out-hdmi-1' }, { nodeId: frame.id, portId: 'opt-cin-IN1-in-hdmi-1' }, { ids, rules: library.rules });
  const swap = connectPorts(diagram, { nodeId: src.id, portId: 'out-hdmi-2' }, { nodeId: frame.id, portId: 'opt-cin4-IN2-in-hdmi-3' }, { ids, rules: library.rules });
  const out = connectPorts(diagram, { nodeId: frame.id, portId: 'opt-cout-OUT1-out-hdmi-2' }, { nodeId: disp.id, portId: 'in-hdmi-1' }, { ids, rules: library.rules });
  assert.ok(keep.ok && swap.ok && out.ok);
  const before = JSON.stringify(diagram);
  const asked = updateSlotAssignments(diagram, frame.id, { IN1: 'cin', IN2: 'cin', OUT1: 'cout' }, opts);
  assert.equal(asked.ok, false);
  assert.equal(asked.code, 'edges-affected');
  assert.deepEqual(asked.removedEdgeIds, [swap.edge.id]);
  assert.equal(JSON.stringify(diagram), before, '확인 전에는 아무것도 바꾸지 않는다');
  const done = updateSlotAssignments(diagram, frame.id, { IN1: 'cin', IN2: 'cin', OUT1: 'cout' }, { ...opts, removeEdges: true });
  assert.deepEqual(done.removedEdgeIds, [swap.edge.id]);
  assert.deepEqual(diagram.edges.map(edge => edge.id).sort(), [keep.edge.id, out.edge.id].sort());
  const data = dataOf(diagram, frame);
  assert.deepEqual(portIds(data, 'inputs'), ['opt-cin-IN1-in-hdmi-1', 'opt-cin-IN1-in-hdmi-2', 'opt-cin-IN2-in-hdmi-1', 'opt-cin-IN2-in-hdmi-2']);
  assert.deepEqual(data.selectedOptionQuantities, { 'portal-option:cin': 2, 'portal-option:cout': 1 });
  assert.ok(diagram.options.some(option => option.id === 'portal-option:cin4'), '옵션 정의는 지우지 않는다(견적 옵션과 같다)');
  assert.deepEqual(saveAndValidate(diagram, library).errors, []);
  // 출력 카드 빼기: 그 슬롯 연결만 정리된다
  const removed = updateSlotAssignments(diagram, frame.id, { IN1: 'cin', IN2: 'cin' }, { ...opts, removeEdges: true });
  assert.deepEqual(removed.removedEdgeIds, [out.edge.id]);
  assert.deepEqual(dataOf(diagram, frame).outputs, []);
  assert.deepEqual(dataOf(diagram, frame).selectedOptionQuantities, { 'portal-option:cin': 2 });
  // 모두 빼면 slotAssignments 키가 사라지고 slot-empty 안내가 나온다
  updateSlotAssignments(diagram, frame.id, {}, { ...opts, removeEdges: true });
  const empty = dataOf(diagram, frame);
  assert.equal(empty.slotAssignments, undefined);
  assert.deepEqual(empty.optionPortIds, []);
  assert.deepEqual(empty.selectedOptionQuantities, {});
  assert.deepEqual(codes(computeIssues(diagram, { library }), frame.id), ['slot-empty']);
});

test('spare card quantities entered in the quote tab survive slot changes', () => {
  const { diagram, frame, opts } = sample();
  dataOf(diagram, frame).selectedOptionQuantities = { 'portal-option:cin': 3, 'portal-option:other': 1 };
  diagram.options = [{ id: 'portal-option:other', model: 'OTHER' }];
  updateSlotAssignments(diagram, frame.id, { IN1: 'cin' }, opts);
  assert.deepEqual(dataOf(diagram, frame).selectedOptionQuantities, { 'portal-option:cin': 4, 'portal-option:other': 1 });
  updateSlotAssignments(diagram, frame.id, { IN1: 'cin4' }, opts);
  assert.deepEqual(dataOf(diagram, frame).selectedOptionQuantities, { 'portal-option:cin': 3, 'portal-option:other': 1, 'portal-option:cin4': 1 });
  // 견적 쪽에서 장착 수보다 적게 적혀 있어도 장착 수 밑으로 내려가지 않는다
  dataOf(diagram, frame).selectedOptionQuantities['portal-option:cin4'] = 0;
  updateSlotAssignments(diagram, frame.id, { IN1: 'cin4', OUT1: 'cout' }, opts);
  assert.equal(dataOf(diagram, frame).selectedOptionQuantities['portal-option:cin4'], 1);
});

test('wrong slots and incompatible cards are refused without changes', () => {
  const { diagram, frame, opts } = sample();
  const before = JSON.stringify(diagram);
  assert.equal(updateSlotAssignments(diagram, frame.id, { IN1: 'cout' }, opts).code, 'card-incompatible');
  assert.equal(updateSlotAssignments(diagram, frame.id, { IN9: 'cin' }, opts).code, 'slot-unknown');
  assert.equal(updateSlotAssignments(diagram, frame.id, { IN1: 'nope' }, opts).code, 'card-incompatible');
  assert.equal(updateSlotAssignments(diagram, frame.id, { IN1: 'cin' }, { ...opts, library: null }).code, 'library-missing');
  const plain = sample('src');
  assert.equal(updateSlotAssignments(plain.diagram, plain.frame.id, { IN1: 'cin' }, plain.opts).code, 'slots-missing');
  assert.equal(JSON.stringify(diagram), before);
  // 같은 값이면 바뀐 것이 없다
  assert.deepEqual(updateSlotAssignments(diagram, frame.id, {}, opts), { ok: true, removedEdgeIds: [], changed: false });
});

test('RTCOM series frames use the slot flow instead of series-config-pending (unit IDs with ":")', () => {
  const { diagram, frame, src, ids, library, opts } = sample('rtcom-xdm:xdm-12');
  const card = addEquipmentNode(diagram, library.units.get('rtcom-xdm:xdm-his100').equipment, { position: { x: 0, y: 400 }, ids });
  const plain = addEquipmentNode(diagram, library.units.get('rtcom-xdm:xdm-plain').equipment, { position: { x: 0, y: 800 }, ids });
  let issues = computeIssues(diagram, { library });
  assert.deepEqual(codes(issues, frame.id), ['no-ports', 'slot-empty']);
  assert.deepEqual(codes(issues, card.id), [], '따로 놓은 카드 단위도 시리즈 구성 대기가 아니다');
  assert.deepEqual(codes(issues, plain.id), ['series-config-pending']);
  const result = updateSlotAssignments(diagram, frame.id, { IN1: 'rtcom-xdm:xdm-his100', OUT2: 'rtcom-xdm:xdm-hos100' }, opts);
  assert.equal(result.ok, true);
  const data = dataOf(diagram, frame);
  assert.equal(data.inputs[0].id, 'opt-rtcom-xdm:xdm-his100-IN1-in-hdmi-1');
  assert.equal(data.inputs[0].label, 'IN1 HDMI In 1');
  assert.deepEqual(data.selectedOptionQuantities, { 'portal-option:rtcom-xdm:xdm-his100': 1, 'portal-option:rtcom-xdm:xdm-hos100': 1 });
  // RTCOM 카드는 제품 하나에 모델이 여럿이라 견적 모델은 카드 모델명이다
  assert.deepEqual(diagram.options.map(option => [option.id, option.model]), [['portal-option:rtcom-xdm:xdm-his100', 'XDM-HIS100'], ['portal-option:rtcom-xdm:xdm-hos100', 'XDM-HOS100']]);
  const edge = connectPorts(diagram, { nodeId: src.id, portId: 'out-hdmi-1' }, { nodeId: frame.id, portId: 'opt-rtcom-xdm:xdm-his100-IN1-in-hdmi-1' }, { ids, rules: library.rules });
  assert.equal(edge.ok, true);
  issues = computeIssues(diagram, { library });
  assert.deepEqual(codes(issues, frame.id), []);
  const { errors } = saveAndValidate(diagram, library);
  assert.deepEqual(errors, []);
  // 라이브러리 없이 열어도(CLI 기본) 카드를 꽂은 프레임은 시리즈 구성 대기가 아니다
  assert.deepEqual(codes(computeIssues(diagram), frame.id), []);
});

test('frames without compatible card data are not nagged with slot-empty', () => {
  const { diagram, frame, library } = sample('empty-frame');
  assert.deepEqual(codes(computeIssues(diagram, { library }), frame.id), []);
  assert.deepEqual(slotCards(library, 'empty-frame', 'S1'), []);
});

test('port editing (B-01) on card ports compares against frame + cards, and reset keeps the cards', () => {
  const { diagram, frame, library, opts } = sample();
  updateSlotAssignments(diagram, frame.id, { IN1: 'cin', OUT1: 'cout' }, opts);
  let data = dataOf(diagram, frame);
  assert.equal(slotOfPort(data, 'opt-cin-IN1-in-hdmi-2'), 'IN1');
  assert.equal(slotOfPort(data, 'both-ethernet-1'), null);
  const libraryEquipment = nodeLibraryEquipment(library, data);
  assert.deepEqual(portIds(libraryEquipment, 'inputs'), portIds(data, 'inputs'));
  // 카드 단자 이름을 고치고, 카드 단자 하나를 지운다
  const lists = Object.fromEntries(['inputs', 'outputs', 'bidirectional'].map(list => [list, data[list].map(({ id, label, connector, signals }) => ({ id, label, connector, signals }))]));
  lists.inputs[0].label = '무대 카메라';
  lists.outputs = lists.outputs.slice(1);
  const edited = updateEquipmentPorts(diagram, frame.id, lists, { rules: library.rules, signalVocabulary: SIGNALS, libraryEquipment });
  assert.equal(edited.ok, true);
  data = dataOf(diagram, frame);
  assert.equal(data.inputs[0].edited, true);
  assert.equal(data.portsEdited, true);
  assert.deepEqual(data.optionPortIds, ['opt-cin-IN1-in-hdmi-1', 'opt-cin-IN1-in-hdmi-2', 'opt-cout-OUT1-out-hdmi-2']);
  assert.deepEqual(codes(computeIssues(diagram, { library }), frame.id), ['ports-edited']);
  // 다른 슬롯에 카드를 꽂아도 고친 카드 단자는 그대로다
  updateSlotAssignments(diagram, frame.id, { IN1: 'cin', IN2: 'cin', OUT1: 'cout' }, opts);
  data = dataOf(diagram, frame);
  assert.equal(data.inputs[0].label, '무대 카메라');
  assert.equal(data.portsEdited, true);
  // 되돌리기: 프레임 + 카드 값으로. 카드 구성은 남는다
  const reset = resetFramePorts(diagram, frame.id, library, opts);
  assert.equal(reset.ok, true);
  data = dataOf(diagram, frame);
  assert.equal(data.portsEdited, undefined);
  assert.equal(data.inputs[0].label, 'IN1 HDMI In 1');
  assert.equal(data.inputs[0].edited, undefined);
  assert.deepEqual(data.slotAssignments, { IN1: 'cin', IN2: 'cin', OUT1: 'cout' });
  assert.deepEqual(portIds(data, 'outputs'), ['opt-cout-OUT1-out-hdmi-1', 'opt-cout-OUT1-out-hdmi-2']);
  assert.deepEqual(data.optionPortIds, [...portIds(data, 'inputs'), ...portIds(data, 'outputs')]);
  assert.deepEqual(codes(computeIssues(diagram, { library }), frame.id), []);
});

test('legacy expanded card ports (BLU-160 before B-03) get a notice, not an automatic conversion (D1)', () => {
  const { diagram, frame, library } = sample('blu');
  const data = dataOf(diagram, frame);
  data.inputs = [p('in-mic-line-audio-1', 'in', 'TERMINAL-BLOCK', ['MIC-AUDIO'], 'audio'), p('in-mic-line-audio-2', 'in', 'TERMINAL-BLOCK', ['MIC-AUDIO'], 'audio')];
  const issues = computeIssues(diagram, { library });
  assert.deepEqual(codes(issues, frame.id), ['slot-legacy-ports']);
  assert.equal(issues.find(issue => issue.code === 'slot-legacy-ports').detail, 'blu: 2');
  // 사용자가 추가한 단자는 예전 카드 단자로 보지 않는다
  data.inputs = [{ ...p('in-user-1', 'in', 'HDMI', ['HDMI'], 'video'), origin: 'user' }];
  data.portsEdited = true;
  data.userPortSeq = 1;
  assert.deepEqual(codes(computeIssues(diagram, { library }), frame.id), ['ports-edited', 'slot-empty']);
});

test('slotAssignments is checked by the validator and dropped when empty', () => {
  const { diagram, frame, library, opts } = sample();
  updateSlotAssignments(diagram, frame.id, { IN1: 'cin' }, opts);
  const { saved } = saveAndValidate(diagram, library);
  for (const bad of [[], { IN1: '' }, { IN1: 3 }, 'IN1']) {
    const copy = JSON.parse(JSON.stringify(saved));
    copy.nodes.find(node => node.id === frame.id).data.slotAssignments = bad;
    assert.ok(validateDiagram(copy).errors.some(error => error.code === 'structure' && error.path.endsWith('slotAssignments')), JSON.stringify(bad));
  }
  const copy = JSON.parse(JSON.stringify(saved));
  copy.nodes.find(node => node.id === frame.id).data.slotAssignments = {};
  const again = JSON.parse(serializeDiagram(copy, { library }));
  assert.equal('slotAssignments' in again.nodes.find(node => node.id === frame.id).data, false);
});
