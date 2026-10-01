import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareEnhancements, selectCardModes, portMarkerPercent, enhancementErrors } from '../prototype/brc-am7/detail-enhancements.mjs';

const base = { images: [{ role: 'Rear', file: 'rear.webp' }], io: [{ connector: 'XLR' }] };
test('optional cards fall back without changing original data', () => {
  const original = structuredClone(base);
  assert.deepEqual(selectCardModes(base, prepareEnhancements(base)), { gallery: 'gallery', io: 'io' });
  assert.deepEqual(selectCardModes({}, prepareEnhancements({})), { gallery: null, io: null });
  assert.deepEqual(prepareEnhancements({ keyFacts: [{ label: 'A', value: '2', unit: '개' }] }).keyFacts, []);
  assert.deepEqual(base, original);
});
test('port map validates roles, measured spans and unique positive numbers', () => {
  const p = { ...base, portMap: { image: 'Rear', items: [{ n: 1, label: 'XLR', desc: 'Input', x1: 20, x2: 60 }] } };
  assert.equal(selectCardModes(p, prepareEnhancements(p)).gallery, 'port-map');
  assert.equal(prepareEnhancements({ ...p, images: [] }).portMap, null);
  for (const patch of [{ n: 0 }, { x1: NaN }, { x1: '20' }, { x2: 10 }]) {
    const bad = { ...p, portMap: { ...p.portMap, items: [{ ...p.portMap.items[0], ...patch }] } };
    assert.ok(enhancementErrors(bad).length);
    assert.equal(prepareEnhancements(bad).portMap, null);
  }
  assert.ok(enhancementErrors({ ...p, portMap: { ...p.portMap, items: [...p.portMap.items, ...p.portMap.items] } }).length);
  assert.deepEqual(portMarkerPercent(p.portMap.items[0], 200), { left: 10, width: 20 });
  for (const width of [0, -1, NaN, 30]) assert.equal(portMarkerPercent(p.portMap.items[0], width), null);
});
test('six signal flow types require real input and output labels', () => {
  for (const type of ['distribution', 'matrix', 'switcher', 'extender', 'amplifier-channel', 'projector-display-input']) {
    const p = { ...base, signalFlow: { type, inputs: ['IN'], outputs: ['OUT'], notes: ['조건'] } };
    assert.equal(selectCardModes(p, prepareEnhancements(p)).io, 'signal-flow');
  }
  for (const flow of [{ type: 'unknown', inputs: ['IN'], outputs: ['OUT'], notes: [] }, { type: 'matrix', inputs: [], outputs: ['OUT'], notes: [] }]) {
    assert.equal(prepareEnhancements({ signalFlow: flow }).signalFlow, null);
    assert.ok(enhancementErrors({ signalFlow: flow }).length);
  }
});
test('settings and key facts reject malformed public data but safely omit in UI', () => {
  const table = { kind: 'edid', title: 'EDID', columns: ['모드', '값'], rows: [['1', '자동']] };
  const modes = { kind: 'modes', title: '모드', items: [{ name: 'Mode', summary: 'Summary', detail: 'Detail' }] };
  const p = { settings: [table, modes], keyFacts: [{ label: 'IN', value: '4', unit: '개' }, { label: 'OUT', value: '2', unit: '개' }] };
  const original = structuredClone(p);
  assert.deepEqual(enhancementErrors(p), []);
  assert.equal(prepareEnhancements(p).settings.length, 2);
  assert.deepEqual(p, original);
  for (const bad of [{ settings: [table, table, table] }, { settings: [{ ...table, rows: [] }] }, { settings: [{ ...table, rows: [['x']] }] }, { settings: [{ ...modes, items: [{ name: 'a' }] }] }, { keyFacts: Array(5).fill(p.keyFacts[0]) }]) assert.ok(enhancementErrors(bad).length);
  assert.equal(prepareEnhancements({ settings: [{ ...table, rows: [] }] }).settings.length, 0);
});
