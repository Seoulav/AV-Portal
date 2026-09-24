import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createGroup1Server, loadGroup1 } from '../prototype/group1/serve.mjs';

const packagesDir = process.env.AV_PORTAL_GROUP1_PACKAGES;
if (!packagesDir) throw new Error('AV_PORTAL_GROUP1_PACKAGES에 로컬 Group 1 패키지 폴더를 지정하세요.');
const expected = new Map([
  ['brc-am7', [8, 27, 14, 'READY FOR CODEX']],
  ['dm7', [8, 16, 15, 'READY WITH REVIEW FLAGS']],
  ['ki-pro-go2', [8, 16, 11, 'READY WITH REVIEW FLAGS']],
  ['pt-mz17k', [7, 13, 4, 'READY WITH REVIEW FLAGS']],
  ['rally-bar', [8, 16, 9, 'READY WITH REVIEW FLAGS']]
]);
const products = await loadGroup1(resolve(packagesDir));
assert.deepEqual([...products.keys()], [...expected.keys()]);
for (const [slug, [features, specs, io, status]] of expected) {
  const product = products.get(slug);
  assert.equal(product.features.length, features, `${slug} features`);
  assert.equal(product.specifications.length, specs, `${slug} specs`);
  assert.equal(product.io.length, io, `${slug} I/O`);
  assert.equal(product.packageStatus, status);
  assert.equal(product.documents.filter(item => ['User Manual', 'Independent Specification', 'Specification', 'Technical Document'].includes(item.type)).length, 4);
  assert.ok(product.specifications.every(item => item.group && item.verification));
  assert.ok(product.io.every(item => item.group && item.verification));
}
assert.deepEqual(products.get('brc-am7').images.map(item => item.role), ['Main', 'Front', 'Rear', 'Perspective']);
assert.equal(products.get('brc-am7').imageStatuses.find(item => item.role === 'Other').status, 'REVIEW REQUIRED');
assert.equal(products.get('pt-mz17k').imageStatuses.find(item => item.role === 'Rear').status, 'MISSING');
assert.equal(products.get('rally-bar').issues.some(item => item.status === 'CONFLICTED'), true);
const publicCatalog = JSON.parse(await readFile(new URL('../beta/site/catalog.json', import.meta.url), 'utf8'));
const server = await createGroup1Server({ packagesDir: resolve(packagesDir), imagesDir: process.env.AV_PORTAL_BRC_IMAGES });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const catalog = await (await fetch(base + '/catalog.json')).json();
  assert.equal(publicCatalog.length, 27);
  assert.equal(catalog.length, 27);
  assert.deepEqual(catalog, publicCatalog);
  assert.deepEqual(catalog.slice(25).map(item => item.product), ['Ki Pro GO2', 'PT-MZ17K']);
  for (const slug of expected.keys()) {
    const response = await fetch(base + `/detail/data/${slug}.json`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.model.toLowerCase().replaceAll(' ', '-'), slug);
    assert.ok(!JSON.stringify(data).includes(packagesDir));
  }
  assert.equal((await fetch(base + '/detail/data/missing.json')).status, 404);
  console.log('Group 1 local: five details, 25 preserved + two local Library entries, counts/states/links checked.');
} finally {
  await new Promise(resolve => server.close(resolve));
}
