const { createServer } = require('node:http');
const fs = require('node:fs');
const { resolve, join, extname, sep } = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const phase='regression';
const root = resolve(__dirname, '../beta/site');
const out = resolve(__dirname, '../Work/기록/W-20261001-001-flow-screens');
fs.mkdirSync(out, { recursive:true });
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.pdf':'application/pdf','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer((req,res)=>{try {const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const f=resolve(root,'.'+(p.endsWith('/')?p+'index.html':p));if(!f.startsWith(root+sep))throw Error('path');const bytes=fs.readFileSync(f);res.writeHead(200,{'Content-Type':mime[extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);} catch {res.writeHead(404);res.end();}});
(async()=>{
 const {fixtureProduct}=await import('../tests/fixtures/signal-flow.mjs');
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:process.env.AV_PORTAL_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:850}});
 const report={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),products:[],fixtures:[],hashes:[],errors:[]};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 async function ready(slug) {
  await page.goto(`${base}/detail/?product=${slug}`,{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#product-name')?.textContent&&document.querySelector('#footer-product')?.textContent);
  await page.evaluate(()=>Promise.all([document.fonts.ready,...[...document.images].map(i=>i.decode().catch(()=>{}))]));await page.waitForTimeout(50);
 }
 async function geometry(){return page.evaluate(()=>({overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),broken:[...document.querySelectorAll('img[src]:not([hidden])')].filter(i=>!i.naturalWidth).map(i=>i.getAttribute('src')),overlap:(()=>{const r=[...document.querySelectorAll('.detail-cards > section:not([hidden])')].map(x=>x.getBoundingClientRect());return r.some((a,i)=>r.slice(i+1).some(b=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1));})()}));}
 try {
 const slugs=fs.readdirSync(join(root,'detail/data')).filter(x=>x.endsWith('.json'));
 for(const filename of process.argv.includes('--fixtures') ? [] : slugs) {
  const raw=JSON.parse(fs.readFileSync(join(root,'detail/data',filename)));const slug=filename.slice(0,-5);await ready(slug);
  const state=await geometry();assert.equal(state.overflow,0,slug);assert.deepEqual(state.broken,[],slug);assert.equal(state.overlap,false,slug);
  const counts=await page.evaluate(()=>({io:document.querySelectorAll('#connector-table-body tr').length,specs:document.querySelectorAll('.spec-data-row').length,features:document.querySelectorAll('#feature-list li').length,images:document.querySelectorAll('#thumbnails button').length}));
  assert.deepEqual(counts,{io:raw.io.length,specs:raw.specifications.length,features:raw.features.length,images:raw.images.length});
  report.products.push({slug,...counts,...state});
  if(report.products.length%40===0)console.log('Checked '+report.products.length+'/'+slugs.length);
 }
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:850});await ready('rtcom-qms-88ux');assert.equal((await geometry()).overflow,0);assert.equal(await page.locator('.signal-flow').count(),0);report.fixtures.push({name:'rtcom-no-auto-adoption',width});
  for(const hash of ['overview','gallery','io','specifications','features','documents','sources','source-TD']){
   await page.goto(`${base}/detail/?product=dm7#${hash}`,{waitUntil:'networkidle'});
   for(let reload=0;reload<2;reload++){
    if(reload)await page.reload({waitUntil:'networkidle'});
    const target=hash.startsWith('source-')?'#sources':'#'+hash;
    // Same-document hash navigation uses smooth scroll: networkidle is not a scroll-completion event.
    await page.waitForFunction(selector=>{const top=document.querySelector(selector).getBoundingClientRect().top;return top>=0&&(top<200||(Math.abs(scrollY+innerHeight-document.documentElement.scrollHeight)<2&&top<850));},target,{timeout:3000});
    const top=await page.locator(target).evaluate(x=>x.getBoundingClientRect().top);
    const atBottom=await page.evaluate(()=>Math.abs(scrollY+innerHeight-document.documentElement.scrollHeight)<2);
    assert.ok(top>=0&&(top<200||(atBottom&&top<850)),`${hash} ${width} ${top}`);
    if(target==='#sources')assert.equal(await page.locator('#sources').evaluate(x=>x.open),true);
    report.hashes.push({hash,width,reload:Boolean(reload),top});
   }
  }
  await page.goto(`${base}/detail/?product=dm7#related-products`,{waitUntil:'networkidle'});
  await page.waitForURL('**#overview');
  assert.equal(new URL(page.url()).hash,'#overview','hidden related section keeps previous fallback');
  const raw=JSON.parse(fs.readFileSync(join(root,'detail/data/dm7.json')));
  for(const type of ['distribution','matrix','switcher','extender','amplifier-channel']){
   const fixture={...raw,images:raw.images.map(i=>({...i,originalSize:i.resolution})),lead:'<img src=x onerror=alert(1)> **강조** 문장. **두 번째**',subtitle:'선택 자료 테스트',keyFacts:[{label:'입력',value:4,unit:'개'},{label:'출력',value:2,unit:'개'}],portMap:{image:'Rear',items:[{n:1,label:'테스트 단자',desc:'좌표 계산 시험용 (실제품 근거 아님)',x1:20,x2:60}]},signalFlow:fixtureProduct(type).signalFlow,settings:[{kind:'modes',title:'모드 테스트',items:[{name:'모드1',summary:'설명',detail:'상세 설명'}]},{kind:'edid',title:'표 테스트',columns:['모드','값'],rows:[['1','자동']]}]};
   await page.route('**/detail/data/dm7.json',route=>route.fulfill({json:fixture}));await ready('dm7');
   assert.equal(await page.locator('#overview-summary img').count(),0);assert.equal(await page.locator('#overview-summary strong').count(),1);
   assert.equal(await page.locator('#key-specs .fact-unit').count(),2);assert.equal(await page.locator('.setting-card').count(),2);assert.equal(await page.locator('.signal-flow').count(),1);
   assert.equal(await page.locator('#port-map-layer .port-map-marker').count(),0);
   await page.getByRole('button',{name:'Rear',exact:true}).click();await page.locator('#featured-image').evaluate(i=>i.decode());await page.waitForTimeout(60);
   assert.equal(await page.locator('.port-map-marker').count(),1);
   const marker=await page.locator('.port-map-marker').evaluate(x=>parseFloat(x.style.left));const natural=await page.locator('#featured-image').evaluate(x=>x.naturalWidth);assert.ok(Math.abs(marker-40/natural*100)<0.001);
   await page.getByRole('button',{name:'Front',exact:true}).click();await page.locator('#featured-image').evaluate(i=>i.decode());await page.waitForTimeout(80);assert.equal(await page.locator('.port-map-marker').count(),0);assert.match(await page.locator('#gallery-title').textContent(),/제품 사진/);
   await page.locator('#setting-6 summary').click();assert.equal(await page.locator('#setting-6 details').evaluate(x=>x.open),true);
   assert.equal(await page.locator('#sources #connector-table-body tr').count(),raw.io.length);
   await page.waitForTimeout(150);assert.equal((await geometry()).overflow,0);assert.equal((await geometry()).overlap,false);
   report.fixtures.push({name:type,width,markerPercent:marker});await page.unroute('**/detail/data/dm7.json');
  }
  for(const fixture of [{...raw,portMap:{image:'Rear',items:[{n:1,label:'Mismatch',desc:'',x1:900,x2:1100}]}}, {...raw,images:[],portMap:{image:'Rear',items:[]}}, {...raw,portMap:{image:'Rear',items:[{n:1,label:'invalid range',desc:'',x1:0,x2:999999}]},signalFlow:{type:'wrong'},settings:[{}]}]){
   await page.route('**/detail/data/dm7.json',route=>route.fulfill({json:fixture}));await ready('dm7');
   assert.equal(await page.locator('.signal-flow').count(),0);assert.equal(await page.locator('.setting-card').count(),0);assert.equal(await page.locator('.port-map-marker').count(),0);
   assert.equal(await page.locator('#io #connector-table-body tr').count(),raw.io.length);assert.equal((await geometry()).overflow,0);await page.unroute('**/detail/data/dm7.json');
  }
  for(const kind of ['dip','table']){
   await page.route('**/detail/data/dm7.json',route=>route.fulfill({json:{...raw,settings:[{kind,title:kind,columns:['A','B'],rows:[['1','2']]}]}}));await ready('dm7');assert.equal(await page.locator('.setting-card tbody tr').count(),1);await page.unroute('**/detail/data/dm7.json');
  }
  await page.goto(base+'/',{waitUntil:'networkidle'});assert.equal(await page.locator('#results-workspace').evaluate(x=>x.hidden),true);
  await page.locator('[data-top-category="audio"]').click();await page.waitForTimeout(100);assert.ok(await page.locator('#cards .card').count()>0);
  await page.goto(base+'/?q=DM7',{waitUntil:'networkidle'});const link=page.locator('#cards a[href*="detail/?product=dm7"]').first();await link.click();await page.waitForURL('**/detail/?product=dm7');await page.goBack({waitUntil:'networkidle'});assert.equal(new URL(page.url()).searchParams.get('q'),'DM7');
  await page.goto(base+'/?brand=Shure',{waitUntil:'networkidle'});assert.ok(await page.locator('#cards .card').count()>0);assert.equal((await geometry()).overflow,0);
  report.fixtures.push({name:'Library search/category/brand/back',width});
 }
 assert.deepEqual(report.errors,[]);
 } finally {fs.writeFileSync(join(out,'regression-metrics.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
 console.log(JSON.stringify({products:report.products.length,fixtures:report.fixtures.length,hashes:report.hashes.length,errors:report.errors}));
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
