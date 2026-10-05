import { isW029Name, withoutW029Uploads } from './w029-history.mjs';
import { isW030Name } from './w030-history.mjs';
import test from 'node:test';
import { beforeW024Raw } from './mpf-images-history.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { GlobalWorkerOptions, PasswordResponses, getDocument } from '../beta/site/vendor/pdfjs/pdf.min.mjs';
import { uploadedDocumentsFor } from '../beta/site/detail/pdf-documents.mjs';
import { verifyPdfLock } from '../beta/pdf-lock.mjs';
import { beforeSamsungW04017Raw } from './samsung-w04017-history.mjs';
import { beforeBssAlignmentRaw } from './bss-alignment-history.mjs';

GlobalWorkerOptions.workerSrc = new URL('../beta/site/vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
const root = new URL('../beta/site/', import.meta.url);
const targets = [
  'samsung-115qhf-spec-ko.pdf',
  'samsung-lcd-signage-product-guide-ko.pdf',
  'samsung-videowall-product-guide-ko.pdf',
];
const targetSet = new Set(targets);
const sha = value => createHash('sha256').update(value).digest('hex');

test('the three authorized sales documents require a PDF password before PDF.js can read any page', async () => {
  for (const file of targets) {
    const bytes = readFileSync(new URL(`manuals/${file}`, root));
    assert.match(bytes.toString('latin1'), /\/Encrypt\b/, file);
    assert.match(bytes.toString('latin1'), /\/V 5\s+\/R 6\s+\/Length 256\b/, `${file}: AES-256 encryption dictionary`);
    const task = getDocument({ data: new Uint8Array(bytes), isEvalSupported: false });
    try {
      await assert.rejects(task.promise, error =>
        error?.name === 'PasswordException' && error.code === PasswordResponses.NEED_PASSWORD,
      file);
    } finally { await task.destroy(); }
  }
});

test('PDF.js requests a new password after an incorrect attempt', async () => {
  const bytes = readFileSync(new URL(`manuals/${targets[0]}`, root));
  const task = getDocument({ data: new Uint8Array(bytes), isEvalSupported: false });
  const settled = task.promise.catch(() => {});
  const reasons = [];
  const retry = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('no password retry')), 10000);
    task.onPassword = (updatePassword, reason) => {
      reasons.push(reason);
      if (reason === PasswordResponses.NEED_PASSWORD) updatePassword('incorrect-example');
      else { clearTimeout(timeout); resolve(); }
    };
  });
  try {
    await retry;
    assert.deepEqual(reasons, [PasswordResponses.NEED_PASSWORD, PasswordResponses.INCORRECT_PASSWORD]);
  } finally { await task.destroy(); await settled; }
});

test('all other posted PDFs, product JSON, and document links keep their prior bytes', () => {
  const manuals = new URL('manuals/', root);
  const files = readdirSync(manuals).filter(name => name.endsWith('.pdf')).sort();
  assert.equal(files.length, 56);
  const others = createHash('sha256');
  for (const name of files.filter(name => !targetSet.has(name)))
    others.update(name).update(Buffer.from([0])).update(readFileSync(new URL(name, manuals)));
  assert.equal(others.digest('hex'), '7d9e6ac1869ed1d4661a7e8232617894572f9953f60659888b98457cbca652a2');

  const details = new URL('detail/data/', root);
  const names = readdirSync(details).filter(name => name.endsWith('.json') && name !== 'lh43behhlbfxkr.json' && !isW029Name(name) && !isW030Name(name)).sort();
  assert.equal(names.length, 242);
  const productHash = createHash('sha256');
  for (const name of names)
    productHash.update(name).update(Buffer.from([0])).update(beforeW024Raw(beforeSamsungW04017Raw(beforeBssAlignmentRaw(readFileSync(new URL(name, details), 'utf8').replace(/\r\n/g, '\n'), name.slice(0, -5)), name.slice(0, -5)), name.slice(0, -5)));
  assert.equal(productHash.digest('hex'), '3d331d708f8d1603975f9ba85fcd3944de8f3e82c9a0cfe2a392a082d0169701');
  const manifest = JSON.parse(readFileSync(new URL('docs/manifest.json', root), 'utf8'));
  const manifestWithoutCurrentLockLabels = JSON.stringify({ ...manifest, uploads: withoutW029Uploads(manifest.uploads) }, null, 2) + '\n';
  const withoutLockLabels = manifestWithoutCurrentLockLabels.replace(/^      "locked": true,\r?\n/gm, '');
  assert.equal(sha(Buffer.from(withoutLockLabels)), '4c64584eb766ad94f2c5fac66f02d687bb81e4b2fce60d71a6149155cac1ddbb');
});

test('the twelve uploads of the three encrypted files are marked locked, without changing other uploads', () => {
  const manifest = JSON.parse(readFileSync(new URL('docs/manifest.json', root), 'utf8'));
  assert.equal(manifest.uploads.length, 107);
  assert.equal(manifest.uploads.filter(entry => entry.locked === true).length, 12);
  for (const entry of manifest.uploads)
    assert.equal(entry.locked === true, targetSet.has(entry.file.replace(/^manuals\//, '')), `${entry.slug}: ${entry.file}`);
});

test('uploaded locked documents carry their lock state to the detail action', () => {
  const manifest = JSON.parse(readFileSync(new URL('docs/manifest.json', root), 'utf8'));
  const documents = uploadedDocumentsFor('lh115qhfebgxkr', manifest);
  const locked = documents.find(item => item.action.file.endsWith('/samsung-lcd-signage-product-guide-ko.pdf'));
  const plain = documents.find(item => item.action.file.endsWith('/samsung-qpdx5k-qhfx-manual-ko.pdf'));
  assert.equal(locked.action.locked, true);
  assert.equal(plain.action.locked, undefined);
});

test('the PDF lock verifier accepts both matching states and rejects both mismatches', async () => {
  const encrypted = readFileSync(new URL(`manuals/${targets[0]}`, root));
  const plain = readFileSync(new URL('manuals/samsung-qpdx5k-qhfx-manual-ko.pdf', root));
  await verifyPdfLock('encrypted.pdf', true, encrypted);
  await verifyPdfLock('plain.pdf', undefined, plain);
  await assert.rejects(verifyPdfLock('plain-labelled-locked.pdf', true, plain), /plain-labelled-locked\.pdf/);
  await assert.rejects(verifyPdfLock('encrypted-unlabelled.pdf', undefined, encrypted), /encrypted-unlabelled\.pdf/);
});
