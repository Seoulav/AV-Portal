const { createServer } = require('node:http');
const fs = require('node:fs');
const { resolve, join, extname, sep } = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const phase = process.argv.includes('--before') ? 'before' : 'after';
const root = resolve(__dirname, '../beta/site');
const out = resolve(__dirname, '../Work/기록/W-20261001-001-screens');
fs.mkdirSync(out, { recursive:true });
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.pdf':'application/pdf','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer((req,res)=>{try {const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const f=resolve(root,'.'+(p.endsWith('/')?p+'index.html':p));if(!f.startsWith(root+sep))throw Error('path');const bytes=fs.readFileSync(f);res.writeHead(200,{'Content-Type':mime[extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);} catch {res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:process.env.AV_PORTAL_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage({acceptDownloads:true});
 const report={phase,sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),screens:[],errors:[]};
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 try {
 for(const slug of ['brc-am7','dm7','ua874xa']) for(const width of [1280,390]) {
  await page.setViewportSize({width,height:850});
  await page.goto(`${base}/detail/?product=${slug}`,{waitUntil:'networkidle'});
  await page.locator('#product-name').waitFor();
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
  await page.waitForTimeout(150);
  const state=await page.evaluate(()=>({overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),height:document.documentElement.scrollHeight,roles:[...document.querySelectorAll('#thumbnails button')].map(x=>x.textContent),ioRows:[...document.querySelectorAll('#connector-table-body tr')].map(x=>x.textContent),ports:[...document.querySelectorAll('#port-grid .pg-port')].map(x=>x.textContent),specs:[...document.querySelectorAll('.spec-data-row')].map(x=>x.textContent),features:[...document.querySelectorAll('#feature-list li')].map(x=>x.textContent),documents:[...document.querySelectorAll('.document-row')].map(x=>x.textContent),docTitle:document.querySelector('#documents-title').textContent,docActions:[...document.querySelectorAll('#documents-list a')].map(x=>({text:x.textContent,href:x.getAttribute('href'),download:x.getAttribute('download')}))}));
  assert.equal(state.overflow,0);
  await page.screenshot({path:join(out,`${phase}-${slug}-${width}.png`),fullPage:true});
  await page.locator('#documents').screenshot({path:join(out,`${phase}-${slug}-${width}-documents.png`)});
  for(const [toggle,selector] of [['#spec-toggle','.spec-data-row'],['#feature-toggle','#feature-list li']]) {
   const button=page.locator(toggle);if(await button.isVisible()) {
    await button.focus();await page.keyboard.press('Enter');assert.equal(await button.getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator(selector+'[hidden]').count(),0);await page.keyboard.press('Enter');assert.equal(await button.getAttribute('aria-expanded'),'false');
   }
  }
  state.imageSwitches=[];
  const count=await page.locator('#thumbnails button').count();
  for(let i=0;i<count;i++) {
   if(count>1)await page.locator('#thumbnails button').nth(i).click();
   await page.locator('#featured-image').evaluate(i=>i.decode());
   state.imageSwitches.push(await page.locator('#featured-image').getAttribute('src'));
   await page.locator('#zoom-button').click();assert.equal(await page.locator('#image-dialog').evaluate(x=>x.open),true);
   await page.keyboard.press('Escape');assert.equal(await page.locator('#image-dialog').evaluate(x=>x.open),false);
   assert.equal(await page.locator('#zoom-button').evaluate(x=>x===document.activeElement),true);
  }
  await page.locator('#io-table-details summary').click();assert.equal(await page.locator('#io-table-details').evaluate(x=>x.open),true);
  state.pdfs=[];
  const pdfs=await page.locator('#documents-list button[data-pdf-open]').count();
  for(let i=0;i<pdfs;i++) {
   const button=page.locator('#documents-list button[data-pdf-open]').nth(i);await button.click();
   await page.locator('#pdf-dialog[open] .pdf-page canvas').first().waitFor({timeout:45000});
   state.pdfs.push(await button.textContent());
   if(slug==='dm7' && i===0) await page.screenshot({path:join(out,`${phase}-dm7-${width}-document-viewer.png`)});
   await page.keyboard.press('Escape');
  }
  state.downloads=[];
  for(const link of await page.locator('#documents-list a[download]').all()) {
   const [download]=await Promise.all([page.waitForEvent('download'),link.click()]);
   assert.equal(await download.failure(),null);state.downloads.push(download.suggestedFilename());
  }
  if(phase==='after') {
   const before=JSON.parse(fs.readFileSync(join(out,'before-metrics.json'))).screens.find(x=>x.slug===slug&&x.width===width);
   for(const key of ['roles','ioRows','ports','features','documents','docActions','imageSwitches','pdfs','downloads'])assert.deepEqual(state[key],before[key],slug+' '+key);
   assert.equal(state.specs.length,before.specs.length);
   const raw=JSON.parse(fs.readFileSync(join(root,'detail/data',slug+'.json')));
   const rendered=await page.locator('.spec-data-row').allTextContents();
   for(const spec of raw.specifications) {
    const row=rendered.find(text=>text.startsWith(spec.group+' · '+spec.name));assert.ok(row,spec.name);
    for(const value of [spec.value,spec.unit,spec.condition].filter(Boolean))assert.ok(row.includes(value),spec.name+' '+value);
    if(spec.source)assert.ok((await page.locator('#spec-source-records').textContent()).includes(spec.name+'출처: '+spec.source));
   }
   assert.equal(await page.locator('.spec-group-row').count(),0);
   assert.equal(state.docTitle,'문서');
  }
  report.screens.push({slug,width,...state});
 }
 assert.deepEqual(report.errors,[]);
 } finally {fs.writeFileSync(join(out,phase+'-metrics.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
 console.log(JSON.stringify({phase,screens:report.screens.length,errors:report.errors.length,documents:report.screens.map(x=>({slug:x.slug,width:x.width,pdfs:x.pdfs.length,downloads:x.downloads.length}))}));
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
