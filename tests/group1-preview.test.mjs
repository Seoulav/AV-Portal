import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGroup1PreviewServer } from '../beta/preview-group1.mjs';

test('local Group 1 preview overlays only image display data and keeps public JSON unchanged', async () => {
  const server = createGroup1PreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const counts = { 'brc-am7': 4, dm7: 3, 'ki-pro-go2': 1, 'pt-mz17k': 2, 'rally-bar': 2 };
    for (const [slug, count] of Object.entries(counts)) {
      const publicData = JSON.parse(await readFile(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
      const response = await fetch(`${origin}/detail/data/${slug}.json`);
      assert.equal(response.status, 200);
      const preview = await response.json();
      assert.ok(preview.images.length <= count);
      assert.deepEqual(preview.specifications, publicData.specifications);
      assert.deepEqual(preview.io, publicData.io);
      assert.deepEqual(preview.imageStatuses, publicData.imageStatuses);
      assert.ok(preview.images.every(item => !item.file.includes('/')));
      assert.ok(preview.images.filter(item => item.officialSource).every(item => item.publicationStatus === 'REVIEW REQUIRED'));
    }
    assert.equal((await fetch(`${origin}/detail/images/unknown.jpg`)).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
