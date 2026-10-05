import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { beforeW006Raw, beforeW006Product, w006Slugs } from './w006-history.mjs';

const root = new URL('../', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const hotel = {
  hg55u800fnfxkr: ['190', '62.1', '1232.1 x 708.8 x 25.7', '13.9'],
  hg75u800fnfxkr: ['310', '79.5', '1676.7 x 960.3 x 26.6', '29.1'],
  hg85u800fnfxkr: ['340', '86.3', '1900.9 x 1086.1 x 26.9', '40.4'],
};
const business = {
  lh43behhlbfxkr: ['53.5', '110', '957.8 x 558.8 x 76.3', '6.5', '200 x 200'],
  lh50behhlbfxkr: ['62.1', '120', '1110.8 x 643.8 x 76.4', '8.4', '200 x 200'],
  lh55behhlbfxkr: ['67.9', '125', '1224.6 x 707.8 x 76.6', '9.9', '200 x 200'],
  lh65behhlbfxkr: ['81.3', '170', '1444.1 x 831.2 x 76.8', '14.1', '200 x 200'],
  lh75behhlbfxkr: ['94', '220', '1668.1 x 957.8 x 77.0', '21.6', '400 x 300'],
  lh85behhlbfxkr: ['106.6', '270', '1889.9 x 1083.5 x 77.0', '28.4', '400 x 300'],
};
const spec = (data, name) => data.specifications.find(row => row.name === name);
const sha = value => createHash('sha256').update(value).digest('hex');

test('six U800F and six BEHX-H products retain model-specific official values', async () => {
  const catalog = await read('beta/site/catalog.json');
  assert.equal(catalog.length, 265);
  assert.equal(catalog.filter(item => item.brand === 'Samsung').length, 33);
  for (const [slug, [max, typical, size, weight]] of Object.entries(hotel)) {
    const data = await read(`beta/site/detail/data/${slug}.json`);
    const card = catalog.find(item => item.slug === slug);
    assert.equal(data.model, slug.toUpperCase());
    assert.deepEqual(card.brandSort, { group: 'Hotel TV', order: 5, size: Number(slug.slice(2, 4)) });
    assert.equal(data.io.length, 13);
    assert.equal(data.io.find(row => row.connector === 'HDMI 입력').quantity, '3');
    assert.equal(data.portMap, undefined);
    assert.equal(spec(data, '소비전력(최대)').value, max);
    assert.equal(spec(data, '소비전력(일반/Typical)').value, typical);
    assert.equal(spec(data, '크기(스탠드 제외, 가로x높이x깊이)').value, size);
    assert.equal(spec(data, '중량(스탠드 제외)').value, weight);
    assert.equal(data.keyFacts.length, 4);
    assert.match(data.sources.find(source => source.code === 'M1').scope, new RegExp(slug.toUpperCase()));
    assert.match(data.sources.find(source => source.code === 'M1').scope, /HG43\/50\/55\/65\/75\/85 U800F/);
  }
  for (const [slug, [typical, on, size, weight, vesa]] of Object.entries(business)) {
    const data = await read(`beta/site/detail/data/${slug}.json`);
    const card = catalog.find(item => item.slug === slug);
    assert.equal(data.model, slug.toUpperCase());
    assert.deepEqual(card.brandSort, { group: 'Business TV', order: 6, size: Number(slug.slice(2, 4)) });
    assert.equal(data.io.length, 6);
    assert.equal(data.portMap, undefined);
    assert.equal(spec(data, '소비전력 (Typical)').value, typical);
    assert.equal(spec(data, '소비전력 (On Mode)').value, on);
    assert.equal(spec(data, '크기(제품, 가로x높이x깊이)').value, size);
    assert.equal(spec(data, '제품 무게').value, weight);
    const mount = spec(data, '벽걸이 규격(VESA)');
    assert.deepEqual([mount.value, mount.unit, mount.condition, mount.source, mount.verification], [vesa, 'mm', '나사 M8', 'IG', 'VERIFIED']);
    assert.equal(data.specifications.length, 22);
    assert.equal(data.keyFacts.length, 4);
    assert.equal(data.io.find(row => row.connector === 'RF 입력').quantity, '');
  }
});

test('the eight new products reuse only their applicable uploaded manuals', async () => {
  const manifest = await read('beta/site/docs/manifest.json');
  for (const slug of Object.keys(hotel)) {
    const files = manifest.uploads.filter(item => item.slug === slug).map(item => item.file);
    assert.deepEqual(files, ['manuals/samsung-hoteltv-hu8000f-hu7000f-manual-ko.pdf']);
  }
  for (const slug of Object.keys(business).filter(slug => slug !== 'lh43behhlbfxkr')) {
    const files = manifest.uploads.filter(item => item.slug === slug).map(item => item.file);
    assert.deepEqual(files, [
      'manuals/samsung-behx-h-quick-guide-ko.pdf',
      'manuals/samsung-behx-h-installation-guide-ko.pdf',
      'manuals/samsung-behx-h-common-manual-ko.pdf',
    ]);
  }
});

test('only the approved VESA row changes the existing 43-inch TV', async () => {
  const raw = await readFile(new URL('beta/site/detail/data/lh43behhlbfxkr.json', root), 'utf8');
  assert.equal(sha(beforeW006Raw(raw, 'lh43behhlbfxkr')), 'e2f4ad55c9d90b78bcfdf69c6be256ebbab5dc89278938a92873dff1caba466b');
  const current = JSON.parse(raw);
  assert.equal(beforeW006Product(current, 'lh43behhlbfxkr').specifications.length, 21);
  const changed = structuredClone(current);
  changed.specifications.find(row => row.name === '벽걸이 규격(VESA)').value = '999 x 999';
  assert.throws(() => beforeW006Product(changed, 'lh43behhlbfxkr'), /VESA row changed/);
  const unrelated = structuredClone(current);
  unrelated.io[0].quantity = '99';
  assert.equal(beforeW006Product(unrelated, 'lh43behhlbfxkr').io[0].quantity, '99');
});

test('the new photos are model-page linked series imagery; an unavailable image remains absent', async () => {
  for (const slug of w006Slugs) {
    const data = await read(`beta/site/detail/data/${slug}.json`);
    assert.equal(data.imageStatuses.find(row => row.role === 'Main').status, data.images.length ? 'FOUND' : 'MISSING');
    for (const image of data.images) {
      assert.equal(image.model, data.model);
      assert.match(image.note, /공식 제품 페이지 갤러리 연결/);
      assert.match(image.note, /개별 인치 실물 사진으로 단정하지 않음/);
      assert.equal(image.verificationStatus, 'FOUND');
    }
  }
  assert.deepEqual((await read('beta/site/detail/data/lh65behhlbfxkr.json')).images, []);
});
