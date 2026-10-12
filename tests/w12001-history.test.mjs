import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW12001Product, beforeW12001Raw } from './w12001-history.mjs';
import { beforeW12003Product } from './w12003-kiprogo2-history.mjs';

const records = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-001-prior-coords.json', import.meta.url), 'utf8'));
const directory = new URL('../beta/site/detail/data/', import.meta.url);
const fields = ['x1', 'x2', 'y', 'y1', 'y2', 'x'];
const coords = product => (product.portMap?.items ?? []).map(item =>
  Object.fromEntries([['n', item.n], ...fields.filter(field => Object.hasOwn(item, field)).map(field => [field, item[field]])]));
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('W-001 coordinate history restores exactly the recorded markers', () => {
  assert.equal(Object.keys(records).length, 39);
  let changedMarkers = 0;
  for (const [slug, record] of Object.entries(records)) {
    const current = beforeW12003Product(JSON.parse(readFileSync(new URL(`${slug}.json`, directory), 'utf8')), slug);
    const restored = beforeW12001Product(current, slug);
    const now = coords(current);
    assert.equal(sha(now), record.approved, slug);
    assert.deepEqual(coords(restored), record.prior.items, slug);
    changedMarkers += now.filter((item, index) => JSON.stringify(item) !== JSON.stringify(record.prior.items[index])).length;
    const originalNonCoordinates = structuredClone(current);
    const restoredNonCoordinates = structuredClone(restored);
    for (const product of [originalNonCoordinates, restoredNonCoordinates]) {
      for (const item of product.portMap.items) for (const field of fields) delete item[field];
    }
    assert.deepEqual(restoredNonCoordinates, originalNonCoordinates, `${slug}: unrelated fields`);
    const edited = structuredClone(current);
    const field = fields.find(key => Object.hasOwn(edited.portMap.items[0], key));
    edited.portMap.items[0][field] += 1;
    assert.throws(() => beforeW12001Product(edited, slug), /unexpected W-001 coordinate change/);
  }
  assert.equal(changedMarkers, 263);
});

test('W-001 history passes through products without a coordinate record', () => {
  for (const name of readdirSync(directory).filter(name => name.endsWith('.json'))) {
    const slug = name.slice(0, -5);
    if (records[slug]) continue;
    const raw = readFileSync(new URL(name, directory), 'utf8');
    assert.equal(beforeW12001Raw(raw, slug), raw, slug);
    const product = JSON.parse(raw);
    assert.strictEqual(beforeW12001Product(product, slug), product, slug);
  }
});
