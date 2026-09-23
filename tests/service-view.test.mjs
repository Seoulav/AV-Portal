import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAppServer } from '../app/server.mjs';

const item = (id, type, row) => ({
  id, brand: 'Brand', product: id, item_type: type, categories: ['영상'], aliases: [],
  official_sources: [], supplemental_sources: [], direct_evidence: [],
  source_records: [{ record_id: `ROW-${row}`, sheet: '영상', row }]
});

test('separates service records from equipment and preserves their IDs and source rows', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'av-service-'));
  const dataPath = join(dir, 'catalog.json');
  await writeFile(dataPath, JSON.stringify({
    as_of: '2026-09-23', counts: { catalog_entries: 3, source_item_rows: 3 },
    products: [item('EQ-1', 'PRODUCT', 1), item('AVP-0235', 'SERVICE', 142), item('AVP-0236', 'SERVICE', 143)]
  }));
  const server = createAppServer({ dataPath });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const equipment = await (await fetch(base + '/api/catalog')).json();
  assert.deepEqual(equipment.products.map(x => x.id), ['EQ-1']);
  assert.equal(equipment.counts.catalog_entries, 1);
  assert.equal(equipment.counts.services, 2);
  const services = await (await fetch(base + '/api/catalog?view=services')).json();
  assert.deepEqual(services.products.map(x => x.id), ['AVP-0235', 'AVP-0236']);
  assert.deepEqual(services.products.map(x => x.source_records[0].record_id), ['ROW-142', 'ROW-143']);
  assert.equal(services.counts.catalog_entries, 2);
  assert.equal(services.counts.total_entries, 3);
  assert.equal((await fetch(base + '/api/catalog?view=unknown')).status, 400);
});

test('private fields in a local catalog cannot enter public catalog responses', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'av-private-'));
  const dataPath = join(dir, 'catalog.json');
  await writeFile(dataPath, JSON.stringify({
    as_of: '2026-09-23', counts: { catalog_entries: 1, source_item_rows: 1 },
    products: [{ ...item('EQ-1', 'PRODUCT', 1), supplier: 'PRIVATE_SUPPLIER_SENTINEL', previous_note: 'PRIVATE_NOTE_SENTINEL',
      source_records: [{ record_id: 'ROW-1', sheet: '영상', row: 1, supplier: 'PRIVATE_NESTED_SENTINEL' }] }]
  }));
  const server = createAppServer({ dataPath });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/catalog`);
  const body = await response.text();
  assert.equal(body.includes('PRIVATE_SUPPLIER_SENTINEL'), false);
  assert.equal(body.includes('PRIVATE_NOTE_SENTINEL'), false);
  assert.equal(body.includes('PRIVATE_NESTED_SENTINEL'), false);
});
