import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadCatalog, validateCatalog } from '../app/catalog.mjs';

const product = (overrides = {}) => ({
  id: 'AVP-0001', brand: 'RTCOM', product: 'XDM-1',
  categories: ['영상', 'Video'], aliases: ['XDM One'],
  official_sources: [], supplemental_sources: [],
  direct_evidence: ['02_사양서.zip / XDM/'],
  source_records: [{ record_id: 'S01-R0001', sheet: '영상', row: 1 }],
  ...overrides
});
const catalog = (products) => ({
  as_of: '2026-09-23',
  counts: { catalog_entries: products.length, source_item_rows: products.flatMap(p => p.source_records).length },
  products
});

test('preserves one product with multiple categories and both original rows', () => {
  const item = product({ source_records: [
    { record_id: 'S01-R0001', sheet: '영상', row: 1 },
    { record_id: 'S01-R0002', sheet: '영상', row: 2 }
  ] });
  const data = validateCatalog(catalog([item]));
  assert.equal(data.products.length, 1);
  assert.deepEqual(data.products[0].categories, ['영상', 'Video']);
  assert.equal(data.products[0].source_records.length, 2);
});

test('rejects duplicate product IDs and source row IDs', () => {
  assert.throws(() => validateCatalog(catalog([product(), product({ product: 'XDM-2' })])), /중복 제품 ID/);
  assert.throws(() => validateCatalog(catalog([
    product(), product({ id: 'AVP-0002', source_records: [{ record_id: 'S01-R0001', sheet: '영상', row: 2 }] })
  ])), /중복 원본 행/);
});

test('rejects excluded products and wrong totals', () => {
  assert.throws(() => validateCatalog(catalog([product({ product: 'HS-88MX' })])), /제외 모델/);
  const bad = catalog([product()]);
  bad.counts.catalog_entries = 338;
  assert.throws(() => validateCatalog(bad), /제품 수/);
});

test('reads a catalog at the specified local path', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'av-portal-test-'));
  const path = join(dir, 'catalog.json');
  await writeFile(path, JSON.stringify(catalog([product()])));
  const data = await loadCatalog(path);
  assert.equal(data.products[0].product, 'XDM-1');
});

test('reports a malformed product rather than crashing on null input', () => {
  assert.throws(() => validateCatalog({ counts: { catalog_entries: 1, source_item_rows: 0 }, products: [null] }), /제품 항목 형식/);
});

test('rejects malformed nested categories and evidence sources', () => {
  assert.throws(() => validateCatalog(catalog([product({ categories: [null] })])), /카테고리/);
  assert.throws(() => validateCatalog(catalog([product({ official_sources: [null] })])), /출처/);
  assert.throws(() => validateCatalog(catalog([product({ aliases: [null] })])), /별칭/);
  assert.throws(() => validateCatalog(catalog([product({ direct_evidence: [null] })])), /직접 제공/);
});
