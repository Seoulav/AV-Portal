import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as D from '../builder/engine/defaults.mjs';
import { addAnnotationNode, addEquipmentNode, addShapeNode, connectPorts, createDiagram, createIdFactory, setEdgeCable } from '../builder/engine/diagram.mjs';
import { nodeHeight } from '../builder/engine/geometry.mjs';
import { createLibraryIndex } from '../builder/engine/library.mjs';
import { judgeConnection } from '../builder/engine/rules.mjs';
import { normalizeDiagram, serializeDiagram } from '../builder/engine/serialize.mjs';
import { validateDiagram } from '../builder/engine/validate.mjs';
import * as V from '../beta/port-vocabulary.mjs';

// 예제 파일만으로 검사한다. 현재 Portal 데이터에 의존하지 않는다.
const root = new URL('../', import.meta.url);
const readText = path => readFileSync(new URL(path, root), 'utf8').replaceAll('\r\n', '\n');
const readJson = path => JSON.parse(readText(path));
const EXAMPLES = ['small-room', 'auditorium-audio', 'rtcom-extender'].map(name => `builder/examples/${name}.diagram.json`);

test('engine defaults match the library vocabulary', () => {
  assert.deepEqual(D.DEFAULT_LINE_TYPES, V.LINE_TYPES);
  assert.deepEqual(D.BASE_LINE_TYPE_IDS, V.BASE_LINE_TYPE_IDS);
  assert.deepEqual(D.CONNECTOR_WILDCARDS, V.CONNECTOR_WILDCARDS);
  assert.deepEqual(D.CONNECTOR_EQUIVALENTS, V.CONNECTOR_EQUIVALENTS);
  assert.deepEqual(D.LEVEL_PAIRS, V.LEVEL_PAIRS);
  assert.equal(D.ENGINE_VOCABULARY_VERSION, V.VOCABULARY_VERSION);
});

// ── 기반명세 §7.3 시험 사례 22건 ──
const TYPE = { HDMI: 'video', DVI: 'video', SDI: 'sdi', DANTE: 'network', AES67: 'network', ETHERNET: 'network', POE: 'network', HDBASET: 'network', 'BLU-LINK': 'network', 'MIC-AUDIO': 'audio', 'LINE-AUDIO': 'audio', 'RS-232': 'control', SPEAKER: 'speaker', POWER: 'power', FIBER: 'fiber' };
let portSeq = 0;
const port = (direction, connector, signals, verification = 'FOUND') => {
  const list = signals.split(',');
  portSeq += 1;
  return { id: `${direction}-${list[0].toLowerCase()}-${portSeq}`, label: '', type: ['SFP', 'LC', 'SC'].includes(connector) ? 'fiber' : TYPE[list[0]], direction, connector, signals: list, verification };
};
const judge = (a, b, { occupied = [], sameNode = false } = {}) => judgeConnection(
  { nodeId: 'A', port: a },
  { nodeId: sameNode ? 'A' : 'B', port: b },
  { occupied: (nodeId, portId) => occupied.includes(`${nodeId}::${portId}`) },
);
const codes = result => result.findings.map(finding => finding.code);

