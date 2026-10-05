// W-20261005-001 Chromium check; PORTAL_BASE can target the deployed Pages site.
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
assert.ok(browser, 'Chromium required');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = resolve(site, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
  if (!file.startsWith(`${site}${sep}`)) { response.writeHead(404).end(); return; }
  try { response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }).end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
console.log('W001 browser: local server ready');
const base = process.env.PORTAL_BASE || `http://127.0.0.1:${server.address().port}`;
const catalog = await (await fetch(`${base}/catalog.json`)).json();
const samsungCount = catalog.filter(item => item.kind === 'equipment' && item.brand === 'Samsung').length;
const qmcCount = catalog.filter(item => item.kind === 'equipment' && item.brandSort?.group === 'QMC').length;
const bssCount = catalog.filter(item => item.kind === 'equipment' && item.brand === 'BSS Audio').length;
const output = resolve(process.env.SCREEN_DIR || 'Work/기록/W-20261005-001-screens');
const profile = await mkdtemp(join(tmpdir(), 'w001-browser-'));
const port = 40000 + Math.floor(Math.random() * 10000);
const chrome = spawn(browser, ['--headless=old', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage', '--no-first-run', '--remote-allow-origins=*', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws;
try {
  let target;
  for (let i = 0; i < 120; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(item => item.type === 'page'); } catch {}
    if (target) break;
    await new Promise(done => setTimeout(done, 100));
  }
  assert.ok(target, 'Chromium did not start');
  console.log('W001 browser: Chromium target ready');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, fail) => { ws.addEventListener('open', done, { once: true }); ws.addEventListener('error', fail, { once: true }); });
  let nextId = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const call = pending.get(message.id);
      pending.delete(message.id);
      message.error ? call.reject(Error(message.error.message)) : call.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(arg => arg.value ?? arg.description ?? '').join(' '));
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const metrics = () => evaluate(`({url:location.href, series:[...document.querySelectorAll('#series-browser button')].map(x=>({id:x.dataset.series,label:x.querySelector('strong')?.textContent,count:Number(x.querySelector('span')?.textContent),pressed:x.getAttribute('aria-pressed')})), cards:[...document.querySelectorAll('#cards .card h3')].map(x=>x.textContent), seriesHidden:document.querySelector('#series-browser')?.hidden, cardsHidden:document.querySelector('#cards')?.hidden, title:document.querySelector('#result-context-title')?.textContent, overflow:document.documentElement.scrollWidth-innerWidth, scroll:scrollY, shows:window.__pageShows ?? []})`);
  const waitFor = async predicate => {
    for (let i = 0; i < 150; i++) {
      const value = await metrics();
      if (predicate(value)) return value;
      await new Promise(done => setTimeout(done, 100));
    }
    throw Error(`Timed out: ${JSON.stringify(await metrics())}`);
  };
  const screenshot = async name => {
    const { contentSize } = await send('Page.getLayoutMetrics');
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: await evaluate('innerWidth'), height: Math.ceil(contentSize.height), scale: 1 } });
    await writeFile(join(output, name), Buffer.from(data, 'base64'));
  };
  await send('Page.enable');
  console.log('W001 browser: Page enabled');
  await send('Runtime.enable');
  console.log('W001 browser: Runtime enabled');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__pageShows=[]; addEventListener('pageshow',event=>window.__pageShows.push({persisted:event.persisted,url:location.href,series:document.querySelector('#series-browser [aria-pressed=\"true\"]')?.dataset.series ?? '',cards:document.querySelectorAll('#cards .card').length,scroll:scrollY}));" });
  console.log('W001 browser: pageshow listener ready');
  await mkdir(output, { recursive: true });
  for (const width of [1280, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 });
    console.log(`W001 browser: ${width}px navigate`);
    await send('Page.navigate', { url: `${base}/?brand=Samsung&sort=brand` });
    console.log(`W001 browser: ${width}px navigated`);
    const choice = await waitFor(value => value.series.length === 8 && value.cardsHidden);
    assert.equal(choice.cards.length, 0);
    assert.equal(choice.series.slice(1).reduce((sum, group) => sum + group.count, 0), samsungCount);
    assert.deepEqual(choice.series.map(group => group.id), ['all', 'qhc', 'qmc', 'video-wall', 'hotel-tv', 'business-tv', 'whiteboard', 'led-signage']);
    assert.ok(choice.title.includes('시리즈를 선택하세요'));
    assert.ok(choice.overflow <= 0);
    await screenshot(`samsung-series-${width}.png`);

    if (width === 1280) {
      await evaluate("document.querySelector('#series-browser [data-series=qmc]').focus()");
      await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
      await send('Input.dispatchKeyEvent', { type: 'char', key: 'Enter', text: '\r', unmodifiedText: '\r', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    } else {
      await evaluate("document.querySelector('#series-browser [data-series=qmc]').click()");
    }
    const qmc = await waitFor(value => value.url.includes('series=qmc') && value.cards.length === qmcCount);
    assert.equal(qmc.series.find(group => group.id === 'qmc').pressed, 'true');
    assert.ok(qmc.cards.includes('LH55QMCEBGCXKR'));
    assert.ok(qmc.overflow <= 0);
    await screenshot(`samsung-qmc-${width}.png`);
    const length = await evaluate('history.length');
    await evaluate("document.querySelector('#series-browser [data-series=qmc]').click()");
    assert.equal(await evaluate('history.length'), length, 'repeated series choice must not push history');
    await evaluate('history.back()');
    await waitFor(value => !value.url.includes('series=') && value.cardsHidden);
    await evaluate('history.forward()');
    await waitFor(value => value.url.includes('series=qmc') && value.cards.length === qmcCount);
    console.log(`${width}px series→QMC→back→forward: 8 choices, ${qmcCount} cards, overflow 0`);
  }
  await send('Page.navigate', { url: `${base}/?brand=Samsung&series=all&sort=brand` });
  const all = await waitFor(value => value.url.includes('series=all') && value.cards.length === samsungCount);
  assert.equal(all.series.find(group => group.id === 'all').pressed, 'true');
  await send('Page.reload', { ignoreCache: true });
  await waitFor(value => value.url.includes('series=all') && value.cards.length === samsungCount);
  await send('Page.navigate', { url: `${base}/?brand=BSS%20Audio&series=all&sort=brand` });
  const bss = await waitFor(value => value.url.includes('brand=BSS') && value.cards.length === bssCount);
  assert.ok(!bss.url.includes('series='));
  assert.equal(bss.seriesHidden, true);
  await send('Page.navigate', { url: `${base}/?brand=Samsung&series=qmc&sort=brand` });
  await waitFor(value => value.cards.length === qmcCount);
  await evaluate("document.querySelector('#result-search').value='LH55'; document.querySelector('#result-search').dispatchEvent(new Event('input',{bubbles:true}))");
  assert.ok((await metrics()).url.includes('series=qmc'), 'result search retains series');
  await evaluate("document.querySelector('#resource-filter').value='detail'; document.querySelector('#resource-filter').dispatchEvent(new Event('change',{bubbles:true}))");
  assert.ok((await metrics()).url.includes('series=qmc'), 'resource retains series');
  await evaluate("document.querySelector('#sort-filter').value='product'; document.querySelector('#sort-filter').dispatchEvent(new Event('change',{bubbles:true}))");
  assert.ok((await metrics()).url.includes('series=qmc'), 'sort retains series');
  await evaluate("document.querySelector('#categories input').click()");
  assert.ok((await metrics()).url.includes('series=qmc'), 'category retains series');
  await evaluate("document.querySelector('#manufacturer-browser [data-manufacturer=Samsung]').click()");
  await waitFor(value => value.cardsHidden && !value.url.includes('series='));
  await send('Page.navigate', { url: `${base}/?brand=Samsung&series=qmc&sort=brand` });
  await waitFor(value => value.cards.length === qmcCount);
  await evaluate("document.querySelector('#brand-filter').value='BSS Audio'; document.querySelector('#brand-filter').dispatchEvent(new Event('change',{bubbles:true}))");
  await waitFor(value => value.cards.length === bssCount && !value.url.includes('series='));
  await send('Page.navigate', { url: `${base}/?brand=Samsung&series=qmc&sort=brand` });
  await waitFor(value => value.cards.length === qmcCount);
  await evaluate("document.querySelector('#top-categories [data-top-category=audio]').click()");
  await waitFor(value => value.url.includes('top=audio') && !value.url.includes('series='));
  await send('Page.navigate', { url: `${base}/?brand=Samsung&series=qmc&sort=brand` });
  await waitFor(value => value.cards.length === qmcCount);
  await evaluate("document.querySelector('#global-search').value='DM7'; document.querySelector('#header-search-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
  await waitFor(value => value.url.includes('q=DM7') && !value.url.includes('series=') && !value.url.includes('brand=Samsung'));
  await send('Page.navigate', { url: `${base}/?brand=Samsung&series=qmc&sort=brand` });
  await waitFor(value => value.cards.length === qmcCount);
  await evaluate("document.querySelector('#filter-clear').click()");
  await waitFor(value => !value.url.includes('series=') && !value.url.includes('brand=Samsung'));
  await send('Page.navigate', { url: `${base}/?brand=Samsung&series=qmc&sort=brand` });
  await waitFor(value => value.cards.length === qmcCount);
  await evaluate("document.querySelector('#clear').click()");
  await waitFor(value => !value.url.includes('series=') && !value.url.includes('brand=Samsung'));
  await send('Page.navigate', { url: `${base}/?brand=Samsung&series=qmc&sort=brand` });
  await waitFor(value => value.cards.length === qmcCount);
  await evaluate("document.querySelector('#result-search').value='no-such-product'; document.querySelector('#result-search').dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('#empty-reset').click()");
  await waitFor(value => !value.url.includes('series=') && !value.url.includes('brand=Samsung'));
  console.log('retain 4 controls, clear 6 navigation paths: OK');

  await send('Page.navigate', { url: `${base}/?brand=Samsung&series=qmc&sort=brand` });
  await waitFor(value => value.cards.length === qmcCount);
  await evaluate("scrollTo(0, document.querySelector('#cards').offsetTop + 100)");
  const beforeDetail = await metrics();
  await evaluate("document.querySelector('#cards .detail-link').click()");
  for (let i = 0; i < 100; i++) {
    if ((await evaluate('location.pathname')).includes('/detail/')) break;
    await new Promise(done => setTimeout(done, 100));
  }
  assert.ok((await evaluate('location.pathname')).includes('/detail/'));
  await evaluate('history.back()');
  await waitFor(value => value.url.includes('series=qmc') && value.cards.length === qmcCount);
  await new Promise(done => setTimeout(done, 350));
  const afterDetail = await metrics();
  assert.ok(Math.abs(afterDetail.scroll - beforeDetail.scroll) < 80, `scroll restore ${beforeDetail.scroll} → ${afterDetail.scroll}`);
  const restoredShow = afterDetail.shows.find(show => show.persisted);
  if (restoredShow) {
    assert.ok(restoredShow.url.includes('series=qmc'), 'bfcache URL');
    assert.equal(restoredShow.series, 'qmc', 'bfcache selected series');
    assert.equal(restoredShow.cards, qmcCount, 'bfcache cards');
    assert.ok(Math.abs(restoredShow.scroll - beforeDetail.scroll) < 80, 'bfcache scroll');
  }
  console.log(`detail back: series=qmc, ${qmcCount} cards, scroll ${beforeDetail.scroll}→${afterDetail.scroll}, bfcache persisted=${Boolean(restoredShow)}`);
  assert.deepEqual(errors, [], 'browser JS errors');
  console.log(`all reload: ${samsungCount} cards; BSS Audio unchanged: ${bssCount} cards; JS errors 0`);
} finally {
  ws?.close();
  chrome.kill();
  server.close();
  await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 250 }).catch(() => {});
}
