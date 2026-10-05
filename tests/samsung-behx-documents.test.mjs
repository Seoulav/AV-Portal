import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { uploadedDocumentsFor } from '../beta/site/detail/pdf-documents.mjs';
import { beforeW005Product } from './w005-history.mjs';

const root = new URL('../', import.meta.url);
const sha = value => createHash('sha256').update(value).digest('hex');
const product = JSON.parse(readFileSync(new URL('beta/site/detail/data/lh43behhlbfxkr.json', root), 'utf8'));
const manifest = JSON.parse(readFileSync(new URL('beta/site/docs/manifest.json', root), 'utf8'));
const expected = new Map([
  ['samsung-behx-h-quick-guide-ko.pdf', 'a2d52816fc2cf33d137c0c6d456c163ac6a54d790cdb4f07f027c0a1a63f1fba'],
  ['samsung-behx-h-installation-guide-ko.pdf', '83e0ea88db6e5a212ee971d8f96362c93b47cff58292e7e19e7eda2367bbd479'],
  ['samsung-behx-h-common-manual-ko.pdf', '245d820827b3715db05bc940dffa7b69a7e795f63e625fe140ad4b5318d549e4'],
]);

test('BEHX-H supplied PDFs are locally viewable and downloadable without invented source URLs', () => {
  const entries = manifest.uploads.filter(item => item.slug === 'lh43behhlbfxkr');
  assert.equal(entries.length, 3);
  assert.deepEqual(new Set(entries.map(item => item.file)), new Set([...expected.keys()].map(name => `manuals/${name}`)));
  const visible = uploadedDocumentsFor('lh43behhlbfxkr', manifest);
  assert.equal(visible.length, 3);
  for (const item of entries) {
    assert.equal(item.kind, 'manual');
    assert.match(item.title, /^삼성전자 /);
    assert.equal(item.locked, undefined);
    const name = item.file.slice('manuals/'.length);
    const bytes = readFileSync(new URL(`beta/site/${item.file}`, root));
    assert.equal(sha(bytes), expected.get(name));
    assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-');
    const shown = visible.find(value => value.action.file === `../${item.file}`);
    assert.equal(shown?.action.kind, 'local');
    assert.equal(shown?.action.locked, undefined);
  }
  assert.match(entries.find(item => item.file.includes('common-manual')).title, /공용/);
});

test('BEHX-H document registration leaves technical data and locked PDFs intact', () => {
  // W-005 only added guide evidence to the existing RF row. Keep this W-033
  // historical hash on the actual current I/O, reversing those two fields only.
  const ioBeforeW005 = beforeW005Product(product, 'lh43behhlbfxkr').io;
  const hashes = {
    io: '67a333db4fd4c8ef27a6cf06a05d3360cd1c1aaf41a81d27a51463057270123a',
    specifications: 'efa7a77b62deb2a674a066da4a6a2b386542c14cd01a478d7f3e6ab299bdcfd2',
    images: 'dc042f1f103a9a26ddee56def9ef2caeec37007bd9f165009dc8dd4f5e0b08d7',
    keyFacts: '573adab65462cec3d5619355922e836a1890e2fbda83869983d7abb581e70447',
    portMap: '74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b',
  };
  for (const [key, hash] of Object.entries(hashes)) assert.equal(sha(JSON.stringify(key === 'io' ? ioBeforeW005 : product[key] ?? null)), hash, key);
  assert.equal(product.io.length, 6);
  assert.equal(product.specifications.length, 21);
  assert.equal(product.portMap, undefined);
  assert.equal(manifest.uploads.filter(item => item.locked === true).length, 12);
});
