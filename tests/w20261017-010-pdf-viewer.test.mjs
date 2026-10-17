import assert from 'node:assert/strict';
import test from 'node:test';
import {viewerHrefFor, resolveViewerPdf} from '../beta/site/pdfjs/web/viewer-link.mjs';

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
