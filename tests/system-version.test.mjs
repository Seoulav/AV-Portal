import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildVersionMetadata, formatVersionLabel, isMainModule } from '../beta/system-version.mjs';
import { buildCatalogHtml } from '../beta/build-readable-catalog.mjs';

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

test('deployment metadata badge appears on the three public pages', async () => {
  const home = await readFile(new URL('../beta/site/index.html', import.meta.url), 'utf8');
  const catalog = await readFile(new URL('../beta/site/catalog.html', import.meta.url), 'utf8');
  const publicDetail = await readFile(new URL('../beta/site/detail/index.html', import.meta.url), 'utf8');
  const prototype = await readFile(new URL('../prototype/brc-am7/index.html', import.meta.url), 'utf8');

  for (const html of [home, catalog, publicDetail]) {
    assert.match(html, /data-system-version/);
    assert.match(html, /system-version\.css/);
    assert.match(html, /system-version\.js/);
  }
  // The prototype remains outside the public Pages deployment.
  assert.doesNotMatch(prototype, /data-system-version/);
});

test('the public version badge belongs to each header and uses the RTCOM pill treatment', async () => {
  const pages = await Promise.all([
    readFile(new URL('../beta/site/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../beta/site/catalog.html', import.meta.url), 'utf8'),
    readFile(new URL('../beta/site/detail/index.html', import.meta.url), 'utf8')
  ]);
  for (const html of [...pages, buildCatalogHtml([])]) {
    const header = html.match(/<header\b[^>]*>[\s\S]*?<\/header>/)?.[0];
    assert.ok(header, 'page header exists');
    assert.match(header, /data-system-version/, 'badge is inside its header');
    assert.equal((html.match(/data-system-version/g) || []).length, 1);
  }
  const css = await readFile(new URL('../beta/site/system-version.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /position\s*:\s*fixed|pointer-events\s*:\s*none|backdrop-filter|box-shadow/);
  assert.match(css, /#f0f4fa/);
  assert.match(css, /#376cd0/);
  assert.match(css, /text-align\s*:\s*center/);
  assert.match(css, /line-height\s*:\s*1\.35/);
  assert.match(css, /@media\s*\(max-width\s*:\s*480px\)/);
});

async function loadPublicBadge(fetchResult) {
  const oldDocument = globalThis.document;
  const oldFetch = globalThis.fetch;
  const badge = { children: [], title: '', append(...nodes) { this.children.push(...nodes); } };
  globalThis.document = {
    querySelector: selector => selector === '[data-system-version]' ? badge : null,
    createElement: tagName => ({ tagName, textContent: '' })
  };
  globalThis.fetch = async () => fetchResult;
  try {
    await import(`../beta/site/system-version.js?w004=${Math.random()}`);
    return badge;
  } finally {
    globalThis.document = oldDocument;
    globalThis.fetch = oldFetch;
  }
}

test('published metadata renders two safe lines with revision and deployment in the tooltip', async () => {
  const badge = await loadPublicBadge({ ok: true, json: async () => ({
    version: '0.1.0', build: '200', revision: 'abcdef0', deployedAt: '2026-10-04T00:00:00Z'
  }) });
  assert.deepEqual(badge.children.map(node => typeof node === 'string' ? node : [node.tagName, node.textContent]), [
    ['b', 'AV 장비 자료실'], ['br', ''], 'DOCUMENT BASED · v0.1.0 · 200'
  ]);
  assert.match(badge.title, /abcdef0/);
  assert.match(badge.title, /2026-10-04/);
  const js = await readFile(new URL('../beta/site/system-version.js', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /innerHTML/);
});

test('failed metadata keeps the fixed first line and a review-needed second line', async () => {
  const badge = await loadPublicBadge({ ok: false, status: 404 });
  assert.deepEqual(badge.children.map(node => typeof node === 'string' ? node : [node.tagName, node.textContent]), [
    ['b', 'AV 장비 자료실'], ['br', ''], 'DOCUMENT BASED · 확인 필요'
  ]);
});
