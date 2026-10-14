import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { beforeW20261014_008Catalog, beforeW20261014_008DetailFiles, beforeW20261014_008Snapshot, inogeniSlugs } from './w20261014-008-history.mjs';
import { prepareEnhancements } from '../beta/site/detail/detail-enhancements.mjs';
import { filterCatalog, buildSuggestions } from '../beta/site/app.js';

const root = new URL('../beta/site/', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const catalog = read('catalog.json');
const product = slug => read(`detail/data/${slug}.json`);

test('INOGENI has two exact-model catalog and detail entries, filter chip and search terms', () => {
  const rows = catalog.filter(row => row.brand === 'INOGENI');
  assert.deepEqual(rows.map(row => row.slug), [...inogeniSlugs]);
  assert.deepEqual(filterCatalog(catalog, { brand: 'INOGENI' }).map(row => row.slug), [...inogeniSlugs]);
  assert.ok(buildSuggestions(catalog, 'INOGENI').some(row => row.type === '제조사' && row.label === 'INOGENI'));
  const index = read('search-index.json');
  for (const slug of inogeniSlugs) {
    const row = rows.find(item => item.slug === slug);
    const detail = product(slug);
    assert.equal(detail.manufacturer, 'INOGENI');
    assert.ok(row.official_links[0].startsWith('https://inogeni.com/product/'));
    assert.ok(index.items.some(item => item.slug === slug));
    assert.equal(detail.portMap.image, 'Diagram');
    assert.ok(prepareEnhancements(detail).portMap);
    assert.deepEqual(detail.images.map(image => image.role), ['Main', 'Diagram']);
    for (const image of detail.images) {
      assert.equal(image.model, detail.model);
      assert.equal(image.officialSource, true);
      assert.ok(existsSync(new URL(`detail/images/${image.file}`, root)));
    }
    assert.ok(detail.documents.filter(doc => doc.url).every(doc => doc.url.startsWith('https://inogeni.com/')));
  }
});

test('host and module I/O stay distinct and map only evidenced connectors', () => {
  const dock = product('toggle-dock-2x1');
  const bridge = product('u-bridge-3');
  assert.deepEqual(dock.io.filter(row => row.group === 'Host 1').map(row => row.connector), ['USB-C']);
  assert.deepEqual(dock.io.filter(row => row.group === 'Host 2').map(row => row.connector), ['USB 3.0 Type-B', 'HDMI 2.0']);
  assert.equal(dock.portMap.items.length, 9);
  assert.equal(bridge.io.find(row => row.group === 'DEVICE' && row.connector === 'USB-A').quantity, '2');
  assert.equal(bridge.io.find(row => row.group === 'DEVICE' && row.connector === 'USB-C').quantity, '1');
  assert.equal(bridge.io.find(row => row.group === 'PC HOST' && row.connector === 'USB-C').quantity, '1');
  assert.equal(bridge.portMap.items.length, 11);
  assert.ok(bridge.specifications.some(row => row.name === 'USB-C DisplayPort Alt Mode' && row.value === '미지원'));
  assert.ok(dock.features.every(row => row.source === 'P'));
  assert.ok(bridge.features.every(row => row.source === 'P'));
});

test('W-008 inverse removes only these two entries from historical snapshots', () => {
  const oldCatalog = beforeW20261014_008Catalog(catalog);
  assert.equal(catalog.length - oldCatalog.length, 2);
  assert.deepEqual(oldCatalog, catalog.filter(row => !inogeniSlugs.has(row.slug)));
  assert.deepEqual(beforeW20261014_008DetailFiles(['old.json', 'toggle-dock-2x1.json', 'u-bridge-3.json']), ['old.json']);
  const snapshot = read('../public-snapshot.json');
  const oldSnapshot = beforeW20261014_008Snapshot(snapshot);
  assert.equal(snapshot.catalog.count - oldSnapshot.catalog.count, 2);
  assert.equal(Object.keys(snapshot.details).length - Object.keys(oldSnapshot.details).length, 2);
  assert.throws(() => beforeW20261014_008Catalog([...catalog, catalog.find(row => inogeniSlugs.has(row.slug))]), /duplicate W-008/);
});
