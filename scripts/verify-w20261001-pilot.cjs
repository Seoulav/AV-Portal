const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../beta/site');
const out = path.resolve(__dirname, '../Work/기록/W-20261001-001-pilot-screens');
const baseline = 'a39d32dea3b0afc55f5d5eb0b9dc6dc1a97a83f9';
const pilots = ['novastar-h5', 'ulxd4d', 'dci-4-600da', 'eb-pq2220b', 'aquilon-rs1'];
const representatives = ['brc-am7', 'dm7', 'ua874xa'];
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.pdf':'application/pdf','.woff2':'font/woff2'};
const cache = new Map();
fs.mkdirSync(out, {recursive:true});
let server, browser;
(async () => {
 let base = process.argv[2];
 if (!base) {
  server = http.createServer((req,res) => {
   try {
    let name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const before = name.startsWith('/before/');
    if (before) name = name.slice(7);
    if (name.endsWith('/')) name += 'index.html';
    const file = path.resolve(root, '.' + name);
    if (!file.startsWith(root + path.sep)) throw Error('path');
    let bytes;
    if (before) {
     if (!cache.has(name)) cache.set(name, execFileSync('git', ['show', `${baseline}:beta/site${name}`], {maxBuffer:64*1024*1024}));
     bytes = cache.get(name);
    } else bytes = fs.readFileSync(file);
    res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
   } catch {res.writeHead(404);res.end();}
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/`;
 }
 const publicRun = base.startsWith('https:');
 const report = {time:new Date().toISOString(), baseline, sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(), publicRun, products:[], representatives:[], errors:[]};
 browser = await chromium.launch({executablePath:process.env.AV_PORTAL_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page = await browser.newPage({reducedMotion:'reduce',acceptDownloads:true});
 page.on('pageerror', e => report.errors.push(e.message));
 page.on('console', m => {if(m.type()==='error')report.errors.push(m.text());});
 async function ready(slug, before=false, hash='') {
  const response=await page.goto(new URL(`${before?'before/':''}detail/?product=${slug}${hash}`,base).href,{waitUntil:'networkidle'});
  if (response) assert.equal(response.status(),200); // Hash-only navigation has no HTTP response.
  await page.waitForFunction(()=>document.querySelector('#footer-product')?.textContent);
  await page.evaluate(()=>Promise.all([document.fonts.ready,...[...document.images].map(i=>i.decode().catch(()=>{}))]));
  await page.waitForTimeout(120);
 }
 async function metrics() {return page.evaluate(()=>({
  height:document.documentElement.scrollHeight,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
  broken:[...document.images].filter(i=>i.getAttribute('src')&&!i.naturalWidth).map(i=>i.src),
  images:[...document.querySelectorAll('#thumbnails button')].map(i=>i.textContent),
  specs:[...document.querySelectorAll('.spec-data-row')].map(i=>i.textContent),
  io:[...document.querySelectorAll('#connector-table-body tr')].map(i=>i.textContent),
  ports:[...document.querySelectorAll('#port-grid .pg-port')].map(i=>i.textContent),
  features:[...document.querySelectorAll('#feature-list li')].map(i=>i.textContent),
  documents:[...document.querySelectorAll('#documents-list a, #documents-list button')].map(i=>({text:i.textContent,href:i.getAttribute('href'),pdf:i.getAttribute('data-pdf-open')})),
  flow:document.querySelectorAll('.signal-flow').length,settings:document.querySelectorAll('.setting-card').length,
  overlap:[...document.querySelectorAll('.pg-card')].filter(x=>x.getBoundingClientRect().height).some((a,i,arr)=>arr.slice(i+1).some(b=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.left<y.right-1&&x.right>y.left+1&&x.top<y.bottom-1&&x.bottom>y.top+1;}))
 }));}
 for (const width of [1280,390]) {
  await page.setViewportSize({width,height:850});
  for (const slug of pilots) {
   await ready(slug);const raw=JSON.parse(fs.readFileSync(path.join(root,'detail/data',slug+'.json')));
   const m=await metrics();assert.equal(m.overflow,0,slug);assert.deepEqual(m.broken,[],slug);assert.equal(m.overlap,false,slug);
   assert.equal(m.io.length,raw.io.length);assert.equal(m.specs.length,raw.specifications.length);assert.equal(m.features.length,raw.features.length);
   assert.equal(m.flow,slug==='eb-pq2220b'?0:1);assert.equal(m.settings,raw.settings?.length||0);
   assert.equal(await page.locator('.spec-group-row').count(),0);
   await page.screenshot({path:path.join(out,`${publicRun?'public':'local'}-${slug}-${width}.png`),fullPage:true});
   await page.locator('#io').screenshot({path:path.join(out,`${publicRun?'public':'local'}-${slug}-${width}-flow.png`)});
   for (const button of await page.locator('#thumbnails button').all()) {
    if (!(await button.isVisible())) continue; // A single existing image needs no role switcher.
    await button.click();await page.locator('#featured-image').evaluate(i=>i.decode());
    if(slug==='novastar-h5') {
     const rear=(await button.textContent()).includes('Rear');
     assert.equal(await page.locator('#port-map-layer .port-map-marker').count(),rear?2:0);
     assert.match(await page.locator('#gallery-title').textContent(),rear?/Port Map/:/제품 사진/);
    }
   }
   await page.locator('#zoom-button').click();assert.equal(await page.locator('#image-dialog').evaluate(x=>x.open),true);await page.keyboard.press('Escape');
   if(slug!=='eb-pq2220b') {
    const scroller=page.locator('.signal-flow .flow-scroll');
    if(width===390){await scroller.focus();await page.keyboard.press('End');assert.ok(await scroller.evaluate(x=>x.scrollLeft)>0);await page.keyboard.press('Home');}
    await page.locator('#sources > summary').click();
   }
   await page.locator('#io-table-details > summary').click();assert.equal(await page.locator('#io-table-details').evaluate(x=>x.open),true);
   for(const setting of await page.locator('.setting-card').all()) {
    for(const summary of await setting.locator('details > summary').all()){await summary.click();assert.equal(await summary.evaluate(x=>x.parentElement.open),true);}
   }
   for(const hash of ['#io','#source-TD']) {
    await ready(slug,false,hash);await page.reload({waitUntil:'networkidle'});
    const target=hash==='#io'?'#io':'#sources';const top=await page.locator(target).evaluate(x=>x.getBoundingClientRect().top);
    assert.ok(top>=0 && top<850,`${slug} ${width} ${hash} ${top}`);
   }
   report.products.push({slug,width,url:new URL(`detail/?product=${slug}`,base).href,...m,gallery:true,zoom:true,fullIo:true,reloadHashes:true});
   console.log(slug,width,'OK');
  }
  for(const slug of representatives) {
   let before;
   if(!publicRun){await ready(slug,true);before=await metrics();await page.screenshot({path:path.join(out,`before-${slug}-${width}.png`),fullPage:true});}
   await ready(slug);const after=await metrics();
   if(before)assert.deepEqual(after,before,slug+' information and layout');
   assert.equal(after.flow,0);assert.equal(after.overflow,0);
   await page.screenshot({path:path.join(out,`${publicRun?'public':'after'}-${slug}-${width}.png`),fullPage:true});
   report.representatives.push({slug,width,identicalToBaseline:before?true:null,...after});
  }
 }
 assert.deepEqual(report.errors,[]);
 fs.writeFileSync(path.join(out,publicRun?'public.json':'local.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({products:report.products.length,representatives:report.representatives.length,errors:report.errors}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.close();});
