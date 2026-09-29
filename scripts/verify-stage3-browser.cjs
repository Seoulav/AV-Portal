const { createServer } = require('node:http');
const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('node:fs');
const { resolve, extname, sep } = require('node:path');
const { chromium } = require('playwright');

const root = resolve(__dirname, '../beta/site');
const reportDir = resolve(__dirname, '../Work/기록/stage3-screens');
const contentType = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const server = createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const resource = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
    const file = resolve(root, '.' + resource);
    if (!(file === root || file.startsWith(root + sep))) throw new Error('invalid path');
    const bytes = readFileSync(file);
    response.writeHead(200, { 'Content-Type': contentType[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(bytes);
  } catch { response.writeHead(404); response.end(); }
});

(async () => {
  mkdirSync(reportDir, { recursive: true });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`;
  const edgePath = process.env.AV_PORTAL_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const browser = await chromium.launch({ ...(existsSync(edgePath) ? { executablePath: edgePath } : {}), headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 }, deviceScaleFactor: 1 });
  const errors = [], failures = [], scenarios = {};
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

  async function inspect(name, url, width, expectedColumns, expectedActive) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto(base + url, { waitUntil: 'networkidle', timeout: 30000 });
    const state = await page.evaluate(() => {
      const workspace = document.querySelector('#results-workspace');
      const cards = [...document.querySelectorAll('#cards .card')];
      return {
        active: !workspace.hidden,
        columns: getComputedStyle(document.querySelector('#cards')).gridTemplateColumns.split(' ').length,
        count: cards.length,
        overflow: document.documentElement.scrollWidth > innerWidth,
        broken: [...document.querySelectorAll('img[src]')].filter(image => image.complete && image.naturalWidth === 0).map(image => image.src),
        font: getComputedStyle(document.body).fontFamily,
        statusBadges: document.querySelectorAll('.card-status').length,
        mediaSlots: cards.filter(card => card.querySelector('.card-media')).length,
        noImage: cards.filter(card => card.querySelector('.media-placeholder')).length,
        summaries: cards.filter(card => card.querySelector('.card-summary')).length,
        links: [...document.querySelectorAll('.readable-catalog a')].map(link => link.getAttribute('href')),
        query: new URL(location.href).searchParams.get('q'),
        search: document.querySelector('#search').value
      };
    });
    if (state.active !== expectedActive || state.overflow || state.broken.length || state.statusBadges || !state.font.includes('Pretendard Variable') || !state.links.includes('./catalog.html') || !state.links.includes('./llms.txt')) failures.push({ name, width, state });
    if (expectedActive && (state.columns !== expectedColumns || state.mediaSlots !== state.count)) failures.push({ name, width, expectedColumns, state });
    if (name === 'HDMI' && (state.query !== 'HDMI' || state.count === 0)) failures.push({ name, width, state });
    scenarios[`${name}-${width}`] = state;
    await page.screenshot({ path: resolve(reportDir, `${name.toLowerCase()}-${width}.png`), fullPage: true });
  }

  for (const width of [1280, 390]) {
    await inspect('home', '/', width, 0, false);
    await inspect('HDMI', '/?q=HDMI', width, width === 1280 ? 4 : 1, true);
    await inspect('Shure', '/?brand=Shure&sort=brand', width, width === 1280 ? 4 : 1, true);
    await inspect('video', '/?top=video', width, width === 1280 ? 4 : 1, true);
  }
  for (const [width, columns] of [[900, 3], [650, 2]]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto(base + '/?q=HDMI', { waitUntil: 'networkidle' });
    const result = await page.evaluate(() => ({ columns: getComputedStyle(document.querySelector('#cards')).gridTemplateColumns.split(' ').length, overflow: document.documentElement.scrollWidth > innerWidth }));
    scenarios[`HDMI-${width}`] = result;
    if (result.columns !== columns || result.overflow) failures.push({ width, result, expectedColumns: columns });
  }
  await page.goto(base + '/?q=ULTRISCAPE', { waitUntil: 'networkidle' });
  const noSummary = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#cards .card')].find(item => item.querySelector('h3')?.textContent === 'ULTRISCAPE');
    return card && { summary: Boolean(card.querySelector('.card-summary')), placeholder: Boolean(card.querySelector('.media-placeholder')) };
  });
  if (!noSummary || noSummary.summary || !noSummary.placeholder) failures.push({ interaction: 'missing summary', noSummary });
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto(base + '/?q=not-a-real-av-product-zz', { waitUntil: 'networkidle' });
  const empty = await page.evaluate(() => ({ visible: !document.querySelector('#empty-state').hidden, reset: !document.querySelector('#empty-reset').hidden, count: document.querySelectorAll('#cards .card').length }));
  if (!empty.visible || !empty.reset || empty.count !== 0) failures.push({ interaction: 'empty', empty });
  await page.locator('#empty-reset').click();
  const reset = await page.evaluate(() => ({ workspaceHidden: document.querySelector('#results-workspace').hidden, query: location.search }));
  if (!reset.workspaceHidden || reset.query) failures.push({ interaction: 'empty reset', reset });
  await page.locator('[data-manufacturer="Shure"]').click();
  const brandBefore = await page.evaluate(() => ({ brand: new URL(location.href).searchParams.get('brand'), count: document.querySelectorAll('#cards .card').length }));
  await page.locator('[data-top-category="video"]').click();
  await page.goBack({ waitUntil: 'networkidle' });
  const brandAfter = await page.evaluate(() => ({ brand: new URL(location.href).searchParams.get('brand'), selected: document.querySelector('[data-manufacturer="Shure"]').getAttribute('aria-pressed'), count: document.querySelectorAll('#cards .card').length }));
  if (brandBefore.brand !== 'Shure' || brandAfter.brand !== 'Shure' || brandAfter.selected !== 'true' || brandAfter.count !== brandBefore.count) failures.push({ interaction: 'back', brandBefore, brandAfter });
  await page.goto(base + '/detail/?product=novastar-h5#overview', { waitUntil: 'networkidle' });
  const longFact = await page.evaluate(() => {
    const node = document.querySelector('#key-specs .long-key-value');
    return node && { text: node.textContent, fontSize: getComputedStyle(node).fontSize, fontWeight: getComputedStyle(node).fontWeight };
  });
  if (!longFact || longFact.fontSize !== '14px' || longFact.fontWeight !== '700') failures.push({ interaction: 'long fact', longFact });
  const report = { failures, errors, scenarios, noSummary, empty, reset, brandBefore, brandAfter, longFact };
  writeFileSync(resolve(reportDir, 'browser-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ failures: failures.length, errors: errors.length, scenarios: Object.keys(scenarios).length, sample: failures.slice(0, 4) }));
  await browser.close(); server.close();
  if (failures.length || errors.length) process.exitCode = 1;
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
