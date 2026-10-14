import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { frontConnectionPointsFor, frontPointPercent, validFrontConnectionPoints } from '../prototype/brc-am7/front-connection-points.mjs';
import { frontConnectionPointMaps } from '../prototype/brc-am7/front-connection-points-data.mjs';

const product = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));

test('only the two approved QMC models have measured front connection regions', () => {
  assert.deepEqual(Object.keys(frontConnectionPointMaps).sort(), ['LH32QMCEBGCXKR', 'LH55QMCEBGCXKR']);
  for (const slug of ['lh32qmcebgcxkr', 'lh55qmcebgcxkr']) {
    const points = frontConnectionPointsFor(product(slug));
    assert.ok(points, slug);
    assert.deepEqual(points.items.map(item => item.label), ['전원', '신호 단자']);
    assert.equal(points.measuredImage.file, product(slug).images.find(image => image.role === 'Main').file);
    for (const item of points.items) {
      const box = frontPointPercent(item, points.measuredImage);
      assert.ok(box.left >= 0 && box.top >= 0 && box.right <= 100 && box.bottom <= 100);
    }
  }
  assert.equal(frontConnectionPointsFor(product('lh43qmcebgcxkr')), null);
});

test('invalid photo dimensions, missing source, and boxes outside the image suppress the toggle', () => {
  const base = product('lh32qmcebgcxkr');
  const mutations = [
    map => { map.measuredImage.width = 100; },
    map => { map.sourceUrl = ''; },
    map => { map.sourceUrl = map.sourceUrl.replace('LH32QMCEBGCXKR', 'LH55QMCEBGCXKR'); },
    map => { map.items[0].x2 = 2000; },
    map => { map.items[1].label = '입력 단자'; },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(frontConnectionPointMaps[base.model]);
    mutate(changed);
    assert.equal(validFrontConnectionPoints(changed, base), false);
  }
});
