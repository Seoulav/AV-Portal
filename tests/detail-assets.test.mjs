import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { detailAssetPairs, transformDetailAsset } from '../beta/detail-asset-transforms.mjs';

const root = new URL('../', import.meta.url);
const file = path => readFile(new URL(path, root), 'utf8');

test('prototype source retains public detail deep-link and failure protections', async () => {
  const source = await file('prototype/brc-am7/app.js');
  assert.match(source, /revealHash/);
  assert.match(source, /Library로 돌아가기/);
  assert.match(source, /scrollRestoration = 'manual'/);
});

test('all generated detail assets match the builder source and shared transforms', async () => {
  const normalized = text => text.replace(/\r\n/g, '\n');
  for (const [sourcePath, generatedPath, kind] of detailAssetPairs) {
    const source = await file(sourcePath);
    const generated = await file(generatedPath);
    assert.equal(normalized(generated), normalized(transformDetailAsset(source, kind)), generatedPath);
  }
});

test('public app has no prototype content fallback', async () => {
  const source = await file('prototype/brc-am7/app.js');
  const generated = transformDetailAsset(source, 'app');
  assert.match(source, /\.\/content\.json/);
  assert.doesNotMatch(generated, /content\.json/);
  assert.match(generated, /location\.replace\('\.\.\/'\)/);
});

test('public detail loads RTCOM raw data through the display adapter', async () => {
  const source = await file('prototype/brc-am7/app.js');
  const generated = transformDetailAsset(source, 'app');
  assert.match(source, /adaptRtcomDetail/);
  assert.match(generated, /\.\.\/rtcom\/raw\/products\/\$\{rtcomId\}\.json/);
  assert.match(generated, /data\.presentation\.imageBase/);
  assert.match(generated, /sourceProductLabel/);
  const { adaptRtcomDetail } = await import('../beta/site/shared/rtcom-adapter.mjs');
  const { prepareProductDetail } = await import('../prototype/brc-am7/product-detail-model.mjs');
  const raw = JSON.parse(await file('beta/site/rtcom/raw/products/qms-88ux.json'));
  const adapted = prepareProductDetail(adaptRtcomDetail(raw));
  assert.equal(adapted.enhancements.portMap, null);
  assert.equal(adapted.enhancements.signalFlow, null);
  assert.deepEqual(adapted.enhancements.settings, []);
});

test('detail template exposes distributor links in the header and manufacturer area', async () => {
  const [html, app] = await Promise.all([
    file('prototype/brc-am7/index.html'),
    file('prototype/brc-am7/app.js')
  ]);
  assert.match(html, /id="header-distributor"/);
  assert.match(html, /id="footer-distributor-link"/);
  assert.match(app, /국내 총판 테크데이타 ↗/);
  assert.match(app, /국내 총판 · 테크데이타피에스 ↗/);
  assert.match(app, /distributorLinkFor/);
});
