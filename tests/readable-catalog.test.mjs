import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createPreviewServer } from '../beta/serve.mjs';

const site = new URL('../beta/site/', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('catalog.json', site), 'utf8'));

test('static catalog exposes every public product without JavaScript', async () => {
  const html = await readFile(new URL('catalog.html', site), 'utf8');
  assert.doesNotMatch(html, /<script\b/i);
  assert.equal((html.match(/<article class="catalog-product"/g) ?? []).length, catalog.length);
  for (const item of catalog) {
    assert.match(html, new RegExp(`>${item.product.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<`));
    for (const link of item.official_links) assert.ok(html.includes(`href="${link}"`));
  }
});

test('llms text lists the public catalog and five detail URLs', async () => {
  const content = await readFile(new URL('llms.txt', site), 'utf8');
  assert.match(content, /^# AV Portal$/m);
  assert.match(content, /공개 장비: 27개/);
  assert.equal((content.match(/^- 제품: /gm) ?? []).length, catalog.length);
  for (const item of catalog) assert.match(content, new RegExp(`^- 제품: ${item.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} ${item.product.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
  assert.equal((content.match(/^  상세: https:\/\/seoulav\.github\.io\/AV-Portal\/detail\/\?product=/gm) ?? []).length, 5);
});

test('home advertises downloadable static catalog files', async () => {
  const home = await readFile(new URL('index.html', site), 'utf8');
  assert.match(home, /rel="canonical" href="https:\/\/seoulav\.github\.io\/AV-Portal\/"/);
  assert.match(home, /href="\.\/catalog\.html" download/);
  assert.match(home, /href="\.\/llms\.txt" download/);
});

test('Pages rebuilds readable files before validating the artifact', async () => {
  const workflow = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  assert.match(workflow, /node beta\/build-readable-catalog\.mjs/);
  assert.ok(workflow.indexOf('node beta/build-readable-catalog.mjs') < workflow.indexOf('node beta/verify-pages.mjs'));
});

test('local preview serves both downloadable formats with explicit MIME types', async t => {
  const server = createPreviewServer(fileURLToPath(new URL('../beta/site/', import.meta.url)));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const { port } = server.address();
  const html = await fetch(`http://127.0.0.1:${port}/catalog.html`);
  const text = await fetch(`http://127.0.0.1:${port}/llms.txt`);
  assert.equal(html.status, 200);
  assert.match(html.headers.get('content-type'), /^text\/html/);
  assert.equal(text.status, 200);
  assert.match(text.headers.get('content-type'), /^text\/plain/);
});
