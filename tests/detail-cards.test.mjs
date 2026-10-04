import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as detailModel from '../prototype/brc-am7/product-detail-model.mjs';

const source = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('detail template reserves 06/07 for optional settings and keeps unnumbered documents', async () => {
  const html = await source('prototype/brc-am7/index.html');
  const order = [...html.matchAll(/data-card="(0[1-7])"/g)].map(match => match[1]);
  assert.deepEqual(order, ['01', '02', '03', '04', '05']);
  assert.match(html, /id="documents"[^>]*data-supplemental/);
  assert.match(html, /id="documents-title">문서<\/h2>/);
  assert.doesNotMatch(html, /role="tablist"|role="tabpanel"/);
  assert.match(html, /id="sources"/);
});

test('visible cards follow actual content and preserve their fixed numbers', () => {
  const minimal = { korean: '설명', overview: '', images: [], io: [], specifications: [], features: [], relatedProducts: [], quickDocuments: [], additionalDocuments: [] };
  assert.deepEqual(detailModel.visibleDetailCards(minimal), ['overview']);
  assert.deepEqual(detailModel.visibleDetailCards({ ...minimal, images: [{ role: 'Front' }], io: [{ connector: 'HDMI' }], features: [{ text: '기능' }] }), ['overview', 'gallery', 'features']);
});

test('connector tone uses explicit signal or protocol, never connector shape', () => {
  assert.equal(detailModel.connectorSignalTone({ connector: 'BNC', signal: 'Word clock' }), 'sync');
  assert.equal(detailModel.connectorSignalTone({ connector: 'RJ-45', signal: 'Dante audio' }), 'audio');
  assert.equal(detailModel.connectorSignalTone({ connector: 'BNC', signal: 'SDI' }), 'sdi');
  assert.equal(detailModel.connectorSignalTone({ connector: 'XLR' }), 'neutral');
});
