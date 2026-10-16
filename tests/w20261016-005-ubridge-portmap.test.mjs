// W-015 group6b: compare this historical task with the approved later layout rewound.
import {readBeforeGroup6bFileSync as readFileSync} from './group6b-w16015-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createHash } from 'node:crypto';
import { enhancementErrors } from '../beta/site/detail/detail-enhancements.mjs';
import { portMapGeometry } from '../beta/site/detail/detail-enhancement-view.mjs';
import { beforeW20261016_005Product, beforeW20261016_005Raw } from './w20261016-005-history.mjs';
import { beforeW20261016_006Product } from './w20261016-006-history.mjs';

const base = new URL('../beta/site/detail/', import.meta.url);
const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-005-prior-fields.json', import.meta.url), 'utf8'));
const raw = readFileSync(new URL('data/u-bridge-3.json', base), 'utf8');
const published = JSON.parse(raw);
const current = beforeW20261016_006Product(published, 'u-bridge-3');
const sha = value => createHash('sha256').update(value).digest('hex');

test('W-005 state keeps the manufacturer diagram and all eleven original callout facts', () => {
  assert.deepEqual(enhancementErrors(current), []);
  assert.deepEqual(current.images.map(image => [image.role, image.file]), [
    ['Main', 'u-bridge-3-main.png'],
    ['Diagram', 'u-bridge-3-panels.png'],
    ['Other', 'u-bridge-3-diagram.png']
  ]);
  assert.deepEqual(current.portMap.items.map(({ n, label, desc }) => ({ n, label, desc })),
    fixture.prior.portMap.items.map(({ n, label, desc }) => ({ n, label, desc })));
  assert.equal(current.portMap.items.length, 11);
  assert.deepEqual(current.portMap.measuredImage, { file: 'u-bridge-3-panels.png', width: 784, height: 580 });
  const geometry = portMapGeometry(current.portMap, 784, 580);
  assert.ok(geometry.markers.slice(0, 5).every(marker => marker.side === 'top'));
  assert.ok(geometry.markers.slice(5).every(marker => marker.side === 'bottom'));
  assert.equal(sha(readFileSync(new URL('../Work/기록/W-20261016-006-before-panels.png', import.meta.url))), fixture.newImageSha256);
  assert.equal(sha(readFileSync(new URL('images/u-bridge-3-diagram.png', base))), fixture.originalImageSha256);
});

test('W-005 selective inverse retains every current nonapproved field and rejects drift', () => {
  const approvedFields = new Set(['images', 'imageStatuses', 'portMap']);
  const unchanged = Object.fromEntries(Object.entries(current).filter(([field]) => !approvedFields.has(field)));
  assert.equal(sha(JSON.stringify(unchanged)), fixture.unchangedSha256);
  assert.deepEqual(beforeW20261016_005Product(published, 'u-bridge-3').portMap, fixture.prior.portMap);
  assert.equal(sha(beforeW20261016_005Raw(raw, 'u-bridge-3')), sha(JSON.stringify({ ...current, ...fixture.prior }, null, 2) + '\n'));
  const alteredIo = structuredClone(published);
  alteredIo.io = [];
  assert.deepEqual(beforeW20261016_005Product(alteredIo, 'u-bridge-3').io, []);
  const alteredMap = structuredClone(published);
  alteredMap.portMap.items[0].label = 'INVALID';
  assert.throws(() => beforeW20261016_005Product(alteredMap, 'u-bridge-3'), /unexpected W-007 portMap change/);
});
