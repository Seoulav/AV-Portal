// Run from repository root with NODE_PATH pointing to Playwright and AV_PORTAL_BROWSER_PATH to Chromium/Edge.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const root = path.resolve('beta/site');
const out = __dirname;
const baseline = 'f124bf0f20d677cf8e1893b2fd43936bf6e31bb9';
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
const cache = new Map();
const report = {baseline, screens:[], errors:[], failedResponses:[]};
let server, browser;

(async () => {
  server = http.createServer((req,res) => {
    try {
      let name = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const before = name.startsWith('/before/');
      if (before) name = name.slice(7);
      if (name.endsWith('/')) name += 'index.html';
      const file = path.resolve(root,'.'+name);
      assert.ok(file.startsWith(root+path.sep));
      let bytes;
      if (before) {
        if (!cache.has(name)) cache.set(name,execFileSync('git',['show',baseline+':beta/site'+name],{maxBuffer:32*1024*1024}));
        bytes = cache.get(name);
      } else bytes = fs.readFileSync(file);
      res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
      res.end(bytes);
    } catch {res.writeHead(404);res.end();}
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  browser = await chromium.launch({executablePath:process.env.AV_PORTAL_BROWSER_PATH,headless:true});
  const page = await browser.newPage({reducedMotion:'reduce'});
  page.setDefaultTimeout(15000);
  page.on('pageerror',e => report.errors.push(e.message));
  page.on('console',m => {if(m.type()==='error') report.errors.push(m.text());});
  page.on('response',r => {if(r.status()>=400) report.failedResponses.push({status:r.status(),url:r.url()});});
  for (const width of [1280,390,1024,721]) {
    await page.setViewportSize({width,height:850});
    for (const phase of (width===1280||width===390?['before','after']:['after'])) {
      const url=`http://127.0.0.1:${server.address().port}/${phase==='before'?'before/':''}detail/?product=dm7#gallery`;
      const response=await page.goto(url,{waitUntil:'networkidle'});
      if (response) assert.equal(response.status(),200);
      await page.waitForFunction(() => document.querySelector('#footer-product')?.textContent);
      await page.evaluate(() => Promise.all([document.fonts.ready,...[...document.images].map(image => image.decode().catch(()=>{}))]));
      const m=await page.evaluate(() => {
        const stage=document.querySelector('.port-photo-stage');
        const rect=element=>element.getBoundingClientRect();
        const bounds=rect(stage);
        const positions=[...document.querySelectorAll('.port-map-marker')].map(element=>({n:element.textContent,rect:rect(element)}));
        const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
        const image=document.querySelector('#featured-image'), ir=rect(image), scale=ir.width/image.naturalWidth;
        const groupCoverage=positions.filter(p=>['1','2','7'].includes(p.n)).map(p=>({n:p.n,bottomNatural:(p.rect.bottom-ir.top)/scale}));
        return {
          markers:positions.length,
          overlap:positions.flatMap((a,i)=>positions.slice(i+1).filter(b=>overlap(a.rect,b.rect)).map(b=>[a.n,b.n])),
          clipped:positions.filter(p=>p.rect.left<bounds.left-1||p.rect.right>bounds.right+1||p.rect.top<bounds.top-1||p.rect.bottom>bounds.bottom+1).map(p=>p.n),
          groupCoverage,
          duplicateDescriptions:(()=>{const lines=[...document.querySelectorAll('#port-map-list > p > span')].map(e=>e.textContent);return lines.length-new Set(lines).size;})(),
          horizontalOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
          brokenImages:[...document.images].filter(image=>image.src&&!image.naturalWidth).length,
          title:document.querySelector('#gallery-title').textContent
        };
      });
      assert.equal(m.markers,phase==='before'?63:18);
      assert.deepEqual(m.overlap,[]);
      assert.deepEqual(m.clipped,[]);
      assert.equal(m.horizontalOverflow,0);
      assert.equal(m.brokenImages,0);
      if (phase==='after') {
        assert.equal(m.duplicateDescriptions,0);
        assert.ok(m.groupCoverage.every(p=>p.bottomNatural<870),'group numbers must stay above XLR sockets');
      }
      report.screens.push({phase,width,...m});
      if (width===1280||width===390) {
        await page.locator('#gallery').screenshot({path:path.join(out,`${phase}-${width}.png`)});
        if (width===390) {
          const scroll=page.locator('.port-photo-scroll');
          await scroll.evaluate(element=>{element.scrollLeft=(element.scrollWidth-element.clientWidth)/2;});
          await page.locator('#gallery').screenshot({path:path.join(out,`${phase}-${width}-center.png`)});
          const photo=await scroll.boundingBox();
          await page.screenshot({path:path.join(out,`${phase}-${width}-photo.png`),clip:{x:photo.x,y:photo.y,width:photo.width,height:photo.height}});
        } else await page.locator('.port-photo-scroll').screenshot({path:path.join(out,`${phase}-${width}-photo.png`)});
      } else await page.locator('#gallery').screenshot({path:path.join(out,`${phase}-${width}.png`)});
    }
  }
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.failedResponses,[]);
  const compare=await browser.newPage({viewport:{width:2600,height:1200},deviceScaleFactor:1});
  for(const width of [1280,390]) {
    const before=fs.readFileSync(path.join(out,`before-${width}-photo.png`)).toString('base64');
    const after=fs.readFileSync(path.join(out,`after-${width}-photo.png`)).toString('base64');
    await compare.setContent(`<style>body{margin:0;padding:16px;background:#eef2f7;font:700 26px Arial}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.panel{background:white;padding:12px;min-width:0}img{display:block;width:100%;height:auto}h2{margin:0 0 12px}</style><div class=grid><div class=panel><h2>BEFORE · 63 markers</h2><img src="data:image/png;base64,${before}"></div><div class=panel><h2>AFTER · 18 markers</h2><img src="data:image/png;base64,${after}"></div></div>`);
    await compare.screenshot({path:path.join(out,`comparison-${width}.png`),fullPage:true});
  }
  for(const file of ['before-1280-photo.png','after-1280-photo.png','before-390-photo.png','after-390-photo.png','before-390.png','after-390.png'])
    fs.unlinkSync(path.join(out,file));
  fs.writeFileSync(path.join(out,'local.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({screens:report.screens.map(({phase,width,markers,duplicateDescriptions})=>({phase,width,markers,duplicateDescriptions})),errors:report.errors.length,failedResponses:report.failedResponses.length}));
})().catch(error => {console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));});
