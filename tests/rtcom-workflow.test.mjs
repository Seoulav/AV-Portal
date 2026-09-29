import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const file = path => readFile(new URL(path, root), 'utf8');

test('Pages verification validates the complete RTCOM last-known-good snapshot', async () => {
  const source = await file('beta/verify-pages.mjs');
  assert.match(source, /verifyRtcomSnapshot/);
  assert.match(source, /adaptRtcomDetail/);
  assert.match(source, /rtcom\/raw\/index\.json/);
  assert.match(source, /RTCOM_EXCLUDED_MODELS/);
});

test('RTCOM synchronization runs daily and manually, then opens only changed validated work', async () => {
  const workflow = await file('.github/workflows/sync-rtcom.yml');
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron:\s*['"]?[^\n]+/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /node beta\/sync-rtcom\.mjs/);
  assert.match(workflow, /node beta\/sync-rtcom\.mjs --check/);
  assert.match(workflow, /node beta\/build-search-index\.mjs --check/);
  assert.match(workflow, /node beta\/verify-pages\.mjs/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /gh pr create/);
  assert.match(workflow, /gh pr merge/);
  assert.match(workflow, /gh workflow run pages\.yml --ref main/);
});

test('repository guidance documents RTCOM source ownership and rebuild commands', async () => {
  const [agents, readme] = await Promise.all([file('AGENTS.md'), file('README.md')]);
  for (const text of [agents, readme]) {
    assert.match(text, /node beta\/sync-rtcom\.mjs/);
    assert.match(text, /node beta\/build-search-index\.mjs/);
    assert.match(text, /rtcom-configurator/);
  }
});
