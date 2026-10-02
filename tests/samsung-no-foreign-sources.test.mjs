import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeSamsungSourceCleanup } from './samsung-w010-history.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const sourceCodes = value => String(value ?? '').split(',').map(code => code.trim()).filter(Boolean);
const isForeignSamsung = source => {
  if (!source.url) return false;
  const url = new URL(source.url);
  return /(^|\.)samsung\.com$/i.test(url.hostname) && !/^\/sec\//i.test(url.pathname);
};

test('published Samsung specification and I/O rows do not verify overseas page values', () => {
  const violations = [];
  for (const item of read('beta/site/catalog.json').filter(product => product.brand === 'Samsung')) {
    const detail = read(`beta/site/detail/data/${item.slug}.json`);
    const foreign = new Map(detail.sources.filter(isForeignSamsung).map(source => [source.code, source]));
    for (const [kind, rows] of [['specifications', detail.specifications], ['io', detail.io]]) {
      rows.forEach((row, index) => {
        const sources = sourceCodes(row.source).filter(code => foreign.has(code));
        if (!sources.length) return;
        if (['FOUND', 'VERIFIED'].includes(row.verification)) violations.push(`${item.slug} ${kind}[${index}] ${row.name ?? row.connector}`);
        if (row.verification === 'REVIEW REQUIRED') {
          for (const code of sources) {
            const source = foreign.get(code);
            if (!source.name.includes('국내 자료 미확보') || !source.scope.includes('해외 지역 페이지 기록')) {
              violations.push(`${item.slug} ${code} lacks domestic-evidence notice`);
            }
          }
        }
      });
    }
  }
  assert.deepEqual(violations, []);
});

test('unused overseas Samsung page entries are removed from active sources', () => {
  const unused = [];
  for (const item of read('beta/site/catalog.json').filter(product => product.brand === 'Samsung')) {
    const detail = read(`beta/site/detail/data/${item.slug}.json`);
    const referenced = new Set([...detail.specifications, ...detail.io].flatMap(row => sourceCodes(row.source)));
    for (const source of detail.sources.filter(isForeignSamsung)) {
      if (!referenced.has(source.code)) unused.push(`${item.slug}:${source.code}`);
    }
  }
  assert.deepEqual(unused, []);
});

test('the recorded source cleanup reconstructs every pre-change Samsung JSON exactly', () => {
  const evidence = read('Work/기록/W-20261002-010-evidence.json');
  for (const item of read('beta/site/catalog.json').filter(product => product.brand === 'Samsung')) {
    if (!evidence.products[item.slug]) continue; // W-010 predates the three W-012 MPF entries.
    const detail = read(`beta/site/detail/data/${item.slug}.json`);
    const before = beforeSamsungSourceCleanup(detail, item.slug);
    const digest = createHash('sha256').update(JSON.stringify(before, null, 2) + '\n').digest('hex');
    assert.equal(digest, evidence.products[item.slug].previousFileSha256, item.slug);
  }
});