test('§7.3 allowed cases', () => {
  let r = judge(port('out', 'HDMI', 'HDMI'), port('in', 'HDMI', 'HDMI'));
  assert.equal(r.allowed, true); assert.deepEqual(codes(r), []); assert.equal(r.lineTypeId, 'video');                       // A1
  r = judge(port('out', 'BNC', 'SDI'), port('in', 'BNC', 'SDI'));
  assert.equal(r.allowed, true); assert.equal(r.lineTypeId, 'sdi'); assert.deepEqual(codes(r), []);                         // A2
  r = judge(port('both', 'RJ45', 'DANTE,AES67,ETHERNET'), port('both', 'RJ45', 'DANTE,AES67,ETHERNET'));
  assert.equal(r.allowed, true); assert.equal(r.signal, 'DANTE'); assert.deepEqual(codes(r), []);                           // A3
  r = judge(port('in', 'XLR', 'MIC-AUDIO'), port('out', 'XLR', 'MIC-AUDIO'));
  assert.equal(r.allowed, true); assert.equal(r.flipped, true); assert.equal(r.source.nodeId, 'B');                        // A4
  r = judge(port('both', 'RJ45', 'ETHERNET'), port('both', 'RJ45', 'ETHERNET'));
  assert.equal(r.allowed, true); assert.deepEqual(codes(r), []);                                                           // A5
  r = judge(port('both', 'RJ45', 'DANTE,ETHERNET'), port('both', 'RJ45', 'ETHERNET,POE'));
  assert.equal(r.allowed, true); assert.equal(r.signal, 'ETHERNET'); assert.deepEqual(codes(r), []);                        // A6
  r = judge(port('in', 'TERMINAL-BLOCK', 'RS-232'), port('both', 'UNKNOWN', 'RS-232'));
  assert.equal(r.allowed, true); assert.equal(r.flipped, true); assert.deepEqual(codes(r), ['connector-unknown']);          // A7
  r = judge(port('both', 'TERMINAL-BLOCK', 'RS-232'), port('out', 'DSUB-9', 'RS-232'));
  assert.equal(r.allowed, true); assert.equal(r.flipped, true); assert.deepEqual(codes(r), ['connector-adapter']);         // A8
});

test('§7.3 warning cases', () => {
  assert.deepEqual(codes(judge(port('out', 'HDMI', 'HDMI'), port('in', 'DVI', 'HDMI,DVI'))), ['connector-adapter']);       // W1
  assert.deepEqual(codes(judge(port('out', 'TERMINAL-BLOCK', 'LINE-AUDIO'), port('in', 'XLR', 'LINE-AUDIO'))), ['connector-adapter']); // W2
  const w3 = judge(port('out', 'XLR', 'LINE-AUDIO'), port('in', 'XLR', 'MIC-AUDIO'));
  assert.equal(w3.allowed, true); assert.deepEqual(codes(w3), ['signal-level']); assert.equal(w3.signal, 'LINE-AUDIO');    // W3
  assert.deepEqual(codes(judge(port('out', 'HDMI', 'HDMI', 'REVIEW REQUIRED'), port('in', 'HDMI', 'HDMI'))), ['unverified-port']); // W4
  const w5 = judge(port('out', 'XLR-COMBO', 'LINE-AUDIO'), port('in', 'TRS-6.3', 'LINE-AUDIO'));
  assert.equal(w5.allowed, true); assert.deepEqual(codes(w5), []);                                                         // W5
});

test('§7.3 blocked cases', () => {
  assert.equal(judge(port('out', 'HDMI', 'HDMI'), port('out', 'HDMI', 'HDMI')).code, 'direction');                         // B1
  assert.equal(judge(port('out', 'SPEAKON', 'SPEAKER'), port('in', 'HDMI', 'HDMI')).code, 'signal-mismatch');               // B2
  const b3 = port('out', 'HDMI', 'HDMI');
  assert.equal(judge(b3, port('in', 'HDMI', 'HDMI'), { occupied: [`A::${b3.id}`] }).code, 'port-occupied');               // B3
  const b3t = port('in', 'HDMI', 'HDMI');
  assert.equal(judge(port('out', 'HDMI', 'HDMI'), b3t, { occupied: [`B::${b3t.id}`] }).code, 'port-occupied');
  const b4 = port('both', 'RJ45', 'ETHERNET');
  assert.equal(judge(b4, port('both', 'RJ45', 'ETHERNET'), { occupied: [`A::${b4.id}`] }).code, 'port-occupied');         // B4
  const b4t = port('both', 'RJ45', 'ETHERNET');
  assert.equal(judge(port('both', 'RJ45', 'ETHERNET'), b4t, { occupied: [`B::${b4t.id}`] }).code, 'port-occupied');
  assert.equal(judge(port('out', 'IEC-C14', 'POWER'), port('in', 'IEC-C14', 'POWER')).code, 'power-disabled');             // B5
  assert.equal(judge(port('out', 'HDMI', 'HDMI'), port('in', 'HDMI', 'HDMI'), { sameNode: true }).code, 'self-loop');      // B6
  assert.equal(judge(port('in', 'RJ45', 'HDBASET'), port('in', 'RJ45', 'HDBASET')).code, 'direction');                     // B7
  assert.equal(judge(port('out', 'RJ45', 'BLU-LINK'), port('both', 'RJ45', 'ETHERNET')).code, 'signal-mismatch');          // B8
  assert.equal(judge(port('out', 'LC', 'FIBER'), port('both', 'SFP', 'ETHERNET')).code, 'signal-mismatch');                // B9
});

