import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { getDocument, GlobalWorkerOptions } from '../beta/site/vendor/pdfjs/pdf.min.mjs';
import { uploadedDocumentsFor } from '../beta/site/detail/pdf-documents.mjs';
import { withoutXdmCommandGuideUpload } from './xdm-command-guide-history.mjs';

GlobalWorkerOptions.workerSrc = new URL('../beta/site/vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
const root = new URL('../', import.meta.url);
const file = 'manuals/rtcom-xdm-command-guide-1013.pdf';
const expectedSha = '986bb5e5727dc86449e4ad72572e7125ff24f192f32250dee7d3849952f651ec';

test('the supplied XDM guide is viewable only on XDM and retains its original bytes', async () => {
  const manifest = JSON.parse(readFileSync(new URL('beta/site/docs/manifest.json', root), 'utf8'));
  const bytes = readFileSync(new URL(`beta/site/${file}`, root));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedSha);
  assert.equal(bytes.length, 1025992);
  assert.equal(manifest.uploads.length - withoutXdmCommandGuideUpload(manifest.uploads).length, 1);
  assert.equal(manifest.uploads.filter(entry => entry.locked === true).length, 12);

  const xdm = uploadedDocumentsFor('rtcom-xdm', manifest).filter(item => item.action.file.endsWith(file));
  assert.equal(xdm.length, 1);
  assert.equal(xdm[0].status, 'FOUND');
  assert.equal(xdm[0].action.kind, 'local');
  assert.equal(xdm[0].action.locked, undefined);
  assert.equal(uploadedDocumentsFor('rtcom-qms-88ux', manifest).some(item => item.action.file.endsWith(file)), false);

  const loading = getDocument({
    data: new Uint8Array(bytes), isEvalSupported: false,
    cMapUrl: new URL('../beta/site/vendor/pdfjs/cmaps/', import.meta.url).href,
    cMapPacked: true,
    standardFontDataUrl: new URL('../beta/site/vendor/pdfjs/standard_fonts/', import.meta.url).href,
  });
  try {
    const pdf = await loading.promise;
    assert.equal(pdf.numPages, 73);
    const page = await pdf.getPage(45);
    const text = (await page.getTextContent()).items.map(item => item.str).join('').replace(/\s+/g, '');
    assert.match(text, /XDM-WOS100WallOverlayCommand/);
    assert.match(text, /OWOxxx-xxx/);
  } finally {
    await loading.destroy();
  }
});

test('the historical upload inverse rejects changed XDM guide metadata', () => {
  const manifest = JSON.parse(readFileSync(new URL('beta/site/docs/manifest.json', root), 'utf8'));
  const changed = structuredClone(manifest.uploads);
  changed.find(entry => entry.file === file).locked = true;
  assert.throws(() => withoutXdmCommandGuideUpload(changed), /metadata/);
});
