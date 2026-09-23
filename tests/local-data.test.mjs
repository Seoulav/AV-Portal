import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../app/catalog.mjs';

test('local private list has 338 unique products and 342 linked source rows', async (t) => {
  const path = process.env.AV_PORTAL_PRODUCT_LIST_PATH;
  if (!path) return t.skip('Set AV_PORTAL_PRODUCT_LIST_PATH to run against the private list');
  const data = await loadCatalog(path);
  assert.equal(data.products.length, 338);
  assert.equal(new Set(data.products.map(p => p.id)).size, 338);
  assert.equal(data.products.flatMap(p => p.source_records).length, 342);
  assert.equal(data.products.filter(p => !p.brand).length, 4);
  assert.equal(data.products.filter(p => p.source_records.length > 1).length, 4);
});