// ── 합성 라이브러리로 만드는 구성도 ──
const equipment = (unitId, ports, extra = {}) => ({
  id: unitId, category: 'video', name: 'Converter', model: unitId.toUpperCase(), manufacturer: 'Test', description: '시험용',
  inputs: ports.filter(p => p.direction === 'in'), outputs: ports.filter(p => p.direction === 'out'), bidirectional: ports.filter(p => p.direction === 'both'),
  imageUrl: 'https://example.invalid/x.webp', portal: { productId: unitId.split(':')[0], source: 'portal', detailUrl: `https://example.invalid/${unitId}` }, ...extra,
});
const p = (id, direction, connector, signals, type) => ({ id, label: id, type, direction, connector, signals, verification: 'FOUND', portalIo: { group: 'G', connector, signal: signals[0] } });
function syntheticLibrary(units = null) {
  const list = units ?? [
    equipment('cam', [p('out-hdmi-1', 'out', 'HDMI', ['HDMI'], 'video'), p('both-ethernet-1', 'both', 'RJ45', ['ETHERNET'], 'network')]),
    equipment('disp', [p('in-hdmi-1', 'in', 'HDMI', ['HDMI'], 'video'), p('in-hdmi-2', 'in', 'HDMI', ['HDMI'], 'video'), p('both-ethernet-1', 'both', 'RJ45', ['ETHERNET'], 'network')]),
    equipment('amp', [p('out-speaker-1', 'out', 'TERMINAL-BLOCK', ['SPEAKER'], 'speaker')]),
    equipment('spk', [p('in-speaker-1', 'in', 'TERMINAL-BLOCK', ['SPEAKER'], 'speaker')]),
  ];
  return {
    schema: 'av-portal.builder-library', schemaVersion: '1.0.0',
    source: { catalogSha: 'c', detailSetSha: 'd', rtcomSha: 'r', vocabularyVersion: '1.0.0' },
    lineTypes: D.DEFAULT_LINE_TYPES.map(item => ({ ...item })),
    vocabulary: { connectorWildcards: D.CONNECTOR_WILDCARDS, connectorEquivalents: D.CONNECTOR_EQUIVALENTS, levelPairs: D.LEVEL_PAIRS },
    products: list.map(item => ({ productId: item.portal.productId, units: [{ unitId: item.id, equipment: item }] })),
  };
}
function buildSample(order = 'normal') {
  const library = createLibraryIndex(syntheticLibrary());
  const ids = createIdFactory({ seed: 7, now: Date.UTC(2026, 9, 7) });
  const diagram = createDiagram({ library });
  const shape = addShapeNode(diagram, { position: { x: -10.04, y: -10 }, label: '가상 구역', ids });
  const cam = addEquipmentNode(diagram, library.units.get('cam').equipment, { position: { x: 0.04, y: 0 }, ids });
  const disp = addEquipmentNode(diagram, library.units.get('disp').equipment, { position: { x: 400, y: 0 }, ids });
  const amp = addEquipmentNode(diagram, library.units.get('amp').equipment, { position: { x: 0, y: 300 }, ids, isReused: true });
  const spk = addEquipmentNode(diagram, library.units.get('spk').equipment, { position: { x: 400, y: 300 }, ids });
  addAnnotationNode(diagram, { position: { x: 0, y: 600 }, label: '가상 메모', ids });
  const video = connectPorts(diagram, { nodeId: disp.id, portId: 'in-hdmi-1' }, { nodeId: cam.id, portId: 'out-hdmi-1' }, { ids, rules: library.rules });
  setEdgeCable(diagram, video.edge.id, [{ productName: 'HDMI 3m', cableType: 'ready-made', quantity: 1, lineTypeId: 'video' }]);
  connectPorts(diagram, { nodeId: cam.id, portId: 'both-ethernet-1' }, { nodeId: disp.id, portId: 'both-ethernet-1' }, { ids, rules: library.rules });
  connectPorts(diagram, { nodeId: amp.id, portId: 'out-speaker-1' }, { nodeId: spk.id, portId: 'in-speaker-1' }, { ids, rules: library.rules });
  if (order === 'shuffled') { diagram.nodes.reverse(); diagram.edges.reverse(); }
  return { diagram, library, nodes: { shape, cam, disp, amp, spk }, video };
}

