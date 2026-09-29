const { createServer } = require('node:http');
const { readFileSync, existsSync, mkdirSync, writeFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { resolve, extname, sep } = require('node:path');
const { chromium } = require('playwright');

const root = resolve(__dirname, '../beta/site');
const reportDir = resolve(__dirname, '../Work/기록/pdf-viewer-screens');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + sep)) throw new Error('outside root');
    const bytes = readFileSync(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(bytes);
  } catch { response.writeHead(404); response.end(); }
});

(async () => {
  mkdirSync(reportDir, { recursive: true });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`;
  const edge = process.env.AV_PORTAL_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const browser = await chromium.launch({ ...(existsSync(edge) ? { executablePath: edge } : {}), headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 }, acceptDownloads: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const manifest = JSON.parse(readFileSync(resolve(root, 'docs/manifest.json')));
  const captures = [];
  const failures = [];
  try {
    for (const { slug, kind } of [
      { slug: 'aquilon-rs1', kind: 'multi-pdf' },
      { slug: 'led-780h', kind: 'uploaded' },
      { slug: 'brc-am7', kind: 'webpage-only' },
      { slug: 'pt-mz17k', kind: 'large-pdf' }
    ]) for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 850 });
      await page.goto(base + `/detail/?product=${slug}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.removeItem('avPortal.docPopupWidth'));
      const baseWidth = await page.evaluate(() => ({ width: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll('body *')].filter(node => node.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 6).map(node => `${node.tagName.toLowerCase()}${node.id ? '#' + node.id : ''}${node.className && typeof node.className === 'string' ? '.' + node.className.trim().replace(/\s+/g, '.') : ''}:${Math.round(node.getBoundingClientRect().right)}`) }));
      const button = page.locator('#documents-list button[data-pdf-open]').first();
      if (kind === 'webpage-only') {
        if (await button.count()) failures.push(`${slug} unexpectedly has a PDF view button`);
        if (!await page.locator('#documents-list a:has-text("제조사에서 열기")').count()) failures.push(`${slug} external fallback missing`);
        await page.screenshot({ path: resolve(reportDir, `${slug}-${width}.png`) });
        captures.push(`${slug}-${width}`);
        continue;
      }
      if (!await button.count()) { failures.push(`${slug} PDF view button missing`); continue; }
      if (slug === 'aquilon-rs1' && width === 1280) { await button.focus(); await page.keyboard.press('Enter'); }
      else await button.click();
      try { await page.locator('#pdf-dialog[open] .pdf-page canvas').first().waitFor({ timeout: 40000 }); }
      catch { failures.push(`${slug} first page failed at ${width}px`); continue; }
      const metrics = await page.evaluate(() => {
        const box = document.querySelector('#pdf-dialog').getBoundingClientRect();
        return { width: box.width, height: box.height, renderedCount: document.querySelectorAll('#pdf-dialog .pdf-page canvas').length,
          totalPages: document.querySelectorAll('#pdf-dialog .pdf-page').length,
          rootWidth: document.documentElement.scrollWidth,
          dialogWidth: document.querySelector('#pdf-dialog').scrollWidth,
          bodyWidth: document.querySelector('#pdf-dialog .pdf-body').scrollWidth,
          pageWidth: document.querySelector('#pdf-dialog .pdf-pages').scrollWidth,
          overflow: document.documentElement.scrollWidth > innerWidth,
          original: document.querySelector('#pdf-dialog .pdf-link[target="_blank"]')?.href };
      });
      if (metrics.overflow) failures.push(`${slug} horizontal overflow at ${width}px: base ${baseWidth.width}, root ${metrics.rootWidth}, dialog ${metrics.dialogWidth}, body ${metrics.bodyWidth}, pages ${metrics.pageWidth}, offenders ${baseWidth.offenders.join(', ')}`);
      if (width === 1280 && Math.abs(metrics.width - 1040) > 2) failures.push(`${slug} default width ${metrics.width}`);
      if (width === 390 && (Math.abs(metrics.width - 390) > 2 || Math.abs(metrics.height - 850) > 2)) failures.push(`${slug} mobile modal is not full screen`);
      if (!metrics.original) failures.push(`${slug} original link missing`);
      if (slug === 'pt-mz17k' && metrics.renderedCount >= metrics.totalPages) failures.push('large PDF rendered every page instead of visible pages');
      await page.screenshot({ path: resolve(reportDir, `${slug}-${width}.png`) });
      captures.push(`${slug}-${width}`);
      if (slug === 'aquilon-rs1' && width === 1280) {
        const source = await page.locator('#pdf-dialog a[download]').getAttribute('href');
        const expected = manifest.mirrors.find(entry => source.endsWith(entry.file));
        const pending = page.waitForEvent('download');
        await page.locator('#pdf-dialog a[download]').click();
        const download = await pending;
        const actual = createHash('sha256').update(readFileSync(await download.path())).digest('hex');
        if (actual !== expected?.sha256) failures.push('browser download SHA differs from manifest');
        await page.locator('#pdf-dialog [data-pdf-action="wide"]').click();
        const wide = await page.locator('#pdf-dialog').evaluate(node => node.getBoundingClientRect().width);
        if (wide < 1250) failures.push(`wide button width ${wide}`);
        await page.locator('#pdf-dialog [data-pdf-action="wide"]').click();
        const box = await page.locator('#pdf-dialog').boundingBox();
        await page.mouse.move(box.x + box.width - 3, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 450, box.y + box.height / 2, { steps: 5 });
        await page.mouse.up();
        const resized = await page.locator('#pdf-dialog').evaluate(node => node.getBoundingClientRect().width);
        if (Math.abs(resized - 900) > 35) failures.push(`edge resize width ${resized}`);
      }
      await page.keyboard.press('Escape');
      if (await page.locator('#pdf-dialog[open]').count()) failures.push(`${slug} Escape did not close`);
      if (!await button.evaluate(node => document.activeElement === node)) failures.push(`${slug} focus did not return`);
    }

    console.log(`Representative captures: ${captures.length}`);
    if (process.env.AV_PORTAL_REPRESENTATIVES_ONLY) {
      console.log(JSON.stringify({ captures, failures, errors }));
      if (failures.length || errors.length) process.exitCode = 1;
      return;
    }
    // The public URL must deliver exactly the same bytes the manifest records.
    for (const [index, entry] of manifest.mirrors.entries()) {
      const response = await fetch(base + '/docs/' + entry.file);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!response.ok || createHash('sha256').update(bytes).digest('hex') !== entry.sha256) failures.push(`${entry.file} served SHA mismatch`);
      if ((index + 1) % 10 === 0) console.log(`Served PDF hashes ${index + 1}/${manifest.mirrors.length}`);
    }
    console.log('Starting popup checks');
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    console.log('Audit page loaded');
    await page.evaluate(async () => {
      const { createPdfViewer } = await import('/shared/pdf-viewer.mjs');
      window.auditViewer = createPdfViewer();
    });
    console.log('Audit viewer ready');
    let opened = 0;
    for (const entry of manifest.mirrors) {
      try {
        console.log(`Opening ${opened + 1}/${manifest.mirrors.length}: ${entry.file}`);
        await page.evaluate(async item => {
          await window.auditViewer.open({ file: '/docs/' + item.file, title: item.file, sourceUrl: item.url, trigger: document.querySelector('a') });
        }, entry);
        await page.locator('#pdf-dialog[open] .pdf-page canvas').first().waitFor({ timeout: 40000 });
        opened++;
      } catch (error) { failures.push(`${entry.file}: ${error.message}`); }
      finally { await page.evaluate(() => { if (window.auditViewer.dialog.open) window.auditViewer.dialog.close(); }); }
      if (opened % 10 === 0 && opened) console.log(`Viewer opened ${opened}/${manifest.mirrors.length}`);
    }
    const report = { copied: manifest.mirrors.length, opened, captures, errors, failures };
    writeFileSync(resolve(reportDir, 'browser-report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ copied: report.copied, opened, captures: captures.length, errors: errors.length, failures: failures.length, sample: failures.slice(0, 5) }));
    if (errors.length || failures.length || opened !== manifest.mirrors.length) process.exitCode = 1;
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
