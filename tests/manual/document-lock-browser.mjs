import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';

const site = resolve('beta/site');
const browserCandidates = process.platform === 'win32'
  ? ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe']
  : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
const browserBinary = process.env.CHROMIUM_BIN || browserCandidates.find(existsSync);
assert.ok(browserBinary, 'Set CHROMIUM_BIN to a Chromium browser executable');
assert.ok(process.env.W021_PDF_PASSWORD, 'Set W021_PDF_PASSWORD locally; never add its value to the repository');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.pdf': 'application/pdf', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = resolve(site, `.${path.endsWith('/') ? `${path}index.html` : path}`);
  if (!file.startsWith(`${site}${sep}`)) { response.writeHead(404).end(); return; }
  try { response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); response.end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const chromeDir = await mkdtemp(join(tmpdir(), 'w021-chrome-'));
const downloads = await mkdtemp(join(tmpdir(), 'w021-downloads-'));
const chromePort = 40000 + Math.floor(Math.random() * 10000);
console.log('starting Chromium');
const chrome = spawn(browserBinary, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-allow-origins=*', `--remote-debugging-port=${chromePort}`, `--user-data-dir=${chromeDir}`, 'about:blank'
], { windowsHide: true, stdio: 'ignore' });
chrome.on('exit', (code, signal) => console.log('Chrome exited', code, signal));
let ws;
try {
  let target;
  for (let i = 0; i < 100; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${chromePort}/json/list`, {signal:AbortSignal.timeout(1000)})).json();
      target = list.find(item => item.type === 'page');
      if (target) break;
    } catch { /* Chrome is starting. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(target, 'Chrome DevTools page did not start');
  console.log('Chrome target ready');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await Promise.race([new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); ws.addEventListener('close', () => reject(new Error('CDP socket closed')), {once:true}); }),new Promise((_,reject)=>setTimeout(()=>reject(new Error('CDP socket timeout')),3000))]);
  console.log('CDP connected');
  let seq = 0;
  const waiting = new Map();
  ws.addEventListener('close', () => { for (const item of waiting.values()) item.reject(new Error('CDP socket closed')); waiting.clear(); });
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const item = waiting.get(message.id);
    if (!item) return;
    waiting.delete(message.id);
    message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    const timeout = setTimeout(() => { waiting.delete(id); reject(new Error(`CDP command timed out: ${method}`)); }, 5000);
    waiting.set(id, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject: error => { clearTimeout(timeout); reject(error); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const until = async (fn, label) => {
    for (let i = 0; i < 120; i++) {
      const value = await fn();
      if (value) return value;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Timed out: ${label}`);
  };
  const rowSelector = '[...document.querySelectorAll(".document-row")].find(row => row.textContent.includes("스마트 LCD 사이니지 제품가이드"))';
  const plainRowSelector = '[...document.querySelectorAll(".document-row")].find(row => row.textContent.includes("한글 사용설명서 BN81-26720E-04"))';
  const pageErrors = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') pageErrors.push(message.params.exceptionDetails.text);
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
  const widths = [1280, 390];
  const outputDir = resolve('Work/기록/W-20261004-021-screens');
  await mkdir(outputDir, { recursive: true });
  for (const width of widths) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 });
    await send('Page.navigate', { url: `${base}/detail/?product=lh115qhfebgxkr` });
    await until(() => evaluate(`Boolean(${rowSelector})`), 'document row');
    const before = await evaluate(`(() => { const row=${rowSelector}; const control=row.querySelector('.document-actions > :last-child'); return {tag:control.tagName,href:control.getAttribute('href')}; })()`);
    console.log(width, 'card download before open', JSON.stringify(before));
    assert.equal(before.tag, 'BUTTON', 'locked download must open viewer instead of linking directly');
    await evaluate(`(${rowSelector}).querySelector('.document-actions > :last-child').click()`);
    await until(() => evaluate('document.querySelector("#pdf-dialog")?.open'), 'PDF dialog');
    await until(() => evaluate('!document.querySelector(".pdf-password")?.hidden'), 'password prompt');
    const locked = await evaluate('({href:document.querySelector("#pdf-dialog .pdf-link")?.getAttribute("href"), disabled:document.querySelector("#pdf-dialog .pdf-link")?.getAttribute("aria-disabled"), sourceHidden:document.querySelectorAll("#pdf-dialog .pdf-link")[1]?.hidden, status:document.querySelector(".pdf-status")?.textContent})');
    console.log(width, 'before password', JSON.stringify(locked));
    assert.equal(locked.href, null);
    assert.equal(locked.disabled, 'true');
    assert.equal(locked.sourceHidden, true);
    const screenshot = async name => {
      const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(join(outputDir, `lh115qhfebgxkr-${width}-${name}.png`), Buffer.from(result.data, 'base64'));
    };
    await screenshot('locked');
    await evaluate('document.querySelector(".pdf-password input").value="incorrect-example"; document.querySelector(".pdf-password button").click()');
    await until(() => evaluate('document.querySelector(".pdf-status")?.textContent.includes("맞지 않습니다")'), 'wrong password response');
    assert.equal(await evaluate('document.querySelector("#pdf-dialog .pdf-link").getAttribute("href")'), null);
    await screenshot('wrong-password');
    const password = process.env.W021_PDF_PASSWORD;
    await evaluate(`(() => { const input=document.querySelector('.pdf-password input'); input.value=${JSON.stringify(password)}; document.querySelector('.pdf-password button').click(); })()`);
    await until(() => evaluate('Boolean(document.querySelector("#pdf-dialog .pdf-link")?.getAttribute("href"))'), 'unlocked download');
    await until(() => evaluate('Boolean(document.querySelector("#pdf-dialog .pdf-page canvas"))'), 'rendered PDF page');
    await until(() => evaluate('document.querySelector("#pdf-dialog .pdf-status").hidden'), 'PDF rendering status cleared');
    await screenshot('unlocked');
    await rm(join(downloads, 'samsung-lcd-signage-product-guide-ko.pdf'), { force: true });
    await evaluate('document.querySelector("#pdf-dialog .pdf-link").click()');
    await until(async () => (await readdir(downloads)).some(file => file === 'samsung-lcd-signage-product-guide-ko.pdf'), 'downloaded PDF');
    console.log(width, 'unlocked downloaded file');
    await evaluate('document.querySelector("#pdf-dialog").close()');
    await evaluate(`(${rowSelector}).querySelector('.document-actions > :last-child').click()`);
    await until(() => evaluate('!document.querySelector(".pdf-password")?.hidden'), 'password prompt on reopen');
    assert.equal(await evaluate('document.querySelector("#pdf-dialog .pdf-link").getAttribute("href")'), null);
    console.log(width, 'reopen requires password');
    await evaluate('document.querySelector("#pdf-dialog").close()');
    const plain = await evaluate(`(() => { const row=${plainRowSelector}; const control=row.querySelector('.document-actions > :last-child'); return {tag:control.tagName,href:control.getAttribute('href')}; })()`);
    assert.equal(plain.tag, 'A');
    assert.match(plain.href, /samsung-qpdx5k-qhfx-manual-ko\.pdf$/);
    await evaluate(`(${plainRowSelector}).querySelector('.document-actions > :first-child').click()`);
    await until(() => evaluate('Boolean(document.querySelector("#pdf-dialog .pdf-link")?.getAttribute("href"))'), 'plain PDF opens without password');
    assert.equal(await evaluate('document.querySelector(".pdf-password").hidden'), true);
    await until(() => evaluate('Boolean(document.querySelector("#pdf-dialog .pdf-page canvas"))'), 'rendered plain PDF page');
    await until(() => evaluate('document.querySelector("#pdf-dialog .pdf-status").hidden'), 'plain PDF rendering status cleared');
    await screenshot('plain');
    await evaluate('document.querySelector("#pdf-dialog").close()');
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, `${width}px horizontal overflow`);
  }
  assert.deepEqual(pageErrors, [], 'page JavaScript errors');
  const response = await fetch(`${base}/manuals/samsung-lcd-signage-product-guide-ko.pdf`);
  console.log('direct URL', response.status, response.headers.get('content-type'));
  assert.equal(response.status, 200);
} finally {
  ws?.close();
  chrome.kill();
  server.close();
  await rm(chromeDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
  await rm(downloads, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
}
