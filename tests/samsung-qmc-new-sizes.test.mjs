import { beforeW009Catalog, beforeW009Uploads } from './w009-history.mjs';
import test from 'node:test';
import { withoutW011Uploads } from './w011-history.mjs';
import { withoutW13008Uploads } from './w13008-surgex-history.mjs';
import { withoutW13010Uploads } from './w13010-yamaha-history.mjs';
import { withoutXdmCommandGuideUpload } from './xdm-command-guide-history.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareEnhancements } from '../beta/site/detail/detail-enhancements.mjs';
import { beforeW12002Raw } from './w12002-wording-history.mjs';
import { beforeW013A2Raw } from './w013-a2-history.mjs';
import { beforeW1010Catalog } from './w1010-history.mjs';

const root = new URL('../', import.meta.url);
const file = path => readFileSync(new URL(path, root));
const json = path => JSON.parse(file(path));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const old = new Map([
  ['lh32qmcebgcxkr', '7c9f96cc201d763a4077682472eacf847790c17f7eb18164e33fe091c76df394'],
  ['lh43qmcebgcxkr', '2f7d8fc02ae6fade0e50c664ae1085befcc4f8e117b85988f974abe766c639ab'],
  ['lh55qmcebgcxkr', '541b0ee9e47e711a8f28999290ad445ad4874ea7b5f8a1439378d69dfb1a65b8'],
  ['lh65qmcebgcxkr', '33c21c49e07c19c9b048cfea6e951c27cccba446a629729869eca502e4a1e509'],
  ['lh85qmcebgcxkr', '7ba8f910eaf82f6c12a34fb9c2c54ef6a9df68928718c5ca2ee96ccca214c595'],
  ['lh98qmcebgcxkr', 'a013ba8606064d9c36d4c8e805542ff2e8b4d4f6cd4b5540cbc5092e54f4f28b'],
]);

test('QM50C and QM75C have their own specifications and a validated eleven-port manual map', () => {
  const catalog = beforeW1010Catalog(beforeW009Catalog(json('beta/site/catalog.json')));
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
  assert.equal(catalog.length, 274);
  assert.equal(catalog.filter(item => item.brand === 'Samsung').length, 35);
});

test('six established QMC records and published PDFs remain untouched', () => {
  // Git stores LF, while a Windows worktree may contain CRLF. Compare the
  // same Git text on both platforms without changing the approved baseline.
  for (const [slug, hash] of old) {
    const normalized = file(`beta/site/detail/data/${slug}.json`).toString('utf8').replace(/\r\n/g, '\n');
    assert.equal(sha(beforeW12002Raw(beforeW013A2Raw(normalized, slug),slug)), hash, slug);
  }
  const uploadsBeforeNewDocs = withoutXdmCommandGuideUpload(beforeW009Uploads(json('beta/site/docs/manifest.json').uploads));
  const uploads = withoutW011Uploads(withoutW13008Uploads(withoutW13010Uploads(uploadsBeforeNewDocs)));
  assert.equal(uploads.length, 128);
  assert.equal(uploads.filter(upload => upload.locked).length, 12);
});
