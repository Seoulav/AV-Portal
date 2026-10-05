import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { filterCatalog } from '../beta/site/app.js';

const catalog = JSON.parse(await readFile(new URL('../beta/site/catalog.json', import.meta.url), 'utf8'));
const slugs = items => items.map(item => item.slug);
const legacySort = (items, state) => [...items].filter(item =>
  item.kind === 'equipment' && (!state.brand || item.brand === state.brand)
).sort((a, b) => a.brand.localeCompare(b.brand, 'ko') || a.product.localeCompare(b.product, 'ko'));

test('Samsung brand order follows catalog groups and increasing size, with Business TV slot reserved', () => {
  const expected = [
    ['QHF', ['lh115qhfebgxkr']],
    ['QHC', ['lh43qhcebgcxkr', 'lh55qhcebgcxkr', 'lh65qhcebgcxkr', 'lh75qhcebgcxkr']],
    ['QMC', ['lh32qmcebgcxkr', 'lh43qmcebgcxkr', 'lh55qmcebgcxkr', 'lh65qmcebgcxkr', 'lh85qmcebgcxkr', 'lh98qmcebgcxkr']],
    ['Video Wall', ['lh55vhcrbgbxkr', 'lh55vmcrbgbxkr']],
    ['Hotel TV', ['hg43u800fnfxkr', 'hg50u800fnfxkr', 'hg55u800fnfxkr', 'hg65u800fnfxkr', 'hg75u800fnfxkr', 'hg85u800fnfxkr']],
    ['Business TV', ['lh43behhlbfxkr', 'lh50behhlbfxkr', 'lh55behhlbfxkr', 'lh65behhlbfxkr', 'lh75behhlbfxkr', 'lh85behhlbfxkr']],
    ['Whiteboard', ['lh55wmfwbgcxkr', 'lh75wmfwlgcxkr']],
    ['LED Signage', ['mp008f', 'mp012f', 'ie015a-e', 'if015r-m', 'mp016f', 'ie020a-e']]
  ];
  const samsung = catalog.filter(item => item.brand === 'Samsung');
  assert.equal(samsung.length, 33);
  assert.deepEqual(slugs(filterCatalog(catalog, { brand: 'Samsung', sort: 'brand' })), expected.flatMap(([, group]) => group));
  for (const [index, [group, names]] of expected.entries()) {
    for (const slug of names) {
      const item = samsung.find(entry => entry.slug === slug);
      assert.deepEqual(item.brandSort?.group, group);
      assert.equal(item.brandSort?.order, index + 1);
      assert.ok(Number.isFinite(item.brandSort?.size));
    }
  }
  const future = { ...samsung[0], slug: 'future-business-tv', product: 'FUTURE BUSINESS TV', brandSort: { group: 'Business TV', order: 6, size: 90 } };
  const withFuture = slugs(filterCatalog([...catalog, future], { brand: 'Samsung', sort: 'brand' }));
  assert.equal(withFuture.indexOf('future-business-tv'), withFuture.indexOf('lh85behhlbfxkr') + 1);
  assert.equal(withFuture[withFuture.indexOf('future-business-tv') + 1], 'lh55wmfwbgcxkr');
});

test('all other catalog products keep their complete previous brand order', () => {
  const others = catalog.filter(item => item.brand !== 'Samsung');
  assert.equal(others.length, 232);
  assert.ok(others.every(item => !item.brandSort));
  assert.deepEqual(slugs(filterCatalog(others, { sort: 'brand' })), slugs(legacySort(others, {})));
  for (const brand of new Set(others.map(item => item.brand))) {
    assert.deepEqual(slugs(filterCatalog(catalog, { brand, sort: 'brand' })), slugs(legacySort(others, { brand })), brand);
  }
});

test('product and relevance ordering, categories, and matching remain unchanged', () => {
  const withoutOrder = catalog.map(({ brandSort, ...item }) => item);
  for (const state of [{ sort: 'product' }, { sort: 'relevance' }, { sort: 'relevance', query: 'QMC' }, { sort: 'product', categories: ['Digital Signage'] }]) {
    assert.deepEqual(slugs(filterCatalog(catalog, state)), slugs(filterCatalog(withoutOrder, state)), JSON.stringify(state));
  }
  assert.deepEqual(catalog.map(item => item.categories), withoutOrder.map(item => item.categories));
});
