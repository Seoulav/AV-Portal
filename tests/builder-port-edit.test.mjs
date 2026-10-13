// B-20261013-01: 구성도 안에서 장비 노드의 단자를 고치는 엔진(builder/engine/ports.mjs)과 저장 형식·이슈.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as D from '../builder/engine/defaults.mjs';
import { addEquipmentNode, connectPorts, createDiagram, createIdFactory } from '../builder/engine/diagram.mjs';
import { computeIssues } from '../builder/engine/issues.mjs';
import { createLibraryIndex } from '../builder/engine/library.mjs';
import { FIBER_CONNECTORS, nextPortLabels, portLineType, resetEquipmentPorts, updateEquipmentPorts } from '../builder/engine/ports.mjs';
import { serializeDiagram } from '../builder/engine/serialize.mjs';
import { validateDiagram } from '../builder/engine/validate.mjs';
import * as V from '../beta/port-vocabulary.mjs';
import { portLineType as generatorPortLineType } from '../beta/builder-library.mjs';

const root = new URL('../', import.meta.url);
const readText = path => readFileSync(new URL(path, root), 'utf8').replaceAll('\r\n', '\n');
const SIGNALS = V.SIGNALS.map(signal => ({ ...signal }));

const p = (id, direction, connector, signals, type) => ({ id, label: id, type, direction, connector, signals, verification: 'FOUND', portalIo: { group: 'G', connector, signal: signals[0] } });
const unit = (id, ports) => ({
  id, category: 'video', name: 'Device', model: id.toUpperCase(), manufacturer: 'Test',
  inputs: ports.filter(x => x.direction === 'in'), outputs: ports.filter(x => x.direction === 'out'), bidirectional: ports.filter(x => x.direction === 'both'),
  portal: { productId: id, source: 'portal', detailUrl: `https://example.invalid/${id}` },
});
function sample() {
  const units = [
    unit('cam', [p('out-hdmi-1', 'out', 'HDMI', ['HDMI'], 'video'), p('both-ethernet-1', 'both', 'RJ45', ['ETHERNET'], 'network')]),
    unit('disp', [p('in-hdmi-1', 'in', 'HDMI', ['HDMI'], 'video'), p('in-hdmi-2', 'in', 'HDMI', ['HDMI'], 'video'), p('both-ethernet-1', 'both', 'RJ45', ['ETHERNET'], 'network')]),
  ];
  const library = createLibraryIndex({
    schema: 'av-portal.builder-library', schemaVersion: '1.0.0',
    source: { catalogSha: 'c', detailSetSha: 'd', rtcomSha: 'r', vocabularyVersion: '1.0.0' },
    lineTypes: D.DEFAULT_LINE_TYPES.map(item => ({ ...item })),
    vocabulary: { signals: SIGNALS, connectors: [...V.CONNECTORS], connectorWildcards: D.CONNECTOR_WILDCARDS, connectorEquivalents: D.CONNECTOR_EQUIVALENTS, levelPairs: D.LEVEL_PAIRS },
    products: units.map(item => ({ productId: item.id, units: [{ unitId: item.id, equipment: item }] })),
  });
  const ids = createIdFactory({ seed: 5, now: Date.UTC(2026, 9, 13) });
  const diagram = createDiagram({ library });
  const cam = addEquipmentNode(diagram, library.units.get('cam').equipment, { position: { x: 0, y: 0 }, ids });
  const disp = addEquipmentNode(diagram, library.units.get('disp').equipment, { position: { x: 400, y: 0 }, ids });
  const options = { rules: library.rules, signalVocabulary: SIGNALS, libraryEquipment: null };
  const forNode = node => ({ ...options, libraryEquipment: library.units.get(node.data.id).equipment });
  return { library, ids, diagram, cam, disp, forNode };
}
const nodeOf = (diagram, node) => diagram.nodes.find(item => item.id === node.id);
// 편집 화면이 만드는 값: 지금 노드 단자에서 이름·커넥터·신호만 남긴 것
const editable = data => Object.fromEntries(['inputs', 'outputs', 'bidirectional'].map(list => [list, data[list].map(({ id, label, connector, signals }) => ({ id, label, connector, signals: [...signals] }))]));
const saveAndValidate = (diagram, library) => {
  const saved = JSON.parse(serializeDiagram(diagram, { library }));
  return { saved, ...validateDiagram(saved, { library }) };
};

