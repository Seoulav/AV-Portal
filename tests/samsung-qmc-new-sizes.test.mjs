import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareEnhancements } from '../beta/site/detail/detail-enhancements.mjs';

const root = new URL('../', import.meta.url);
const file = path => readFileSync(new URL(path, root));
const json = path => JSON.parse(file(path));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const old = new Map([
  ['lh32qmcebgcxkr', '8c5cf0f9dc114692262e157f347efd7a93f9ccf513a2a3a2c4357a358c1b0218'],
  ['lh43qmcebgcxkr', 'c3cd448b9060388db60b2932a97091d992a8392b074757f3ab6b25b629175cfe'],
  ['lh55qmcebgcxkr', '541b0ee9e47e711a8f28999290ad445ad4874ea7b5f8a1439378d69dfb1a65b8'],
  ['lh65qmcebgcxkr', '33c21c49e07c19c9b048cfea6e951c27cccba446a629729869eca502e4a1e509'],
  ['lh85qmcebgcxkr', '7c804665cea113e7a34caa5e468a80fc5fa33ba8c74c058f5cc3220c2b919f9e'],
  ['lh98qmcebgcxkr', '1247c49d1f2ba3f5b8339c0dae5ea11ffd4cd0180615a7d12cfe9da7a869741b'],
]);

test('QM50C and QM75C have their own specifications and a validated eleven-port manual map', () => {
  const catalog = json('beta/site/catalog.json');
  const expected = [
    [50, '10', '0.285x0.285', '1124.1 x 644.8 x 28.5', '11.8'],
    [75, '8', '0.429x0.429', '1682.3 x 960.4 x 28.5', '33.4'],
  ];
  const reference = json('beta/site/detail/data/lh55qmcebgcxkr.json').portMap;
  for (const [size, response, pitch, dimensions, mass] of expected) {
    const slug = `lh${size}qmcebgcxkr`;
    const product = json(`beta/site/detail/data/${slug}.json`);
    assert.equal(product.model, slug.toUpperCase());
    assert.equal(product.specifications.find(row => row.name === '응답 속도')?.value, response);
    assert.equal(product.specifications.find(row => row.name === '픽셀 피치(HxV)')?.value, pitch);
    assert.equal(product.specifications.find(row => row.name === '크기(가로x높이x깊이)')?.value, dimensions);
    assert.equal(product.specifications.find(row => row.name === '중량')?.value, mass);
    assert.equal(product.io.length, 9);
    assert.deepEqual(product.io.slice(0, 3).map(row => row.quantity), ['3', '1', '2']);
    assert.equal(product.images.length, 2);
    assert.deepEqual(product.images.map(image => image.role), ['Main', 'Diagram']);
    assert.equal(product.portMap.image, 'Diagram');
    assert.equal(product.portMap.items.length, 11);
    assert.deepEqual(product.portMap.items, reference.items);
    assert.deepEqual(product.portMap.measuredImage, {file: `${slug}-diagram.webp`, width: 290, height: 1420});
    assert.ok(prepareEnhancements(product).portMap);
    assert.deepEqual(catalog.find(item => item.slug === slug), {
      brand: 'Samsung', product: slug.toUpperCase(),
      categories: ['사이니지', 'Display', 'Digital Signage'], kind: 'equipment',
      official_links: [`https://www.samsung.com/sec/business/smart-signage/qmc-series/${slug.toUpperCase()}/`],
      slug, card_image: `${slug}-main.webp`, brandSort: {group:'QMC', order:3, size}
    });
    assert.equal(sha(file(`beta/site/detail/images/${slug}-diagram.webp`)), sha(file('beta/site/detail/images/lh55qmcebgcxkr-diagram.webp')));
  }
  assert.equal(catalog.length, 267);
  assert.equal(catalog.filter(item => item.brand === 'Samsung').length, 35);
});

test('six established QMC records and published PDFs remain untouched', () => {
  for (const [slug, hash] of old) assert.equal(sha(file(`beta/site/detail/data/${slug}.json`)), hash, slug);
  const uploads = json('beta/site/docs/manifest.json').uploads;
  assert.equal(uploads.length, 128);
  assert.equal(uploads.filter(upload => upload.locked).length, 12);
});
