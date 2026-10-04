import {beforeHarmanW03014,beforeHarmanW03014Raw,harmanW03014Slug} from './harman-w03014-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { beforeBssW04004Raw } from './bss-w04004-history.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { uploadedDocumentsFor } from '../beta/site/detail/pdf-documents.mjs';
import { beforeWinstarW04016Uploads } from './winstar-w04016-history.mjs';
import { beforeCrownW03009, crownW03009Slug } from './crown-w03009-history.mjs';
import { beforeJblW03010, jblW03010Slug } from './jbl-w03010-history.mjs';
import { beforeBssW03011, bssW03011Slug } from './bss-w03011-history.mjs';
import { beforeCrownW03013, crownW03013Slug } from './crown-w03013-history.mjs';
import { beforeSamsungW04010Raw } from './samsung-w04010-history.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const evidence = read('Work/기록/W-20261003-008-evidence.json');
const slugs = Object.keys(evidence.products);
const product = slug => read(`beta/site/detail/data/${slug}.json`);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const row = (rows, field, name) => {
  const found = rows.filter(item => item[field] === name);
  assert.equal(found.length, 1, name);
  return found[0];
};

test('NX-1200, 2200 and 3200 expose the missing USB 2.0 host counts without changing other connectors', () => {
  for (const [slug, quantity] of [['nx-1200','1'],['nx-2200','2'],['nx-3200','2']]) {
    const current = product(slug);
    const before = evidence.products[slug].before;
    assert.equal(current.io.length, before.io.length + 1, slug);
    assert.deepEqual(current.io.filter(item => item.connector !== 'USB 2.0 호스트'), before.io, `${slug} prior rows`);
    const usb = row(current.io, 'connector', 'USB 2.0 호스트');
    assert.equal(usb.quantity, quantity);
    assert.equal(usb.direction, 'IN/OUT');
    assert.equal(usb.verification, 'VERIFIED');
    assert.match(usb.source, /M1/);
  }
});

test('VARIA-80 gains only data-sheet-supported USB and display/memory facts', () => {
  const current = product('varia-80');
  const before = evidence.products['varia-80'].before;
  assert.equal(current.io.length, before.io.length + 1);
  assert.deepEqual(current.io[0], before.io[0]);
  const usb = row(current.io, 'connector', 'USB Type-C');
  assert.match(usb.signal, /OTG/);
  assert.equal(usb.quantity, '');
  assert.equal(usb.source, 'D1');
  for (const [name, value] of [
    ['패널 종류','TFT-LCD, IPS'], ['밝기','350'], ['명암비','>800:1'],
    ['시야각','>80°/80°/80°/80°'], ['터치 방식','정전식(Capacitive)'],
    ['동시 터치점','>5'], ['백라이트','LED'], ['RAM','4 GB LPDDR4'],
    ['저장 용량','16 GB eMMC'], ['DC 입력','N/A'],
  ]) {
    const spec = row(current.specifications, 'name', name);
    assert.equal(spec.value, value, name);
    assert.equal(spec.source, 'D1', name);
  }
  assert.match(row(current.specifications, 'name', '터치 특성').value, /팜 리젝션.*젖은 손가락.*지문 방지.*항균/);
  for (const slug of ['varia-100','varia-sl50','varia-sl80']) {
    const other = product(slug);
    assert.deepEqual(other.io, evidence.products[slug].before.io, `${slug}: manual gives no model-specific USB connector`);
    assert.equal(other.specifications.some(item => item.name === '밝기'), false, `${slug}: no copied VARIA-80 brightness`);
  }
});

