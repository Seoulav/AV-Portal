// W-20261004-029 local Chromium visual regression and screenshots.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';

const site = resolve('beta/site');
const browser = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
].find(existsSync);
assert.ok(browser);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = resolve(site, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
  if (!file.startsWith(`${site}${sep}`)) { response.writeHead(404).end(); return; }
  try { response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }).end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const profile = await mkdtemp(join(tmpdir(), 'w029-browser-'));
const port = 40000 + Math.floor(Math.random() * 10000);
const chrome = spawn(browser, [
  '--headless=old', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage', '--no-first-run',
  '--remote-allow-origins=*', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'
], { windowsHide: true, stdio: 'ignore' });
let ws;
try {
  let target;
  for (let i = 0; i < 120; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(item => item.type === 'page'); } catch {}
    if (target) break;
    await new Promise(done => setTimeout(done, 100));
  }
  assert.ok(target);
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, fail) => { ws.addEventListener('open', done, { once: true }); ws.addEventListener('error', fail, { once: true }); });
  let nextId = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(Error(message.error.message)) : resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(arg => arg.value ?? arg.description ?? '').join(' '));
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
    return result.result.value;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  const output = resolve('Work/기록/W-20261004-029-screens');
  await mkdir(output, { recursive: true });
  const slugs = ['lh55qhcebgcxkr', 'lh65qhcebgcxkr', 'lh55qmcebgcxkr', 'lh65qmcebgcxkr'];
  for (const width of [1280, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 });
    for (const slug of slugs) {
      errors.length = 0;
      await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/detail/?product=${slug}` });
      let metrics;
      for (let i = 0; i < 150; i++) {
        metrics = await evaluate(`(() => ({title:document.title, image:document.querySelector('#featured-image')?.complete && document.querySelector('#featured-image')?.naturalWidth > 0, markers:document.querySelectorAll('#port-map-layer svg circle').length, cards:document.querySelectorAll('#port-map-list .port-map-port').length, labels:[...document.querySelectorAll('#spec-table-body tr')].map(row=>row.textContent), scrollWidth:document.documentElement.scrollWidth, innerWidth:innerWidth, failure:!!document.querySelector('.load-failure')}))()`);
        if (metrics.title.includes(slug.toUpperCase()) && metrics.image && metrics.markers === 11) break;
        await new Promise(done => setTimeout(done, 100));
      }
      assert.equal(metrics.failure, false, slug);
      assert.equal(metrics.markers, 11, slug);
      assert.equal(metrics.cards, 11, slug);
      assert.ok(metrics.scrollWidth <= metrics.innerWidth, `${slug} ${width}px overflow`);
      assert.ok(metrics.labels[0].includes('화면 크기'), slug);
      assert.ok(metrics.labels[1].includes('크기(가로x높이x깊이)'), slug);
      assert.deepEqual(errors, [], `${slug} ${width}px JS errors`);
      const { contentSize } = await send('Page.getLayoutMetrics');
      const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.ceil(contentSize.height), scale: 1 } });
      await writeFile(join(output, `${slug}-${width}.png`), Buffer.from(data, 'base64'));
      console.log(JSON.stringify({ slug, width, markers: metrics.markers, cards: metrics.cards, overflow: metrics.scrollWidth - metrics.innerWidth, errors: errors.length }));
    }
    errors.length = 0;
    await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/?brand=Samsung&sort=brand` });
    let names = [];
    for (let i = 0; i < 150; i++) {
      names = await evaluate('[...document.querySelectorAll("#cards .card h3")].map(node => node.textContent)');
      if (names.length === 22) break;
      await new Promise(done => setTimeout(done, 100));
    }
    assert.equal(names.length, 22);
    for (const slug of slugs) assert.ok(names.includes(slug.toUpperCase()), slug);
    assert.deepEqual(errors, []);
    const { contentSize } = await send('Page.getLayoutMetrics');
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.ceil(contentSize.height), scale: 1 } });
    await writeFile(join(output, `samsung-catalog-${width}.png`), Buffer.from(data, 'base64'));
    console.log(`${width}px Samsung list: ${names.length} cards`);
  }
} finally {
  ws?.close();
  chrome.kill();
  server.close();
  await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 250 }).catch(() => {});
}