test('port type follows the generator rule (fiber connectors, then the main signal line type)', () => {
  assert.deepEqual(FIBER_CONNECTORS, V.FIBER_CONNECTORS);
  for (const [connector, signals] of [['HDMI', ['HDMI']], ['SFP', ['ETHERNET']], ['LC', ['DANTE']], ['RJ45', ['DANTE', 'AES67']], ['BNC', ['SYNC']], ['XLR', ['MIC-AUDIO']]]) {
    assert.equal(portLineType(connector, signals, SIGNALS), generatorPortLineType(connector, signals), `${connector} ${signals}`);
  }
  assert.equal(portLineType('HDMI', ['NOPE'], SIGNALS), null);
});

test('labels continue the numbering of the section', () => {
  const list = [{ label: 'HDMI In 1' }, { label: 'HDMI In 4 (Front)' }, { label: 'SDI In 9' }];
  assert.deepEqual(nextPortLabels(list, 'HDMI', 'in', 4), ['HDMI In 5', 'HDMI In 6', 'HDMI In 7', 'HDMI In 8']);
  assert.deepEqual(nextPortLabels([], 'Dante', 'both', 1), ['Dante I/O 1']);
});

test('adding ports gives unique user ids, marks the node and keeps 1.1 keys', () => {
  const { diagram, library, disp, forNode } = sample();
  const lists = editable(nodeOf(diagram, disp).data);
  lists.inputs.push({ label: 'HDMI In 3', connector: 'HDMI', signals: ['HDMI'] }, { label: 'SDI In 1', connector: 'BNC', signals: ['SDI'] });
  lists.outputs.push({ label: 'LAN SFP', connector: 'SFP', signals: ['ETHERNET'] });
  const result = updateEquipmentPorts(diagram, disp.id, lists, forNode(disp));
  assert.deepEqual([result.ok, result.changed, result.removedEdgeIds], [true, true, []]);
  const data = nodeOf(diagram, disp).data;
  assert.equal(data.portsEdited, true);
  assert.deepEqual(data.inputs.map(x => x.id), ['in-hdmi-1', 'in-hdmi-2', 'in-user-1', 'in-user-2']);
  assert.deepEqual(data.outputs.map(x => [x.id, x.type, x.direction, x.origin]), [['out-user-3', 'fiber', 'out', 'user']]);
  assert.equal(data.inputs[3].type, 'sdi');
  assert.equal('verification' in data.inputs[2], false);
  assert.equal(data.inputs[0].edited, undefined);
  // 지운 번호는 같은 편집 안에서 다시 쓰지 않는다
  const again = editable(data);
  again.inputs = again.inputs.filter(x => x.id !== 'in-user-2');
  again.inputs.push({ label: 'SDI In 2', connector: 'BNC', signals: ['SDI'] });
  updateEquipmentPorts(diagram, disp.id, again, forNode(disp));
  assert.deepEqual(nodeOf(diagram, disp).data.inputs.map(x => x.id), ['in-hdmi-1', 'in-hdmi-2', 'in-user-1', 'in-user-4']);
  const { saved, errors, issues } = saveAndValidate(diagram, library);
  assert.deepEqual(errors, []);
  const node = saved.nodes.find(n => n.id === disp.id);
  assert.deepEqual(Object.keys(node.data), ['id', 'category', 'name', 'model', 'manufacturer', 'inputs', 'outputs', 'bidirectional', 'isReused', 'portal', 'portsEdited']);
  assert.deepEqual(Object.keys(node.data.inputs[2]), ['id', 'label', 'type', 'direction', 'connector', 'signals', 'origin']);
  assert.deepEqual(issues.filter(i => i.target.node === disp.id).map(i => i.code), ['ports-edited']);
  // 다시 저장해도 같은 바이트
  assert.equal(serializeDiagram(saved, { library }), serializeDiagram(diagram, { library }));
});