test('connecting flips reversed drags and uses the 1.1 handle rules', () => {
  const { diagram, nodes, video } = buildSample();
  assert.equal(video.ok, true);
  assert.equal(video.edge.source, nodes.cam.id);
  assert.equal(video.edge.sourceHandle, 'out-hdmi-1');
  assert.equal(video.edge.targetHandle, 'in-hdmi-1');
  const lan = diagram.edges[1];
  assert.equal(lan.sourceHandle, 'source_both-ethernet-1');
  assert.equal(lan.targetHandle, 'target_both-ethernet-1');
  const again = connectPorts(diagram, { nodeId: nodes.cam.id, portId: 'out-hdmi-1' }, { nodeId: nodes.disp.id, portId: 'in-hdmi-2' });
  assert.deepEqual([again.ok, again.code], [false, 'port-occupied']);
});

test('serialization is deterministic, ordered and drops screen-only values', () => {
  const a = buildSample();
  const b = buildSample('shuffled');
  b.diagram.nodes[0].selected = true;
  b.diagram.nodes[0].dragging = true;
  const text = serializeDiagram(a.diagram, { library: a.library });
  assert.equal(serializeDiagram(b.diagram, { library: b.library }), text);
  const out = JSON.parse(text);
  assert.deepEqual(Object.keys(out), ['version', 'nodes', 'edges', 'lineTypes', 'equipmentDB', 'generator', 'library', 'issues']);
  assert.deepEqual(out.nodes.map(n => n.type), ['shape', 'equipment', 'equipment', 'equipment', 'equipment', 'annotation']);
  const node = out.nodes.find(n => n.type === 'equipment');
  assert.deepEqual(Object.keys(node), ['id', 'type', 'position', 'data', 'measured', 'sourcePosition', 'targetPosition']);
  assert.deepEqual(Object.keys(node.data), ['id', 'category', 'name', 'model', 'manufacturer', 'description', 'inputs', 'outputs', 'bidirectional', 'imageUrl', 'isReused', 'portal']);
  assert.deepEqual(node.position, { x: 0, y: 0 });
  assert.equal(out.nodes[0].position.x, -10);
  assert.deepEqual(Object.keys(out.edges[0]), ['id', 'type', 'source', 'sourceHandle', 'target', 'targetHandle', 'animated', 'style', 'data']);
  const cabled = out.edges.find(e => e.data.bomRows);
  assert.deepEqual(Object.keys(cabled.data.bomRows[0]), ['cableType', 'productName', 'lineTypeId', 'quantity']);
  assert.deepEqual(out.lineTypes.map(l => l.id), ['audio', 'control', 'lt-1784014150344', 'network', 'sdi', 'speaker', 'usb', 'video']);
  assert.deepEqual(out.equipmentDB.map(e => e.id), ['amp', 'cam', 'disp', 'spk']);
  assert.equal(out.equipmentDB.some(e => 'isReused' in e), false);
  assert.equal(out.nodes.find(n => n.data.id === 'amp').data.isReused, true);
  assert.ok(text.endsWith('}\n') && !text.includes('\r'));
});

