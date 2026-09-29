const { createServer } = require('node:http');
const { readFileSync, existsSync, mkdirSync } = require('node:fs');
const { resolve, extname, sep } = require('node:path');
const { chromium } = require('playwright');

const root = resolve(__dirname, '../beta/site');
const reportDir = resolve(__dirname, '../Work/기록/header-doc-labels-screens');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const cases = [
  { slug: 'aquilon-rs1', header: ['매뉴얼 보기', '↓', '사양서 보기', '↓', '기술문서 보기', '↓'], detail: ['보기', '↓ 내려받기', '보기', '↓ 내려받기', '보기', '↓ 내려받기'] },
  { slug: 'ac18-26', header: ['사양서 ↗', '참고자료 보기', '↓'], detail: ['제조사에서 열기 ↗', '보기', '↓ 내려받기'] },
  { slug: 'lh115qhfebgxkr', header: ['사양서 ↗'], detail: ['제조사에서 열기 ↗'] }
];

const server = createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + sep)) throw new Error('outside root');
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(readFileSync(file));
  } catch { response.writeHead(404); response.end(); }
});

(async () => {
  mkdirSync(reportDir, { recursive: true });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const edge = process.env.AV_PORTAL_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const browser = await chromium.launch({ ...(existsSync(edge) ? { executablePath: edge } : {}), headless: true });
  const errors = [];
  const failures = [];
  const captures = [];
  try {
    for (const width of [1280, 390]) for (const sample of cases) {
      const page = await browser.newPage({ viewport: { width, height: 850 } });
      page.on('pageerror', error => errors.push(`${sample.slug} ${width}: ${error.message}`));
      page.on('console', message => { if (message.type() === 'error') errors.push(`${sample.slug} ${width}: ${message.text()}`); });
      await page.goto(`http://127.0.0.1:${server.address().port}/detail/?product=${sample.slug}`, { waitUntil: 'networkidle' });
      const header = await page.locator('#header-docs button, #header-docs a').allTextContents();
      const detail = await page.locator('#documents-list .document-actions button, #documents-list .document-actions a').allTextContents();
      const same = (left, right) => JSON.stringify(left.map(value => value.trim())) === JSON.stringify(right);
      if (!same(header, sample.header)) failures.push(`${sample.slug} ${width}: header ${JSON.stringify(header)}`);
      if (!same(detail, sample.detail)) failures.push(`${sample.slug} ${width}: detail ${JSON.stringify(detail)}`);
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) failures.push(`${sample.slug} ${width}: horizontal overflow`);
      await page.locator('#header-docs').scrollIntoViewIfNeeded();
      const name = `${sample.slug}-${width}.png`;
      await page.screenshot({ path: resolve(reportDir, name) });
      captures.push(name);
      const external = page.locator('#header-docs a[target="_blank"]');
      if (sample.slug === 'lh115qhfebgxkr' && await external.count() !== 1) failures.push(`${sample.slug} ${width}: manufacturer new-tab link missing`);
      const open = page.locator('#header-docs button[data-pdf-open]').first();
      if (await open.count()) {
        await open.click();
        try { await page.locator('#pdf-dialog[open] .pdf-page canvas').first().waitFor({ timeout: 40000 }); }
        catch { failures.push(`${sample.slug} ${width}: PDF popup failed`); }
      }
      await page.close();
    }
    console.log(JSON.stringify({ captures, failures, errors }));
    if (failures.length || errors.length) process.exitCode = 1;
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
