import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildVersionMetadata, formatVersionLabel } from '../beta/system-version.mjs';

test('deployment metadata produces a stable visible system version', () => {
  const metadata = buildVersionMetadata({
    packageVersion: '0.1.0',
    runNumber: '82',
    sha: '0123456789abcdef',
    deployedAt: '2026-09-25T08:30:00.000Z'
  });

  assert.deepEqual(metadata, {
    version: '0.1.0',
    build: '82',
    revision: '0123456',
    deployedAt: '2026-09-25T08:30:00.000Z'
  });
  assert.equal(formatVersionLabel(metadata), 'SYSTEM v0.1.0 · build 82 · 0123456');
});

test('home and product detail include the shared system version badge', async () => {
  const home = await readFile(new URL('../beta/site/index.html', import.meta.url), 'utf8');
  const detail = await readFile(new URL('../prototype/brc-am7/index.html', import.meta.url), 'utf8');
  const publicDetail = await readFile(new URL('../beta/site/detail/index.html', import.meta.url), 'utf8');

  assert.match(home, /data-system-version/);
  assert.match(home, /href="\.\/system-version\.css"/);
  assert.match(home, /src="\.\/system-version\.js"/);
  assert.match(detail, /data-system-version/);
  assert.match(detail, /src="\.\.\/\.\.\/beta\/site\/system-version\.js"/);
  assert.match(publicDetail, /data-system-version/);
  assert.match(publicDetail, /href="\.\.\/system-version\.css"/);
  assert.match(publicDetail, /src="\.\.\/system-version\.js"/);
});
