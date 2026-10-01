const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async()=>{
 const root=path.resolve('beta/site');
 const out=path.resolve('Work/기록/W-20261001-002-screens');fs.mkdirSync(out,{recursive:true});
 const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf','.json':'application/json'};
 let server;
 let base=process.argv[2];
 if(!base){server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/`;}
 let browser;
 const results=[];const errors=[];
 try{
 browser=await chromium.launch({executablePath:process.env.H5_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:850},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const url=new URL('samples/h5-layers/',base).href;
  const response=await page.goto(url);assert.equal(response.status(),200);
  await page.waitForFunction(()=>document.querySelectorAll('.slots i').length===32);
  await page.evaluate(()=>document.fonts.ready);
  for(const [mode,used] of [['left',['1','0']],['span',['1','1']],['right',['0','1']]]){
   await page.locator(`label:has(input[value="${mode}"])`).click();
   assert.equal(await page.locator('#used-a').innerText(),used[0]);assert.equal(await page.locator('#used-b').innerText(),used[1]);
   assert.ok(await page.locator(`input[value="${mode}"]`).isChecked());
  }
  await page.locator('input[value="right"]').focus();await page.keyboard.press('ArrowLeft');
  assert.ok(await page.locator('input[value="span"]').isChecked());assert.equal(await page.locator('#used-a').innerText(),'1');
  await page.locator('.diagram-scroll').focus();await page.keyboard.press('End');
  if(width===390)assert.ok(await page.locator('.diagram-scroll').evaluate(e=>e.scrollLeft)>0);
  await page.keyboard.press('Home');assert.equal(await page.locator('.diagram-scroll').evaluate(e=>e.scrollLeft),0);
  await page.locator('summary').click();assert.ok(await page.locator('details').evaluate(e=>e.open));
  const pdf=await page.locator('.evidence a').getAttribute('href');assert.equal((await page.request.get(new URL(pdf,url).href)).status(),200);
  await page.locator('summary').click();
  const m=await page.evaluate(()=>({width:innerWidth,height:document.documentElement.scrollHeight,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),svgTitle:document.getElementById('svg-title').textContent,body:document.body.textContent}));
  assert.equal(m.overflow,0);assert.match(m.body,/사용자가 제공한 설명/);assert.match(m.body,/같은 카드 안/);assert.doesNotMatch(m.body,/C:\\Users|hkkim|API_KEY|TOKEN=/);
  await page.locator('.diagram-scroll').evaluate(e=>e.scrollLeft=(e.scrollWidth-e.clientWidth)/2);
  await page.evaluate(()=>{document.activeElement.blur();scrollTo(0,0);});
  await page.screenshot({path:path.join(out,`${base.startsWith('https:')?'public':'local'}-${width}.png`),fullPage:true});
  await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.slots i').length===32);assert.ok(await page.locator('input[value="span"]').isChecked());
  results.push({width,height:m.height,overflow:m.overflow,threeModes:true,keyboard:true,pdf:true,reload:true,url});await page.close();
 }
 const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(new URL('samples/h5-layers/',base).href);assert.ok(await nojs.locator('input[value="left"]').isDisabled());await nojs.close();
 assert.deepEqual(errors,[]);
 const report={time:new Date().toISOString(),results,errors};fs.writeFileSync(path.join(out,base.startsWith('https:')?'public.json':'local.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
