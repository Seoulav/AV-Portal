const {createServer}=require('node:http');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../beta/site'),out=path.resolve(__dirname,'../Work/기록/W-20261001-001-flow-screens');
const before=process.argv.includes('--baseline'),onlyFixtures=process.argv.includes('--fixtures');
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.pdf':'application/pdf'};
let fixture;
const server=createServer((req,res)=>{try{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname==='/fixture') {res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/shared/pg.css"><link rel="stylesheet" href="/detail/styles.css"><link rel="icon" href="/favicon.svg"><title>Signal Flow 검토</title><style>body{margin:0;background:#f4f6fa}main{max-width:754px;margin:24px auto;padding:0 16px}.pg-card{padding:24px}h1{font-size:22px}.fixture-label{color:#52637c;font-size:14px}@media(max-width:600px){main{padding:0 12px}.pg-card{padding:16px}}</style><main><p class="fixture-label">AV Portal · 검토용 fixture / 제품 등록 아님</p><h1 id="name"></h1><section class="pg-card"><h2>03 Signal Flow</h2><div id="flow"></div></section></main><script type="module">import {renderSignalFlow} from '/detail/detail-enhancement-view.mjs'; const p=await(await fetch('/fixture-data')).json();document.querySelector('#name').textContent=p.model;document.querySelector('#flow').append(renderSignalFlow(p.signalFlow,p.model));window.fixtureReady=true;</script></html>`);}
  if(u.pathname==='/fixture-data'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(fixture));}
  const f=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));if(!f.startsWith(root+path.sep))throw Error('path');
  const b=fs.readFileSync(f);res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});res.end(b);
}catch{res.writeHead(404);res.end();}});
(async()=>{
 const {fixtureProduct,scenarios,qmsFixture}=await import('../tests/fixtures/signal-flow.mjs');
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:process.env.AV_PORTAL_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:850},reducedMotion:'reduce'});const report={products:[],fixtures:[],errors:[]};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))report.errors.push(m.text());});
 async function ready(slug){await page.goto(`${base}/detail/?product=${slug}`);await page.waitForFunction(()=>document.querySelector('#footer-product')?.textContent);await page.evaluate(()=>Promise.all([document.fonts.ready,...[...document.images].map(i=>i.decode().catch(()=>{}))]));await page.waitForTimeout(40);}
 try{
 if(!onlyFixtures)for(const width of [1280,390]){
  await page.setViewportSize({width,height:850});
  for(const file of fs.readdirSync(path.join(root,'detail/data')).filter(f=>f.endsWith('.json'))){
   const slug=file.slice(0,-5),data=JSON.parse(fs.readFileSync(path.join(root,'detail/data',file)));assert.equal(data.signalFlow,undefined);await ready(slug);
   const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,height:document.documentElement.scrollHeight,text:document.querySelector('main').innerText,io:document.querySelectorAll('#connector-table-body tr').length,ports:document.querySelectorAll('#port-grid .pg-port').length,images:document.querySelectorAll('#thumbnails button').length,flow:document.querySelectorAll('.signal-flow').length,ioTitle:document.querySelector('#io-title').textContent}));
   assert.equal(state.overflow,0,slug);assert.equal(state.flow,0,slug);assert.equal(state.io,data.io.length);assert.equal(state.images,data.images.length);
   state.textHash=createHash('sha256').update(state.text).digest('hex');delete state.text;
   report.products.push({slug,width,...state});
   if(['brc-am7','dm7','ua874xa'].includes(slug))await page.screenshot({path:path.join(out,`${before?'before':'after'}-${slug}-${width}.png`),fullPage:true});
   if(report.products.length%80===0)console.log('Existing screens '+report.products.length+'/480');
  }
 }
 if(!before){
  for(const width of [1280,390]){
    fixture=fixtureProduct('control');const long='제어'.repeat(100);
    fixture.signalFlow.auxiliary[0].label=long;fixture.signalFlow.connections[0].label=long;
    await page.setViewportSize({width,height:850});await page.goto(base+'/fixture');await page.waitForFunction(()=>window.fixtureReady);
    const clipped=await page.locator('svg').evaluate(svg=>{const box=svg.getBoundingClientRect();return [...svg.querySelectorAll('.flow-edge-label')].some(n=>{const r=n.getBoundingClientRect();return r.left<box.left||r.right>box.right});});
    assert.equal(clipped,false,'long route label must not be clipped inside SVG');
    assert.equal(await page.locator('.flow-route-notes li').count(),2);
    assert.ok((await page.locator('.flow-route-notes').textContent()).includes(long));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
    report.fixtures.push({name:'long-primary-and-aux-labels',width});
  }

  if(!onlyFixtures){const baseline=JSON.parse(fs.readFileSync(path.join(out,'baseline.json')));assert.deepEqual(report.products,baseline.products,'240 products must retain text, counts and page heights at both widths');}
  for(const [name,p] of [...Object.keys(scenarios).map(t=>[t,fixtureProduct(t)]),['qms-88ux',qmsFixture()]])for(const width of [1280,390]){
   fixture=p;await page.setViewportSize({width,height:850});await page.goto(base+'/fixture');await page.waitForFunction(()=>window.fixtureReady);await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.locator('.flow-scroll').count(),1,'horizontal diagram scroll viewport');
   const m=await page.locator('.flow-scroll').evaluate(x=>({overflow:document.documentElement.scrollWidth-innerWidth,scrollWidth:x.scrollWidth,clientWidth:x.clientWidth,label:x.getAttribute('aria-label')}));assert.equal(m.overflow,0);assert.ok(m.label);
   assert.equal(await page.locator('.flow-process-shape').count(),p.signalFlow.processes.length);
   assert.equal(await page.locator('.flow-edge').count(),p.signalFlow.connections.length+p.signalFlow.auxiliary.length);
   const svg=page.locator('.signal-flow svg');assert.ok(await svg.getAttribute('aria-label'));
   if(width===390){assert.ok(m.scrollWidth>m.clientWidth);await page.locator('.flow-scroll').focus();await page.keyboard.press('End');await page.waitForTimeout(30);assert.ok(await page.locator('.flow-scroll').evaluate(x=>x.scrollLeft>0));await page.locator('.flow-scroll').evaluate(x=>x.scrollLeft=0);}
   await page.locator('h1').click();if(name==='qms-88ux')await page.locator('.pg-card').screenshot({path:path.join(out,`av-qms-card-${width}.png`)});await page.screenshot({path:path.join(out,`${name}-${width}.png`),fullPage:true});
   report.fixtures.push({name,width,...m});
  }
 }
 assert.deepEqual(report.errors,[]);
 }finally{fs.writeFileSync(path.join(out,before?'baseline.json':onlyFixtures?'fixture-metrics.json':'validation.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
 console.log(JSON.stringify({screens:report.products.length,fixtures:report.fixtures.length,errors:report.errors.length}));
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
