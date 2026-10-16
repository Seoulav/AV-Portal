import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { beforeW032Raw } from './w032-history.mjs';
import { beforeW06003Raw } from './w06003-history.mjs';
import { beforeW12001Raw } from './w12001-history.mjs';
import { beforeW12002Raw } from './w12002-wording-history.mjs';
import { beforeW12005Raw } from './w12005-history.mjs';
import { beforeLogitechW14001Raw } from './logitech-w14001-history.mjs';
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
  // The detail asset version advances when its presentation renderer changes.
  assert.match(detail, /styles\.css\?v=w20261016-013-portmap-loupe/);
  assert.match(detail, /app\.js\?v=w20261016-013-portmap-loupe/);
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
    const slug = name.slice(0, -5);
    const current = readFileSync(new URL(path, root), 'utf8').replace(/\r\n/g, '\n');
    const restoredWording = beforeW12002Raw(beforeW12005Raw(beforeLogitechW14001Raw(current,slug), slug), slug);
    const raw = slug === 'brc-am7'
      ? beforeW032Raw(beforeW06003Raw(restoredWording, slug), slug)
      : ['dm7', 'ki-pro-go2'].includes(slug)
        ? beforeW12001Raw(restoredWording, slug)
        : restoredWording;
    const bytes = Buffer.from(raw);
    const blob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    assert.equal(blob, hash, name);
  }
});
