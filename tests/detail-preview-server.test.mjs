import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewServer } from '../prototype/brc-am7/serve.mjs';
test('prototype server serves its module graph and content fallback, without private paths', async t => {
  const server = createPreviewServer({ pictogram: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of ['/detail-enhancements.mjs?v=w20261001-001', '/detail-enhancement-view.mjs', '/pdf-documents.mjs', '/beta/site/shared/pdf-viewer.mjs', '/beta/site/shared/pdf-viewer.css', '/beta/site/shared/rtcom-adapter.mjs', '/beta/site/docs/manifest.json', '/beta/site/vendor/pdfjs/pdf.min.mjs']) assert.equal((await fetch(base + path)).status, 200, path);
  assert.equal((await (await fetch(base + '/content.json')).json()).model, 'BRC-AM7');
  assert.equal((await fetch(base + '/hkkim/README.md')).status, 404);
});