test('editing a library port keeps its id and connections and re-derives the edge', () => {
  const { diagram, library, ids, cam, disp, forNode } = sample();
  const lan = connectPorts(diagram, { nodeId: cam.id, portId: 'both-ethernet-1' }, { nodeId: disp.id, portId: 'both-ethernet-1' }, { ids, rules: library.rules });
  assert.equal(lan.ok, true);
  const lists = editable(nodeOf(diagram, disp).data);
  lists.inputs[0].label = 'HDMI 1 (회의 탁자)';
  lists.bidirectional[0].signals = ['ETHERNET', 'POE'];
  lists.bidirectional[0].connector = 'SFP';
  const result = updateEquipmentPorts(diagram, disp.id, lists, forNode(disp));
  assert.deepEqual([result.ok, result.removedEdgeIds], [true, []]);
  const data = nodeOf(diagram, disp).data;
  assert.deepEqual([data.inputs[0].id, data.inputs[0].edited, data.inputs[0].verification], ['in-hdmi-1', true, 'FOUND']);
  assert.deepEqual([data.bidirectional[0].id, data.bidirectional[0].type, data.bidirectional[0].edited], ['both-ethernet-1', 'fiber', true]);
  assert.equal(data.inputs[1].edited, undefined);
  // 엣지 선 종류가 새 단자로 다시 정해진다(fiber)
  const edge = diagram.edges.find(e => e.id === lan.edge.id);
  assert.equal(edge.data.lineTypeId, 'fiber');
  assert.deepEqual(saveAndValidate(diagram, library).errors, []);
  // 값을 라이브러리와 같게 되돌리면 표시도 사라진다
  const back = editable(nodeOf(diagram, disp).data);
  back.inputs[0].label = 'in-hdmi-1';
  back.bidirectional[0] = { ...back.bidirectional[0], connector: 'RJ45', signals: ['ETHERNET'] };
  updateEquipmentPorts(diagram, disp.id, back, forNode(disp));
  const restored = nodeOf(diagram, disp).data;
  assert.equal(restored.portsEdited, undefined);
  assert.equal(restored.inputs[0].edited, undefined);
  assert.equal(diagram.edges.find(e => e.id === lan.edge.id).data.lineTypeId, 'network');
});

test('deleting a connected port needs removeEdges and never leaves an orphan edge', () => {
  const { diagram, library, ids, cam, disp, forNode } = sample();
  const video = connectPorts(diagram, { nodeId: cam.id, portId: 'out-hdmi-1' }, { nodeId: disp.id, portId: 'in-hdmi-2' }, { ids, rules: library.rules });
  const lan = connectPorts(diagram, { nodeId: cam.id, portId: 'both-ethernet-1' }, { nodeId: disp.id, portId: 'both-ethernet-1' }, { ids, rules: library.rules });
  const before = JSON.stringify(diagram);
  const lists = editable(nodeOf(diagram, disp).data);
  lists.inputs = lists.inputs.filter(x => x.id !== 'in-hdmi-2');
  const refused = updateEquipmentPorts(diagram, disp.id, lists, forNode(disp));
  assert.deepEqual([refused.ok, refused.code, refused.removedEdgeIds], [false, 'edges-affected', [video.edge.id]]);
  assert.equal(JSON.stringify(diagram), before, '확인 전에는 아무것도 바꾸지 않는다');
  const done = updateEquipmentPorts(diagram, disp.id, lists, { ...forNode(disp), removeEdges: true });
  assert.deepEqual([done.ok, done.removedEdgeIds], [true, [video.edge.id]]);
  assert.deepEqual(diagram.edges.map(e => e.id), [lan.edge.id]);
  const { errors } = saveAndValidate(diagram, library);
  assert.deepEqual(errors, []);
});

