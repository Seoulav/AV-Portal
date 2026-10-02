// Run from repository root. Provide Playwright via NODE_PATH and a Chromium executable via AV_PORTAL_BROWSER_PATH.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve('beta/site'),out=__dirname,baseline='dd2efbfe694fe8a4b71a3798aa83b3fab68b23ae';
const proof=JSON.parse(fs.readFileSync(path.join(out,'../W-20261002-001-shure-port-map-evidence.json')));
const targets=['qlxd4','slxd4-plus','ua864a','ulxd4','ulxd4q','ulxd4d','mxcw640','mxcwapt-w','slxd4d-plus','slxd1-plus','mxa925w-r'];
const publicBase=process.argv[2],phase=publicBase?'public':'local';
const widths=publicBase?[1280,390]:[1280,390,1024,721];
const report={time:new Date().toISOString(),baseline,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),phase,screens:[],errors:[],failedResponses:[],jsonComparison:[]};
let server,browser;
const cache=new Map();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf'};
(async()=>{
 let base=publicBase;
 if(!base){server=http.createServer((req,res)=>{try{
  let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),before=name.startsWith('/before/');
  if(before)name=name.slice(7);if(name.endsWith('/'))name+='index.html';
  const file=path.resolve(root,'.'+name);assert.ok(file.startsWith(root+path.sep));
  let bytes;if(before){if(!cache.has(name))cache.set(name,execFileSync('git',['show',baseline+':beta/site'+name],{maxBuffer:32*1024*1024}));bytes=cache.get(name);}else bytes=fs.readFileSync(file);
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port+'/';}
 browser=await chromium.launch({executablePath:process.env.AV_PORTAL_BROWSER_PATH,headless:true});
 const page=await browser.newPage({reducedMotion:'reduce'});page.setDefaultTimeout(12000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)report.failedResponses.push({status:r.status(),url:r.url()});});
 async function ready(slug,hash='#gallery',before=false){
  const res=await page.goto(new URL((before?'before/':'')+'detail/?product='+slug+hash,base).href,{waitUntil:'networkidle'});if(res)assert.equal(res.status(),200);
  await page.waitForFunction(()=>document.querySelector('#footer-product')?.textContent);
  await page.evaluate(()=>Promise.all([document.fonts.ready,...[...document.images].map(i=>i.decode().catch(()=>{}))]));
 }
 async function content(){return page.evaluate(()=>({
  specs:[...document.querySelectorAll('.spec-data-row')].map(x=>x.textContent),
  io:[...document.querySelectorAll('#connector-table-body tr')].map(x=>x.textContent),
  ports:[...document.querySelectorAll('#port-grid .pg-port')].map(x=>x.textContent),
  features:[...document.querySelectorAll('#feature-list li')].map(x=>x.textContent),
  documents:[...document.querySelectorAll('#documents-list a,#documents-list button')].map(x=>[x.textContent,x.getAttribute('href'),x.getAttribute('data-pdf-open')]),
  flow:document.querySelectorAll('.signal-flow').length,settings:document.querySelectorAll('.setting-card').length,
 }));}
 for(const width of widths){await page.setViewportSize({width,height:850});for(const slug of targets){
  const raw=JSON.parse(fs.readFileSync(path.join(root,'detail/data',slug+'.json'))),expected=raw.portMap?.items.length||0;
  let before;if(!publicBase && [1280,390].includes(width)){await ready(slug,'#gallery',true);before=await content();}
  await ready(slug);if(before)assert.deepEqual(await content(),before,slug+' preserves rendered data');
  const m=await page.evaluate(()=>{
   const stage=document.querySelector('.port-photo-stage'),markers=[...document.querySelectorAll('.port-map-marker')];
   const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
   const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
   const bounds=stage?rect(stage):null,positions=markers.map(e=>({n:e.textContent,...rect(e)}));
   const hint=document.querySelector('#port-map-scroll-hint'),zoom=document.querySelector('#zoom-button');
   return {overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),broken:[...document.images].filter(i=>i.src&&!i.naturalWidth).length,
    markers:positions,overlap:positions.flatMap((a,i)=>positions.slice(i+1).filter(b=>overlap(a,b)).map(b=>[a.n,b.n])),
    clipped:positions.filter(a=>a.left<bounds.left-1||a.right>bounds.right+1||a.top<bounds.top-1||a.bottom>bounds.bottom+1).map(a=>a.n),
    hintOverlap:hint&&!hint.hidden?overlap(rect(hint),rect(zoom)):false,
    featured:{width:document.querySelector('#featured-image').naturalWidth,height:document.querySelector('#featured-image').naturalHeight},
    title:document.querySelector('#gallery-title').textContent};
  });
  assert.equal(m.overflow,0,slug+' page overflow');assert.equal(m.broken,0,slug+' broken image');
  assert.equal(m.markers.length,expected,slug+' marker count');assert.deepEqual(m.overlap,[],slug+' marker overlap');assert.deepEqual(m.clipped,[],slug+' marker clipping');assert.equal(m.hintOverlap,false,slug+' hint overlap');
  if(expected){assert.deepEqual(m.featured,{width:proof.products[slug].image.width,height:proof.products[slug].image.height});assert.equal(await page.locator('#port-map-list > p').count(),expected);assert.equal(await page.locator('#rear-connector-panel').isVisible(),false);}
  if([1280,390].includes(width))await page.locator('#gallery').screenshot({path:path.join(out,`${phase}-${slug}-${width}.png`),style:'.site-header{visibility:hidden}'});
  const row={slug,width,...m,preservedContent:before?true:null,checks:[]};report.screens.push(row);
  if([1280,390].includes(width)){
   for(const button of await page.locator('#thumbnails button').all()){if(!await button.isVisible())continue;await button.click();await page.locator('#featured-image').evaluate(i=>i.decode());
    const isRear=(await button.innerText()).trim()==='Rear';assert.equal(await page.locator('.port-map-marker').count(),isRear?expected:0);assert.match(await page.locator('#gallery-title').innerText(),isRear&&expected?/Port Map/i:/제품 사진/);
   }
   row.checks.push('role/title switches');
   await page.locator('#zoom-button').click();assert.equal(await page.locator('#image-dialog').evaluate(d=>d.open),true);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#image-dialog').open);row.checks.push('zoom/Escape');
   if(expected&&width===390){await page.locator('#thumbnails button').filter({hasText:/^Rear$/}).click();await page.locator('#featured-image').evaluate(i=>i.decode());const scroll=page.locator('.port-photo-scroll');
    await scroll.focus();const canScroll=await scroll.evaluate(s=>s.scrollWidth>s.clientWidth);await page.keyboard.press('End');if(canScroll)assert.ok(await scroll.evaluate(s=>s.scrollLeft>0));if(slug==='ua864a')await page.locator('#gallery').screenshot({path:path.join(out,`${phase}-${slug}-${width}-end.png`),style:'.site-header{visibility:hidden}'});await page.keyboard.press('Home');assert.equal(await scroll.evaluate(s=>s.scrollLeft),0);row.checks.push('mobile Home/End');}
   const table=page.locator('#io-table-details');
   if(!await table.locator('summary').isVisible())await page.locator('#sources > summary').click();
   if(!await table.evaluate(d=>d.open))await table.locator('summary').click();assert.equal(await table.evaluate(d=>d.open),true);
   assert.equal(await page.locator('#connector-table-body tr').count(),raw.io.length);row.checks.push('full I/O table');
   for(const hash of ['#io','#specifications','#documents','#sources','#gallery']){await ready(slug,hash);await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#footer-product')?.textContent);await page.evaluate(()=>document.fonts.ready);
    const y=await page.locator(hash).evaluate(e=>e.getBoundingClientRect().top);assert.ok(y>=0&&y<850,slug+' '+hash+' top='+y);
   }row.checks.push('five direct hashes/reload');
  }
  console.log(phase,slug,width,'OK');
 }}
 if(publicBase)for(const slug of targets){const res=await page.request.get(new URL('detail/data/'+slug+'.json',base).href);assert.equal(res.status(),200);const actual=await res.body(),expected=execFileSync('git',['show','HEAD:beta/site/detail/data/'+slug+'.json']);assert.deepEqual(actual,expected,slug+' public JSON vs merged blob');report.jsonComparison.push(slug);}
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedResponses,[]);report.success=true;
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(out,phase+'.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();server?.close();});
