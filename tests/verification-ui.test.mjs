import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { summarizeVerificationStatuses } from '../prototype/brc-am7/product-detail-model.mjs';

const root = new URL('../', import.meta.url);
const file = path => readFile(new URL(path, root), 'utf8');

test('verification summary is computed from product data and omits empty states', () => {
  const summary = summarizeVerificationStatuses([
    { verification: 'VERIFIED' },
    { verification: 'VERIFIED' },
    { verification: 'REVIEW REQUIRED' },
    { verification: 'PARTIAL' },
    { verification: 'MISSING' }
  ]);
  assert.equal(summary.total, 5);
  assert.equal(summary.verified, 2);
  assert.deepEqual(summary.entries.map(({ status, count }) => [status, count]), [
    ['VERIFIED', 2],
    ['PARTIAL', 1],
    ['REVIEW REQUIRED', 1],
    ['MISSING', 1]
  ]);
  assert.equal(summary.entries.some(item => item.status === 'CONFLICTED'), false);
});

test('verification records move below cards and keep the sources hash', async () => {
  const html = await file('prototype/brc-am7/index.html');
  const app = await file('prototype/brc-am7/app.js');
  assert.match(html, /<details id="sources"/);
  assert.match(html, /id="source-list"/);
  assert.match(html, /검증 상태 설명/);
  assert.match(app, /for \(const source of data\.sources\)/);
  assert.match(app, /legacySourceHash/);
});

test('public pages display a version badge while detail assets retain their refreshed versions', async () => {
  const home = await file('beta/site/index.html');
  const detail = await file('prototype/brc-am7/index.html');
  const publicDetail = await file('beta/site/detail/index.html');
  assert.match(home, /data-system-version/);
  assert.match(publicDetail, /data-system-version/);
  assert.doesNotMatch(detail, /data-system-version|SYSTEM v0\.1\.0|build local/);
  // W-009 refreshed styles; W-014 refreshes the app module to pick up the Port Map height cap.
  assert.match(detail, /styles\.css\?v=w20261004-009-port-merge/);
  assert.match(detail, /app\.js\?v=w20261004-013-spec-order/);
});

test('the five public Product Detail JSON Git blobs match their approved fixed hashes', () => {
  // DM7 and Ki Pro GO2 gained only the approved W-20261002-002 portMap;
  // remaining-port-maps.test.mjs separately locks their original core fields.
  // W-20261002-004 changes only DM7's portMap; its original core stays locked there.
  const expected = new Map([
    ['brc-am7.json', '673b3dcfaf167f171f9cf25a36ea891e3f02e597'],
    ['dm7.json', '269485f1de618ed2ee079914210594f085872104'],
    ['ki-pro-go2.json', 'b8cdcf3772de5aed7318197975bd0a674c28c85f'],
    ['pt-mz17k.json', '53ea915a730d0b52b54ae5433e0fe86ed2b0a68c'],
    ['rally-bar.json', '00f0f993e6183ff6edd632888569a3835fce2009']
  ]);
  for (const [name, hash] of expected) {
    const path = `beta/site/detail/data/${name}`;
    const blob = execFileSync('git', ['rev-parse', `HEAD:${path}`], {
      cwd: root,
      encoding: 'utf8'
    }).trim();
    assert.equal(blob, hash, name);
  }
});
