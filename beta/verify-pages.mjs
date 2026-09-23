import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';

const site = new URL('./site/', import.meta.url);
const files = (await readdir(site)).sort();
assert.deepEqual(files, ['app.js', 'catalog.json', 'index.html', 'styles.css']);

const raw = await readFile(new URL('catalog.json', site));
const sha256 = createHash('sha256').update(raw).digest('hex').toUpperCase();
assert.equal(sha256, 'A0CC18F8AAA8F8DA8F495FD629DB5EE060EEB5B5F93008C79A0EFCF8F8A2DD26');

const catalog = JSON.parse(raw.toString('utf8'));
assert.equal(catalog.length, 25);
const allowed = ['brand', 'categories', 'kind', 'official_links', 'product'];
const identities = new Set();
for (const item of catalog) {
  assert.deepEqual(Object.keys(item).sort(), allowed);
  assert.equal(item.kind, 'equipment');
  assert.ok(typeof item.brand === 'string' && item.brand.trim());
  assert.ok(typeof item.product === 'string' && item.product.trim());
  assert.ok(Array.isArray(item.categories) && item.categories.length);
  assert.ok(item.categories.every(value => typeof value === 'string' && value.trim()));
  assert.ok(Array.isArray(item.official_links) && item.official_links.length);
  for (const link of item.official_links) {
    const url = new URL(link);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.username, '');
    assert.equal(url.password, '');
    assert.ok(!/\.pdf$/i.test(url.pathname));
  }
  const identity = `${item.brand}\0${item.product}`;
  assert.ok(!identities.has(identity), 'Duplicate public product');
  identities.add(identity);
}
console.log('Public Pages artifact: four files, 25 equipment items, five fields, expected snapshot.');
