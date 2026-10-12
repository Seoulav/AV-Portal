import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isAllowedHttpOfficialPage } from '../beta/manufacturer-hosts.mjs';
import { uploadedDocumentsFor } from '../beta/site/detail/pdf-documents.mjs';

const root = new URL('../', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const official = 'http://www.vsent.co.kr/bbs/board.php?bo_table=c4&wr_id=14';

test('DS-8S is one VS ENT product with only the exact official HTTP exception', async () => {
  const [catalog, product] = await Promise.all([
    read('beta/site/catalog.json'), read('beta/site/detail/data/ds-8s.json')
  ]);
  assert.equal(catalog.filter(item => item.slug === 'ds-8s').length, 1);
  assert.equal(product.model, 'DS-8S');
  assert.equal(product.manufacturer, 'VS ENT');
  assert.deepEqual(catalog.find(item => item.slug === 'ds-8s').official_links, [official]);
  assert.equal(isAllowedHttpOfficialPage(official), true);
  for (const other of [official.replace('wr_id=14', 'wr_id=15'), 'http://example.com/', 'https://www.vsent.co.kr/'])
    assert.equal(isAllowedHttpOfficialPage(other), false);
});

test('DS-8S keeps the 2200W/2500W source conflict and only leaflet-supported I/O', async () => {
  const product = await read('beta/site/detail/data/ds-8s.json');
  assert.equal(product.packageStatus, 'CONFLICTED');
  const output = product.specifications.find(row => row.name === 'AC 출력');
  assert.equal(output.verification, 'CONFLICTED');
  assert.match(output.condition, /2200W.*2500W/);
  assert.deepEqual(product.io.map(row => row.connector), [
    '연동 AC 아울렛', '비연동 AC 아울렛', 'DC 출력', 'RJ-45 JACK', 'REMOTE 접점', '모니터 단자'
  ]);
  assert.deepEqual(product.io.slice(0, 3).map(row => row.quantity), ['8', '1', '1']);
  assert.ok(product.io.slice(3).every(row => row.quantity === ''));
  assert.equal(product.portMap, undefined);
});

test('DS-8S uploads are viewable/downloadable and the twelve locked entries remain locked', async () => {
  const manifest = await read('beta/site/docs/manifest.json');
  const docs = uploadedDocumentsFor('ds-8s', manifest);
  assert.equal(docs.length, 2);
  assert.ok(docs.every(doc => doc.action.kind === 'local' && doc.action.locked === undefined));
  assert.equal(manifest.uploads.filter(item => item.locked === true).length, 12);
  for (const doc of docs) {
    const bytes = await readFile(new URL(`beta/site/${doc.action.file.replace('../', '')}`, root));
    assert.equal(bytes.subarray(0, 4).toString(), '%PDF');
  }
});
