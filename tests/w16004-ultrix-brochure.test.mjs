import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW16004Product, beforeW16004Raw, beforeW16004Uploads } from './w16004-history.mjs';
import { beforeW20261018_001Product } from './w20261018-001-history.mjs';
import { uploadedDocumentsFor, documentActionLabels } from '../beta/site/detail/pdf-documents.mjs';

const root = new URL('../', import.meta.url);
const products = [
  'ultrix-ns-fr2', 'ultrix-hdx-io', 'ultriscape', 'ultrimix-mxr',
  'ultrimix-dante', 'ultrisync-18', 'ultripower', 'ultripower-ps',
  'ultritouch-2-hr',
];
const file = 'manuals/ross-ultrix-family-brochure-ko.pdf';
const expectedSha = '0f772628d065bec59c6782acb0c939038445c98eda4f2abf8c57518213a6186a';
const load = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const product = slug => load(`beta/site/detail/data/${slug}.json`);

test('one unchanged brochure byte stream is linked to exactly nine Ultrix details', () => {
  const bytes = readFileSync(new URL(`beta/site/${file}`, root));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedSha);
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  const uploads = load('beta/site/docs/manifest.json').uploads.filter(row => row.file === file);
  assert.deepEqual(uploads.map(row => row.slug).sort(), [...products].sort());
  for (const row of uploads) {
    assert.equal(row.kind, 'reference');
    assert.match(row.title, /한국어.*사용자 제공/);
    assert.notEqual(row.locked, true);
  }
  for (const slug of products) {
    const brochure = uploadedDocumentsFor(slug, load('beta/site/docs/manifest.json'))
      .find(item => item.action.file === `../${file}`);
    assert.ok(brochure, `${slug} missing viewer action`);
    assert.equal(brochure.action.kind, 'local');
    assert.equal(brochure.status, 'FOUND');
    assert.ok(documentActionLabels(brochure, brochure.action).download, `${slug} missing download action`);
  }
  assert.equal(uploadedDocumentsFor('carbonite-ultra', load('beta/site/docs/manifest.json'))
    .filter(item => item.action.file === `../${file}`).length, 0);
});

test('FR2 differences retain old and brochure numbers with conflict badges', () => {
  for (const [name, oldValue, brochureValue] of [
    ['최대 UHD 게이트박스 수', '12입력/12출력', '15입력/15출력'],
    ['최대 UHD 입력 프레임 동기화 수', '27', '51'],
  ]) {
    const historical = beforeW20261018_001Product(product('ultrix-ns-fr2'), 'ultrix-ns-fr2');
    const row = historical.specifications.find(item => item.name === name);
    assert.equal(row.verification, 'CONFLICTED');
    assert.ok(row.value.includes(oldValue));
    assert.ok(row.value.includes(brochureValue));
    assert.match(row.condition, /브로슈어 25쪽/);
    assert.match(row.source, /B/);
  }
});

test('HDX AUX C difference and Ultriscape 30RU extension stay source-specific', () => {
  const historicalHdx = beforeW20261018_001Product(product('ultrix-hdx-io'), 'ultrix-hdx-io');
  const aux = historicalHdx.specifications.find(item => item.name === 'AUX C 포트 기능');
  assert.equal(aux.verification, 'CONFLICTED');
  assert.match(aux.value, /Dante I\/O/);
  assert.match(aux.value, /Ultristream/);
  assert.match(aux.condition, /브로슈어 26쪽/);
  const heads = product('ultriscape').specifications.find(row => row.name === '30RU 최대 멀티뷰어 헤드 수');
  assert.equal(heads.value, '96');
  assert.equal(heads.verification, 'FOUND');
  assert.equal(heads.source, 'B');
  assert.match(heads.condition, /15쪽/);
});

test('historical inverse passes unrelated live fields and rejects unapproved brochure changes', () => {
  const priorRawHashes = {
    'ultrix-ns-fr2': '7d73ce2bad2107ce75821aeb1062b8a9d846824f75600ac287e1329addb04d7e',
    'ultrix-hdx-io': '5d2cb5226fc5effc1eb8c4464430945ec5ac7e4f44c432e634607320f2c4cdef',
    'ultriscape': '851f2449d8190430d0a6f5687c95fbc62ae3a548000af9c760af07e54be8b43c',
  };
  for (const slug of ['ultrix-ns-fr2', 'ultrix-hdx-io', 'ultriscape']) {
    const current = product(slug);
    const mutated = structuredClone(current);
    mutated.io = [{ probe: 'unapproved I/O mutation' }];
    const inverse = beforeW16004Product(mutated, slug);
    assert.deepEqual(inverse.io, mutated.io);
    assert.notDeepEqual(inverse.io, current.io);

    const changedSpec = structuredClone(current);
    changedSpec.specifications[0].value = 'INVALID';
    assert.throws(() => beforeW16004Product(changedSpec, slug), /unexpected W-004/);

    const currentRaw = readFileSync(new URL(`beta/site/detail/data/${slug}.json`, root), 'utf8');
    assert.equal(createHash('sha256').update(beforeW16004Raw(currentRaw, slug)).digest('hex'), priorRawHashes[slug]);
  }
  const uploads = load('beta/site/docs/manifest.json').uploads;
  assert.equal(uploads.length - beforeW16004Uploads(uploads).length, 9);
  const altered = structuredClone(uploads);
  altered.find(row => row.file === file).title = 'INVALID';
  assert.throws(() => beforeW16004Uploads(altered), /unexpected W-004/);
});
