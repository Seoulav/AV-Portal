import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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

test('the five public Product Detail JSON files remain byte-identical', async () => {
  const expected = new Map([
    ['brc-am7.json', 'FF2CCB91FDE1E0D625B2AFCAC62187D89ADABEE8BBCA2388834C2865E426E121'],
    ['dm7.json', '9D33311F5C094FA5FE186C6BD317F84D1EC8C880DFA98C99A716A6DF65777C3C'],
    ['ki-pro-go2.json', '79801CDCEF0B1CD6821A1B4433291F340856EEB909042AE267C70FE5B30BFA12'],
    ['pt-mz17k.json', 'F2607D58BCA1FA1618329A8396AB3996104E35A6DF5C49EEB041EE7B0A219365'],
    ['rally-bar.json', '29A796E7EF97676F081E2D069B8EC097A13DD4CCF039C17D8CCC493FC44B249B']
  ]);
  for (const [name, hash] of expected) {
    const content = await readFile(new URL(`beta/site/detail/data/${name}`, root));
    assert.equal(createHash('sha256').update(content).digest('hex').toUpperCase(), hash, name);
  }
});
