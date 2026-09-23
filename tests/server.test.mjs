import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAppServer } from '../app/server.mjs';

test('serves the current local catalog and fixed static routes only', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'av-portal-server-'));
  const dataPath = join(dir, 'catalog.json');
  await writeFile(dataPath, JSON.stringify({
    as_of: '2026-09-23',
    counts: { catalog_entries: 1, source_item_rows: 1 },
    products: [{
      id: 'AVP-1', brand: null, product: 'DS-8S',
      categories: ['Audio'], aliases: [],
      official_sources: [], supplemental_sources: [], direct_evidence: [],
      source_records: [{ record_id: 'S01-R1', sheet: '오디오', row: 1 }]
    }]
  }));
  const server = createAppServer({ dataPath });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const api = await fetch(base + '/api/catalog');
  assert.equal(api.status, 200);
  assert.equal((await api.json()).products[0].product, 'DS-8S');
  assert.equal((await fetch(base + '/')).status, 200);
  assert.equal((await fetch(base + '/not-allowed')).status, 404);
});

test('reports missing input as a server error', async (t) => {
  const server = createAppServer({ dataPath: 'missing-catalog.json' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/catalog`);
  assert.equal(response.status, 500);
  assert.match((await response.json()).error, /목록 파일/);
});
