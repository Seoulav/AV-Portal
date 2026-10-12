import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { filterCatalog } from '../beta/site/app.js';
import { seriesGroupsFor, seriesIdFor } from '../beta/site/shared/brand-series.mjs';

const catalog = JSON.parse(await readFile(new URL('../beta/site/catalog.json', import.meta.url), 'utf8'));
const expected = [
  { group: 'ULX-D', id: 'ulx-d', label: 'ULX-D \uBB34\uC120 \uC2DC\uC2A4\uD15C', slugs: ['ulxd4','ulxd4d','ulxd4q','ulxd1','ulxd2-beta58','ulxd2-beta87','ulxd2-ksm9','ulxd8'] },
  { group: 'QLX-D', id: 'qlx-d', label: 'QLX-D \uBB34\uC120 \uC2DC\uC2A4\uD15C', slugs: ['qlxd4','qlxd1','qlxd2-beta58','qlxd2-beta87a'] },
  { group: 'SLX-D+', id: 'slx-d-plus', label: 'SLX-D Plus \uBB34\uC120 \uC2DC\uC2A4\uD15C', slugs: ['slxd4-plus','slxd4d-plus','slxd1-plus','slxd2-plus-58','slxd2-plus-b58','slxd2-plus-b87a'] },
  { group: 'MXC', id: 'mxc', label: '\uD68C\uC758\uC6A9 \uC7A5\uBE44 (MXC\u00B7MXCW)', slugs: ['mxcw640','mxcwapt-w','mxc420-c'] },
  { group: 'MX', id: 'mx', label: 'Microflex \uC720\uC120 \uB9C8\uC774\uD06C', slugs: ['mx392-c','mx418d-c','mx395'] },
  { group: 'MXA', id: 'mxa', label: '\uCC9C\uC7A5 \uC5B4\uB808\uC774 (MXA)', slugs: ['mxa925w-r','a900w-r-gm'] },
  { group: 'UA', id: 'ua', label: '\uC548\uD14C\uB098\u00B7\uBD84\uBC30', slugs: ['ua874xa','ua864a','ua844-swb','ua845uwb'] },
];
const shure = catalog.filter(item => item.brand === 'Shure');

 test('Shure lineup groups cover all 30 catalog entries in the approved order', () => {
  assert.equal(shure.length, 30);
  for (const [index, entry] of expected.entries()) {
    for (const slug of entry.slugs) {
      const item = shure.find(candidate => candidate.slug === slug);
      assert.ok(item, `missing Shure product ${slug}`);
      assert.deepEqual(item.brandSort, { group: entry.group, order: index + 1 }, slug);
      assert.equal(seriesIdFor(item), entry.id, slug);
    }
  }
  const groups = seriesGroupsFor('Shure', shure);
  assert.deepEqual(groups.map(({ id, label, count }) => ({ id, label, count })), expected.map(entry => ({ id: entry.id, label: entry.label, count: entry.slugs.length })));
  assert.equal(groups.reduce((sum, group) => sum + shure.filter(group.match).length, 0), 30);
  const all = filterCatalog(catalog, { brand: 'Shure', sort: 'brand' });
  assert.equal(all.length, 30);
  for (const group of groups) {
    const expectedSlugs = all.filter(group.match).map(item => item.slug).sort();
    const actualSlugs = filterCatalog(catalog, { brand: 'Shure', series: group.id, sort: 'brand' }).map(item => item.slug).sort();
    assert.deepEqual(actualSlugs, expectedSlugs, group.id);
  }
});

test('A900W-R-GM is grouped with MXA from its official MXA920/MXA925 accessory scope', async () => {
  const detail = JSON.parse(await readFile(new URL('../beta/site/detail/data/a900w-r-gm.json', import.meta.url), 'utf8'));
  assert.match(detail.series, /MXA920 \/ MXA925/);
  assert.ok(detail.sources.some(source => source.url === 'https://pubs.shure.com/guide/A900-GM/en-US'));
  assert.equal(shure.find(item => item.slug === 'a900w-r-gm').brandSort.group, 'MXA');
  assert.equal(seriesGroupsFor('Shure', shure).some(group => group.id === 'acc'), false);
});

test('non-Shure catalog entries stay byte-stable through the lineup change', () => {
  const nonShure = catalog.filter(item => item.brand !== 'Shure');
  const sha = createHash('sha256').update(JSON.stringify(nonShure)).digest('hex');
  assert.equal(nonShure.length, 244);
  assert.equal(sha, '8a08e4e596394d01b60370bb72646ceb1a0907c3d208119a32b35cf945ee5980');
});