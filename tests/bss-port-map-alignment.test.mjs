import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const products = new URL('../beta/site/detail/data/', import.meta.url);
const read = slug => JSON.parse(readFileSync(new URL(`${slug}.json`, products), 'utf8'));
const images = new URL('../beta/site/detail/images/', import.meta.url);
const imageHashes = {
  'blu-100': '6f9e5d1bfe98f1ec5b846af1657b58d987a09c01e057b8d27617f7480a2353c3',
  'blu-101': 'dddec58e5888c11f15598cc3b12b3f6ba960c0bb40342b5918f9dc1505ebf31a',
  'blu-160': '3c8afc9cedab6c55797437dc07937bcdd0ed8bdab9707c8ec79887241b9f3122',
  'blu-50v2': 'a7a02e2a291c7ad4122e987969c875802bdcc2cb5d67274fec7718b6272a21bd',
  'blu-dan': 'd37b07e1e3633e1cd5d54cedf5a54fab2e1dca2c591984e80e7b186b9bd73748',
};

// Physical Phoenix connector color bounds measured on the published Rear
// WebPs, at their natural pixel sizes. A bracket may differ by at most 12 px
// to allow the dark terminal housing around the colored connector.
const bounds = {
  'blu-100': {
    1: [3559, 3947], 2: [3150, 3540], 3: [2740, 3131],
    4: [2306, 2699], 5: [1896, 2288],
  },
  'blu-101': {
    1: [3638, 4050], 2: [3207, 3618], 3: [2778, 3187],
    4: [2327, 2737], 5: [1897, 2306],
  },
  'blu-160': {
    1: [3259, 3916], 2: [2463, 3119],
    3: [3259, 3917], 4: [2462, 3119],
  },
  'blu-50v2': {
    1: [1842, 1941], 2: [1743, 1841], 3: [1644, 1742], 4: [1545, 1643],
    5: [1420, 1518], 6: [1321, 1419], 7: [1221, 1320], 8: [1120, 1220],
  },
};

test('BSS rear-map brackets cover the physical connector bank or channel they name', () => {
  for (const [slug, markers] of Object.entries(bounds)) {
    const map = read(slug).portMap;
    assert.equal(map.image, 'Rear', slug);
    for (const [number, [left, right]] of Object.entries(markers)) {
      const item = map.items.find(marker => marker.n === Number(number));
      assert.ok(item, `${slug} #${number}`);
      assert.ok(Math.abs(item.x1 - left) <= 12, `${slug} #${number}: left ${item.x1} vs ${left}`);
      assert.ok(Math.abs(item.x2 - right) <= 12, `${slug} #${number}: right ${item.x2} vs ${right}`);
    }
  }
});

test('the five measured Rear photos stay byte-for-byte unchanged', () => {
  for (const [slug, expected] of Object.entries(imageHashes)) {
    const bytes = readFileSync(new URL(`${slug}-rear.webp`, images));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, slug);
  }
});

test('all five BSS products preserve every field except marker horizontal coordinates', () => {
  const hash = createHash('sha256');
  for (const slug of Object.keys(imageHashes)) {
    const product = read(slug);
    for (const marker of product.portMap.items) {
      delete marker.x1;
      delete marker.x2;
    }
    hash.update(slug).update(JSON.stringify(product));
  }
  assert.equal(hash.digest('hex'), '54827e0fa2341c6a63af9ad41562f8379ec3bfcc55a90484295f7dc3b14ffdfa');
});

test('BSS products without a Rear photo still have no inferred Port Map', () => {
  for (const slug of ['blu-aec-in', 'blucard-in', 'blucard-out', 'ec-4bv']) {
    const product = read(slug);
    assert.ok(!product.images.some(image => image.role === 'Rear'), slug);
    assert.ok(!Object.hasOwn(product, 'portMap'), slug);
  }
});
