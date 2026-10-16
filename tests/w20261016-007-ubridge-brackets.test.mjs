import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { portMapGeometry } from '../beta/site/detail/detail-enhancement-view.mjs';

const product = JSON.parse(readFileSync(new URL('../beta/site/detail/data/u-bridge-3.json', import.meta.url), 'utf8'));
const expectedY = [175, 175, 175, 122, 175, 455, 445, 461, 455, 445, 461];
const connectorEdges = [190, 190, 190, 137, 190, 440, 429, 445, 440, 429, 445];

test('W-007 brackets stay beyond all eleven connector bodies', () => {
  assert.deepEqual(product.portMap.items.map(item => item.y), expectedY);
  const geometry = portMapGeometry(product.portMap, 944, 580);
  assert.equal(geometry.markers.length, 11);
  const tipPixelsInSource = 8 / geometry.scale;
  for (const [index, item] of product.portMap.items.entries()) {
    const edge = connectorEdges[index];
    if (item.side === 'top') assert.ok(item.y + tipPixelsInSource <= edge - 2, `top marker ${item.n} crosses connector`);
    else assert.ok(item.y - tipPixelsInSource >= edge + 2, `bottom marker ${item.n} crosses connector`);
  }
});

import { createHash } from 'node:crypto';
import { beforeW20261016_007Product } from './w20261016-007-history.mjs';

const fixture = JSON.parse(readFileSync(new URL('../Work/\uAE30\uB85D/W-20261016-007-prior-fields.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');

test('W-007 preserves image, facts and every field outside Port Map', () => {
  const image = readFileSync(new URL('../beta/site/detail/images/u-bridge-3-panels.png', import.meta.url));
  assert.equal(sha(image), fixture.imageSha256);
  const unchanged = Object.fromEntries(Object.entries(product).filter(([field]) => field !== 'portMap'));
  assert.equal(sha(JSON.stringify(unchanged)), fixture.unchangedSha256);
  assert.deepEqual(product.portMap.items.map(({ n, label, desc, x1, x2, side }) => ({ n, label, desc, x1, x2, side })),
    fixture.prior.portMap.items.map(({ n, label, desc, x1, x2, side }) => ({ n, label, desc, x1, x2, side })));
});

test('W-007 inverse restores coordinates selectively and rejects unapproved map drift', () => {
  assert.deepEqual(beforeW20261016_007Product(product, 'u-bridge-3').portMap, fixture.prior.portMap);
  const changedIo = structuredClone(product);
  changedIo.io = [];
  assert.deepEqual(beforeW20261016_007Product(changedIo, 'u-bridge-3').io, []);
  const changedMap = structuredClone(product);
  changedMap.portMap.items[0].label = 'INVALID';
  assert.throws(() => beforeW20261016_007Product(changedMap, 'u-bridge-3'), /unexpected W-007 portMap change/);
});
