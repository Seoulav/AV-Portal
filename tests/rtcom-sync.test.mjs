import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rename, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { syncRtcom, verifyRtcomSnapshot } from '../beta/sync-rtcom.mjs';

const sourceRoot = 'https://fixture.test/';
const indexUrl = `${sourceRoot}data/products/index.json`;
const exactIndex = Buffer.from(`{\r\n  "schema": "rtcom.products.v1",\r\n  "manufacturer": "RTCOM",\r\n  "detailPath": "data/products/{id}.json",\r\n  "imagePath": "output/design/assets/products/{file}",\r\n  "products": [\r\n    {"id":"alpha","group":"integrated","productName":"Alpha","model":"Alpha","itemType":"PRODUCT","categories":["영상","Video","Matrix Switcher"],"cardImage":"alpha.webp"},\r\n    {"id":"blocked","group":"integrated","productName":"HS-88MX","model":"HS-88MX","itemType":"PRODUCT","categories":["영상","Video","Matrix Switcher"],"cardImage":"blocked.webp"}\r\n  ]\r\n}\r\n`, 'utf8');
const detail = Buffer.from(JSON.stringify({
  id: 'alpha', manufacturer: 'RTCOM', productName: 'Alpha', model: 'Alpha', categories: ['영상', 'Video', 'Matrix Switcher'],
  english: 'Alpha', korean: '알파', overview: '알파', packageStatus: 'VERIFIED', verificationSummary: '검증',
  images: [{ role: 'Main', file: 'alpha.webp' }], imageStatuses: [{ role: 'Main', status: 'FOUND' }],
  documents: [], features: [{ text: '기능' }], specifications: [{ group: 'Video', name: '해상도', value: '4K' }], io: [], sources: [], issues: []
}, null, 2) + '\n');
const image = Buffer.from('RIFF-fixture-webp');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

function fixtureFetch(overrides = {}) {
  const files = new Map([
    [indexUrl, exactIndex],
    [`${sourceRoot}data/products/alpha.json`, detail],
    [`${sourceRoot}output/design/assets/products/alpha.webp`, image],
    ...Object.entries(overrides)
  ]);
  return async url => {
    const value = files.get(String(url));
    if (value instanceof Error) throw value;
    if (value === undefined) return new Response('missing', { status: 404 });
    if (value instanceof Response) return value;
    return new Response(value, { status: 200 });
  };
}

async function digestTree(root) {
  const verified = await verifyRtcomSnapshot(root);
  return sha(Buffer.from(JSON.stringify(verified.manifest)));
}

test('sync promotes a complete deterministic snapshot and preserves exact JSON bytes', async t => {
  const root = await mkdtemp(join(tmpdir(), 'rtcom-sync-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const destination = join(root, 'rtcom');

  const first = await syncRtcom({ destination, indexUrl, sourceRoot, fetchImpl: fixtureFetch() });
  assert.equal(first.changed, true);
  assert.equal(first.sourceCount, 2);
  assert.equal(first.publishedCount, 1);
  assert.equal(first.failures, 0);
  assert.deepEqual(first.excluded.map(item => item.model), ['HS-88MX']);
  assert.deepEqual(await readFile(join(destination, 'raw', 'index.json')), exactIndex);
  assert.deepEqual(await readFile(join(destination, 'raw', 'products', 'alpha.json')), detail);
  assert.deepEqual(await readFile(join(destination, 'images', 'alpha.webp')), image);

  const manifest = JSON.parse(await readFile(join(destination, 'SYNC.json'), 'utf8'));
  assert.equal(manifest.source.index.sha256, sha(exactIndex));
  assert.equal(manifest.source.index.bytes, exactIndex.length);
  assert.equal(manifest.source.sourceProductCount, 2);
  assert.equal(manifest.source.publishedProductCount, 1);
  assert.equal(manifest.fetchedAt, undefined);
  const before = await stat(join(destination, 'SYNC.json'));

  const second = await syncRtcom({ destination, indexUrl, sourceRoot, fetchImpl: fixtureFetch() });
  const after = await stat(join(destination, 'SYNC.json'));
  assert.equal(second.changed, false);
  assert.equal(after.mtimeMs, before.mtimeMs);
  await verifyRtcomSnapshot(destination);
});

test('unreachable index, missing detail and missing image preserve the last-known-good snapshot', async t => {
  const root = await mkdtemp(join(tmpdir(), 'rtcom-failures-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const destination = join(root, 'rtcom');
  await syncRtcom({ destination, indexUrl, sourceRoot, fetchImpl: fixtureFetch() });
  const baseline = await digestTree(destination);

  await assert.rejects(syncRtcom({ destination, indexUrl, sourceRoot, fetchImpl: async () => { throw new Error('offline'); } }), /offline/);
  assert.equal(await digestTree(destination), baseline);
  await assert.rejects(syncRtcom({ destination, indexUrl, sourceRoot, fetchImpl: fixtureFetch({ [`${sourceRoot}data/products/alpha.json`]: new Response('missing', { status: 404 }) }) }), /alpha.*404/);
  assert.equal(await digestTree(destination), baseline);
  await assert.rejects(syncRtcom({ destination, indexUrl, sourceRoot, fetchImpl: fixtureFetch({ [`${sourceRoot}output/design/assets/products/alpha.webp`]: new Response('missing', { status: 404 }) }) }), /alpha\.webp.*404/);
  assert.equal(await digestTree(destination), baseline);
});

test('validation rejects slug collisions before promotion', async t => {
  const root = await mkdtemp(join(tmpdir(), 'rtcom-collision-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const destination = join(root, 'rtcom');
  await assert.rejects(syncRtcom({ destination, indexUrl, sourceRoot, fetchImpl: fixtureFetch(), existingSlugs: ['rtcom-alpha'] }), /충돌/);
  await assert.rejects(stat(destination), error => error.code === 'ENOENT');
});

test('promotion failure restores the prior snapshot', async t => {
  const root = await mkdtemp(join(tmpdir(), 'rtcom-rollback-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const destination = join(root, 'rtcom');
  await syncRtcom({ destination, indexUrl, sourceRoot, fetchImpl: fixtureFetch() });
  const baseline = await digestTree(destination);
  const changedDetail = Buffer.from(detail.toString().replace('알파', '알파 변경'));
  let moves = 0;
  const moveImpl = async (from, to) => {
    moves += 1;
    if (moves === 2) throw new Error('promotion interrupted');
    await rename(from, to);
  };

  await assert.rejects(syncRtcom({
    destination, indexUrl, sourceRoot,
    fetchImpl: fixtureFetch({ [`${sourceRoot}data/products/alpha.json`]: changedDetail }),
    moveImpl
  }), /promotion interrupted/);
  assert.equal(await digestTree(destination), baseline);
});
