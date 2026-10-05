import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareProductDetail} from '../prototype/brc-am7/product-detail-model.mjs';
import {beforeSamsungSourceCleanup} from './samsung-w010-history.mjs';
import {beforeSamsungForeignPurge} from './samsung-w014-history.mjs';
import {beforeSamsungManualIo} from './samsung-w015-history.mjs';
import {beforeSamsungW04010Path} from './samsung-w04010-history.mjs';

const read = path => beforeSamsungW04010Path(path, JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8')));
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const absentValue = value => ['미지원(사양표 "No")','Not available'].includes(String(value || '').trim());

test('A: 9 published Samsung connector rows remain FOUND; historical evidence stays intact', () => {
  const prior = read('Work/기록/W-20261002-007-samsung-key-facts-evidence.json');
  assert.equal(Object.values(prior.products).reduce((total, product) => total + product.conflicts.length, 0), 12);
  let count = 0;
  for (const [slug, product] of Object.entries(prior.products)) {
    if (slug === 'lh98qecedgcxkr') continue;
    const p = beforeSamsungManualIo(read(`beta/site/detail/data/${slug}.json`), slug);
    for (const conflict of product.conflicts) {
      const row = p.io[conflict.index];
      assert.equal(row.connector, conflict.connector);
      assert.equal(conflict.beforeVerification, 'FOUND');
      assert.equal(row.verification, 'FOUND');
      assert.equal(row.availability, conflict.overseas.priorAvailability);
      assert.equal(row.availability, '미지원(사양표 "No")');
      count++;
    }
  }
  assert.equal(count, 9);
});

test('B: only availability-absent ports leave cards; functional limits remain', async () => {
  const {isAbsentConnector} = await import('../prototype/brc-am7/product-detail-model.mjs');
  assert.equal(typeof isAbsentConnector, 'function');
  const files = readdirSync(new URL('../beta/site/detail/data/', import.meta.url)).filter(name => name.endsWith('.json'));
  let absent = 0;
  let functional = 0;
  for (const file of files) {
    const p = read(`beta/site/detail/data/${file}`);
    const prepared = prepareProductDetail(p);
    const expected = p.io.filter(row => absentValue(row.availability));
    assert.deepEqual(prepared.absentConnectors, expected, file);
    for (const row of p.io) {
      assert.equal(isAbsentConnector(row), absentValue(row.availability), `${file}: ${row.connector}`);
      if (isAbsentConnector(row)) absent++;
      else if (/미지원/i.test(`${row.availability || ''} ${row.condition || ''}`)) functional++;
    }
  }
  assert.equal(absent, 15); // Four new QHC/QMC models each document an absent audio input.
  // New U800F sizes add three more satellite-limit notes.
  assert.equal(functional, 15);
  const app = readFileSync(new URL('../prototype/brc-am7/app.js', import.meta.url), 'utf8');
  assert.match(app, /prepareIoFallbackEntries\(data\.io\)/);
  assert.match(app, /presentConnectors\.length/);
  assert.match(app, /이 모델에 없는 단자/);
  assert.match(app, /제조사 사양표 기준/);
  assert.match(app, /connector-table-body/);
});

test('C: quantity changes come only from model-specific supplied documents', () => {
  const evidence = read('Work/기록/W-20261002-008-evidence.json');
  assert.equal(Object.keys(evidence.products).length, 10);
  let filled = 0;
  for (const [slug, e] of Object.entries(evidence.products)) {
    if (slug === 'lh98qecedgcxkr') continue;
    const p = beforeSamsungManualIo(read(`beta/site/detail/data/${slug}.json`), slug);
    for (const change of e.quantityChanges) {
      const row = p.io[change.index];
      assert.equal(row.connector, change.connector);
      assert.equal(row.quantity, change.after);
      assert.match(change.document, /제품가이드|115QHF|단독형_Q[MH]C/);
      assert.ok(change.pageOrSlide > 0);
      assert.ok(change.tableLabel);
      assert.ok(change.exactModelMatch);
      filled++;
    }
    const restored = beforeSamsungSourceCleanup(beforeSamsungForeignPurge(p, slug), slug);
    for (const change of e.quantityChanges) restored.io[change.index].quantity = change.before;
    for (const revert of e.verificationReverts) restored.io[revert.index].verification = revert.before;
    restored.sources = restored.sources.filter(source => !e.addedSourceCodes.includes(source.code));
    assert.equal(sha(restored), e.baselineSha256, `${slug}: only approved quantity, source and verification changes`);
  }
  assert.ok(filled > 0);
});
