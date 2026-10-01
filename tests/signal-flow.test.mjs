import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareEnhancements, enhancementErrors, selectCardModes } from '../prototype/brc-am7/detail-enhancements.mjs';
import { flowTypes } from '../prototype/brc-am7/detail-enhancements.mjs';
import { fixtureProduct, scenarios, qmsFixture } from './fixtures/signal-flow.mjs';

export function sample() {
  const evidence = [{ kind: 'io', index: 0 }];
  return { categories: ['Audio'], io: [{ connector: 'TEST', verification: 'VERIFIED' }], specifications: [{ value: 'test', verification: 'VERIFIED' }], sources: [{ code: 'M', name: 'Test manual' }], signalFlow: {
    type: 'matrix', description: '검증 전용 개념도. 선택 점은 동작 예시입니다.',
    inputs: [{ id: 'in', label: 'IN', signal: 'video', evidence }],
    outputs: [{ id: 'out', label: 'OUT', signal: 'video', evidence }],
    processes: [{ id: 'p', kind: 'matrix', label: '선택', evidence, crosspoints: { inputs: ['in'], outputs: ['out'], examples: [{ input: 'in', output: 'out' }] } }],
    connections: [{ from: 'in', to: 'p', signal: 'video', evidence }, { from: 'p', to: 'out', signal: 'video', evidence }],
    auxiliary: [], groups: [], legend: [{ signal: 'video', label: '영상' }], notes: []
  } };
}
test('structured flow keeps explicit topology, evidence and example selections', () => {
  const p = sample(), original = structuredClone(p);
  assert.deepEqual(enhancementErrors(p), []);
  assert.deepEqual(prepareEnhancements(p).signalFlow, p.signalFlow);
  assert.equal(selectCardModes(p, prepareEnhancements(p)).io, 'signal-flow');
  assert.deepEqual(p, original);
});
test('invalid flow references, missing evidence and invalid crosspoints fall back to connectors', () => {
  const mutations = [
    p => p.signalFlow.inputs[0].evidence = [],
    p => p.signalFlow.inputs[0].evidence[0].index = 9,
    p => p.io[0].verification = 'CONFLICTED',
    p => p.signalFlow.connections[0].to = 'absent',
    p => p.signalFlow.connections[0].to = 'in',
    p => p.signalFlow.outputs[0].id = 'in',
    p => p.signalFlow.processes[0].crosspoints.examples[0].output = 'absent',
    p => p.signalFlow.processes[0].crosspoints.inputs = ['out'],
    p => p.signalFlow.band = { label: 'invented' },
    p => p.signalFlow.inputs[0].group = 'absent',
    p => p.signalFlow.processes[0].kind = 'made-up',
    p => p.signalFlow.type = 'projector-display-input',
    p => p.signalFlow = { type: 'matrix', inputs: ['IN'], outputs: ['OUT'], notes: [] },
    p => p.signalFlow.connections = [],
    p => p.signalFlow.connections[1] = { ...p.signalFlow.connections[1], from: 'out', to: 'p', direction: 'both' },
    p => p.signalFlow.inputs[0].evidence = [{ kind: 'pdf', source: 'M', file: '../../secret.pdf', page: 1 }],
    p => p.signalFlow.inputs[0].evidence = [{ kind: 'pdf', source: 'unknown', file: 'docs/test.pdf', page: 1 }],
    p => p.signalFlow.inputs[0].evidence = [{ kind: 'pdf', source: 'M', file: 'docs/test.pdf', page: 0 }]
  ];
  for (const mutate of mutations) {
    const p = sample(); mutate(p);
    assert.ok(enhancementErrors(p).includes('Invalid optional detail field: signalFlow'), mutate.toString());
    assert.equal(prepareEnhancements(p).signalFlow, null);
    assert.equal(selectCardModes(p, prepareEnhancements(p)).io, 'io');
  }
});
test('matrix axis captions use explicit tags rather than invented port numbers', () => {
  const p=sample();p.signalFlow.outputs[0].tag='A';
  assert.deepEqual(enhancementErrors(p), []);
  p.signalFlow.outputs[0].tag='this tag is much too long';
  assert.ok(enhancementErrors(p).length);
});
test('matrix axes exactly cover primary endpoints and overlapping matrix combinations fall back', () => {
  for (const side of ['inputs','outputs']) {
    const p=fixtureProduct('matrix');p.signalFlow.processes[0].crosspoints[side].pop();p.signalFlow.processes[0].crosspoints.examples=[];
    assert.equal(prepareEnhancements(p).signalFlow,null,side+' omitted axis');
  }
});
test('unsupported multiple matrices fall back while ordinary stages remain supported',()=>{
  const p=fixtureProduct('matrix'),duplicate=structuredClone(p.signalFlow.processes[0]);duplicate.id='another-matrix';p.signalFlow.processes.push(duplicate);
  p.signalFlow.connections.push(...p.signalFlow.connections.map(e=>({...e,from:e.from==='p-0'?duplicate.id:e.from,to:e.to==='p-0'?duplicate.id:e.to})));
  assert.equal(prepareEnhancements(p).signalFlow,null,'two matrix blocks must not overlap');
  assert.ok(prepareEnhancements(fixtureProduct('extender')).signalFlow,'ordinary multiple stages remain supported');
});
test('display products retain connectors even if a valid flow is accidentally added', () => {
  for (const categories of [['Display','Projector'], ['프로젝터','대형 공간용 레이저 프로젝터'], ['Display','Interactive Display']]) {
    const p = { ...sample(), categories };
    assert.equal(prepareEnhancements(p).signalFlow, null);
  }
});
test('auxiliary paths and PDF references preserve direction and source pages', () => {
  const p = sample(), evidence = [{ kind: 'pdf', source: 'M', file: 'docs/test.pdf', page: 12 }];
  p.signalFlow.outputs.push({ id: 'audio', label: 'AUDIO OUT', signal: 'audio', evidence });
  p.signalFlow.auxiliary.push({ from: 'p', to: 'audio', signal: 'audio', label: '추출', evidence });
  p.signalFlow.band = { label: '대역', detail: '보조 표기', evidence };
  assert.deepEqual(enhancementErrors(p), []);
  p.signalFlow.auxiliary[0].direction = 'backwards';
  assert.ok(enhancementErrors(p).length);
});
test('every approved type has a valid semantic fixture and QMS keeps its explicit auxiliary branches', () => {
  assert.deepEqual(Object.keys(scenarios).sort(), [...flowTypes].sort());
  for(const type of flowTypes) assert.deepEqual(enhancementErrors(fixtureProduct(type)), [], type);
  const qms=qmsFixture();delete qms.portMap;
  assert.deepEqual(enhancementErrors(qms), []);
  assert.equal(qms.signalFlow.processes[0].crosspoints.inputs.length,8);
  assert.equal(qms.signalFlow.processes[0].crosspoints.outputs.length,8);
  assert.deepEqual(qms.signalFlow.auxiliary.map(e=>e.to),['out-9','out-10','audio']);
});

test('backward processing stages cannot silently draw forward arrows',()=>{const p=fixtureProduct('extender');const e=p.signalFlow.connections.find(e=>e.from==='p-0'&&e.to==='p-1');e.from='p-1';e.to='p-0';assert.equal(prepareEnhancements(p).signalFlow,null);});
