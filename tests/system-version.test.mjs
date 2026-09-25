import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildVersionMetadata, formatVersionLabel, isMainModule } from '../beta/system-version.mjs';

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

test('deployment script recognizes direct execution on Windows and Linux', () => {
  assert.equal(isMainModule('file:///C:/repo/beta/system-version.mjs', 'C:\\repo\\beta\\system-version.mjs'), true);
  assert.equal(isMainModule('file:///home/runner/repo/beta/system-version.mjs', '/home/runner/repo/beta/system-version.mjs'), true);
  assert.equal(isMainModule('file:///home/runner/repo/beta/system-version.mjs', '/home/runner/repo/tests/importer.mjs'), false);
});

test('deployment metadata stays internal and public pages omit the build badge', async () => {
  const home = await readFile(new URL('../beta/site/index.html', import.meta.url), 'utf8');
  const detail = await readFile(new URL('../prototype/brc-am7/index.html', import.meta.url), 'utf8');
  const publicDetail = await readFile(new URL('../beta/site/detail/index.html', import.meta.url), 'utf8');

  for (const html of [home, detail, publicDetail]) {
    assert.doesNotMatch(html, /data-system-version|SYSTEM v0\.1\.0|build local/);
    assert.doesNotMatch(html, /system-version\.(?:css|js)/);
  }
});
