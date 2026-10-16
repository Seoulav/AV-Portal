import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW13001Product, w13001Slugs } from './w13001-powersoft-history.mjs';
import { beforeW20261016_015B4Product } from './w20261016-015-b4-history.mjs';
import { prepareEnhancements } from '../prototype/brc-am7/detail-enhancements.mjs';

const baseline = JSON.parse(readFileSync(new URL('./fixtures/w13001-product-baseline-sha.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const read = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));

test('18 Powersoft rear maps use the correct variant and preserve unrelated fields', () => {
  assert.equal(w13001Slugs.size, 18);
  for (const slug of w13001Slugs) {
    const product = read(slug);
    const restored = beforeW13001Product(beforeW20261016_015B4Product(product, slug), slug);
    assert.equal(sha(restored), baseline[slug], `${slug}: historical product`);
    const map = prepareEnhancements(product).portMap;
    assert.ok(map, `${slug}: map rendered`);
    assert.deepEqual(map.items.map(item => item.n), map.items.map((_, index) => index + 1));
    const image = product.images.find(item => item.file === map.measuredImage.file);
    assert.ok(image, `${slug}: mapped image exists`);
    if (slug.endsWith('-dsp')) {
      assert.equal(image.role, 'Diagram');
      assert.ok(!map.items.some(item => /Dante/i.test(item.label)));
      assert.match(image.note, /2쪽/);
    } else assert.equal(image.role, 'Rear');
    const unrelated = structuredClone(product);
    unrelated.model += ' wrong';
    assert.equal(beforeW20261016_015B4Product(unrelated, slug).model, unrelated.model);
    const changed = structuredClone(product);
    changed.portMap.items[0].label += ' wrong';
    assert.throws(() => beforeW20261016_015B4Product(changed, slug), /non-layout Port Map change/);
  }
});
