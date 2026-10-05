import { isW006Name, withoutW006Uploads } from './w006-history.mjs';
import {beforeW026Raw, beforeW026Product} from './w026-history.mjs';
import { beforeW032Raw } from './w032-history.mjs';
import { beforeW032Mirrors } from './w032-history.mjs';
import { isW029Name, withoutW029Uploads } from './w029-history.mjs';
import { isW030Name } from './w030-history.mjs';
import test from 'node:test';
import { beforeW024Raw } from './mpf-images-history.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { uploadedDocumentsFor } from '../beta/site/detail/pdf-documents.mjs';
import { beforeSamsungW04011Raw } from './samsung-w04011-history.mjs';
import { beforeBssAlignmentRaw } from './bss-alignment-history.mjs';
import { beforeW04021Uploads } from './document-lock-history.mjs';
import { beforeW033Uploads } from './w033-history.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const manifest = read('beta/site/docs/manifest.json');
const removed = {
  'winstar-qhc-standalone-spec-ko.pdf': ['lh43qhcebgcxkr', 'lh75qhcebgcxkr'],
  'winstar-qmc-standalone-spec-ko.pdf': ['lh43qmcebgcxkr', 'lh85qmcebgcxkr'],
  'winstar-videowall-spec-ko.pdf': ['lh55vhcrbgbxkr', 'lh55vmcrbgbxkr'],
};

test('W-016 removes only the three requested PDF files and six upload links', () => {
  assert.equal(beforeW033Uploads(withoutW006Uploads(manifest.uploads)).length, 107);
  assert.equal(manifest.uploads.filter(item => /\/winstar-/.test(item.file)).length, 0);
  assert.equal(sha(JSON.stringify(beforeW04021Uploads(withoutW029Uploads(beforeW033Uploads(withoutW006Uploads(manifest.uploads)))))), 'b49dabfdc5348057ebf402e974364226f02d5e2f6db7ae269c57d8de1bad43df');
  assert.equal(beforeW032Mirrors(manifest.mirrors).length, 111);
  assert.equal(sha(JSON.stringify(beforeW032Mirrors(manifest.mirrors))), 'ad01fc0b4ac91d999ae119a14f4fe858ac5a60f09fd2b7225c38bde02bc566ef');
  for (const file of Object.keys(removed))
    assert.equal(existsSync(new URL(`beta/site/manuals/${file}`, root)), false, file);
});

test('all six affected products retain Samsung documents and no Winstar viewer link', () => {
  for (const [file, slugs] of Object.entries(removed)) for (const slug of slugs) {
    const entries = manifest.uploads.filter(item => item.slug === slug);
    const expectedCount = file === 'winstar-videowall-spec-ko.pdf' ? 3 : 2;
    assert.equal(entries.length, expectedCount, slug);
    assert.ok(entries.every(item => item.title.startsWith('삼성전자 ')), slug);
    const shown = uploadedDocumentsFor(slug, manifest);
    assert.equal(shown.length, expectedCount, slug);
    assert.ok(shown.every(item => !item.action.file.includes('winstar-')), slug);
  }
});

test('all 242 published product JSON files and their source records remain fixed', () => {
  const directory = new URL('beta/site/detail/data/', root);
  const names = readdirSync(directory).filter(name => name.endsWith('.json') && name !== 'lh43behhlbfxkr.json' && !isW029Name(name) && !isW030Name(name) && !isW006Name(name)).sort();
  assert.equal(names.length, 242);
  const digest = createHash('sha256');
  for (const name of names) digest.update(name).update('\0').update(beforeW024Raw(beforeSamsungW04011Raw(beforeBssAlignmentRaw(beforeW032Raw(beforeW026Raw(readFileSync(new URL(name, directory), 'utf8').replace(/\r\n/g, '\n'), name.slice(0, -5)), name.slice(0, -5)), name.slice(0, -5)), name.slice(0, -5)), name.slice(0, -5)));
  assert.equal(digest.digest('hex'), '74cc23674b4a88c852145b0db991c99e0a9383af3affbae2414175ca78ec87fc');
  for (const slug of [...removed['winstar-qhc-standalone-spec-ko.pdf'], ...removed['winstar-qmc-standalone-spec-ko.pdf']]) {
    const product = read(`beta/site/detail/data/${slug}.json`);
    assert.ok(product.sources.some(source => source.code === 'S4' && source.name.includes('윈스타비투비')), slug);
  }
  for (const slug of removed['winstar-videowall-spec-ko.pdf']) {
    const product = read(`beta/site/detail/data/${slug}.json`);
    assert.ok(product.sources.every(source => !source.name.includes('윈스타비투비')), slug);
  }
});
