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

test('verification tab hides source listings and retains the sources panel id', async () => {
  const html = await file('prototype/brc-am7/index.html');
  const app = await file('prototype/brc-am7/app.js');
  assert.match(html, /aria-controls="sources"[^>]*>검증 상태<\/button>/);
  assert.match(html, /id="sources"[^>]+role="tabpanel"/);
  assert.match(html, /id="verification-summary-groups"/);
  assert.match(html, /검토 중인 항목/);
  assert.match(html, /검증 상태 설명/);
  for (const hiddenText of ['Manufacturer Official', 'Supplemental / Domestic', '특징별 근거 보기']) assert.doesNotMatch(html, new RegExp(`>\\s*${hiddenText}\\s*<`, 'i'));
  assert.doesNotMatch(html, /id="source-list"|id="verification-documents"|id="feature-evidence-list"/);
  assert.doesNotMatch(app, /href = '#source-'|sourceReference\(|data\.sources\)|['"] SOURCES['"]/);
  assert.match(app, /legacySourceHash/);
});

test('public footers do not expose build strings and detail asset versions are refreshed', async () => {
  const home = await file('beta/site/index.html');
  const detail = await file('prototype/brc-am7/index.html');
  assert.doesNotMatch(home, /data-system-version|SYSTEM v0\.1\.0|build local/);
  assert.doesNotMatch(detail, /data-system-version|SYSTEM v0\.1\.0|build local/);
  assert.match(detail, /styles\.css\?v=w007-verification-1/);
  assert.match(detail, /app\.js\?v=w007-verification-1/);
});

test('the five public Product Detail JSON Git blobs remain byte-identical', () => {
  const expected = new Map([
    ['brc-am7.json', '78f32fb6139f2c618bf6ceef3080a198563dbc06'],
    ['dm7.json', 'cfafaae7f38e5790c3fd559753192c91c4e06c36'],
    ['ki-pro-go2.json', 'b688107c13cf84c06942cc831ad89387983a6aeb'],
    ['pt-mz17k.json', 'ab0488e3f401da9deab8d7a6d534a4ea3cce70e4'],
    ['rally-bar.json', '1ce4c62dace009d206a348919095d00585f2e8cc']
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
