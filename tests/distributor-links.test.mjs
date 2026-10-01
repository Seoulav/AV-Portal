import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('verified distributor mapping contains only exact Harman product matches', async () => {
  const { distributorLinks, isHarmanManufacturer, distributorLinkFor } = await import('../beta/distributor-links.mjs');
  const catalog = JSON.parse(await readFile(new URL('beta/site/catalog.json', root), 'utf8'));
  const catalogBySlug = new Map(catalog.filter(item => item.slug).map(item => [item.slug, item]));

  assert.equal(distributorLinks.length, 48);
  assert.equal(new Set(distributorLinks.map(item => item.slug)).size, distributorLinks.length);
  for (const item of distributorLinks) {
    const catalogItem = catalogBySlug.get(item.slug);
    assert.ok(catalogItem, `${item.slug}: catalog product missing`);
    assert.ok(isHarmanManufacturer(catalogItem.brand), `${item.slug}: ${catalogItem.brand} is not Harman`);
    assert.match(item.url, /^https:\/\/techdata-ps\.com\/m21_view\.php\?idx=\d+$/);
    assert.equal(item.distributor, '테크데이타피에스');
    assert.match(item.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(item.pageTitle.trim());
    const detail = JSON.parse(await readFile(new URL(`beta/site/detail/data/${item.slug}.json`, root), 'utf8'));
    assert.equal(item.model, detail.model);
    assert.equal(distributorLinkFor(item.slug, catalogItem.brand), item);
  }

  for (const futureBrand of ['AKG', 'Soundcraft', 'dbx']) assert.ok(isHarmanManufacturer(futureBrand));
  assert.equal(distributorLinkFor('blu-50v2', 'BSS Audio'), null);
  assert.equal(distributorLinkFor('nx-1200', 'Sony'), null);
});

test('Pages verifier enforces distributor slug, manufacturer, model and canonical URL', async () => {
  const verifier = await readFile(new URL('beta/verify-pages.mjs', root), 'utf8');
  assert.match(verifier, /distributorLinks/);
  assert.match(verifier, /isHarmanManufacturer/);
  assert.match(verifier, /techdata-ps\\\.com/);
  assert.match(verifier, /distributor\.model/);
});
