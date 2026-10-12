import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareEnhancements } from '../beta/site/detail/detail-enhancements.mjs';
import { beforeW06005Product, beforeW06005Raw } from './w06005-history.mjs';
import { beforeW12001Product, beforeW12001Raw } from './w12001-history.mjs';
import { beforeW12002Product } from './w12002-wording-history.mjs';
import { beforeW12005Raw, beforeW12005Product } from './w12005-history.mjs';

const approved = JSON.parse(readFileSync(new URL('../Work/기록/W-20261006-005-approved-maps.json', import.meta.url)));
const read = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url)));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const counts = {
  'srg-a40': 7, 'sx-1216-rti': 4, dm3: 10, 'rio1608-d3': 2,
  ulxd1: 2, 'mxcwapt-w': 1, 'slxd4d-plus': 6, 'slxd1-plus': 1,
  'ua844-swb': 6, ua845uwb: 7,
};

test('ten approved rear maps cover only photographed connectors and survive validation', () => {
  assert.deepEqual(Object.keys(approved).sort(), Object.keys(counts).sort());
  for (const [slug, count] of Object.entries(counts)) {
    const product = read(slug), map = product.portMap;
    assert.equal(map.image, 'Rear', slug);
    assert.equal(map.items.length, count, slug);
    assert.deepEqual(map.items.map(item => item.n), Array.from({ length: count }, (_, i) => i + 1), slug);
    assert.ok(prepareEnhancements(product).portMap, `${slug}: visible map`);
    const image = product.images.find(image => image.role === 'Rear');
    const [width, height] = image.resolution.split(/[x×]/).map(Number);
    assert.deepEqual(map.measuredImage, { file: image.file, width, height }, slug);
    assert.equal(hash(beforeW06005Product(beforeW12001Product(beforeW12002Product(beforeW12005Product(product,slug),slug), slug), slug)), approved[slug].coreSha, `${slug}: all other data stays fixed`);
  }
});

test('unseen connector rows are not assigned photograph numbers', () => {
  for (const slug of ['mxcw640', 'mxa925w-r']) {
    const product = read(slug);
    assert.equal(product.portMap, undefined, slug);
    assert.equal(prepareEnhancements(product).portMap, null, `${slug}: I/O fallback`);
  }
  const surge = read('sx-1216-rti').portMap;
  assert.equal(surge.items.filter(item => item.label.startsWith('OUTPUT')).length, 3);
  assert.deepEqual(surge.items.filter(item => item.label.startsWith('OUTPUT')).map(item => item.label),
    ['OUTPUT 1–4', 'OUTPUT 5–8', 'OUTPUT 9–10']);
  assert.equal(read('srg-a40').portMap.items.some(item => /GENLOCK|TC/.test(item.label)), false);
  assert.equal(read('rio1608-d3').portMap.items.some(item => /XLR|Phones/.test(item.label)), false);
});

test('historical inverse rejects marker edits and exposes unrelated current changes', () => {
  for (const slug of Object.keys(counts)) {
    const product = read(slug);
    const older = beforeW06005Raw(beforeW12001Raw(beforeW12005Raw(JSON.stringify(product, null, 2) + '\n', slug), slug), slug);
    const changedIo = structuredClone(product);
    changedIo.io = [];
    assert.deepEqual(beforeW06005Product(beforeW12001Product(beforeW12005Product(changedIo, slug), slug), slug).io, [], slug);
    assert.notEqual(beforeW06005Raw(beforeW12001Raw(beforeW12005Raw(JSON.stringify(changedIo, null, 2) + '\n', slug), slug), slug), older, slug);
    const changedMap = structuredClone(product);
    const marker = changedMap.portMap.items[0];
    if (marker.x1 === undefined) marker.y1 += 1;
    else marker.x1 += 1;
    assert.throws(() => beforeW06005Product(changedMap, slug), /unexpected W-005 portMap change/, slug);
  }
});
