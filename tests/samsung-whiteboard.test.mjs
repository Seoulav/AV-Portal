import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { uploadedDocumentsFor } from '../beta/site/detail/pdf-documents.mjs';
import { beforeAmxW03008, amxW03008Slug } from './amx-w03008-history.mjs';
import { beforeCrownW03009, crownW03009Slug } from './crown-w03009-history.mjs';
import { beforeJblW03010, jblW03010Slug } from './jbl-w03010-history.mjs';
import { beforeBssW03011, bssW03011Slug } from './bss-w03011-history.mjs';
import { beforeCrownW03013 } from './crown-w03013-history.mjs';

const root = new URL('../', import.meta.url);
const evidence = JSON.parse(readFileSync(new URL('Work/기록/W-20261003-006-evidence.json', root), 'utf8'));
const slugs = ['lh55wmfwbgcxkr', 'lh75wmfwlgcxkr'];
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const product = slug => read(`beta/site/detail/data/${slug}.json`);
const row = (rows, field, name) => {
  const matches = rows.filter(item => item[field] === name);
  assert.equal(matches.length, 1, name);
  return matches[0];
};
const hasManual = item => String(item.source).split(',').map(code => code.trim()).includes('M1');

test('WMFX manual verifies the four exact existing specifications and adds three model-specific rows', () => {
  for (const slug of slugs) {
    const current = product(slug);
    const before = evidence.products[slug].before;
    assert.equal(current.specifications.length, before.specifications.length + 3, slug);
    for (const name of ['해상도', '수평 주사 주파수', '수직 주사 주파수', '동작 습도']) {
      const actual = row(current.specifications, 'name', name);
      const previous = row(before.specifications, 'name', name);
      assert.equal(actual.value, previous.value, `${slug}: ${name} value preserved`);
      assert.equal(actual.verification, 'VERIFIED', `${slug}: ${name}`);
      assert.ok(hasManual(actual), `${slug}: ${name} manual source`);
    }
    for (const [name, value, unit] of [
      ['디스플레이 면적', slug === slugs[0] ? '1209.6 x 680.4' : '1650.24 x 928.26', 'mm'],
      ['보관 온도', '-20 - 45', '℃'],
      ['보관 습도', '5 - 95', '%'],
    ]) {
      const actual = row(current.specifications, 'name', name);
      assert.equal(actual.value, value, `${slug}: ${name}`);
      assert.equal(actual.unit, unit, `${slug}: ${name}`);
      assert.equal(actual.verification, 'VERIFIED');
      assert.ok(hasManual(actual));
    }
    assert.equal(current.specifications.filter(item => item.verification === 'REVIEW REQUIRED').length, slug === slugs[0] ? 21 : 0);
    assert.deepEqual(row(current.specifications, 'name', '전원 사양'), row(before.specifications, 'name', '전원 사양'));
    assert.deepEqual(row(current.specifications, 'name', '최대 픽셀 주파수'), row(before.specifications, 'name', '최대 픽셀 주파수'));
    const changed = new Set(['해상도', '수평 주사 주파수', '수직 주사 주파수', '동작 습도']);
    for (const original of before.specifications.filter(item => !changed.has(item.name))) {
      assert.deepEqual(row(current.specifications, 'name', original.name), original, `${slug}: ${original.name} unchanged`);
    }
  }
});

