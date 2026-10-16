import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareEnhancements } from '../prototype/brc-am7/detail-enhancements.mjs';
import { beforeW20261015_011Product } from './w20261015-011-history.mjs';
import {beforeW16015Group5Product} from './w16015-group5-history.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const expected = {
  'varia-sl50': { file: 'varia-sl50-rear.webp', width: 2170, height: 3072, x1: 850, x2: 1165, y: 1620 },
  'varia-sl80': { file: 'varia-sl80-rear.webp', width: 4087, height: 3072, x1: 1810, x2: 2105, y: 1365 },
};

test('W-011 maps only the single RJ-45 physically visible in each exact SL Rear photo', () => {
  for (const [slug, coordinates] of Object.entries(expected)) {
    const product = beforeW16015Group5Product(read(`beta/site/detail/data/${slug}.json`),slug);
    const rear = product.images.find(image => image.role === 'Rear');
    assert.equal(rear.file, coordinates.file);
    assert.equal(rear.model, product.model);
    assert.equal(rear.resolution, `${coordinates.width}x${coordinates.height}`);
    assert.deepEqual(product.io.map(row => [row.connector, row.quantity]), [['RJ-45', '1']]);
    assert.deepEqual(product.portMap.measuredImage, { file: coordinates.file, width: coordinates.width, height: coordinates.height });
    assert.deepEqual(product.portMap.items, [{ n: 1, label: 'RJ-45 Ethernet', desc: 'Ethernet · PoE(802.3af)', x1: coordinates.x1, x2: coordinates.x2, y: coordinates.y, side: 'bottom' }]);
    assert.equal(prepareEnhancements(product).portMap.items.length, 1);
    const before = beforeW20261015_011Product(product, slug);
    assert.equal(before.portMap, undefined);
    assert.equal(before.io[0].connector, 'RJ-45');
  }
});

test('W-011 leaves Varia-100 and Varia-80 unmapped without visual verification of their QSG drawings', () => {
  for (const slug of ['varia-100', 'varia-80']) {
    const product = read(`beta/site/detail/data/${slug}.json`);
    assert.equal(product.portMap, undefined);
    assert.ok(product.images.find(image => image.role === 'Rear'));
  }
});
