import { isW029Name } from './w029-history.mjs';
import {beforeHarmanW03014,beforeHarmanW03014Raw,harmanW03014Slug} from './harman-w03014-history.mjs';
import {shureW04003Slug} from './shure-w04003-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {beforeBssW04004Raw} from './bss-w04004-history.mjs';
import {beforeBssAlignmentRaw} from './bss-alignment-history.mjs';
import { beforeSamsung115ManualSpecs } from './samsung-w03003-history.mjs';
import { beforeSamsungWhiteboard } from './samsung-w03006-history.mjs';
import { beforeAmxW03008, amxW03008Slug } from './amx-w03008-history.mjs';
import { beforeCrownW03009, crownW03009Slug } from './crown-w03009-history.mjs';
import { beforeJblW03010, jblW03010Slug } from './jbl-w03010-history.mjs';
import { beforeBssW03011, bssW03011Slug } from './bss-w03011-history.mjs';
import { beforeCrownW03013 } from './crown-w03013-history.mjs';
import { beforeSamsungW04010Raw } from './samsung-w04010-history.mjs';

const root = new URL('../', import.meta.url);
const slugs = ['hg43u800fnfxkr', 'hg50u800fnfxkr', 'hg65u800fnfxkr'];
const evidence = JSON.parse(readFileSync(new URL('Work/기록/W-20261003-004-evidence.json', root), 'utf8'));
const sha = data => createHash('sha256').update(data).digest('hex');
const load = slug => JSON.parse(readFileSync(new URL(`beta/site/detail/data/${slug}.json`, root), 'utf8'));
const row = (product, connector) => {
  const rows = product.io.filter(item => item.connector === connector);
  assert.equal(rows.length, 1, `${product.model}: ${connector}`);
  return rows[0];
};

test('three U800F hotel TVs have the manual HDMI, physical ports and unchanged protected fields', () => {
  const reference = load(slugs[0]).io;
  for (const slug of slugs) {
    const product = load(slug);
    assert.equal(product.io.length, 13, `${slug}: 9 existing + 4 U800F rows`);
    assert.deepEqual(product.io, reference, `${slug}: shared series I/O`);
    const { io, sources, issues, ...core } = product;
    assert.equal(sha(JSON.stringify(core)), evidence.products[slug].coreSha256, `${slug}: protected fields`);
    assert.equal(sha(JSON.stringify(product.specifications)), evidence.products[slug].specificationsSha256, `${slug}: specifications`);
    assert.equal(issues.filter(item => item.code === 'HDMI-COUNT').length, 1);
    assert.equal(issues.find(item => item.code === 'HDMI-COUNT').status, 'RESOLVED');
    assert.equal(sha(JSON.stringify(issues.filter(item => item.code !== 'HDMI-COUNT'))), evidence.products[slug].previousOtherIssuesSha256, `${slug}: other issues`);
    const hdmi = row(product, 'HDMI 입력');
    assert.equal(hdmi.quantity, '3');
    assert.equal(hdmi.direction, 'IN');
    assert.match(hdmi.availability, /HDMI 3.*eARC/);
    for (const connector of ['HDMI 입력', 'DATA', 'VOL-CTRL', 'VARIABLE']) {
      const item = row(product, connector);
      assert.equal(item.verification, 'VERIFIED', `${slug}: ${connector}`);
      assert.equal(item.source, 'M1', `${slug}: ${connector} manual`);
    }
    for (const u700fOnly of ['HP-ID', 'HEADPHONE JACK', 'SERVICE']) {
      assert.equal(product.io.some(item => item.connector === u700fOnly), false, `${slug}: ${u700fOnly} is U700F-only`);
    }
    assert.equal(row(product, 'RF 입력').quantity, '2');
    assert.match(row(product, 'RF 입력').availability, /위성.*미지원/);
    assert.equal(row(product, 'Ethernet 브리지(LAN-Out)').quantity, '1');
    assert.match(row(product, 'USB').availability, /5V 0\.5A.*5V 1A/);
    assert.equal(product.io.filter(item => item.connector === '무선(물리 단자 없음)').length, 2);
    assert.equal(row(product, 'RJ12').verification, 'REVIEW REQUIRED');
    assert.match(row(product, 'RJ12').availability, /DATA.*동일 여부 미확인/);
    const manual = product.sources.find(source => source.code === 'M1');
    assert.ok(manual);
    assert.match(manual.name, /BN81-28062C-00/);
    assert.match(manual.scope, /11.*12.*13/);
  }
});

test('all other detail JSON files retain their pre-change Git LF bytes', () => {
  const dir = new URL('beta/site/detail/data/', root);
  const hash = createHash('sha256');
  for (const file of readdirSync(dir).filter(name => name.endsWith('.json') && name !== 'lh43behhlbfxkr.json' && !isW029Name(name) && !slugs.some(slug => name === `${slug}.json`)).sort()) {
    const slug = file.slice(0, -5);
    const historical = beforeCrownW03013(beforeBssW03011(beforeJblW03010(beforeCrownW03009(beforeAmxW03008(beforeSamsung115ManualSpecs(beforeSamsungWhiteboard(beforeHarmanW03014(JSON.parse(beforeBssW04004Raw(beforeSamsungW04010Raw(beforeBssAlignmentRaw(readFileSync(new URL(file, dir), 'utf8'),slug),slug),slug)),slug), slug), slug),slug),slug),slug),slug),slug);
    const bytes = slug === 'lh115qhfebgxkr' || ['lh55wmfwbgcxkr', 'lh75wmfwlgcxkr'].includes(slug) || amxW03008Slug(slug) || crownW03009Slug(slug) || jblW03010Slug(slug) || bssW03011Slug(slug) || harmanW03014Slug(slug) || shureW04003Slug(slug)
      ? JSON.stringify(historical, null, 2) + '\n'
      : beforeBssW04004Raw(beforeSamsungW04010Raw(beforeBssAlignmentRaw(readFileSync(new URL(file, dir), 'utf8').replace(/\r\n/g, '\n'),slug),slug),slug);
    hash.update(file).update('\0').update(bytes);
  }
  assert.equal(hash.digest('hex'), evidence.otherDetailJsonSha256);
});
