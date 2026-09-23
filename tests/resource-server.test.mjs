import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAppServer } from '../app/server.mjs';

const product = (id, row) => ({
  id, brand: 'Maker', product: id, categories: ['Audio'], aliases: [],
  official_sources: [], supplemental_sources: [], direct_evidence: [],
  source_records: [{ record_id: 'ROW-' + row, sheet: 'Sheet', row }]
});

async function fixture(t, register) {
  const dir = await mkdtemp(join(tmpdir(), 'av-portal-resources-'));
  const dataPath = join(dir, 'catalog.json');
  const resourcePath = join(dir, 'private-register.json');
  await writeFile(dataPath, JSON.stringify({
    as_of: '2026-09-23', counts: { catalog_entries: 2, source_item_rows: 2 },
    products: [product('P1', 1), product('P2', 2)]
  }));
  if (register !== undefined) await writeFile(resourcePath, JSON.stringify(register));
  const start = async (path) => {
    const server = createAppServer({ dataPath, resourcePath: path });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    return 'http://127.0.0.1:' + server.address().port;
  };
  return { dataPath, resourcePath, start };
}

function register() {
  return {
    products: [
      { product_id: 'P1', resource_ids: ['R1'], folder: 'C:\\Users\\private' },
      { product_id: 'P2', resource_ids: ['R1'] }
    ],
    resources: [{
      resource_id: 'R1', title: 'Manual', kind: 'MANUAL', authority: 'OFFICIAL',
      url: 'https://example.com/manual', local_reference: '/home/private/manual.pdf',
      language: 'ko', revision: null, verification: 'CONTENT_VIEWED', checked_on: null
    }],
    product_resource_links: [
      { product_id: 'P1', resource_id: 'R1', applicability: 'EXACT_MODEL' },
      { product_id: 'P2', resource_id: 'R1', applicability: 'EXACT_MODEL' }
    ]
  };
}

test('resource endpoint distinguishes absent configuration, empty known product and unknown ID', async t => {
  const { resourcePath, start } = await fixture(t, register());
  const unconfigured = await start(undefined);
  const absent = await fetch(unconfigured + '/api/products/P1/resources');
  assert.equal(absent.status, 200);
  assert.deepEqual(await absent.json(), { status: 'not_configured', product_id: 'P1', resources: [] });
  assert.equal((await fetch(unconfigured + '/api/products/unknown/resources')).status, 404);

  const data = register();
  data.products[1].resource_ids = [];
  data.product_resource_links.pop();
  const configured = await fixture(t, data);
  const available = await configured.start(configured.resourcePath);
  const empty = await fetch(available + '/api/products/P2/resources');
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), { status: 'available', product_id: 'P2', resources: [] });
  assert.equal((await fetch(available + '/api/products/P1/resources')).status, 200);
  assert.equal((await fetch(available + '/api/catalog')).status, 200);
  assert.equal((await fetch(available + '/api/products/P1/resources', { method: 'POST' })).status, 405);
  assert.equal((await fetch(available + '/api/products/P1/resources/extra')).status, 404);
  assert.ok(resourcePath);
});

test('resource endpoint returns only public fields and keeps a shared document on each product', async t => {
  const { resourcePath, start } = await fixture(t, register());
  const base = await start(resourcePath);
  for (const id of ['P1', 'P2']) {
    const response = await fetch(base + '/api/products/' + id + '/resources');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'available');
    assert.equal(body.resources.length, 1);
    assert.equal(body.resources[0].resource_id, 'R1');
    assert.equal(body.resources[0].url, 'https://example.com/manual');
    assert.doesNotMatch(JSON.stringify(body), /private|folder|local_reference|resourcePath/i);
  }
});

test('missing, malformed and relationally invalid registers stay isolated from catalog', async t => {
  const { resourcePath, start } = await fixture(t, undefined);
  const base = await start(resourcePath);
  let response = await fetch(base + '/api/products/P1/resources');
  assert.equal(response.status, 500);
  assert.equal((await response.json()).status, 'unavailable');
  assert.equal((await fetch(base + '/api/catalog')).status, 200);

  await writeFile(resourcePath, '{broken json');
  response = await fetch(base + '/api/products/P1/resources');
  assert.equal(response.status, 500);
  assert.doesNotMatch(JSON.stringify(await response.json()), /private-register|\\Users|\/home/i);

  const bad = register();
  bad.product_resource_links[0].resource_id = 'MISSING';
  await writeFile(resourcePath, JSON.stringify(bad));
  response = await fetch(base + '/api/products/P1/resources');
  assert.equal(response.status, 500);
  assert.equal((await response.json()).status, 'unavailable');
  assert.equal((await fetch(base + '/api/catalog')).status, 200);
});