test('changing direction or signal re-judges the connection', () => {
  const { diagram, library, ids, cam, disp, forNode } = sample();
  const video = connectPorts(diagram, { nodeId: cam.id, portId: 'out-hdmi-1' }, { nodeId: disp.id, portId: 'in-hdmi-1' }, { ids, rules: library.rules });
  // 신호를 SDI로 바꾸면 HDMI 출력과 맞지 않는다
  let lists = editable(nodeOf(diagram, disp).data);
  lists.inputs[0] = { ...lists.inputs[0], connector: 'BNC', signals: ['SDI'] };
  assert.deepEqual(updateEquipmentPorts(diagram, disp.id, lists, forNode(disp)).removedEdgeIds, [video.edge.id]);
  // 입력을 양방향으로 옮기면 연결은 유지되고 핸들이 target_ 접두어로 바뀐다
  lists = editable(nodeOf(diagram, disp).data);
  const [moved] = lists.inputs.splice(0, 1);
  lists.bidirectional.push(moved);
  const result = updateEquipmentPorts(diagram, disp.id, lists, forNode(disp));
  assert.deepEqual([result.ok, result.removedEdgeIds], [true, []]);
  const edge = diagram.edges.find(e => e.id === video.edge.id);
  assert.equal(edge.targetHandle, 'target_in-hdmi-1');
  assert.equal(nodeOf(diagram, disp).data.bidirectional[1].direction, 'both');
  assert.deepEqual(saveAndValidate(diagram, library).errors, []);
  // 출력 장비의 출력을 입력으로 바꾸면 방향이 맞지 않아 지울 대상이다
  lists = editable(nodeOf(diagram, cam).data);
  lists.inputs.push(...lists.outputs.splice(0, 1));
  assert.deepEqual(updateEquipmentPorts(diagram, cam.id, lists, forNode(cam)).removedEdgeIds, [video.edge.id]);
});

test('reordering marks the node but no port, and bad input is refused without changes', () => {
  const { diagram, disp, forNode } = sample();
  const lists = editable(nodeOf(diagram, disp).data);
  lists.inputs.reverse();
  updateEquipmentPorts(diagram, disp.id, lists, forNode(disp));
  const data = nodeOf(diagram, disp).data;
  assert.deepEqual(data.inputs.map(x => x.id), ['in-hdmi-2', 'in-hdmi-1']);
  assert.equal(data.portsEdited, true);
  assert.equal(data.inputs.some(x => x.edited), false);
  const before = JSON.stringify(diagram);
  const bad = editable(data);
  bad.inputs[0].label = ' ';
  assert.equal(updateEquipmentPorts(diagram, disp.id, bad, forNode(disp)).code, 'port-invalid');
  const unknown = editable(data);
  unknown.inputs.push({ label: 'X', connector: 'HDMI', signals: ['NOPE'] });
  assert.equal(updateEquipmentPorts(diagram, disp.id, unknown, forNode(disp)).code, 'signal-unknown');
  const dup = editable(data);
  dup.outputs.push({ ...dup.inputs[0] });
  assert.equal(updateEquipmentPorts(diagram, disp.id, dup, forNode(disp)).code, 'duplicate-port-id');
  const ghost = editable(data);
  ghost.inputs[0].id = 'in-ghost-1';
  assert.equal(updateEquipmentPorts(diagram, disp.id, ghost, forNode(disp)).code, 'port-unknown');
  assert.equal(JSON.stringify(diagram), before);
  // 바뀐 것이 없으면 changed false
  assert.equal(updateEquipmentPorts(diagram, disp.id, editable(data), forNode(disp)).changed, false);
});

test('reset to library removes all marks and handles connections like an edit', () => {
  const { diagram, library, ids, cam, disp, forNode } = sample();
  const lists = editable(nodeOf(diagram, disp).data);
  lists.inputs = lists.inputs.filter(x => x.id !== 'in-hdmi-2');
  lists.inputs[0].label = '바뀐 이름';
  lists.inputs.push({ label: 'HDMI In 9', connector: 'HDMI', signals: ['HDMI'] });
  updateEquipmentPorts(diagram, disp.id, lists, forNode(disp));
  const user = connectPorts(diagram, { nodeId: cam.id, portId: 'out-hdmi-1' }, { nodeId: disp.id, portId: 'in-user-1' }, { ids, rules: library.rules });
  assert.equal(user.ok, true);
  const lan = connectPorts(diagram, { nodeId: cam.id, portId: 'both-ethernet-1' }, { nodeId: disp.id, portId: 'both-ethernet-1' }, { ids, rules: library.rules });
  const equipment = library.units.get('disp').equipment;
  const refused = resetEquipmentPorts(diagram, disp.id, equipment, forNode(disp));
  assert.deepEqual([refused.ok, refused.code, refused.removedEdgeIds], [false, 'edges-affected', [user.edge.id]]);
  const done = resetEquipmentPorts(diagram, disp.id, equipment, { ...forNode(disp), removeEdges: true });
  assert.equal(done.ok, true);
  const data = nodeOf(diagram, disp).data;
  assert.equal('portsEdited' in data, false);
  for (const list of ['inputs', 'outputs', 'bidirectional']) assert.deepEqual(data[list], equipment[list]);
  assert.deepEqual(diagram.edges.map(e => e.id), [lan.edge.id]);
  const { errors, issues } = saveAndValidate(diagram, library);
  assert.deepEqual(errors, []);
  assert.deepEqual(issues.filter(i => i.target.node).map(i => i.code), []);
  // 이미 라이브러리와 같으면 바뀌는 것이 없다
  assert.equal(resetEquipmentPorts(diagram, disp.id, equipment, forNode(disp)).changed, false);
});

