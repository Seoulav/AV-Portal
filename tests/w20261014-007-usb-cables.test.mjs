import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { GlobalWorkerOptions, getDocument } from '../beta/site/vendor/pdfjs/pdf.min.mjs';
import { uploadedDocumentsFor } from '../beta/site/detail/pdf-documents.mjs';

GlobalWorkerOptions.workerSrc = new URL('../beta/site/vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const catalog = read('beta/site/catalog.json');
const detailUrl = new URL('beta/site/detail/data/hdf-ccf.json', root);
const product = existsSync(detailUrl) ? JSON.parse(readFileSync(detailUrl, 'utf8')) : null;
const manifest = read('beta/site/docs/manifest.json');

test('HDF-CCF stays one manufacturer model with the requested technical facet and three length options', () => {
  const row = catalog.find(item => item.slug === 'hdf-ccf');
  assert.ok(row);
  assert.ok(product);
  assert.equal(row.brand, 'HDCVT');
  assert.deepEqual(row.categories, ['연결·전송', 'Connectivity', 'Cable', 'USB 3.2 Gen2 10Gbps']);
  assert.equal(catalog.filter(item => item.slug === 'hdf-ccf').length, 1);
  assert.equal(product.manufacturer, 'HDCVT');
  assert.equal(product.model, 'HDF-CCF');
  assert.deepEqual(product.specifications.find(item => item.name === '길이 옵션')?.value, '5m / 10m / 15m');
  const lengthPower = product.specifications.find(item => item.name === 'PD 충전 출력' && item.value.includes('5m: 90W'));
  assert.ok(lengthPower);
  assert.ok(lengthPower.value.includes('10m·15m: 85W'));
  const conflicts = product.specifications.filter(item => item.name === 'PD 충전 출력');
  assert.equal(conflicts.length, 2);
  assert.ok(conflicts.every(item => item.verification === 'CONFLICTED'));
  assert.ok(conflicts.some(item => item.value === '최대 100W'));
  assert.ok(conflicts.some(item => item.value === '5m: 90W / 10m·15m: 85W'));
});

test('HDF-CCF features preserve mode, direction, and distance facts in compact wording', async () => {
  assert.ok(product);
  const { endingType } = await import('../scripts/check-feature-wording.mjs');
  const texts = product.features.map(feature => feature.text);
  assert.ok(texts.some(text => text.includes('4 Lane DP 1.4') && text.includes('8K@60Hz')));
  assert.ok(texts.some(text => text.includes('2 Lane DP 1.4') && text.includes('10Gbps')));
  assert.ok(texts.some(text => text.includes('SOURCE') && text.includes('DISPLAY')));
  assert.ok(texts.some(text => text.includes('15m')));
  assert.ok(product.features.every(feature => endingType(feature.text) === null));
});

test('HDF-CCF manual upload is an unlocked, SHA-pinned seven-page document', async () => {
  const upload = manifest.uploads.find(item => item.slug === 'hdf-ccf' && item.file === 'manuals/hdf-ccf-user-manual-v1-1.pdf');
  assert.ok(upload);
  assert.match(upload.title, /^HDF-CCF .*V1\.1/);
  const target = new URL(`beta/site/${upload.file}`, root);
  assert.ok(existsSync(target));
  const bytes = readFileSync(target);
  assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-');
  assert.equal(bytes.length, 853678);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), 'c96e33cce303073b0c0106c3e61eb90d6f33a712e1f8c2a5e7bd41ee3229518f');
  assert.equal(upload.locked, undefined, 'unlock status is represented by omitting locked=true');
  const cards = uploadedDocumentsFor('hdf-ccf', manifest);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].action.kind, 'local');
  assert.equal(cards[0].action.file, '../manuals/hdf-ccf-user-manual-v1-1.pdf');
  const pdf = await getDocument({ data: new Uint8Array(bytes), verbosity: 0 }).promise;
  try {
    assert.equal(pdf.numPages, 7);
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const text = await page.getTextContent();
      assert.ok(text.items.length > 0, `page ${pageNumber} contains readable PDF content`);
    }
  } finally {
    await pdf.destroy();
  }
});

test('the Beluga Highwave Pro 8K 5M remains unregistered until exact-model official protocol evidence exists', () => {
  assert.equal(catalog.some(item => /벨루가|highwave.?pro/i.test(`${item.product} ${item.slug}`)), false);
});