test('all seven AMX products keep short conditions without discarding original facts', () => {
  const total = slugs.reduce((count, slug) => count + product(slug).specifications.filter(item => item.condition).length, 0);
  assert.ok(total <= 20, `condition rows ${total} exceed 20`);
  for (const slug of slugs) {
    const specs = product(slug).specifications;
    assert.ok(specs.every(item => !/\b(?:lb|lbs|°F)\b|\"\s*[×x]/i.test(item.condition)), `${slug}: conversion left in condition`);
    for (const original of evidence.products[slug].before.specifications) assert.ok(specs.some(item => item.name === original.name), `${slug}: lost ${original.name}`);
    if (slug.startsWith('varia-')) {
      assert.ok(row(specs, 'name', '화면비').value.includes(slug === 'varia-sl50' ? '9:16' : '16:10'));
      assert.match(row(specs, 'name', '전원').value, /15\.4\s*W/);
      assert.match(row(specs, 'name', 'NFC').value, /(?:읽기\/쓰기|미지원)/);
    } else {
      assert.equal(row(specs, 'name', '입력 전압').value, '12');
      assert.equal(row(specs, 'name', '입력 전압 범위').value, '9-18VDC (typical)');
      assert.match(row(specs, 'name', '전원 커넥터').value, /리테이닝 스크류/);
    }
  }
});

test('existing AMX specification values remain intact except documented condition-to-value moves', () => {
  const intoValue = new Set(['전원 커넥터', '프로그램 포트', 'USB Host 포트', '메모리 카드',
    '디스플레이 크기', '카메라', 'NFC', '주변광 센서', '근접 센서']);
  for (const slug of slugs) {
    const current = product(slug);
    const before = evidence.products[slug].before;
    assert.deepEqual(current.sources.slice(0, before.sources.length), before.sources, `${slug}: previous sources`);
    for (const original of before.specifications) {
      const actual = row(current.specifications, 'name', original.name);
      const expected = structuredClone(original);
      const movedConversion = /^(?:\d.*(?:"|lb)|\d.*°F)/.test(original.condition);
      if (slug === 'varia-sl80' && original.name === '크기(H×W×D)') expected.verification = 'CONFLICTED';
      else if (movedConversion) {
        expected.value = `${original.value} ${original.unit} (${original.condition})`;
        expected.unit = '';
      } else if (intoValue.has(original.name) && original.condition) expected.value = `${original.value} (${original.condition})`;
      else if (original.name === '전원' && slug.startsWith('varia-')) {
        expected.value = `${original.value} (${original.condition.replace('W', ' W')})`;
        expected.unit = '';
      }
      if (original.condition && !['전류', '발열량'].includes(original.name)) expected.condition = '';
      assert.deepEqual(actual, expected, `${slug}: ${original.name} must match its approved move`);
    }
  }
  const sl80 = product('varia-sl80');
  const oldSize = row(evidence.products['varia-sl80'].before.specifications, 'name', '크기(H×W×D)');
  const imperial = row(sl80.specifications, 'name', '크기(H×W×D) · 인치 표기');
  assert.equal(imperial.value, oldSize.condition);
  assert.equal(imperial.verification, 'CONFLICTED');
  assert.equal(imperial.source, oldSize.source);
  assert.equal(row(sl80.specifications, 'name', '크기(H×W×D)').verification, 'CONFLICTED');
});

test('15 unique SHA-checked PDFs are linked to their exact models in 28 manifest entries', () => {
  const manifest = read('beta/site/docs/manifest.json');
  const historicalUploads = beforeWinstarW04016Uploads(manifest.uploads);
  assert.ok(historicalUploads.length >= evidence.manifest.uploadCount + 28);
  assert.equal(sha(JSON.stringify(historicalUploads.slice(0, evidence.manifest.uploadCount))), evidence.manifest.uploadsSha256);
  assert.equal(sha(JSON.stringify(manifest.mirrors)), evidence.manifest.mirrorsSha256);
  const added = historicalUploads.slice(evidence.manifest.uploadCount, evidence.manifest.uploadCount + 28);
  const files = [...new Set(added.map(item => item.file))];
  assert.equal(files.length, 15);
  assert.equal(new Set(evidence.inventory.documents.map(item => item.sha256)).size, 15);
  assert.equal(files.length, evidence.inventory.documents.length);
  for (const doc of evidence.inventory.documents) {
    const actual = added.filter(item => item.file === doc.file);
    assert.deepEqual(actual.map(item => item.slug).sort(), [...doc.products].sort(), doc.file);
    for (const item of actual) {
      assert.equal(item.kind, doc.kind);
      assert.equal(item.title, doc.title);
      assert.match(item.file, /^manuals\/[a-z0-9-]+\.pdf$/);
    }
    const bytes = readFileSync(new URL(`beta/site/${doc.file}`, root));
    assert.equal(bytes.length, doc.bytes);
    assert.equal(sha(bytes), doc.sha256);
  }
  for (const slug of slugs) assert.ok(uploadedDocumentsFor(slug, manifest).length >= 1, `${slug}: document absent`);
  assert.equal(files.some(file => file.includes('pocket')), false);
});

test('AMX presentation fields and every other product JSON remain fixed', () => {
  for (const slug of slugs) {
    const current = beforeHarmanW03014(product(slug),slug);
    const { specifications, io, sources, ...core } = current;
    assert.equal(sha(JSON.stringify(core)), evidence.products[slug].coreSha256, slug);
    assert.equal(current.keyFacts?.length ?? 0, 0, `${slug}: keyFacts deferred`);
  }
  const dir = new URL('beta/site/detail/data/', root);
  const hash = createHash('sha256');
  for (const name of readdirSync(dir).filter(name => name.endsWith('.json') && !slugs.some(slug => name === `${slug}.json`)).sort()) {
    const slug = name.slice(0,-5);
    const raw = beforeHarmanW03014Raw(beforeBssW04004Raw(beforeSamsungW04010Raw(readFileSync(new URL(name, dir), 'utf8').replace(/\r\n/g, '\n'),slug),slug),slug);
    const historical = crownW03009Slug(slug) ? beforeCrownW03009(beforeCrownW03013(JSON.parse(raw),slug),slug)
      : jblW03010Slug(slug) ? beforeJblW03010(JSON.parse(raw),slug)
      : bssW03011Slug(slug) ? beforeBssW03011(JSON.parse(raw),slug) : null;
    hash.update(name).update('\0').update(historical ? JSON.stringify(historical,null,2)+'\n' : raw);
  }
  assert.equal(hash.digest('hex'), evidence.otherDetailJsonSha256);
});