test('rear HDMI, LAN, audio, USB, SERVICE and TOUCH follow the exact WMFX drawings without deleting possible front ports', () => {
  for (const slug of slugs) {
    const current = product(slug);
    const before = evidence.products[slug].before;
    assert.equal(current.io.length, 9, `${slug}: seven prior plus SERVICE and TOUCH`);
    for (const connector of ['HDMI 출력', 'HDMI', '오디오 출력', 'RJ45(LAN)', 'SERVICE', 'TOUCH']) {
      const item = row(current.io, 'connector', connector);
      assert.equal(item.quantity, '1', `${slug}: ${connector}`);
      assert.equal(item.verification, 'VERIFIED', `${slug}: ${connector}`);
      assert.ok(hasManual(item), `${slug}: ${connector} manual source`);
    }
    assert.match(row(current.io, 'connector', 'RJ45(LAN)').availability, /10\/100 Mbps.*CAT 7\(STP\)/);
    assert.match(row(current.io, 'connector', 'HDMI').signal, /^후면 /, `${slug}: card count scoped to rear`);
    assert.match(row(current.io, 'connector', 'USB').availability, /후면.*1\.0 A/);
    assert.equal(row(current.io, 'connector', 'USB').quantity, row(before.io, 'connector', 'USB').quantity, `${slug}: existing front/option count preserved`);
    for (const connector of ['USB-C 허브', 'RS-232C 입력']) {
      const item = row(current.io, 'connector', connector);
      assert.equal(item.verification, 'REVIEW REQUIRED', `${slug}: ${connector}`);
      assert.match(item.availability, /매뉴얼 후면 단자표에 없음.*전면\/옵션 트레이 여부 미확인/);
    }
    assert.equal(row(current.io, 'connector', 'SERVICE').group, 'Control');
    assert.equal(row(current.io, 'connector', 'TOUCH').direction, 'OUT');
    assert.equal(current.sources.filter(source => source.code === 'M1').length, 1);
  }
  const current75 = product(slugs[1]);
  assert.equal(row(evidence.products[slugs[1]].before.io, 'connector', 'HDMI').quantity, '2');
  assert.equal(row(current75.io, 'connector', 'HDMI').quantity, '1');
  assert.ok(current75.issues.some(issue => issue.code === 'HDMI-REAR-COUNT' && issue.status === 'REVIEW REQUIRED' && /2.*1/.test(issue.detail)));
  const current55 = product(slugs[0]);
  assert.doesNotMatch(row(current55.io, 'connector', 'HDMI').availability, /2\.0|HDCP 2\.2/);
  assert.doesNotMatch(row(current55.io, 'connector', '오디오 출력').availability, /스테레오 미니 잭/);
  assert.ok(current55.issues.some(issue => issue.code === 'WMFX-IO-DETAILS' && issue.status === 'REVIEW REQUIRED' && /HDMI.*2\.0.*HDCP 2\.2.*스테레오 미니 잭/.test(issue.detail)));
});

test('55-inch facts use verified display axes; unrelated product fields and 75-inch facts stay fixed', () => {
  for (const slug of slugs) {
    const current = product(slug);
    const { specifications, io, sources, issues, keyFacts, ...core } = current;
    assert.equal(sha(JSON.stringify(core)), evidence.products[slug].coreSha256, slug);
    if (slug === slugs[1]) assert.deepEqual(keyFacts, evidence.products[slug].before.keyFacts);
  }
  const current = product(slugs[0]);
  assert.deepEqual(current.keyFacts.map(fact => fact.label), ['해상도', '화면 크기', '설치 방향']);
  for (const fact of current.keyFacts) {
    assert.deepEqual(Object.keys(fact).sort(), ['label', 'unit', 'value']);
    const original = current.specifications.find(spec => spec.value === fact.value && ['FOUND', 'VERIFIED'].includes(spec.verification));
    assert.ok(original, `${fact.label}: verified evidence row`);
  }
});

test('one intact 70-page Korean manual is uploaded for only the two whiteboards', () => {
  const manifest = read('beta/site/docs/manifest.json');
  assert.ok(manifest.uploads.length >= evidence.manifest.uploadCount + 2);
  assert.equal(sha(JSON.stringify(manifest.uploads.slice(0, evidence.manifest.uploadCount))), evidence.manifest.uploadsSha256);
  assert.equal(sha(JSON.stringify(manifest.mirrors)), evidence.manifest.mirrorsSha256);
  const added = manifest.uploads.slice(evidence.manifest.uploadCount, evidence.manifest.uploadCount + 2);
  assert.deepEqual(added.map(entry => entry.slug).sort(), slugs);
  for (const entry of added) {
    assert.equal(entry.file, evidence.manual.published);
    assert.equal(entry.kind, 'manual');
    assert.match(entry.title, /삼성전자.*BN81-28453F-02/);
    assert.match(entry.file, /^manuals\/[a-z0-9-]+\.pdf$/);
    assert.ok(uploadedDocumentsFor(entry.slug, manifest).some(item => item.action.file === `../${entry.file}`));
  }
  const bytes = readFileSync(new URL(`beta/site/${evidence.manual.published}`, root));
  assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-');
  assert.equal(sha(bytes), evidence.manual.sha256);
});

test('every other detail JSON retains its pre-change Git LF bytes', () => {
  const dir = new URL('beta/site/detail/data/', root);
  const hash = createHash('sha256');
  for (const name of readdirSync(dir).filter(name => name.endsWith('.json') && !slugs.some(slug => name === `${slug}.json`)).sort()) {
    const slug = name.slice(0,-5);
    const raw = readFileSync(new URL(name, dir), 'utf8').replace(/\r\n/g, '\n');
    const historical = amxW03008Slug(slug) || crownW03009Slug(slug) || jblW03010Slug(slug) || bssW03011Slug(slug) ? JSON.stringify(beforeCrownW03013(beforeBssW03011(beforeJblW03010(beforeCrownW03009(beforeAmxW03008(JSON.parse(raw),slug),slug),slug),slug),slug),null,2)+'\n' : raw;
    hash.update(name).update('\0').update(historical);
  }
  assert.equal(hash.digest('hex'), evidence.otherDetailJsonSha256);
});
