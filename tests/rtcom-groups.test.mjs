import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { adaptRtcomCatalog, validateRtcomIndex } from '../beta/site/shared/rtcom-adapter.mjs';
import { filterCatalog, parseExploreState, serializeExploreState } from '../beta/site/app.js';
import { normalizeSeriesFor, seriesGroupsFor, seriesIdFor } from '../beta/site/shared/brand-series.mjs';

const index = JSON.parse(readFileSync(new URL('../beta/site/rtcom/raw/index.json', import.meta.url), 'utf8'));
const av = JSON.parse(readFileSync(new URL('../beta/site/catalog.json', import.meta.url), 'utf8')).filter(item => item.kind === 'equipment');
const adapted = adaptRtcomCatalog(index);
const all = [...av, ...adapted];
const groupIds = Object.keys(index.groups);

test('RTCOM groups and card membership come from the synchronized index in original order', () => {
  const groups = seriesGroupsFor('RTCOM', all, index.groups);
  assert.deepEqual(groups.map(group => [group.id, group.label, group.count]), groupIds.map(id => [id, index.groups[id], index.products.filter(p => p.group === id).length]));
  assert.equal(groups.reduce((sum, group) => sum + group.count, 0), adapted.length);
  assert.deepEqual(adapted.map(item => item.rtcomId), index.products.map(item => item.id));
  for (const item of adapted) assert.equal(seriesIdFor(item), index.products.find(source => source.id === item.rtcomId).group);
  assert.deepEqual(filterCatalog(all, { brand: 'RTCOM', sort: 'brand' }).map(item => item.rtcomId), index.products.map(item => item.id));
  assert.equal(seriesGroupsFor('BSS Audio', all, index.groups), null);
});

test('RTCOM group selection keeps URL state, series cards, deliberate sorts and other brands intact', () => {
  for (const id of ['series', 'integrated', 'distribution', 'extender', 'cable', 'all']) {
    const parsed = parseExploreState(serializeExploreState({ brand: 'RTCOM', series: id, sort: 'brand' }));
    assert.equal(normalizeSeriesFor(parsed.brand, parsed.series, all, index.groups), id);
  }
  const series = filterCatalog(all, { brand: 'RTCOM', series: 'series', sort: 'brand' });
  assert.deepEqual(series.map(item => item.rtcomId), index.products.filter(item => item.group === 'series').map(item => item.id));
  for (const id of ['xdm', 'spx', 'vdm']) assert.ok(series.some(item => item.rtcomId === id));
  assert.ok(series.every(item => item.link_scope === 'series' && item.official_links[0].endsWith(`#products/${item.rtcomId}`)));
  assert.ok(series.every(item => item.configurator_link === 'https://seoulav.github.io/rtcom-configurator/#matrix-configurator'));
  assert.ok(adapted.filter(item => seriesIdFor(item) !== 'series').every(item => !item.configurator_link));
  assert.ok(adapted.some(item => item.product.includes('HD-104U')));
  assert.ok(adapted.some(item => item.product.includes('HD-108U')));
  for (const excluded of ['HS-88M-U', 'HS-88MX', 'HD-D104U', 'HD-D108U']) assert.ok(!adapted.some(item => item.product === excluded));
  assert.deepEqual(filterCatalog(all, { brand: 'RTCOM', sort: 'product' }).map(item => item.slug), [...adapted].sort((a,b) => a.product.localeCompare(b.product, 'ko')).map(item => item.slug));
  assert.deepEqual(filterCatalog(all, { brand: 'RTCOM', sort: 'relevance' }).map(item => item.slug), [...adapted].sort((a,b) => a.product.localeCompare(b.product, 'ko')).map(item => item.slug));
  assert.deepEqual(filterCatalog(all, { brand: 'Samsung', sort: 'brand' }).map(item => item.slug), filterCatalog(av, { brand: 'Samsung', sort: 'brand' }).map(item => item.slug));
  assert.deepEqual(filterCatalog(all, { sort: 'brand' }).filter(item => item.brand !== 'RTCOM').map(item => item.slug), filterCatalog(av, { sort: 'brand' }).map(item => item.slug));
  for (const [brand, value] of [['RTCOM', 'bad'], ['Samsung', 'series'], ['Sony', 'all'], ['', 'all']]) assert.equal(normalizeSeriesFor(brand, value, all, index.groups), '');
});

test('candidate index rejects missing or reserved groups and non-owned product memberships', () => {
  const change = update => { const value = structuredClone(index); update(value); return value; };
  assert.throws(() => validateRtcomIndex(change(value => { delete value.groups; })), /groups/);
  assert.throws(() => validateRtcomIndex(change(value => { value.groups = {}; })), /groups/);
  assert.throws(() => validateRtcomIndex(change(value => { value.groups[''] = 'empty'; })), /group/);
  assert.throws(() => validateRtcomIndex(change(value => { value.groups.all = 'all'; })), /all/);
  assert.throws(() => validateRtcomIndex(change(value => { value.groups.series = '   '; })), /series/);
  assert.throws(() => validateRtcomIndex(change(value => { value.products[0].group = 'other'; })), /group/);
  assert.throws(() => validateRtcomIndex(change(value => { value.products[0].group = 'toString'; })), /group/);
  assert.doesNotThrow(() => validateRtcomIndex(change(value => { value.groups.newkind = '새 그룹'; value.products[0].group = 'newkind'; })));
});

test('brand sort retains source product order even if groups interleave after a future sync', () => {
  const changed = structuredClone(index);
  changed.products = [
    index.products.find(item => item.group === 'integrated'),
    index.products.find(item => item.group === 'series'),
    index.products.find(item => item.group === 'cable')
  ];
  const catalog = adaptRtcomCatalog(changed);
  assert.deepEqual(filterCatalog(catalog, { brand: 'RTCOM', sort: 'brand' }).map(item => item.rtcomId), changed.products.map(item => item.id));
});
