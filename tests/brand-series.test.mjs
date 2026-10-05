import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { filterCatalog, parseExploreState, serializeExploreState } from '../beta/site/app.js';
import { seriesGroupsFor, seriesIdFor, normalizeSeriesFor } from '../beta/site/shared/brand-series.mjs';

const catalog = JSON.parse(await readFile(new URL('../beta/site/catalog.json', import.meta.url), 'utf8'));
const samsung = catalog.filter(item => item.brand === 'Samsung' && item.kind === 'equipment');

test('Samsung series choices cover the catalog once and preserve brand order', () => {
  const groups = seriesGroupsFor('Samsung', samsung);
  assert.deepEqual(groups.map(group => group.id), ['qhc', 'qmc', 'video-wall', 'hotel-tv', 'business-tv', 'whiteboard', 'led-signage']);
  assert.equal(groups.some(group => group.id === 'all'), false);
  assert.equal(groups.reduce((count, group) => count + samsung.filter(group.match).length, 0), samsung.length);
  assert.equal(seriesIdFor(catalog.find(item => item.slug === 'lh115qhfebgxkr')), 'qhc');
  assert.equal(seriesIdFor(catalog.find(item => item.slug === 'lh43qhcebgcxkr')), 'qhc');
  assert.equal(seriesIdFor(catalog.find(item => item.slug === 'lh55qmcebgcxkr')), 'qmc');
  const brandSorted = filterCatalog(catalog, { brand: 'Samsung', sort: 'brand' });
  for (const group of groups) {
    const expected = brandSorted.filter(group.match).map(item => item.slug);
    const actual = filterCatalog(catalog, { brand: 'Samsung', series: group.id, sort: 'brand' }).map(item => item.slug);
    assert.deepEqual(actual, expected, group.id);
  }
  assert.equal(seriesGroupsFor('BSS Audio', catalog), null);
});

test('empty and all series retain the existing complete result set', () => {
  for (const brand of ['Samsung', 'BSS Audio']) {
    const old = filterCatalog(catalog, { brand, sort: 'brand' }).map(item => item.slug);
    assert.deepEqual(filterCatalog(catalog, { brand, series: '', sort: 'brand' }).map(item => item.slug), old);
    assert.deepEqual(filterCatalog(catalog, { brand, series: 'all', sort: 'brand' }).map(item => item.slug), old);
  }
});

test('series URL round-trips and invalid choices normalize for the final brand', () => {
  for (const series of ['', 'all', 'qmc']) {
    const state = parseExploreState(serializeExploreState({ brand: 'Samsung', series, sort: 'brand' }));
    assert.equal(state.series, series);
  }
  assert.equal(normalizeSeriesFor('Samsung', 'all', catalog), 'all');
  assert.equal(normalizeSeriesFor('Samsung', 'qmc', catalog), 'qmc');
  for (const [brand, series] of [['Sony', 'all'], ['', 'all'], ['Samsung', 'bad-series'], ['Unknown', 'qmc']]) {
    assert.equal(normalizeSeriesFor(brand, series, catalog), '', `${brand}/${series}`);
  }
});

test('series browser is a real part of the result workspace', async () => {
  const html = await readFile(new URL('../beta/site/index.html', import.meta.url), 'utf8');
  assert.match(html, /id="series-browser"[^>]+hidden/);
  assert.ok(html.indexOf('id="result-context-title"') < html.indexOf('id="series-browser"'));
  assert.ok(html.indexOf('id="series-browser"') < html.indexOf('id="cards"'));
});
