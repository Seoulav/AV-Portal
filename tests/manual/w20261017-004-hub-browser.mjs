// Local W-004 draft review: node tests/manual/w20261017-004-hub-browser.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {buildHubModel} from '../../Work/기록/W-20261017-004-preview/model.mjs';

const root = process.cwd();
const publicMode = process.env.HUB_PUBLIC === '1';
const output = path.join(root, 'Work', '기록', publicMode ? 'W-20261017-004-public' : 'W-20261017-004-preview');
fs.mkdirSync(output, {recursive:true});
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'beta/site/catalog.json'), 'utf8'));
const entries = catalog.filter(item => item.brand === 'Analog Way');
const products = Object.fromEntries(entries.map(item => [item.slug, JSON.parse(fs.readFileSync(path.join(root, 'beta/site/detail/data', `${item.slug}.json`), 'utf8'))]));
const model = buildHubModel(entries, products);
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const pathname = decodeURIComponent(url.pathname);
  const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const file = path.resolve(root, `.${relative}`);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { response.writeHead(404).end(); return; }
  const mime = {'.html':'text/html', '.mjs':'application/javascript', '.js':'application/javascript', '.json':'application/json', '.css':'text/css', '.woff2':'font/woff2', '.pdf':'application/pdf'};
  response.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const debugPort = 9390;
const chrome = spawn(chromePath, ['--headless', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--remote-allow-origins=*', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${path.join(os.tmpdir(), `w004-hub-${process.pid}`)}`, 'about:blank'], {windowsHide: true, stdio: 'ignore'});
let socket;
const pending = new Map();
let sequence = 0;
try {
  let target;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { target = (await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(item => item.type === 'page'); } catch {}
    if (target) break;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  assert.ok(target, 'Chromium target unavailable');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, {once: true}));
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const call = pending.get(message.id);
    if (!call) return;
    pending.delete(message.id);
    message.error ? call.reject(Error(message.error.message)) : call.resolve(message.result);
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, {resolve, reject}); socket.send(JSON.stringify({id, method, params})); });
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
    return result.result.value;
  };
  await cdp('Page.enable');
  const measures = [];
  for (const width of [1280, 760, 390]) {
    await cdp('Emulation.setDeviceMetricsOverride', {width, height:900, deviceScaleFactor:1, mobile:false});
    await cdp('Page.navigate', {url:`http://127.0.0.1:${server.address().port}/${publicMode ? 'beta/site/analogway' : 'Work/기록/W-20261017-004-preview'}/`});
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      ready = await evaluate("!!document.querySelector('#load-error') && (document.documentElement.dataset.ready === 'true' || !document.querySelector('#load-error').hidden)");
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    assert.ok(ready, `${width}px page did not finish loading`);
    const state = await evaluate(`(() => ({
      error: document.querySelector('#load-error').hidden ? '' : document.querySelector('#load-error').textContent,
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      rows: [...document.querySelectorAll('.aw-table tbody tr')].map(row => ({slug:row.dataset.slug, fields:[...row.querySelectorAll('td')].map(cell => ({key:cell.dataset.key, path:cell.dataset.source, value:cell.textContent}))})),
      cards: document.querySelectorAll('.aw-series-card').length,
      guide: !!document.querySelector('#guide .aw-layer-guide'),
      standards: !!document.querySelector('#standards .aw-layer-standards'),
      links: [...document.querySelectorAll('a[href]')].map(link => link.href),
      height: document.documentElement.scrollHeight
    }))()`);
    assert.equal(state.error, '', `${width}px load error`);
    assert.equal(state.scrollWidth, width, `${width}px horizontal page overflow`);
    assert.equal(state.cards, 5);
    assert.equal(state.guide, true);
    assert.equal(state.standards, true);
    assert.deepEqual(state.rows, model.rows.map(row => ({slug:row.slug, fields:row.fields.map(field => ({key:field.key, path:field.path, value:field.value}))})), `${width}px visible table differs from JSON`);
    assert.ok(state.links.every(link => !link.includes('/undefined') && !link.includes('/null')), `${width}px broken link`);
    if (width === 1280) for (const href of new Set(state.links.filter(link => link.startsWith(`http://127.0.0.1:${server.address().port}/`)))) {
      const response = await fetch(href);
      assert.equal(response.status, 200, `local link does not resolve: ${href}`);
      await response.body?.cancel();
    }
    assert.ok(state.height > 900);
    const filename = `analogway-hub-${width}.png`;
    const screenshot = await cdp('Page.captureScreenshot', {format:'png', captureBeyondViewport:true, fromSurface:true, clip:{x:0, y:0, width, height:state.height, scale:1}});
    fs.writeFileSync(path.join(output, filename), Buffer.from(screenshot.data, 'base64'));
    measures.push({width, height:state.height, scrollWidth:state.scrollWidth, rows:state.rows.length, cards:state.cards, guide:state.guide, standards:state.standards, screenshot:filename});
    console.log(`${width}px: ${state.rows.length} JSON-backed rows, ${state.cards} cards, ${state.height}px page, overflow 0`);
  }
  fs.writeFileSync(path.join(output, 'measurements.json'), JSON.stringify(measures, null, 2) + '\n');
  if (publicMode) for (const width of [1280, 390]) {
    await cdp('Emulation.setDeviceMetricsOverride', {width, height:900, deviceScaleFactor:1, mobile:false});
    await cdp('Page.navigate', {url:`http://127.0.0.1:${server.address().port}/beta/site/`});
    let linked = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      linked = await evaluate("!!document.querySelector('.site-menu a[href=\"analogway/\"]') && !!document.querySelector('#manufacturer-section a[href=\"analogway/\"]')");
      if (linked) break;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    assert.ok(linked, `${width}px: home menu and manufacturer entry missing`);
    assert.equal(await evaluate('document.documentElement.scrollWidth'), width, `${width}px home overflow`);
    const screenshot = await cdp('Page.captureScreenshot', {format:'png', fromSurface:true});
    fs.writeFileSync(path.join(output, `analogway-entry-${width}.png`), Buffer.from(screenshot.data, 'base64'));
    await evaluate("document.querySelector('.site-menu a[href=\"analogway/\"]').click()");
    let reached = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      reached = await evaluate("location.pathname.endsWith('/beta/site/analogway/') && document.documentElement.dataset.ready === 'true'");
      if (reached) break;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    assert.ok(reached, `${width}px: menu navigation did not reach hub`);
  }
} finally {
  socket?.close();
  chrome.kill();
  server.close();
}
