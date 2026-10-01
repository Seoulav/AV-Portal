import * as enhancementModel from '../prototype/brc-am7/detail-enhancements.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareEnhancements, selectCardModes, portMarkerPercent, enhancementErrors } from '../prototype/brc-am7/detail-enhancements.mjs';
import { prepareProductDetail } from '../prototype/brc-am7/product-detail-model.mjs';

test('legacy prototype content without imageStatuses retains safe record defaults', () => {
  const data = prepareProductDetail({ manufacturer: 'TEST', model: 'TEST' });
  assert.deepEqual(data.imageStatuses, []);
});

const base = { images: [{ role: 'Rear', file: 'rear.webp', originalSize: '200×100', resolution: '200×100' }], io: [{ connector: 'XLR' }] };
test('unverified original-to-published pixel conversion cannot create a port map', () => {
  const image = { role: 'Rear', file: 'rear.webp', originalSize: '2000×2000', resolution: '1800×1800' };
  const p = { ...base, images: [image], portMap: { image: 'Rear', items: [{ n: 1, label: 'XLR', desc: '', x1: 900, x2: 1100 }] } };
  assert.equal(prepareEnhancements(p).portMap, null);
  assert.ok(enhancementErrors(p).length);
  assert.equal(enhancementModel.portMapImageMatches(image, 1800, 1800), false);
  assert.equal(enhancementModel.portMapImageMatches(base.images[0], 200, 100), true);
  assert.equal(enhancementModel.portMapImageMatches(base.images[0], 180, 100), false);
  assert.equal(enhancementModel.portMapImageMatches(base.images[0], 200, 90), false);
  assert.equal(enhancementModel.portMapImageMatches({ role: 'Rear' }, 200, 100), false);
});
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


test('explicit published-image measurements preserve original metadata and reject mismatches', () => {
  const image = { role: 'Rear', file: 'rear.webp', originalSize: '3000x3000', resolution: '2000x291' };
  const measuredImage = { file: 'rear.webp', width: 2000, height: 291 };
  const p = { images: [image], portMap: { image: 'Rear', measuredImage, items: [{ n: 1, label: 'A', desc: 'Input', x1: 1800, x2: 1880, y: 60, side: 'top' }] } };
  assert.deepEqual(enhancementErrors(p), []);
  assert.ok(prepareEnhancements(p).portMap);
  assert.equal(enhancementModel.portMapImageMatches(image, 2000, 291, p.portMap), true);
  assert.equal(enhancementModel.portMapImageMatches(image, 1999, 291, p.portMap), false);
  for (const bad of [{ ...measuredImage, file: 'other.webp' }, { ...measuredImage, width: 3000 }, { ...measuredImage, height: 0 }, { ...measuredImage, extra: true }]) {
    assert.equal(prepareEnhancements({ ...p, portMap: { ...p.portMap, measuredImage: bad } }).portMap, null);
  }
  for (const y of [-1, 292, NaN, '60']) {
    assert.equal(prepareEnhancements({ ...p, portMap: { ...p.portMap, items: [{ ...p.portMap.items[0], y }] } }).portMap, null);
  }
  assert.equal(image.originalSize, '3000x3000');
});

test('map display width separates close marker numbers without changing pixel coordinates', () => {
  const map = {items: [{x1: 990, x2: 1000, side: 'top'}, {x1: 1050, x2: 1060, side: 'top'}]};
  const width = enhancementModel.portMapDisplayWidth(map, 2000, 291);
  assert.ok(width >= 1000 && width <= 2000);
  assert.equal(map.items[0].x1, 990);
});
