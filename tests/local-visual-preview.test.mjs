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
