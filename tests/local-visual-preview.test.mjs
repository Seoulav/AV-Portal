import { strict as assert } from 'node:assert';
import { after, before, test } from 'node:test';
import { createPreviewServer } from '../prototype/brc-am7/serve.mjs';

let server;
let base;
before(async () => {
  server = createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise(resolve => server.close(resolve));
});

test('the private-photo preview loads its light design only through the local server', async () => {
  const page = await fetch(base);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /local-visual\.css/);
  assert.match(html, /name="color-scheme" content="light"/);

  const style = await fetch(`${base}/local-visual.css`);
  assert.equal(style.status, 200);
  assert.match(await style.text(), /image-led, light Product Detail study/);

  const unknownImage = await fetch(`${base}/images/unapproved.jpg`);
  assert.equal(unknownImage.status, 404);
});

test('the pictogram preview replaces only local images with an original SVG', async () => {
  const preview = createPreviewServer({ pictogram: true });
  await new Promise(resolve => preview.listen(0, '127.0.0.1', resolve));
  const previewBase = `http://127.0.0.1:${preview.address().port}`;
  try {
    const html = await (await fetch(previewBase)).text();
    assert.match(html, /class="pictogram-preview"/);
    assert.match(html, /id="gallery-title">제품 시각화/);
    const content = await (await fetch(`${previewBase}/content.json`)).json();
    assert.equal(content.images.length, 1);
    assert.equal(content.images[0].file, 'ptz-pictogram.svg');
    assert.equal(content.images[0].sourceUrl, undefined);
    assert.equal(content.images[0].publicationStatus, 'CC0 1.0');
    assert.match(content.images[0].alt, /실제 제품 사진이 아닌/);
    assert.equal(content.features.length, 8);
    assert.equal(content.specifications.length, 27);
    assert.equal(content.io.length, 14);
    const icon = await fetch(`${previewBase}/images/ptz-pictogram.svg`);
    assert.equal(icon.status, 200);
    assert.match(icon.headers.get('content-type'), /image\/svg\+xml/);
    const svg = await icon.text();
    assert.match(svg, /SPDX-License-Identifier: CC0-1\.0/);
    assert.doesNotMatch(svg, /<script|<image|(?:href|src)="|url\(https?:/);
  } finally {
    await new Promise(resolve => preview.close(resolve));
  }
});
