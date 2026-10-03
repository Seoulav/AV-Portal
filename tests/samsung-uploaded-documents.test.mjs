import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {uploadedDocumentsFor} from '../beta/site/detail/pdf-documents.mjs';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('beta/site/docs/manifest.json', root), 'utf8'));
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

test('only the eight exact-model Samsung products receive their approved uploaded PDFs', () => {
  assert.equal(Object.keys(expected).length, 8);
  const uploaded = manifest.uploads.slice(5);
  assert.equal(uploaded.length, 17);
  for (const [slug, names] of Object.entries(expected)) {
    const entries = uploaded.filter(entry => entry.slug === slug);
    assert.deepEqual(entries.map(entry => entry.file.slice('manuals/'.length)).sort(), names.slice().sort(), slug);
    const rendered = uploadedDocumentsFor(slug, manifest);
    assert.equal(rendered.length, names.length, slug);
    for (const item of rendered) {
      assert.equal(item.action.kind, 'local');
      assert.match(item.action.file, /^\.\.\/manuals\/[a-z0-9-]+\.pdf$/);
      assert.equal(item.status, 'FOUND');
    }
  }
  assert.deepEqual([...new Set(uploaded.map(entry => entry.slug))].sort(), Object.keys(expected).sort());
  assert.equal(uploadedDocumentsFor('lh32qmcebgcxkr', manifest).length, 0);
  assert.deepEqual(uploaded.filter(entry => entry.slug === 'lh98qmcebgcxkr').map(entry => entry.file), [`manuals/${manualQmc}`]);
  assert.equal(uploaded.some(entry => ['lh32qmcebgcxkr', 'lh98qmcebgcxkr'].includes(entry.slug) && entry.file.endsWith(specQmc)), false);
});

test('all eight published files have safe paths, readable PDF bytes, and the source SHA-256', () => {
  const uploaded = manifest.uploads.slice(5);
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
