import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getDocument, GlobalWorkerOptions } from '../beta/site/vendor/pdfjs/pdf.min.mjs';

const vendor = new URL('../beta/site/vendor/pdfjs/', import.meta.url);
GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', vendor).href;
const cMapUrl = fileURLToPath(new URL('cmaps/', vendor));
const standardFontDataUrl = fileURLToPath(new URL('standard_fonts/', vendor));

test('PDF.js support assets decode Korean text in all three Sony manuals', async () => {
  for (const file of ['sony-srg-a40-a12-manual-ko.pdf', 'sony-srg-x40uh-h40uh-manual-ko.pdf', 'sony-rm-ip500-manual-ko.pdf']) {
    const data = new Uint8Array(readFileSync(new URL(`../beta/site/docs/${file}`, import.meta.url)));
    const pdf = await getDocument({ data, cMapUrl, cMapPacked: true, standardFontDataUrl }).promise;
    const page = await pdf.getPage(4);
    const body = (await page.getTextContent()).items.map(item => item.str).join(' ');
    assert.ok((body.match(/[가-힣]/g) ?? []).length > 100, `${file}: Korean body glyphs must decode`);
  }
});

test('the public viewer requests the same-origin CMap and font assets without changing PDF security settings', () => {
  const source = readFileSync(new URL('../beta/site/shared/pdf-viewer.mjs', import.meta.url), 'utf8');
  assert.match(source, /cMapUrl: new URL\('\.\.\/vendor\/pdfjs\/cmaps\/', import\.meta\.url\)\.href/);
  assert.match(source, /cMapPacked: true/);
  assert.match(source, /standardFontDataUrl: new URL\('\.\.\/vendor\/pdfjs\/standard_fonts\/', import\.meta\.url\)\.href/);
  assert.match(source, /isEvalSupported: false/);
});
