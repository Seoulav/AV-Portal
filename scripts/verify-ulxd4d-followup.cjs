const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve('beta/site'),out=path.resolve('Work/기록/W-20261001-001-ulxd4d-followup-screens');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
let server,browser;
(async()=>{
let base=process.argv[2];if(!base){server=http.createServer((req,res)=>{try{let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(url.endsWith('/'))url+='index.html';const f=path.resolve(root,'.'+url);assert.ok(f.startsWith(root+path.sep));res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port+'/';}
const phase=base.startsWith('https:')?'public':'local',report={time:new Date().toISOString(),base,products:[],errors:[]};
browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const page=await browser.newPage({reducedMotion:'reduce'});
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
for(const width of [1280,390]){
 await page.setViewportSize({width,height:850});
 for(const id of ['ulxd4d','novastar-h5','dci-4-600da','aquilon-rs1','brc-am7']){
  await page.goto(base+'detail/?product='+id,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#footer-product')?.textContent);
  await page.evaluate(()=>Promise.all([document.fonts.ready,...[...document.images].map(i=>i.decode().catch(()=>{}))]));
  const m=await page.evaluate(()=>({overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),broken:[...document.images].filter(i=>i.src&&!i.naturalWidth).length,flow:document.querySelectorAll('.signal-flow').length}));assert.equal(m.overflow,0);assert.equal(m.broken,0);assert.equal(m.flow,id==='brc-am7'?0:1);
  if(id==='ulxd4d'){
   assert.equal(await page.locator('.port-map-marker').count(),11);
   assert.equal(await page.locator('.flow-auxiliary[data-from="ant-a"][data-to="cascade-a"]').count(),1);
   assert.equal(await page.locator('.flow-auxiliary[data-from="ant-b"][data-to="cascade-b"]').count(),1);
   const texts=await page.locator('.signal-flow svg text').allTextContents();assert.ok(texts.includes('채널 1 수신')&&texts.includes('채널 2 수신'));assert.ok(!texts.includes('송'));
   await page.locator('#sources > summary').click();await page.locator('#io-table-details > summary').click();const rows=await page.locator('#connector-table-body tr').allTextContents();assert.match(rows.find(t=>t.includes('Cascade')),/2/);await page.locator('#io-table-details > summary').click();await page.locator('#sources > summary').click();
   assert.ok(!(await page.locator('#documents-list').textContent()).includes('Shure Shure'));
   for(const [sel,label]of [['#gallery','02'],['#io','03']])await page.locator(sel).screenshot({path:path.join(out,phase+'-ulxd4d-'+width+'-'+label+'.png'),style:'.site-header{visibility:hidden}'});
   if(width===390){for(const sel of ['.port-photo-scroll','.flow-scroll']){await page.locator(sel).focus();await page.keyboard.press('End');assert.ok(await page.locator(sel).evaluate(e=>e.scrollLeft)>0);}await page.locator('#io').screenshot({path:path.join(out,phase+'-ulxd4d-390-03-right.png'),style:'.site-header{visibility:hidden}'});}
   for(const hash of ['#io','#source-TD']){await page.goto(base+'detail/?product=ulxd4d'+hash,{waitUntil:'networkidle'});await page.reload({waitUntil:'networkidle'});const top=await page.locator(hash==='#io'?'#io':'#sources').evaluate(e=>e.getBoundingClientRect().top);assert.ok(top>=0&&top<850);}
  }
  report.products.push({id,width,...m});
 }
}
assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,phase+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();if(server)server.close()});
