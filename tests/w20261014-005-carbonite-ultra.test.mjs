import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { GlobalWorkerOptions, getDocument } from '../beta/site/vendor/pdfjs/pdf.min.mjs';
import { uploadedDocumentsFor } from '../beta/site/detail/pdf-documents.mjs';
import { prepareEnhancements } from '../beta/site/detail/detail-enhancements.mjs';

GlobalWorkerOptions.workerSrc = new URL('../beta/site/vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
const root = new URL('../beta/site/', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const product = () => read('detail/data/carbonite-ultra.json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('Carbonite Ultra is catalogued as a Ross Video production switcher', () => {
  const rows = read('catalog.json').filter(row => row.slug === 'carbonite-ultra');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].brand, 'Ross Video');
  assert.equal(rows[0].product, 'Carbonite Ultra');
  assert.ok(rows[0].categories.includes('Production Switcher'));
  assert.ok(rows[0].official_links.includes('https://www.rossvideo.com/products/production-switchers/carbonite-ultra'));
  assert.equal(product().itemType, 'PRODUCT');
});

test('front and rear images identify this model and the rear Port Map follows printed groups', () => {
  const item = product();
  assert.deepEqual(item.images.map(image => image.role), ['Front', 'Rear']);
  for (const image of item.images) {
    assert.equal(image.provider, '사용자 제공');
    assert.equal(image.model, 'Carbonite Ultra');
    assert.equal(image.verificationStatus, 'VERIFIED');
    assert.equal(image.officialSource, false);
    assert.ok(existsSync(new URL(`detail/images/${image.file}`, root)));
  }
  const map = item.portMap;
  assert.equal(map.image, 'Rear');
  assert.deepEqual(map.measuredImage, { file: 'carbonite-ultra-rear.png', width: 1600, height: 800 });
  assert.deepEqual(map.items.map(row => row.label), [
    'PS1', 'PS2', 'EDITOR', 'LAN', 'TALLY', 'GPIO', 'LTC', 'AES 1', 'AES 2',
    'REF IN', 'REF OUT', 'MV OUTPUT IO-1–IO-2 · 1–2', 'OUTPUT 3–12', 'INPUT 1–24', 'UPGD', 'SD'
  ]);
  assert.deepEqual(map.items.filter(row => row.n === 10 || row.n === 11).map(row => [row.n, row.label, row.x1, row.x2]), [[10, 'REF IN', 292, 316], [11, 'REF OUT', 318, 343]]);
  assert.ok(map.items.every(row => /[가-힣]+$|[0-9–]+$|AES [12]$|REF (?:OUT|IN)$|PS[12] · 전원$|EDITOR$|LAN$|TALLY$|GPIO$|LTC$|UPGD$|SD$/.test(row.label)));
  assert.ok(prepareEnhancements(item).portMap);
  assert.ok(item.specifications.some(row => row.verification === 'CONFLICTED' && /사진.*매뉴얼|매뉴얼.*사진/.test(row.condition)));
});

test('the posted Ultra 9.2 manual PDF is uploaded and retains all 277 pages', async () => {
  const item = product();
  const manifest = read('docs/manifest.json');
  const docs = uploadedDocumentsFor('carbonite-ultra', manifest);
  assert.equal(docs.length, 1);
  assert.match(docs[0].title, /Ultra 9\.2 User Manual/);
  assert.equal(docs[0].action.kind, 'local');
  const bytes = readFileSync(new URL('manuals/carbonite-ultra-user-manual-v9-2.pdf', root));
  assert.equal(sha(bytes), '0527e3d4d02e60e634321ab7072505110510a35d7cc62f97ee1504340e319848');
  assert.equal(docs[0].action.file, '../manuals/carbonite-ultra-user-manual-v9-2.pdf');
  const pdf = await getDocument({ data: new Uint8Array(bytes), verbosity: 0 }).promise;
  try {
    assert.equal(pdf.numPages, 277);
    assert.match((await pdf.getMetadata()).info.Title, /Ultra 9\.2 User Manual/);
    const page = await pdf.getPage(175);
    const text = (await page.getTextContent()).items.map(item => item.str).join(' ');
    assert.match(text, /Note:.*port may appear different/i);
    assert.match(text, /MV OUT[\s\S]*OUT/);
  } finally { await pdf.destroy(); }
});
