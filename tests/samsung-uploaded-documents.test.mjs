import {beforeHarmanW03014,beforeHarmanW03014Raw,harmanW03014Slug} from './harman-w03014-history.mjs';
import {shureW04003Slug} from './shure-w04003-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeBssW04004Raw} from './bss-w04004-history.mjs';
import {uploadedDocumentsFor} from '../beta/site/detail/pdf-documents.mjs';
import {beforeSamsungWhiteboard} from './samsung-w03006-history.mjs';
import {beforeAmxW03008,amxW03008Slug} from './amx-w03008-history.mjs';
import {beforeCrownW03009,crownW03009Slug} from './crown-w03009-history.mjs';
import {beforeJblW03010,jblW03010Slug} from './jbl-w03010-history.mjs';
import {beforeBssW03011,bssW03011Slug} from './bss-w03011-history.mjs';
import {beforeCrownW03013} from './crown-w03013-history.mjs';
import {beforeSamsungW04010Raw} from './samsung-w04010-history.mjs';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('beta/site/docs/manifest.json', root), 'utf8'));
const historicalManifest = {...manifest, uploads: manifest.uploads.slice(0, 22)};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const files = {
  'samsung-qbc-qhc-qmc-shc-manual-ko.pdf': 'b82e05f4cf163ca62ff19fa9a1f9b9bb465560eb5776280d903358508afe56e3',
  'samsung-qpdx5k-qhfx-manual-ko.pdf': '0e7037f32df5b1a2e2783903effa799cfa817fe17e0dd8f7fd08bd91894080fc',
  'samsung-vhcr-vmcr-vhce-vmce-manual-ko.pdf': '7dd00ff63cc5f2ffdd068c603eccf8c4f533cad7e7de9b25b6fdb547d3621188',
  'samsung-115qhf-spec-ko.pdf': '4be5f424f5d7bce2c716f4375b1dfc31f126e71f3e7db739b389289331486962',
  'samsung-videowall-product-guide-ko.pdf': '3f5751cbcc8e8ffb8bff77513d889b9d17735ef46c48e0e329601af9d47bd73d',
  'winstar-qhc-standalone-spec-ko.pdf': '67ad244b91da603dea75b322af3098719a27f97a2c6a6c276b36a4cadf625397',
  'winstar-qmc-standalone-spec-ko.pdf': '663b0bd387bcaf7a950002c9138b6afe916b23aec575c849028171bc55c0a10c',
  'winstar-videowall-spec-ko.pdf': 'f8d4a12db1649faf970ba3eca823ead410e06844ceae7e617ddf6279790d2fe8',
};
const manualQmc = 'samsung-qbc-qhc-qmc-shc-manual-ko.pdf';
const manualQhf = 'samsung-qpdx5k-qhfx-manual-ko.pdf';
const manualWall = 'samsung-vhcr-vmcr-vhce-vmce-manual-ko.pdf';
const guideWall = 'samsung-videowall-product-guide-ko.pdf';
const specQhc = 'winstar-qhc-standalone-spec-ko.pdf';
const specQmc = 'winstar-qmc-standalone-spec-ko.pdf';
const specWall = 'winstar-videowall-spec-ko.pdf';
const expected = {
  lh43qhcebgcxkr: [manualQmc, specQhc],
  lh75qhcebgcxkr: [manualQmc, specQhc],
  lh43qmcebgcxkr: [manualQmc, specQmc],
  lh85qmcebgcxkr: [manualQmc, specQmc],
  lh98qmcebgcxkr: [manualQmc],
  lh115qhfebgxkr: [manualQhf, 'samsung-115qhf-spec-ko.pdf'],
  lh55vhcrbgbxkr: [manualWall, specWall, guideWall],
  lh55vmcrbgbxkr: [manualWall, specWall, guideWall],
};

test('W-002 historical eight exact-model Samsung products retain their approved uploaded PDFs', () => {
  assert.equal(Object.keys(expected).length, 8);
  const uploaded = manifest.uploads.slice(5, 22);
  assert.equal(uploaded.length, 17);
  for (const [slug, names] of Object.entries(expected)) {
    const entries = uploaded.filter(entry => entry.slug === slug);
    assert.deepEqual(entries.map(entry => entry.file.slice('manuals/'.length)).sort(), names.slice().sort(), slug);
    const rendered = uploadedDocumentsFor(slug, historicalManifest);
    assert.equal(rendered.length, names.length, slug);
    for (const item of rendered) {
      assert.equal(item.action.kind, 'local');
      assert.match(item.action.file, /^\.\.\/manuals\/[a-z0-9-]+\.pdf$/);
      assert.equal(item.status, 'FOUND');
    }
  }
  assert.deepEqual([...new Set(uploaded.map(entry => entry.slug))].sort(), Object.keys(expected).sort());
  assert.equal(uploadedDocumentsFor('lh32qmcebgcxkr', historicalManifest).length, 0);
  assert.deepEqual(uploaded.filter(entry => entry.slug === 'lh98qmcebgcxkr').map(entry => entry.file), [`manuals/${manualQmc}`]);
  assert.equal(uploaded.some(entry => ['lh32qmcebgcxkr', 'lh98qmcebgcxkr'].includes(entry.slug) && entry.file.endsWith(specQmc)), false);
});

