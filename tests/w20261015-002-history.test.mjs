// W-015 group6b: compare this historical task with the approved later layout rewound.
import {readBeforeGroup6bFileSync as readFileSync} from './group6b-w16015-history.mjs';
import {beforeW16015Product,beforeW16015Raw} from './w16015-group1-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createHash } from 'node:crypto';
import { beforeW20261015_002Product, beforeW20261015_002Raw, beforeW20261015_002EpsonProduct, beforeW20261015_002EpsonRaw } from './w20261015-002-history.mjs';
import { beforeW20261015_007Product, beforeW20261015_007Raw } from './w20261015-007-history.mjs';

const raw = readFileSync(new URL('../beta/site/detail/data/toggle-dock-2x1.json', import.meta.url), 'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');

test('TOGGLE DOCK photo crop inverse restores the exact prior product JSON', () => {
  assert.equal(sha(beforeW20261015_002Raw(raw, 'toggle-dock-2x1')),
    '0f7e2a25bd6f17e6db8ebbb3ac17de26901f2199848cf76b09da1cb694d9bb39');
  const product = JSON.parse(raw);
  product.overview += ' independent later wording';
  assert.match(beforeW20261015_002Product(product, 'toggle-dock-2x1').overview, /independent later wording/);
  product.portMap.crop.top = 180;
  assert.throws(() => beforeW20261015_002Product(product, 'toggle-dock-2x1'), /approved diagram crop changed/);
});

test('Epson HDMI 2 coordinate inverses restore both exact prior product JSON files', () => {
  for (const [slug, expectedHash] of [
    ['eb-pq2213b', '79f1f97eaf013d2b5b1e48142ed82ced3b148e501f0230f54156e0ecdb7e38fc'],
    ['eb-pq2216b', '4a3bbd97dc686398859b257506ccdff929007a5588830ffb435cd7baa75e5720']
  ]) {
    const text = readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8');
    assert.equal(sha(beforeW20261015_002EpsonRaw(beforeW20261015_007Raw(beforeW16015Raw(text,slug), slug), slug)), expectedHash, slug);
    const changed = beforeW20261015_007Product(beforeW16015Product(JSON.parse(text),slug), slug);
    changed.overview += ' independent later wording';
    assert.match(beforeW20261015_002EpsonProduct(changed, slug).overview, /independent later wording/);
    changed.portMap.items.find(item => item.n === 2).x2 = 510;
    assert.throws(() => beforeW20261015_002EpsonProduct(changed, slug), /HDMI 2 marker changed/);
  }
});
