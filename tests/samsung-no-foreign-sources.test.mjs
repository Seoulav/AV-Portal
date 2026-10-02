import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeSamsungSourceCleanup } from './samsung-w010-history.mjs';
import { beforeSamsungForeignPurge } from './samsung-w014-history.mjs';
import { beforeSamsungManualIo } from './samsung-w015-history.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const sourceCodes = value => String(value ?? '').split(',').map(code => code.trim()).filter(Boolean);
const isForeignSamsung = source => {
  if (!source.url) return false;
  const url = new URL(source.url);
  return /(^|\.)samsung\.com$/i.test(url.hostname) && !/^\/sec\//i.test(url.pathname);
};

test('active Samsung JSON contains no overseas regional page URL or source entry', () => {
  for (const item of read('beta/site/catalog.json').filter(product => product.brand === 'Samsung')) {
    const raw = readFileSync(new URL(`beta/site/detail/data/${item.slug}.json`, root), 'utf8');
    assert.equal(/samsung\.com\/(?:uk|ca|latin_en|nz|hk_en)\//i.test(raw), false, `${item.slug}: 해외 지역 URL 잔존`);
    const detail = JSON.parse(raw);
    assert.deepEqual(detail.sources.filter(isForeignSamsung), [], `${item.slug}: 해외 지역 source 잔존`);
  }
});

test('W-014 preserves prior values and connector rows while withdrawing overseas citations', () => {
  const evidence = read('Work/기록/W-20261002-014-evidence.json');
  const sha = raw => createHash('sha256').update(raw).digest('hex');
  for (const [slug, expected] of Object.entries(evidence.untouchedProductSha256)) {
    const restored=beforeSamsungManualIo(read(`beta/site/detail/data/${slug}.json`),slug);
    assert.equal(sha(JSON.stringify(restored,null,2)+'\n'), expected, `${slug}: outside W-014`);
  }
  for (const [slug, e] of Object.entries(evidence.products)) {
    const current = beforeSamsungManualIo(read(`beta/site/detail/data/${slug}.json`), slug);
    const previous = beforeSamsungForeignPurge(current, slug);
    assert.equal(sha(JSON.stringify(previous, null, 2) + '\n'), e.previousFileSha256, `${slug}: previous JSON reconstruction`);
    assert.equal(current.io.length, previous.io.length, `${slug}: connector rows retained`);
    assert.equal(current.sources.some(s => s.code === 'S2'), false);
    for (const kind of ['specifications', 'io']) {
      for (const change of e.affected[kind]) {
        const row = current[kind][change.index];
        const prior = change.previousRow;
        assert.equal(row.name ?? row.connector, prior.name ?? prior.connector);
        if (kind === 'specifications') {
          assert.equal(row.value, prior.value, `${slug}: original specification value retained`);
          assert.equal(row.unit, prior.unit);
        } else {
          assert.equal(row.quantity, row.source ? prior.quantity : '', `${slug}: unconfirmed quantity blank`);
          assert.equal(row.availability, prior.availability);
        }
        assert.equal(row.source, change.previousSource === 'P, S2' ? 'P' : '');
        if (!row.source) {
          assert.equal(row.verification, 'REVIEW REQUIRED');
          assert.equal(row.condition, '국내 자료 미확보');
        }
      }
    }
    const validCodes = new Set(current.sources.map(s => s.code));
    for (const row of [...current.specifications, ...current.io]) {
      for (const code of sourceCodes(row.source)) assert.ok(validCodes.has(code), `${slug}: ${code} missing`);
    }
  }
});

test('115QHF has separate domestic maximum brightness and three evidence-backed overview facts', () => {
  const product = read('beta/site/detail/data/lh115qhfebgxkr.json');
  const typical = product.specifications.find(row => row.name === '밝기(Typ)');
  const maximum = product.specifications.find(row => row.name === '밝기(최대)');
  assert.equal(typical.value, '1000');
  assert.equal(typical.verification, 'REVIEW REQUIRED');
  assert.equal(typical.source, '');
  assert.equal(maximum.value, '1000');
  assert.equal(maximum.unit, 'nit');
  assert.equal(maximum.source, 'S5');
  assert.equal(maximum.verification, 'FOUND');
  for (const name of ['디스플레이 기술', 'SmartThings', 'VXT Player Support', '방수/방진']) {
    assert.equal(product.specifications.find(row => row.name === name)?.source, 'S5', name);
  }
  assert.equal(product.keyFacts.length, 3);
  const anchors = [maximum, product.specifications.find(row => row.name === '화면 크기'), product.specifications.find(row => row.name === '설치 방향')];
  product.keyFacts.forEach((fact, index) => {
    assert.equal(fact.value, anchors[index].value);
    assert.equal(fact.unit, anchors[index].unit);
    assert.ok(['FOUND', 'VERIFIED'].includes(anchors[index].verification));
  });
  assert.equal(read('beta/site/detail/data/lh55wmfwbgcxkr.json').keyFacts.length, 2);
});

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
    const before = beforeSamsungSourceCleanup(beforeSamsungForeignPurge(beforeSamsungManualIo(detail,item.slug), item.slug), item.slug);
    const digest = createHash('sha256').update(JSON.stringify(before, null, 2) + '\n').digest('hex');
    assert.equal(digest, evidence.products[item.slug].previousFileSha256, item.slug);
  }
});