test('W-002 eight published files retain safe paths, readable PDF bytes, and source SHA-256', () => {
  const uploaded = manifest.uploads.slice(5, 22);
  assert.deepEqual([...new Set(uploaded.map(entry => entry.file))].sort(), Object.keys(files).map(name => `manuals/${name}`).sort());
  for (const [name, hash] of Object.entries(files)) {
    const bytes = readFileSync(new URL(`beta/site/manuals/${name}`, root));
    assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-', name);
    assert.equal(sha(bytes), hash, name);
  }
  for (const entry of uploaded) {
    assert.match(entry.file, /^manuals\/[a-z0-9-]+\.pdf$/);
    assert.match(entry.title, /^(삼성전자|윈스타비투비) /);
    assert.ok(['manual', 'reference'].includes(entry.kind));
  }
  assert.equal(uploaded.some(entry => /ropatsch|spatial|mpf|pptx/i.test(`${entry.file} ${entry.title}`)), false);
});

test('existing mirrors and five uploaded document entries stay intact', () => {
  assert.equal(manifest.mirrors.length, 111);
  assert.equal(sha(JSON.stringify(manifest.mirrors)), 'ad01fc0b4ac91d999ae119a14f4fe858ac5a60f09fd2b7225c38bde02bc566ef');
  assert.equal(sha(JSON.stringify(manifest.uploads.slice(0, 5))), '8bd4bd04e067df019e21a71752420adb772b06c802c845d5a54a85e53afc981a');
});

const secondGuide = 'samsung-lcd-signage-product-guide-ko.pdf';
const secondHotel = 'samsung-hoteltv-hu8000f-hu7000f-manual-ko.pdf';
const secondExpected = {
  lh115qhfebgxkr: secondGuide,
  lh32qmcebgcxkr: secondGuide,
  lh43qmcebgcxkr: secondGuide,
  lh85qmcebgcxkr: secondGuide,
  lh98qmcebgcxkr: secondGuide,
  lh43qhcebgcxkr: secondGuide,
  lh75qhcebgcxkr: secondGuide,
  lh55vhcrbgbxkr: secondGuide,
  lh55vmcrbgbxkr: secondGuide,
  hg43u800fnfxkr: secondHotel,
  hg50u800fnfxkr: secondHotel,
  hg65u800fnfxkr: secondHotel,
};

test('W-005 adds exactly twelve model-matched PDF uploads, including four previously uncovered products', () => {
  const added = manifest.uploads.slice(22, 34);
  assert.equal(manifest.uploads.length >= 34, true);
  assert.equal(added.length, 12);
  assert.deepEqual(Object.keys(secondExpected).sort(), added.map(item => item.slug).sort());
  for (const [slug, file] of Object.entries(secondExpected)) {
    const entry = added.find(item => item.slug === slug);
    assert.equal(entry.file, `manuals/${file}`, slug);
    assert.equal(entry.kind, file === secondHotel ? 'manual' : 'reference', slug);
    assert.match(entry.title, /^삼성전자 /, slug);
    assert.match(entry.file, /^manuals\/[a-z0-9-]+\.pdf$/, slug);
    assert.ok(uploadedDocumentsFor(slug, manifest).some(item => item.action.file === `../manuals/${file}`), slug);
  }
  for (const slug of ['lh32qmcebgcxkr', 'hg43u800fnfxkr', 'hg50u800fnfxkr', 'hg65u800fnfxkr']) {
    assert.equal(uploadedDocumentsFor(slug, manifest).length, 1, `${slug}: first document`);
  }
  assert.equal(added.filter(item => item.file.endsWith(secondGuide)).length, 9);
  assert.equal(added.filter(item => item.file.endsWith(secondHotel)).length, 3);
});

test('W-005 published PDFs match supplied bytes and all earlier uploads/products stay unchanged', () => {
  const newFiles = {
    [secondGuide]: '2351a2b725d621d92b5b9737e24dcc18629aabfa88d60e1f577fa98a2098d177',
    [secondHotel]: 'b61ea1be4f423fb59c7912b79c2c9076fd8b9fd9d9ce188bb1525db056bec1ee',
  };
  for (const [name, expectedSha] of Object.entries(newFiles)) {
    const bytes = readFileSync(new URL(`beta/site/manuals/${name}`, root));
    assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-', name);
    assert.equal(sha(bytes), expectedSha, name);
  }
  assert.equal(sha(JSON.stringify(manifest.uploads.slice(0, 22))), '98b1d73f66f68e5248e5cf77331166f8d3d7c384b19fc131b28af1a7d6e98557');
  assert.equal(sha(JSON.stringify(manifest.mirrors)), 'ad01fc0b4ac91d999ae119a14f4fe858ac5a60f09fd2b7225c38bde02bc566ef');
  const dir = new URL('beta/site/detail/data/', root);
  const hash = createHash('sha256');
  const names = readdirSync(dir).filter(name => name.endsWith('.json')).sort();
  assert.equal(names.length, 242);
  for (const name of names) {
    const slug = name.slice(0, -5);
    const raw = beforeBssW04004Raw(beforeSamsungW04010Raw(readFileSync(new URL(name, dir), 'utf8').replace(/\r\n/g, '\n'),slug),slug);
    const historical = ['lh55wmfwbgcxkr', 'lh75wmfwlgcxkr'].includes(slug) || amxW03008Slug(slug) || crownW03009Slug(slug) || jblW03010Slug(slug) || bssW03011Slug(slug) || harmanW03014Slug(slug) || shureW04003Slug(slug)
      ? JSON.stringify(beforeCrownW03013(beforeBssW03011(beforeJblW03010(beforeCrownW03009(beforeAmxW03008(beforeSamsungWhiteboard(beforeHarmanW03014(JSON.parse(raw),slug), slug),slug),slug),slug),slug),slug), null, 2) + '\n'
      : raw;
    hash.update(name).update('\0').update(historical);
  }
  assert.equal(hash.digest('hex'), 'c51a13044da74cb0847f89f5fb6cca501b7081f7ed1cd7afcc1415c69670b662');
});
