import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {viewerHrefFor, resolveViewerPdf, isViewerPdfLocked} from '../beta/site/pdfjs/web/viewer-link.mjs';

const analogWay = 'https://seoulav.github.io/AV-Portal/analogway/';
const viewer = 'https://seoulav.github.io/AV-Portal/pdfjs/web/viewer.html';

test('a local document opens through the same-origin PDF.js page', () => {
  const href = viewerHrefFor('../docs/eikos-4k-specification-79a762641b70.pdf', analogWay);
  assert.equal(href, `${viewer}?file=%2FAV-Portal%2Fdocs%2Feikos-4k-specification-79a762641b70.pdf`);
  assert.equal(resolveViewerPdf(new URL(href).search, viewer)?.href,
    'https://seoulav.github.io/AV-Portal/docs/eikos-4k-specification-79a762641b70.pdf');
  assert.equal(resolveViewerPdf('?file=%2FAV-Portal%2Fmanuals%2Fa.pdf', viewer)?.pathname,
    '/AV-Portal/manuals/a.pdf');
});

test('the viewer refuses off-site, unrelated and malformed PDF addresses', () => {
  for (const file of [
    'https://example.com/a.pdf', '//example.com/a.pdf', '/AV-Portal/analogway/app.mjs',
    '/AV-Portal/docs/../private.pdf', '/AV-Portal/docs/not-a-pdf.txt',
    '/AV-Portal/docs/a.pdf?token=secret', '/AV-Portal/docs/a%2fb.pdf'
  ]) assert.equal(resolveViewerPdf(`?file=${encodeURIComponent(file)}`, viewer), null, file);
  assert.equal(resolveViewerPdf('?file=%2FAV-Portal%2Fdocs%2Fa.pdf&file=%2FAV-Portal%2Fdocs%2Fb.pdf', viewer), null);
  assert.equal(viewerHrefFor('https://example.com/a.pdf', analogWay), null);
});

test('standalone viewer passes manifest lock state to the shared PDF.js viewer', async () => {
  const manifest=JSON.parse(await readFile(new URL('../beta/site/docs/manifest.json',import.meta.url),'utf8'));
  const locked=resolveViewerPdf('?file=%2FAV-Portal%2Fmanuals%2Fsamsung-115qhf-spec-ko.pdf',viewer);
  const unlocked=resolveViewerPdf('?file=%2FAV-Portal%2Fmanuals%2Fjbl-ae-series-u-bracket-handbook.pdf',viewer);
  const mirrored=resolveViewerPdf('?file=%2FAV-Portal%2Fdocs%2Feikos-4k-specification-79a762641b70.pdf',viewer);
  assert.equal(isViewerPdfLocked(locked,viewer,manifest),true);
  assert.equal(isViewerPdfLocked(unlocked,viewer,manifest),false);
  assert.equal(isViewerPdfLocked(mirrored,viewer,manifest),false);
  assert.equal(isViewerPdfLocked(locked,viewer,null),true,'manifest failure must hide the source link until PDF opens');
});
