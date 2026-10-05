import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {group1Images, cardImages} from '../beta/group1-images.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const slug = 'lh98qecedgcxkr';

test('discontinued LH98QEC is absent from every active Library artifact', () => {
  assert.equal(existsSync(new URL(`beta/site/detail/data/${slug}.json`, root)), false);
  assert.equal(existsSync(new URL(`beta/site/detail/images/${slug}-main.webp`, root)), false);

  const catalog = read('beta/site/catalog.json');
  assert.equal(catalog.length, 257);
  assert.equal(catalog.filter(item => item.brand === 'Samsung').length, 25);
  assert.equal(catalog.some(item => item.slug === slug), false);
  assert.equal(Object.hasOwn(group1Images, slug), false);
  assert.equal(Object.hasOwn(cardImages, slug), false);

  const snapshot = read('beta/public-snapshot.json');
  assert.equal(snapshot.catalog.count, 257);
  assert.equal(Object.keys(snapshot.details).length, 250);
  assert.equal(Object.hasOwn(snapshot.details, slug), false);
  assert.equal(readdirSync(new URL('beta/site/detail/data/', root)).filter(name => name.endsWith('.json')).length, 250);

  assert.equal(read('beta/site/search-index.json').items.some(item => item.slug === slug), false);
  assert.equal(readFileSync(new URL('beta/site/catalog.html', root), 'utf8').includes('LH98QECEDGCXKR'), false);
  assert.equal(readFileSync(new URL('beta/site/llms.txt', root), 'utf8').includes('LH98QECEDGCXKR'), false);
});
