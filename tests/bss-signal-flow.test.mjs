import test from 'node:test';
import {beforeBssAlignment} from './bss-alignment-history.mjs';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareEnhancements, enhancementErrors } from '../prototype/brc-am7/detail-enhancements.mjs';
import { beforeSamsungW04011Raw } from './samsung-w04011-history.mjs';

const directory = new URL('../beta/site/detail/data/', import.meta.url);
const targets = ['blu-100', 'blu-101', 'blu-160', 'blu-50v2', 'blu-dan'];
const product = slug => JSON.parse(readFileSync(new URL(`${slug}.json`, directory)));
const sha = value => createHash('sha256').update(value).digest('hex');

test('five BSS products publish valid, evidence-backed Signal Flow', () => {
  for (const slug of targets) {
    const data = product(slug);
    assert.deepEqual(enhancementErrors(data), [], slug);
    const flow = prepareEnhancements(data).signalFlow;
    assert.ok(flow, slug);
    assert.ok(flow.description.length && flow.connections.length, slug);
    for (const node of [...flow.inputs, ...flow.outputs, ...flow.processes]) assert.ok(node.evidence.length, `${slug}: ${node.id}`);
    for (const edge of [...flow.connections, ...flow.auxiliary]) assert.ok(edge.evidence.length, `${slug}: ${edge.from}`);
    assert.ok(flow.connections.every(edge => edge.signal !== 'control'), slug);
  }
});

test('fixed matrix counts match the existing I/O rows and example dots are explicitly illustrative', () => {
  for (const [slug, inputCount, outputCount] of [['blu-100', 12, 8], ['blu-101', 12, 8], ['blu-50v2', 4, 4]]) {
    const data = product(slug), flow = data.signalFlow;
    assert.equal(Number(data.io[0].quantity), inputCount, slug);
    assert.equal(Number(data.io[1].quantity), outputCount, slug);
    const matrix = flow.processes.find(node => node.kind === 'matrix');
    assert.equal(matrix.crosspoints.inputs.length, inputCount, slug);
    assert.equal(matrix.crosspoints.outputs.length, outputCount, slug);
    assert.match(flow.description, /선택 점은 동작 예시/, slug);
  }
  assert.equal(product('blu-101').signalFlow.processes[0].crosspoints.inputs.length * product('blu-101').signalFlow.processes[0].crosspoints.outputs.length, 96);
});

test('configurable cards do not become a fixed 16×16 installation, and Dante bridge is not a matrix', () => {
  const configurable = product('blu-160'), bridge = product('blu-dan');
  assert.match(configurable.io[0].quantity, /최대 16/);
  assert.match(configurable.signalFlow.description, /카드 구성/);
  assert.ok(configurable.signalFlow.processes.every(node => node.kind !== 'matrix'));
  assert.equal(bridge.signalFlow.type, 'network-bridge');
  assert.ok(bridge.signalFlow.processes.some(node => node.kind === 'bridge'));
  assert.ok(bridge.signalFlow.processes.every(node => node.kind !== 'matrix'));
  assert.equal(bridge.io[0].quantity, '2');
  assert.equal(bridge.io[1].quantity, '2');
});

test('BLU link routes are not inferred from port existence, and the bridge has only cross-protocol paths', () => {
  for (const slug of ['blu-100', 'blu-101', 'blu-160', 'blu-50v2']) {
    const flow = product(slug).signalFlow;
    assert.ok([...flow.inputs, ...flow.outputs].every(node => !/BLU link/.test(node.label)), slug);
    assert.ok([...flow.connections, ...flow.auxiliary].every(edge => !/blu-link/.test(`${edge.from} ${edge.to}`)), slug);
    assert.match(flow.description, /BLU link 내부 경로는 표시하지 않습니다/);
  }
  const flow = product('blu-dan').signalFlow;
  assert.deepEqual(flow.connections.map(edge => [edge.from, edge.to]), [
    ['dante-in', 'dante-to-blu'], ['dante-to-blu', 'blu-out'],
    ['blu-in', 'blu-to-dante'], ['blu-to-dante', 'dante-out']
  ]);
  assert.deepEqual(flow.processes.map(node => node.kind), ['bridge', 'bridge']);
});

test('other 237 product JSON files and the four approved flows remain byte-for-byte fixed', () => {
  const digest = createHash('sha256');
  const files = readdirSync(directory).filter(name => name.endsWith('.json') && name !== 'lh43behhlbfxkr.json').sort();
  assert.equal(files.length, 242);
  // Git stores LF; Windows checkouts may materialize CRLF. Compare the same
  // published text on both platforms without weakening the content snapshot.
  for (const file of files) if (!targets.includes(file.slice(0, -5)))
    digest.update(file).update(beforeSamsungW04011Raw(readFileSync(new URL(file, directory), 'utf8').replace(/\r\n/g, '\n'), file.slice(0, -5)));
  assert.equal(digest.digest('hex'), '1df0881cc382b08fb1d031dbe5d925c4a44287a649598cd708003c6ac8348a33');
  const original = {
    'aquilon-rs1': 'da98ff1d4c6e1fbf2a18c807d5e27c7895d3e56d0482a4da77246908d6855e93',
    'dci-4-600da': 'f7c3b29f6d5228dba62eda698a7d01bceb77b96134827bce94693df2b5d8cd90',
    'novastar-h5': '892c388dade21b038b6c309cb6a4536ac2e3bd53fb25af17b140640cf3b6fe40',
    ulxd4d: 'c18d4f1c2d2bd19a0ed5b5e3cb8a23b891ba845fba878def4dab13508781cee7'
  };
  for (const [slug, expected] of Object.entries(original)) assert.equal(sha(JSON.stringify(product(slug).signalFlow)), expected, slug);
});

test('the five existing BSS products preserve every field outside Signal Flow', () => {
  const original = {
    'blu-100': 'e607b81ca13d2ce0adcdc9e5cbef7b73e8862f6b7f9e48bc924ad16859543b72',
    'blu-101': '5c69a6405b5ea6c3c72bc6b3e97fc13c2ce2c8906b0791cdf0f9c972bd7ba25c',
    'blu-160': 'b81a6e3e7246c6aa92c93dc703507a05f96ca85c0fc5cb35fb2beeaf49f5cf7c',
    'blu-50v2': '6ebb840d22b4a46930e5e5e2c9364734ec9e52a5032fd9dee54f6b4d43a8e08b',
    'blu-dan': 'e164bfb271b38b12aabaaa01a099b682ba2f19014a10d1b2f3ed4d4b3d2d9fb4'
  };
  for (const [slug, expected] of Object.entries(original)) {
    const data = product(slug);
    delete data.signalFlow;
    assert.equal(sha(JSON.stringify(beforeBssAlignment(data, slug))), expected, slug);
  }
});
