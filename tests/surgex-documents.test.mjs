import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { GlobalWorkerOptions, getDocument } from '../beta/site/vendor/pdfjs/pdf.min.mjs';
import { uploadedDocumentsFor } from '../beta/site/detail/pdf-documents.mjs';
import { beforeW13008Product, withoutW13008Uploads } from './w13008-surgex-history.mjs';

const root = new URL('../beta/site/', import.meta.url);
const product = JSON.parse(readFileSync(new URL('detail/data/sx-1216-rti.json', root)));
const manifest = JSON.parse(readFileSync(new URL('docs/manifest.json', root)));
const sha = value => createHash('sha256').update(value).digest('hex');
GlobalWorkerOptions.workerSrc = new URL('../beta/site/vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;

test('SX-1216-RTi supplied sheet resolves ten rear plus one front output without hiding voltage conflict', () => {
  const output = product.specifications.find(row => row.name === '출력 커넥터');
  const voltage = product.specifications.find(row => row.name === '정격 입력');
  assert.match(output.condition, /후면 10구.*전면 1구/);
  assert.equal(product.io.find(row => row.connector === 'IEC C13').quantity, '11');
  assert.equal(voltage.verification, 'CONFLICTED');
  assert.match(voltage.condition, /240V.*230V/);
  assert.deepEqual(product.portMap.items.map(item => item.n), [1, 2, 3, 4]);
  assert.ok(product.portMap.items.every(item => item.side === 'top'));
});

test('supplied Korean brochure opens without a password, stays byte-identical, and does not add a locked upload', async () => {
  const entry = manifest.uploads.find(item => item.file === 'manuals/surgex-brochure-ko.pdf');
  assert.ok(entry);
  assert.equal(entry.slug, 'sx-1216-rti');
  assert.equal(entry.locked, undefined);
  assert.equal(manifest.uploads.filter(item => item.locked === true).length, 12);
  assert.equal(withoutW13008Uploads(manifest.uploads).length, manifest.uploads.length - 1);
  const action = uploadedDocumentsFor('sx-1216-rti', manifest).find(item => item.action.file.endsWith('/surgex-brochure-ko.pdf'));
  assert.equal(action.action.locked, undefined);
  const bytes = readFileSync(new URL('manuals/surgex-brochure-ko.pdf', root));
  assert.equal(sha(bytes), '264adf99b6e9ff9fcefbaef830ff336eaadbc6bc5ffd0fa801f5c3209d86246a');
  const task = getDocument({ data: new Uint8Array(bytes), isEvalSupported: false });
  try { assert.equal((await task.promise).numPages, 8); }
  finally { await task.destroy(); }
});

test('SurgeX inverse checks only approved fields and exposes unrelated changes', () => {
  const prior = beforeW13008Product(product, 'sx-1216-rti');
  assert.notDeepEqual(prior.portMap, product.portMap);
  const unrelated = structuredClone(product);
  unrelated.model = 'INVALID';
  assert.equal(beforeW13008Product(unrelated, 'sx-1216-rti').model, 'INVALID');
  const altered = structuredClone(product);
  altered.portMap.items[0].x1 += 1;
  assert.throws(() => beforeW13008Product(altered, 'sx-1216-rti'), /unexpected W-008 portMap change/);
});
