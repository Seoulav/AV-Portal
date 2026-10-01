const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../beta/site');
const out = path.resolve(__dirname, '../Work/기록/W-20261001-001-port-map-screens');
const baseline = '1264feb';
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
 let referencePhase=false;report.referenceErrors=[];report.failedResponses=[];
 page.on('response', r=>{if(r.status()>=400)report.failedResponses.push({url:r.url(),status:r.status(),phase:referencePhase?'reference':'app'});});
 page.on('pageerror', e => (referencePhase?report.referenceErrors:report.errors).push(e.message));
 page.on('console', m => {if(m.type()==='error')(referencePhase?report.referenceErrors:report.errors).push(m.text());});
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
   if (raw.portMap) {
    assert.equal(await page.locator('.port-map-marker').count(),raw.portMap.items.length);
    assert.equal(await page.locator('.port-map-bracket').count(),raw.portMap.items.length);
    const mapMetrics = await page.locator('.port-photo-scroll').evaluate(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth}));
    const overlaps = await page.locator('.port-map-marker').evaluateAll(nodes=>nodes.flatMap((n,i)=>nodes.slice(i+1).filter(q=>{const a=n.getBoundingClientRect(),b=q.getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}).map(q=>[n.textContent,q.textContent])));
    assert.deepEqual(overlaps,[],slug+' marker collisions');
    const hintOverlap=await page.evaluate(()=>{const hint=document.querySelector('#port-map-scroll-hint');if(hint.hidden)return false;const a=hint.getBoundingClientRect(),b=document.querySelector('#zoom-button').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});
    assert.equal(hintOverlap,false,slug+' scroll hint overlaps zoom');
    assert.equal(await page.locator('#rear-connector-panel').isVisible(),false);
    await page.locator('#gallery').screenshot({style:'.site-header{visibility:hidden}',path:path.join(out,`${publicRun?'public':'local'}-${slug}-${width}-port-map.png`)});
    if(mapMetrics.scrollWidth>mapMetrics.width){await page.locator('.port-photo-scroll').focus();await page.keyboard.press('End');assert.ok(await page.locator('.port-photo-scroll').evaluate(x=>x.scrollLeft)>0);await page.locator('#gallery').screenshot({style:'.site-header{visibility:hidden}',path:path.join(out,`${publicRun?'public':'local'}-${slug}-${width}-port-map-right.png`)});await page.keyboard.press('Home');}
    m.portMap={items:raw.portMap.items.length,brackets:raw.portMap.items.length,overlaps,...mapMetrics};
   }
   for (const button of await page.locator('#thumbnails button').all()) {
    if (!(await button.isVisible())) continue; // A single existing image needs no role switcher.
    await button.click();await page.locator('#featured-image').evaluate(i=>i.decode());
    if(raw.portMap) {
     const rear=(await button.textContent()).includes('Rear');
     assert.equal(await page.locator('#port-map-layer .port-map-marker').count(),rear?raw.portMap.items.length:0);
     assert.match(await page.locator('#gallery-title').textContent(),rear?/Port Map/:/제품 사진/);
    }
   }
   await page.locator('#zoom-button').click();assert.equal(await page.locator('#image-dialog').evaluate(x=>x.open),true);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#image-dialog').open && document.activeElement===document.querySelector('#zoom-button'));
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
 if(!publicRun) {
  referencePhase=true;
  for(const width of [1280,390]){
   await page.setViewportSize({width,height:850});
   console.log('RTCOM reference',width);
   await page.goto('about:blank'); // setContent keeps the URL; force a real reference-page navigation.
   await page.goto('https://seoulav.github.io/rtcom-configurator/#products/qms-88ux',{waitUntil:'networkidle'});
   const card=page.locator('.rt-pg-card').filter({has:page.locator('h2', {hasText:'Port Map'})}).first();
   await card.waitFor(); await card.evaluate(el=>Promise.race([Promise.all([...el.querySelectorAll('img')].map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,10000))]));
   await card.screenshot({style:'header{visibility:hidden}',path:path.join(out,`rtcom-qms-88ux-${width}-port-map.png`)});
   const left=fs.readFileSync(path.join(out,`rtcom-qms-88ux-${width}-port-map.png`)).toString('base64');
   const right=fs.readFileSync(path.join(out,`local-ulxd4d-${width}-port-map.png`)).toString('base64');
   await page.setViewportSize({width:width===390?820:1440,height:900});
   await page.setContent(`<html lang="ko"><meta charset="utf-8"><style>body{margin:0;padding:20px;background:#edf2f8;color:#21344a;font:16px sans-serif}h1{font-size:20px}main{display:grid;grid-template-columns:1fr 1fr;gap:20px}img{width:100%;height:auto}h2{font-size:17px}</style><h1>02 Port Map 비교 · 실제 ${width}px 화면 캡처</h1><p>왼쪽: RTCOM QMS-88UX / 오른쪽: AV Portal ULXD4D · 서로 다른 제품이며 번호는 각 제품의 단자에 대응합니다.</p><main><section><h2>RTCOM 공개 기준 화면</h2><img src="data:image/png;base64,${left}"></section><section><h2>ULXD4D 시범 후면 지도</h2><img src="data:image/png;base64,${right}"></section></main></html>`);
   await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
   await page.screenshot({path:path.join(out,`comparison-ulxd4d-rtcom-${width}.png`),fullPage:true});
  }
 }
 assert.deepEqual(report.errors,[]);
 fs.writeFileSync(path.join(out,publicRun?'public.json':'local.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({products:report.products.length,representatives:report.representatives.length,errors:report.errors}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.close();});
