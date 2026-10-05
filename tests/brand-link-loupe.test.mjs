import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const catalog = JSON.parse(read('beta/site/catalog.json'));

test('detail manufacturer links use the catalog brand for every AV product', async () => {
  const { brandForProduct, brandListingHref } = await import('../beta/site/shared/brand-links.mjs');
  const brands = new Set(catalog.map(item => item.brand));
  for (const item of catalog.filter(item => item.slug)) {
    const detail = JSON.parse(read(`beta/site/detail/data/${item.slug}.json`));
    const brand = brandForProduct(catalog, item.slug, detail.manufacturer);
    assert.equal(brand, item.brand, item.slug);
    assert.ok(brands.has(brand), item.slug);
    const url = new URL(brandListingHref(brand), 'https://example.test/detail/');
    assert.equal(url.searchParams.get('brand'), item.brand, item.slug);
    assert.equal(url.searchParams.get('sort'), 'brand', item.slug);
    assert.ok(catalog.some(product => product.brand === url.searchParams.get('brand')));
  }
  assert.equal(brandListingHref('BSS Audio'), '../?brand=BSS+Audio&sort=brand');
  assert.equal(new URL(brandListingHref('BSS Audio', '../../beta/site/'), 'https://example.test/AV-Portal/prototype/brc-am7/').pathname, '/AV-Portal/beta/site/');
  assert.equal(brandForProduct(catalog, 'brc-am7', 'SONY'), 'Sony');
});

test('manufacturer links are present in breadcrumb, subtitle, and manufacturer card', () => {
  for (const prefix of ['beta/site/detail', 'prototype/brc-am7']) {
    const html = read(`${prefix}/index.html`);
    const js = read(`${prefix}/app.js`);
    assert.match(html, /<a id="breadcrumb-brand"/);
    assert.match(html, /<a id="footer-manufacturer"/);
    assert.match(js, /brandListingHref\(brand/);
    assert.match(js, /subtitle-brand/);
    assert.doesNotMatch(html, /<a id="footer-product"|<a id="dialog-product"/);
  }
});

test('loupe uses the same 216px diameter in JS and CSS while keeping 3x dialog zoom', () => {
  for (const prefix of ['beta/site/detail', 'prototype/brc-am7']) {
    const js = read(`${prefix}/app.js`);
    const css = read(`${prefix}/styles.css`);
    assert.match(js, /const LOUPE_SIZE = 216, LOUPE_ZOOM = 3/);
    assert.match(css, /\.image-loupe\s*\{[^}]*width:\s*216px;[^}]*height:\s*216px;/);
    assert.match(js, /role === 'Diagram'\) return null/);
  }
});