test('node height follows the old Builder formula', () => {
  const ports = n => Array.from({ length: n }, (_, i) => ({ id: `in-x-${i}` }));
  assert.equal(nodeHeight({ inputs: [], outputs: [], bidirectional: [] }), 100);
  assert.equal(nodeHeight({ inputs: ports(2), outputs: ports(1), bidirectional: [], imageUrl: 'x' }), 12 + 54 + 68 + (2 * 28 - 4) + 12);
  assert.equal(nodeHeight({ inputs: ports(1), outputs: [], bidirectional: ports(2) }), Math.max(100, 12 + 54 + (28 - 4) + 8 + 13 + (2 * 28 - 4) + 12));
});

test('ids are prefixed lowercase ULIDs and reproducible with a seed', () => {
  const a = createIdFactory({ seed: 1, now: 0 });
  const b = createIdFactory({ seed: 1, now: 0 });
  const id = a.node();
  assert.match(id, /^node_[0-9a-hjkmnp-tv-z]{26}$/);
  assert.equal(b.node(), id);
  assert.match(a.edge('node_a', 'node_b'), /^e-node_a-node_b-[0-9a-z]{26}$/);
});

// ── 예제 ──
test('examples validate and re-serialize to the same bytes', () => {
  for (const path of EXAMPLES) {
    const diagram = readJson(path);
    const { errors } = validateDiagram(diagram);
    assert.deepEqual(errors, [], path);
    assert.equal(serializeDiagram(diagram), readText(path), path);
  }
});

test('1.2 examples are a superset of the 1.1 keys', () => {
  const EXCEPT = new Set(['selected', 'dragging', 'dimmed', 'draggable', 'quantity', 'selectedOptionQuantities', 'selectedOptionIds', 'optionPortIds', 'locked']);
  const paths = (value, prefix = '', out = new Map()) => {
    if (Array.isArray(value)) { for (const item of value) paths(item, `${prefix}[]`, out); return out; }
    if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        if (EXCEPT.has(key)) continue;
        const path = `${prefix}.${key}`;
        if (!out.has(path)) out.set(path, new Set());
        out.get(path).add(item === null ? 'null' : Array.isArray(item) ? 'array' : typeof item);
        paths(item, path, out);
      }
    }
    return out;
  };
  const legacy = paths(readJson('builder/examples/legacy-1.1.example.json'));
  const current = new Map();
  for (const path of EXAMPLES) for (const [key, types] of paths(readJson(path))) {
    if (!current.has(key)) current.set(key, new Set());
    for (const type of types) current.get(key).add(type);
  }
  for (const [key, types] of legacy) {
    if (key === '.version') continue;
    assert.ok(current.has(key), `1.2에 없는 1.1 키: ${key}`);
    for (const type of types) assert.ok(current.get(key).has(type), `${key}의 타입 ${type}`);
  }
});

test('broken files fail with precise error codes', () => {
  const base = () => readJson('builder/examples/small-room.diagram.json');
  const errorCodes = diagram => validateDiagram(diagram).errors.map(error => error.code);
  const video = diagram => diagram.edges.find(edge => edge.data.lineTypeId === 'video');
  let d = base(); d.version = '1.1';
  assert.deepEqual(errorCodes(d), ['structure']);
  d = base(); video(d).source = 'node_missing';
  assert.deepEqual(errorCodes(d), ['edge-node-missing']);
  d = base(); video(d).targetHandle = 'in-hdmi-99';
  assert.deepEqual(errorCodes(d), ['edge-handle-missing']);
  d = base(); d.edges.push({ ...structuredClone(video(d)), id: 'e-dup' });
  assert.ok(errorCodes(d).includes('port-occupied'));
  d = base(); { const e = video(d); [e.source, e.target, e.sourceHandle, e.targetHandle] = [e.target, e.source, e.targetHandle, e.sourceHandle]; }
  assert.deepEqual(errorCodes(d), ['direction']);
  d = base(); video(d).targetHandle = 'in-usb-1';
  assert.deepEqual(errorCodes(d), ['signal-mismatch']);
  d = base(); d.lineTypes = d.lineTypes.filter(lineType => lineType.id !== 'video');
  assert.ok(errorCodes(d).includes('linetype-missing'));
  d = base(); video(d).data.lineTypeId = 'sdi';
  assert.deepEqual(errorCodes(d), ['edge-linetype', 'derived-mismatch']);
});

