import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPreviewServer } from '../beta/serve.mjs';

test('serves only standalone beta assets on a loopback test listener', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'av-beta-serve-'));
  for (const [name, body] of [['index.html', '<h1>Local</h1>'], ['catalog.json', '[]'], ['app.js', ''], ['styles.css', '']]) {
    await writeFile(join(dir, name), body);
  }
  const server = createPreviewServer(dir);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const home = await fetch(base);
    assert.equal(home.status, 200);
    assert.match(await home.text(), /Local/);
    const catalog = await fetch(`${base}/catalog.json`);
    assert.equal(catalog.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(await catalog.text(), '[]');
    assert.equal((await fetch(`${base}/../source.json`)).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
