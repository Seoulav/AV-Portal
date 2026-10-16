import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { enhancementErrors } from '../beta/site/detail/detail-enhancements.mjs';
import { portMapGeometry } from '../beta/site/detail/detail-enhancement-view.mjs';
import { beforeW20261016_006Product } from './w20261016-006-history.mjs';

const base = new URL('../beta/site/detail/', import.meta.url);
const current = JSON.parse(readFileSync(new URL('data/u-bridge-3.json', base), 'utf8'));
const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-006-prior-fields.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');

test('W-006 separates the two module columns without changing any callout facts', () => {
  assert.deepEqual(enhancementErrors(current), []);
  assert.equal(current.images.find(image => image.role === 'Diagram').resolution, '944x580');
  assert.deepEqual(current.portMap.measuredImage, { file: 'u-bridge-3-panels.png', width: 944, height: 580 });
  assert.deepEqual(current.portMap.items.map(({ n, label, desc, side }) => ({ n, label, desc, side })),
    fixture.prior.portMap.items.map(({ n, label, desc, side }) => ({ n, label, desc, side })));
  assert.equal(current.portMap.items[7].x2, fixture.prior.portMap.items[7].x2);
  assert.equal(current.portMap.items[8].x1, fixture.prior.portMap.items[8].x1 + 160);
  assert.ok(572 - 372 >= 372 / 2);
  assert.equal(portMapGeometry(current.portMap, 944, 580).markers.length, 11);
  const image = readFileSync(new URL('images/u-bridge-3-panels.png', base));
  assert.equal(image.readUInt32BE(16), 944);
  assert.equal(image.readUInt32BE(20), 580);
  assert.equal(sha(image), fixture.approvedImageSha256);
  assert.equal(sha(readFileSync(new URL('../Work/기록/W-20261016-006-before-panels.png', import.meta.url))), fixture.priorImageSha256);
});

test('W-006 inverse is selective and rejects drift in approved fields', () => {
  const unchanged = Object.fromEntries(Object.entries(current).filter(([field]) => !['images', 'portMap'].includes(field)));
  assert.equal(sha(JSON.stringify(unchanged)), fixture.unchangedSha256);
  const prior = beforeW20261016_006Product(current, 'u-bridge-3');
  assert.deepEqual(prior.images, fixture.prior.images);
  assert.deepEqual(prior.portMap, fixture.prior.portMap);
  const changedIo = structuredClone(current);
  changedIo.io = [];
  assert.deepEqual(beforeW20261016_006Product(changedIo, 'u-bridge-3').io, []);
  const changedMap = structuredClone(current);
  changedMap.portMap.items[0].label = 'INVALID';
  assert.throws(() => beforeW20261016_006Product(changedMap, 'u-bridge-3'), /unexpected W-007 portMap change/);
});