test('files still open when the library changes, and the change is reported', () => {
  const diagram = readJson('builder/examples/small-room.diagram.json');
  // 예제의 equipmentDB로 "만들 때의 라이브러리"를 되살린다
  const original = syntheticLibrary(diagram.equipmentDB);
  const same = validateDiagram(diagram, { library: createLibraryIndex(original) });
  assert.deepEqual(same.errors, []);
  assert.equal(same.issues.some(issue => ['library-drift', 'product-removed'].includes(issue.code)), false);
  const changed = structuredClone(original);
  changed.products[0].units[0].equipment.inputs.push({ ...changed.products[0].units[0].equipment.outputs[0], id: 'in-new-1', direction: 'in' });
  changed.products = changed.products.filter((_, i) => i !== 1);
  const result = validateDiagram(diagram, { library: createLibraryIndex(changed) });
  assert.deepEqual(result.errors, []);
  const codes = result.issues.map(issue => issue.code);
  assert.ok(codes.includes('library-drift'));
  assert.ok(codes.includes('product-removed'));
});

test('issues are computed, sorted and typed', () => {
  const { diagram, library } = buildSample();
  const out = normalizeDiagram(diagram, { library });
  assert.deepEqual(out.issues.map(issue => issue.code), ['cable-unspecified', 'cable-unspecified']);
  assert.deepEqual(Object.keys(out.issues[0]), ['code', 'severity', 'target', 'detail']);
  const series = readJson('builder/examples/rtcom-extender.diagram.json');
  assert.deepEqual(validateDiagram(series).issues.map(issue => issue.code), ['no-ports', 'series-config-pending']);
});

