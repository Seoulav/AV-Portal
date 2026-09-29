const { createServer } = require('node:http');
const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('node:fs');
const { resolve, extname, sep } = require('node:path');
const { chromium } = require('playwright');

const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('usage: node scripts/measure-stage4.cjs before|after');
const root = resolve(__dirname, '../beta/site');
const reportDir = resolve(__dirname, '../Work/기록/stage4-search-index');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
let requests = [];
const server = createServer((request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
    if (!file.startsWith(root + sep)) throw new Error('outside root');
    const bytes = readFileSync(file);
    requests.push({ path, bytes: bytes.length });
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(bytes);
  } catch { response.writeHead(404); response.end(); }
});
const summarize = rows => {
  const select = regex => { const found = rows.filter(item => regex.test(item.path)); return { count: found.length, bytes: found.reduce((total, item) => total + item.bytes, 0) }; };
  return { data: select(/\.json$/), images: select(/\.(?:webp|png|jpg|jpeg|svg)$/), total: select(/./) };
};

(async () => {
  mkdirSync(reportDir, { recursive: true });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`;
  const edge = process.env.AV_PORTAL_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const browser = await chromium.launch({ ...(existsSync(edge) ? { executablePath: edge } : {}), headless: true });
  const report = { phase, cases: [], failures: [] };
  try {
    for (const width of [1280, 390]) for (const name of ['home', 'HDMI']) {
      const page = await browser.newPage({ viewport: { width, height: 850 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      requests = [];
      const started = performance.now();
      await page.goto(base + (name === 'home' ? '/' : '/?q=HDMI'), { waitUntil: 'networkidle', timeout: 90000 });
      const loadMs = Math.round(performance.now() - started);
      const state = await page.evaluate(() => ({ items: document.querySelector('#equipment-total').textContent, cards: document.querySelectorAll('#cards .card').length, overflow: document.documentElement.scrollWidth > innerWidth, broken: [...document.querySelectorAll('img[src]')].filter(image => image.complete && !image.naturalWidth).map(image => image.src) }));
      const summary = summarize(requests);
      report.cases.push({ name, width, ...summary, loadMs, state, errors });
      if (state.items !== '247' || state.overflow || state.broken.length || errors.length || (name === 'HDMI' && state.cards === 0)) report.failures.push(`${name}-${width}`);
      await page.screenshot({ path: resolve(reportDir, `${phase}-${name.toLowerCase()}-${width}.png`), fullPage: true });
      await page.close();
    }
    writeFileSync(resolve(reportDir, `${phase}.json`), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ phase, cases: report.cases.map(({ name, width, data, images, loadMs }) => ({ name, width, data, images, loadMs })), failures: report.failures }));
    if (report.failures.length) process.exitCode = 1;
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
