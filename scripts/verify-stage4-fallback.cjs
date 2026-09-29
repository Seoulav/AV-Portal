const { createServer } = require('node:http');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, extname, sep } = require('node:path');
const { chromium } = require('playwright');

const root = resolve(__dirname, '../beta/site');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = createServer((request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
    if (!file.startsWith(root + sep)) throw new Error('outside root');
    const bytes = readFileSync(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(bytes);
  } catch { response.writeHead(404); response.end(); }
});

(async () => {
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const edge = process.env.AV_PORTAL_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const browser = await chromium.launch({ ...(existsSync(edge) ? { executablePath: edge } : {}), headless: true });
  const base = `http://127.0.0.1:${server.address().port}`;
  const results = [];
  const failures = [];
  try {
    for (const mode of ['normal', 'missing', 'corrupt']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      if (mode !== 'normal') await page.route('**/search-index.json', route => route.fulfill({ status: mode === 'missing' ? 404 : 200, contentType: 'application/json', body: mode === 'missing' ? '' : '{broken' }));
      const responses = [];
      page.on('response', response => { if (response.url().includes('/detail/data/')) responses.push(response.url()); });
      await page.goto(base + '/?q=HDMI', { waitUntil: 'networkidle', timeout: 90000 });
      const result = await page.evaluate(() => ({ count: document.querySelectorAll('#cards .card').length, error: !document.querySelector('#load-error').hidden, overflow: document.documentElement.scrollWidth > innerWidth, title: document.querySelector('#result-context-title').textContent }));
      results.push({ mode, ...result, detailRequests: responses.length, pageErrors });
      if (!result.count || result.error || result.overflow || pageErrors.length || (mode === 'normal' ? responses.length !== 0 : responses.length !== 240)) failures.push(mode);
      await page.close();
    }
    if (new Set(results.map(result => result.count)).size !== 1) failures.push('search results changed');
    const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
    await page.goto(base + '/?q=ULTRISCAPE', { waitUntil: 'networkidle' });
    const noDetail = await page.evaluate(() => {
      const card = [...document.querySelectorAll('#cards .card')].find(node => node.querySelector('h3')?.textContent === 'ULTRISCAPE');
      return Boolean(card && !card.querySelector('.detail-link'));
    });
    if (!noDetail) failures.push('catalog item without detail disappeared');
    await page.goto(base + '/');
    await page.locator('[data-manufacturer="Shure"]').click();
    const shureCount = await page.locator('#cards .card').count();
    await page.locator('[data-top-category="video"]').click();
    await page.goBack({ waitUntil: 'networkidle' });
    const back = await page.evaluate(() => ({ brand: new URL(location.href).searchParams.get('brand'), selected: document.querySelector('[data-manufacturer="Shure"]').getAttribute('aria-pressed'), count: document.querySelectorAll('#cards .card').length }));
    if (back.brand !== 'Shure' || back.selected !== 'true' || back.count !== shureCount) failures.push('back navigation changed');
    await page.close();
    console.log(JSON.stringify({ results, noDetail, back, failures }));
    if (failures.length) process.exitCode = 1;
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