test('the validate CLI reports errors with its exit code', () => {
  const cli = fileURLToPath(new URL('builder/cli/validate.mjs', root));
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  const ok = run(fileURLToPath(new URL(EXAMPLES[0], root)));
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /오류 0건/);
  const dir = mkdtempSync(join(tmpdir(), 'builder-cli-'));
  try {
    const broken = readJson(EXAMPLES[0]);
    broken.edges[0].source = 'node_missing';
    const brokenPath = join(dir, 'broken.diagram.json');
    writeFileSync(brokenPath, JSON.stringify(broken));
    const failed = run(brokenPath);
    assert.equal(failed.status, 1);
    assert.match(failed.stdout, /edge-node-missing/);
    const libraryPath = join(dir, 'library.json');
    writeFileSync(libraryPath, JSON.stringify(syntheticLibrary(readJson(EXAMPLES[0]).equipmentDB)));
    const withLibrary = run('--library', libraryPath, fileURLToPath(new URL(EXAMPLES[0], root)));
    assert.equal(withLibrary.status, 0, withLibrary.stdout + withLibrary.stderr);
    assert.equal(run().status, 2);
    assert.equal(run(`--library=${libraryPath}`, fileURLToPath(new URL(EXAMPLES[0], root))).status, 0);
    assert.equal(run(...EXAMPLES.map(path => fileURLToPath(new URL(path, root)))).status, 0);
    assert.equal(run(join(dir, 'missing.diagram.json')).status, 2);
    assert.equal(run(fileURLToPath(new URL(EXAMPLES[0], root)), brokenPath).status, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('reversed drags swap handle prefixes and keep level-pair signals on the source', () => {
  const library = createLibraryIndex(syntheticLibrary([
    equipment('ctl', [p('both-rs-232-1', 'both', 'TERMINAL-BLOCK', ['RS-232'], 'control'), p('in-mic-audio-1', 'in', 'XLR', ['MIC-AUDIO'], 'audio')]),
    equipment('dev', [p('out-rs-232-1', 'out', 'DSUB-9', ['RS-232'], 'control'), p('out-line-audio-1', 'out', 'XLR', ['LINE-AUDIO'], 'audio')]),
  ]));
  const ids = createIdFactory({ seed: 3, now: 0 });
  const diagram = createDiagram({ library });
  const ctl = addEquipmentNode(diagram, library.units.get('ctl').equipment, { ids });
  const dev = addEquipmentNode(diagram, library.units.get('dev').equipment, { ids });
  // A8: both에서 out으로 끌면 바뀌고, 양방향 단자는 target_ 접두어가 된다
  const rs = connectPorts(diagram, { nodeId: ctl.id, portId: 'both-rs-232-1' }, { nodeId: dev.id, portId: 'out-rs-232-1' }, { ids, rules: library.rules });
  assert.deepEqual([rs.edge.source, rs.edge.sourceHandle, rs.edge.target, rs.edge.targetHandle], [dev.id, 'out-rs-232-1', ctl.id, 'target_both-rs-232-1']);
  // 레벨 차이 쌍 + 방향 바꾸기: 신호는 바꾼 뒤 source(라인 출력) 쪽
  const audio = connectPorts(diagram, { nodeId: ctl.id, portId: 'in-mic-audio-1' }, { nodeId: dev.id, portId: 'out-line-audio-1' }, { ids, rules: library.rules });
  assert.equal(audio.judgement.flipped, true);
  assert.equal(audio.edge.data.signal, 'LINE-AUDIO');
  assert.deepEqual(audio.judgement.findings.map(f => f.code), ['signal-level']);
  assert.deepEqual(validateDiagram(normalizeDiagram(diagram, { library }), { library }).errors, []);
});

test('the remaining error codes are reported', () => {
  const base = () => readJson('builder/examples/small-room.diagram.json');
  const errorCodes = diagram => validateDiagram(diagram).errors.map(error => error.code);
  const equipmentNodes = diagram => diagram.nodes.filter(node => node.type === 'equipment');
  let d = base(); d.nodes.push(structuredClone(d.nodes[1]));
  assert.ok(errorCodes(d).includes('duplicate-node-id'));
  d = base(); d.edges.push(structuredClone(d.edges[0]));
  assert.ok(errorCodes(d).includes('duplicate-edge-id'));
  d = base(); { const data = equipmentNodes(d)[0].data; data.inputs.push(structuredClone(data.inputs[0])); }
  assert.ok(errorCodes(d).includes('duplicate-port-id'));
  d = base(); { const e = d.edges.find(edge => edge.data.lineTypeId === 'video'); e.target = e.source; e.targetHandle = 'in-rs-422-1'; }
  assert.ok(errorCodes(d).length > 0);
  d = base(); { const e = d.edges.find(edge => edge.data.lineTypeId === 'video'); e.data.signal = 'DVI'; }
  assert.deepEqual(errorCodes(d), ['edge-signal']);
  d = base(); { const e = d.edges.find(edge => edge.sourceHandle.startsWith('source_')); e.sourceHandle = e.sourceHandle.replace('source_', ''); }
  assert.deepEqual(errorCodes(d), ['edge-handle-missing']);
  // 출력 단자를 inputs 배열로 옮기면 1.1 화면에서 핸들이 사라진다
  d = base(); { const data = equipmentNodes(d).find(node => node.data.outputs.length).data; data.inputs.push(data.outputs.shift()); }
  assert.ok(errorCodes(d).includes('structure'));
  d = base(); d.equipmentDB = [];
  assert.deepEqual(errorCodes(d), ['derived-mismatch']);
  d = base(); d.edges[0].style.stroke = '#000000';
  assert.deepEqual(errorCodes(d), ['derived-mismatch']);
  // 같은 노드끼리, 전원끼리
  const library = createLibraryIndex(syntheticLibrary([
    equipment('psu', [p('out-power-1', 'out', 'IEC-C14', ['POWER'], 'power'), p('in-power-1', 'in', 'IEC-C14', ['POWER'], 'power'), p('out-hdmi-1', 'out', 'HDMI', ['HDMI'], 'video'), p('in-hdmi-1', 'in', 'HDMI', ['HDMI'], 'video')]),
  ]));
  const diagram = createDiagram({ library });
  const ids = createIdFactory({ seed: 9, now: 0 });
  const a = addEquipmentNode(diagram, library.units.get('psu').equipment, { ids });
  const b = addEquipmentNode(diagram, library.units.get('psu').equipment, { ids });
  diagram.edges.push(
    { id: 'e-self', type: 'smoothstep', source: a.id, sourceHandle: 'out-hdmi-1', target: a.id, targetHandle: 'in-hdmi-1', animated: false, style: { stroke: '#ef4444', strokeWidth: 2 }, data: { lineTypeId: 'video', signal: 'HDMI' } },
    { id: 'e-power', type: 'smoothstep', source: a.id, sourceHandle: 'out-power-1', target: b.id, targetHandle: 'in-power-1', animated: false, style: { stroke: '#78716c', strokeWidth: 2 }, data: { lineTypeId: 'power', signal: 'POWER' } },
  );
  const codes = validateDiagram(normalizeDiagram(diagram, { library }), { library }).errors.map(error => error.code);
  assert.deepEqual(codes.sort(), ['power-disabled', 'self-loop']);
});

test('the validator never throws on damaged input', () => {
  const pristine = readJson('builder/examples/auditorium-audio.diagram.json');
  const junk = [null, 0, 5, 'abc', {}, [], [null], { x: 1 }, true];
  let seed = 20261007;
  const random = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  const paths = [];
  const walk = (value, path) => {
    paths.push(path);
    if (value && typeof value === 'object') for (const key of Object.keys(value)) walk(value[key], [...path, key]);
  };
  walk(pristine, []);
  for (let i = 0; i < 400; i += 1) {
    const diagram = structuredClone(pristine);
    const path = paths[Math.floor(random() * paths.length)];
    if (!path.length) continue;
    let parent = diagram;
    for (const key of path.slice(0, -1)) parent = parent[key];
    parent[path.at(-1)] = junk[Math.floor(random() * junk.length)];
    assert.doesNotThrow(() => validateDiagram(diagram), path.join('.'));
  }
  for (const bad of [null, 'x', [], { version: '1.2', nodes: 'x', edges: [], lineTypes: [], equipmentDB: [] }, { version: '1.2', nodes: [], edges: [], lineTypes: [null], equipmentDB: [] }]) {
    assert.doesNotThrow(() => validateDiagram(bad));
    assert.ok(validateDiagram(bad).errors.length > 0);
  }
});

test('serialization rejects unknown node types and keeps locks', () => {
  const { diagram, library } = buildSample();
  diagram.nodes.find(node => node.type === 'shape').data.locked = true;
  diagram.nodes.find(node => node.type === 'annotation').data.locked = true;
  const out = normalizeDiagram(diagram, { library });
  assert.equal(out.nodes.find(node => node.type === 'shape').data.locked, true);
  assert.equal(out.nodes.find(node => node.type === 'annotation').data.locked, true);
  diagram.nodes.push({ id: 'x', type: 'group', position: { x: 0, y: 0 }, data: {} });
  assert.throws(() => normalizeDiagram(diagram, { library }), /알 수 없는 노드 type/);
});

test('every current library unit round-trips without a false library-drift', async () => {
  // 현재 데이터의 수치가 아니라 "저장 직후에는 drift가 없다"는 성질만 본다
  const { expectedBuilderLibrary } = await import('../beta/build-builder-library.mjs');
  const library = createLibraryIndex(await expectedBuilderLibrary());
  const ids = createIdFactory({ seed: 11, now: 0 });
  const diagram = createDiagram({ library });
  let x = 0;
  for (const unitId of library.units.keys()) addEquipmentNode(diagram, library.units.get(unitId).equipment, { position: { x: (x += 1) * 10, y: 0 }, ids });
  const saved = JSON.parse(serializeDiagram(diagram, { library }));
  const { errors, issues } = validateDiagram(saved, { library });
  assert.deepEqual(errors, []);
  assert.deepEqual(issues.filter(issue => issue.code === 'library-drift' || issue.code === 'product-removed'), []);
});
