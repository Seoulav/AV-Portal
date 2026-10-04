// Manual Chromium check for W-20261004-022; run with `node tests/manual/catalog-order-browser.mjs`.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';

const site = resolve('beta/site');
const browser = process.env.CHROMIUM_BIN || [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
].find(existsSync);
assert.ok(browser, 'Chromium browser required');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = resolve(site, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
  if (!file.startsWith(`${site}${sep}`)) { response.writeHead(404).end(); return; }
  try { response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }).end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const profile = await mkdtemp(join(tmpdir(), 'w022-chrome-'));
const port = 40000 + Math.floor(Math.random() * 10000);
const chrome = spawn(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-allow-origins=*', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws;
try {
  let target;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(item => item.type === 'page'); }
    catch { /* Browser is starting. */ }
    if (target) break;
    await new Promise(done => setTimeout(done, 100));
  }
  assert.ok(target, 'Chromium did not start');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, fail) => { ws.addEventListener('open', done, { once: true }); ws.addEventListener('error', fail, { once: true }); });
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const call = pending.get(message.id);
    if (!call) return;
    pending.delete(message.id);
    message.error ? call.reject(new Error(message.error.message)) : call.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const errors = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(arg => arg.value ?? arg.description ?? '').join(' '));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  const output = resolve('Work/기록/W-20261004-022-screens');
  await mkdir(output, { recursive: true });
  const expected = ['LH115QHFEBGXKR', 'LH43QHCEBGCXKR', 'LH75QHCEBGCXKR', 'LH32QMCEBGCXKR', 'LH43QMCEBGCXKR', 'LH85QMCEBGCXKR', 'LH98QMCEBGCXKR', 'LH55VHCRBGBXKR', 'LH55VMCRBGBXKR', 'HG43U800FNFXKR', 'HG50U800FNFXKR', 'HG65U800FNFXKR', 'LH55WMFWBGCXKR', 'LH75WMFWLGCXKR', 'MP008F', 'MP012F', 'MP016F'];
  for (const width of [1280, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 });
    await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/?brand=Samsung&sort=brand` });
    let titles;
    for (let attempt = 0; attempt < 120; attempt++) {
      titles = await evaluate('[...document.querySelectorAll("#cards .card h3")].map(node => node.textContent)');
      if (titles.length === 17) break;
      await new Promise(done => setTimeout(done, 100));
    }
    assert.deepEqual(titles, expected);
    const metrics = await evaluate('({scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth,count:document.querySelectorAll("#cards .card").length})');
    assert.ok(metrics.scrollWidth <= metrics.innerWidth, `${width}px horizontal overflow`);
    assert.equal(metrics.count, 17);
    assert.deepEqual(errors, []);
    const { contentSize } = await send('Page.getLayoutMetrics');
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.ceil(contentSize.height), scale: 1 } });
    await writeFile(join(output, `samsung-brand-${width}.png`), Buffer.from(data, 'base64'));
    console.log(`${width}px: 17 ordered cards, overflow 0, JS errors 0, screenshot saved`);
  }
} finally {
  ws?.close();
  chrome.kill();
  server.close();
  await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 250 }).catch(() => {});
}
