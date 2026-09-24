import test from 'node:test';
import assert from 'node:assert/strict';
import { filterProducts, listFacets, safeHttpUrl, verificationLabel, prioritizeOfficialSources } from '../app/public/catalog-view.mjs';

const products = [
  { id: '1', brand: 'BSS Audio', product: 'BLU-101', aliases: ['AEC / Bluelink'], categories: ['오디오', 'Audio', 'DSP'] },
  { id: '2', brand: 'RTCOM', product: 'XDM-DPO100', aliases: [], categories: ['영상', 'Video', 'Matrix Module'] },
  { id: '3', brand: null, product: 'DS-8S', aliases: ['Speaker'], categories: ['오디오', 'Audio'] }
];

test('searches brand, product and aliases without changing source products', () => {
  assert.deepEqual(filterProducts(products, { query: 'bss' }).map(p => p.id), ['1']);
  assert.deepEqual(filterProducts(products, { query: 'dpo100' }).map(p => p.id), ['2']);
  assert.deepEqual(filterProducts(products, { query: 'bluelink' }).map(p => p.id), ['1']);
  assert.equal(products[0].categories.length, 3);
});

test('combines brand with any of several selected categories', () => {
  assert.deepEqual(filterProducts(products, { brand: 'RTCOM', categories: ['Audio', 'Video'] }).map(p => p.id), ['2']);
  assert.deepEqual(filterProducts(products, { categories: ['DSP', 'Video'] }).map(p => p.id), ['1', '2']);
  assert.deepEqual(filterProducts(products, { brand: '__unknown__' }).map(p => p.id), ['3']);
});

test('builds distinct category facets and a brand-missing option', () => {
  const facets = listFacets(products);
  assert.equal(facets.categories.find(x => x.name === 'Audio').count, 2);
  assert.equal(facets.brands.find(x => x.value === '__unknown__').count, 1);
});

test('accepts only external HTTPS links without credentials', () => {
  assert.equal(safeHttpUrl('https://example.com/path'), 'https://example.com/path');
  for (const value of ['javascript:alert(1)', 'http://example.com', '/relative', 'https://a:b@example.com']) {
    assert.equal(safeHttpUrl(value), null);
  }
});

test('does not turn inherited research into a verified claim', () => {
  assert.match(verificationLabel('INHERITED_RESEARCH'), /재확인/);
  assert.match(verificationLabel('OFFICIAL_SUPPORT_LISTING_2026-09-23_NOT_MANUFACTURER_PROOF'), /제조사 미확정/);
});

test('puts explicitly Korean manufacturer sources first without changing verification or original order', () => {
  const sources = [
    { url: 'https://example.com/en-a', language: 'en', verification: 'INHERITED_RESEARCH' },
    { url: 'https://example.com/unknown' },
    { url: 'https://example.com/ko-a', language: 'ko' },
    { url: 'https://example.com/ko-b', language: 'ko' }
  ];
  assert.deepEqual(prioritizeOfficialSources(sources).map(item => item.url), [
    'https://example.com/ko-a', 'https://example.com/ko-b',
    'https://example.com/en-a', 'https://example.com/unknown'
  ]);
  assert.equal(sources[0].url, 'https://example.com/en-a');
  assert.equal(prioritizeOfficialSources(sources)[2].verification, 'INHERITED_RESEARCH');
});
