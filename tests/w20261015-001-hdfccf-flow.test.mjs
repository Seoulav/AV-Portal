import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { enhancementErrors, prepareEnhancements } from '../beta/site/detail/detail-enhancements.mjs';

const read = () => JSON.parse(readFileSync(new URL('../beta/site/detail/data/hdf-ccf.json', import.meta.url), 'utf8'));
const manual = { kind: 'pdf', source: 'M', file: 'manuals/hdf-ccf-user-manual-v1-1.pdf', page: 6 };

test('HDF-CCF has the two manual scenarios with forward signal and reverse PD', () => {
  const product = read();
  const flow = product.signalFlow;
  assert.equal(flow.type, 'extender');
  assert.equal(flow.layout, 'cable-scenarios');
  assert.deepEqual(flow.scenarios.map(s => s.id), ['direct', 'hub']);
  assert.deepEqual(flow.scenarios.map(s => s.mode), [
    '4-lane DP 1.4 + USB 2.0',
    '2-lane DP 1.4 + USB 3.2 10G'
  ]);
  assert.deepEqual(flow.scenarios.map(s => s.receiver), ['monitor', 'hub']);
  assert.ok(flow.scenarios[1].outputLabel.includes('HDMI'));
  assert.deepEqual(flow.scenarios.map(s => s.powerDirection), ['reverse', 'reverse']);
  for (const scenario of flow.scenarios) {
    assert.ok(scenario.evidence.some(ref => JSON.stringify(ref) === JSON.stringify(manual)));
    assert.ok(flow.inputs.some(n => n.id === scenario.source));
    assert.ok(flow.processes.some(n => n.id === scenario.cable));
    assert.ok(flow.outputs.some(n => n.id === scenario.sink));
    assert.ok(flow.connections.some(e => e.from === scenario.source && e.to === scenario.cable));
    assert.ok(flow.connections.some(e => e.from === scenario.cable && e.to === scenario.sink));
    assert.ok(!/\\d+\\s*W/i.test(scenario.powerLabel + scenario.cableLabel));
  }
  assert.match(flow.description, /외부 장비/);
  assert.match(flow.description, /고정 결선/);
  assert.deepEqual(enhancementErrors(product), []);
  assert.equal(prepareEnhancements(product).signalFlow, flow);
});

test('invalid scenario references or reverse power evidence hide the optional diagram', () => {
  for (const mutate of [
    f => { f.scenarios[0].source = 'invented'; },
    f => { f.scenarios[1].evidence = []; },
    f => { f.scenarios[0].powerDirection = 'forward'; },
    f => { f.scenarios[1].mode = ''; }
  ]) {
    const product = read();
    mutate(product.signalFlow);
    assert.ok(enhancementErrors(product).includes('Invalid optional detail field: signalFlow'));
  }
});