test('a deleted library port can come back with its library id', () => {
  const { diagram, library, disp, forNode } = sample();
  const lists = editable(nodeOf(diagram, disp).data);
  const [removed] = lists.inputs.splice(1, 1);
  updateEquipmentPorts(diagram, disp.id, lists, forNode(disp));
  assert.equal(nodeOf(diagram, disp).data.portsEdited, true);
  const back = editable(nodeOf(diagram, disp).data);
  back.inputs.push(removed);
  assert.equal(updateEquipmentPorts(diagram, disp.id, back, forNode(disp)).ok, true);
  const data = nodeOf(diagram, disp).data;
  assert.equal(data.portsEdited, undefined);
  assert.deepEqual(data.inputs[1], { ...library.units.get('disp').equipment.inputs[1] });
  // 라이브러리를 모르면 없는 단자 id는 받지 않는다
  const ghost = editable(data);
  ghost.inputs.push({ ...ghost.inputs[0], id: 'in-hdmi-9' });
  assert.equal(updateEquipmentPorts(diagram, disp.id, ghost, { signalVocabulary: SIGNALS }).code, 'port-unknown');
});

test('quote fields alone do not raise library-drift, other differences still do', () => {
  const { diagram, library, cam } = sample();
  const node = nodeOf(diagram, cam);
  node.data = { ...node.data, systemName: '회의실 A', selectedOptionQuantities: { OPT: 1 }, optionPortIds: [] };
  diagram.options = [{ id: 'OPT', model: 'OPT-A' }];
  assert.deepEqual(computeIssues(diagram, { library, rules: library.rules }).filter(i => i.target.node), []);
  node.data = { ...node.data, model: 'CAM-OLD' };
  assert.deepEqual(computeIssues(diagram, { library, rules: library.rules }).filter(i => i.target.node).map(i => i.code), ['library-drift']);
  // 단자를 고친 노드도 단자 밖의 차이는 library-drift로 함께 알린다
  node.data = { ...node.data, portsEdited: true };
  assert.deepEqual(computeIssues(diagram, { library, rules: library.rules }).filter(i => i.target.node).map(i => i.code), ['library-drift', 'ports-edited']);
});

test('1.1-shaped examples still validate and re-serialize to the same bytes', () => {
  for (const name of ['small-room', 'auditorium-audio', 'rtcom-extender']) {
    const path = `builder/examples/${name}.diagram.json`;
    const diagram = JSON.parse(readText(path));
    assert.deepEqual(validateDiagram(diagram).errors, [], path);
    assert.equal(serializeDiagram(diagram), readText(path), path);
  }
});

test('the validator rejects malformed edit marks', () => {
  const diagram = JSON.parse(readText('builder/examples/small-room.diagram.json'));
  const node = diagram.nodes.find(n => n.type === 'equipment');
  node.data.portsEdited = 'yes';
  node.data.outputs[0].origin = 'portal';
  node.data.outputs[0].edited = 1;
  const paths = validateDiagram(diagram).errors.map(e => e.path);
  assert.ok(paths.some(path => path.endsWith('.data.portsEdited')));
  assert.ok(paths.some(path => path.endsWith('.origin')));
  assert.ok(paths.some(path => path.endsWith('.edited')));
});
