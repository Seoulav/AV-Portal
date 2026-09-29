const { createServer } = require('node:http');
const { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } = require('node:fs');
const { resolve, join, extname, sep } = require('node:path');
const { chromium } = require('playwright');

const root = resolve(__dirname, '../beta/site');
const reportDir = resolve(__dirname, '../Work/기록/stage2-screens');
const contentType = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};
const server = createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const resource = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
    const file = resolve(root, '.' + resource);
    if (!(file === root || file.startsWith(root + sep))) throw new Error('path');
    const bytes = readFileSync(file);
    response.writeHead(200, { 'Content-Type': contentType[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(bytes);
  } catch {
    response.writeHead(404);
    response.end();
  }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const edgePath = process.env.AV_PORTAL_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const browser = await chromium.launch({ ...(existsSync(edgePath) ? { executablePath: edgePath } : {}), headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const slugs = readdirSync(join(root, 'detail/data')).filter(name => name.endsWith('.json')).map(name => name.slice(0, -5));
  const quick = process.argv.includes('--quick');
  const failures = [];
  const representatives = ['tr315', 'novastar-h5', 'a900w-r-gm', 'aquilon-rs1'];
  mkdirSync(reportDir, { recursive: true });
  for (const slug of quick ? [] : slugs) {
    const source = JSON.parse(readFileSync(join(root, 'detail/data', slug + '.json')));
    const errors = [];
    const onError = error => errors.push(error.message);
    const onConsole = message => { if (message.type() === 'error') errors.push(message.text()); };
    const onResponse = response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); };
    page.on('pageerror', onError);
    page.on('console', onConsole);
    page.on('response', onResponse);
    try {
      await page.goto(`${base}/detail/?product=${slug}`, { waitUntil: 'networkidle', timeout: 15000 });
      const state = await page.evaluate(() => ({
        title: document.querySelector('#product-name')?.textContent?.trim(),
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        broken: [...document.querySelectorAll('img[src]')].filter(image => image.complete && image.naturalWidth === 0).map(image => image.src),
        cards: [...document.querySelectorAll('[data-card]:not([hidden])')].map(card => card.dataset.card),
        ioRows: document.querySelectorAll('#connector-table-body tr').length,
        specRows: document.querySelectorAll('.spec-data-row').length,
        features: document.querySelectorAll('#feature-list li').length,
        documents: document.querySelectorAll('.document-row').length
      }));
      const expectedDocuments = (source.documents ?? []).filter(item => item.type !== 'Official Product Page' && item.url && ['VERIFIED', 'FOUND', 'READY'].includes(item.status)).length;
      if (!state.title || state.overflow || state.broken.length || errors.length || state.ioRows !== (source.io ?? []).length || state.specRows !== (source.specifications ?? []).length || state.features !== (source.features ?? []).length || state.documents !== expectedDocuments) failures.push({ slug, ...state, expected: { ioRows: (source.io ?? []).length, specRows: (source.specifications ?? []).length, features: (source.features ?? []).length, documents: expectedDocuments }, errors });
      if (representatives.includes(slug)) {
        await page.screenshot({ path: join(reportDir, `${slug}-390.png`), fullPage: true });
        await page.setViewportSize({ width: 1280, height: 850 });
        await page.waitForTimeout(100);
        const packing = await page.evaluate(() => {
          const gaps = ids => {
            const cards = ids.map(id => document.getElementById(id)).filter(card => card && !card.hidden);
            return cards.slice(1).map((card, index) => Math.round(card.getBoundingClientRect().top - cards[index].getBoundingClientRect().bottom));
          };
          return { active: document.querySelector('.detail-cards').classList.contains('is-packed'), gaps: [...gaps(['overview', 'specifications', 'features']), ...gaps(['gallery', 'io', 'related-products', 'documents'])] };
        });
        if (!packing.active || packing.gaps.some(gap => gap < 0 || gap > 30)) failures.push({ slug, packing });
        await page.screenshot({ path: join(reportDir, `${slug}-1280.png`), fullPage: true });
        await page.setViewportSize({ width: 390, height: 844 });
      }
    } catch (error) {
      failures.push({ slug, errors: [...errors, error.message] });
    } finally {
      page.off('pageerror', onError);
      page.off('console', onConsole);
      page.off('response', onResponse);
    }
  }
  const hashChecks = {};
  for (const hash of ['overview', 'features', 'specifications', 'io', 'related-products', 'documents', 'sources']) {
    await page.goto(`${base}/detail/?product=aquilon-rs1#${hash}`, { waitUntil: 'networkidle' });
    hashChecks[hash] = await page.evaluate(() => ({
      hash: location.hash,
      sourceOpen: document.querySelector('#sources').open,
      title: document.querySelector('#product-name')?.textContent?.trim()
    }));
    if (hash === 'related-products' ? hashChecks[hash].hash !== '#overview' : hashChecks[hash].hash !== '#' + hash) failures.push({ hash, result: hashChecks[hash] });
    if (hash === 'sources' && !hashChecks[hash].sourceOpen) failures.push({ hash, result: hashChecks[hash] });
  }
  await page.goto(`${base}/detail/?product=aquilon-rs1`, { waitUntil: 'networkidle' });
  await page.setViewportSize({ width: 800, height: 850 });
  await page.waitForTimeout(100);
  const intermediate = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.detail-cards > [data-card]:not([hidden])')];
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      oneColumn: cards.every(card => Math.abs(card.getBoundingClientRect().left - cards[0].getBoundingClientRect().left) < 2),
      ordered: cards.every((card, index) => !index || card.getBoundingClientRect().top >= cards[index - 1].getBoundingClientRect().bottom)
    };
  });
  if (intermediate.overflow || !intermediate.oneColumn || !intermediate.ordered) failures.push({ interaction: '800px layout', intermediate });
  await page.setViewportSize({ width: 1280, height: 850 });
  const beforePrint = await page.evaluate(() => ({
    sources: document.querySelector('#sources').open,
    hiddenSpecs: document.querySelectorAll('.spec-data-row[hidden]').length
  }));
  const duringPrint = await page.evaluate(() => {
    window.dispatchEvent(new Event('beforeprint'));
    return { sources: document.querySelector('#sources').open, hiddenSpecs: document.querySelectorAll('.spec-data-row[hidden]').length };
  });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  const afterPrint = await page.evaluate(() => ({
    sources: document.querySelector('#sources').open,
    hiddenSpecs: document.querySelectorAll('.spec-data-row[hidden]').length
  }));
  if (duringPrint.sources !== true || duringPrint.hiddenSpecs !== 0 || afterPrint.sources !== beforePrint.sources || afterPrint.hiddenSpecs !== beforePrint.hiddenSpecs) failures.push({ interaction: 'print', beforePrint, duringPrint, afterPrint });
  await page.locator('#zoom-button').click();
  const zoomOpen = await page.locator('#image-dialog').evaluate(dialog => dialog.open);
  if (!zoomOpen) failures.push({ interaction: 'zoom' });
  await page.locator('#dialog-close').click();
  await page.locator('#detail-search').fill('DM7');
  await page.locator('#detail-search-form button[type="submit"]').click();
  const searchQuery = new URL(page.url()).searchParams.get('q');
  if (searchQuery !== 'DM7') failures.push({ interaction: 'search', searchQuery });
  await page.goBack({ waitUntil: 'networkidle' });
  const returnedTitle = await page.locator('#product-name').textContent();
  if (!returnedTitle?.includes('Aquilon')) failures.push({ interaction: 'back', returnedTitle });
  const report = { checked: quick ? 0 : slugs.length, failures, representatives, hashChecks, intermediate, zoomOpen, searchQuery, returnedTitle, beforePrint, duringPrint, afterPrint };
  writeFileSync(join(reportDir, quick ? 'interaction-report.json' : 'browser-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ checked: report.checked, failures: failures.length, sample: failures.slice(0, 5) }));
  await browser.close();
  server.close();
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
