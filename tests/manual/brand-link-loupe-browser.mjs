// W-20261004-031 local Chromium comparison: node tests/manual/brand-link-loupe-browser.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';

const site = resolve('beta/site');
const output = resolve('Work/기록/W-20261004-031-screens');
await mkdir(output, { recursive: true });
const browser = process.env.CHROMIUM_BIN || [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
].find(existsSync);
assert.ok(browser, 'Chromium browser required');
const mime = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json', '.css':'text/css', '.webp':'image/webp', '.woff2':'font/woff2', '.svg':'image/svg+xml' };
let baseline = false;
const previous = new Set(['/detail/index.html','/detail/app.js','/detail/styles.css']);
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const file = resolve(site, `.${relative}`);
  if (!file.startsWith(`${site}${sep}`)) { response.writeHead(404).end(); return; }
  try {
    const bytes = baseline && previous.has(relative)
      ? execFileSync('git', ['show', `7a9258d:${`beta/site${relative}`}`])
      : await readFile(file);
    response.writeHead(200, {'Content-Type':mime[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'}).end(bytes);
  } catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const profile = await mkdtemp(join(tmpdir(), 'w031-chrome-'));
const port = 40000 + Math.floor(Math.random() * 10000);
const chrome = spawn(browser, ['--headless=old','--disable-gpu','--disable-software-rasterizer','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--remote-allow-origins=*',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'], {windowsHide:true,stdio:'ignore'});
let ws;
try {
  let target;
  for (let i=0;i<100;i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(item=>item.type==='page'); } catch {}
    if (target) break;
    await new Promise(done=>setTimeout(done,100));
  }
  assert.ok(target,'Chromium did not start');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done,fail)=>{ ws.addEventListener('open',done,{once:true}); ws.addEventListener('error',fail,{once:true}); });
  let id=0;
  const pending=new Map(), errors=[];
  ws.addEventListener('message',event=>{
    const message=JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const call=pending.get(message.id);pending.delete(message.id);
      message.error?call.reject(Error(message.error.message)):call.resolve(message.result);
    }
    if (message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method==='Runtime.consoleAPICalled' && message.params.type==='error') errors.push(message.params.args.map(arg=>arg.value??arg.description??'').join(' '));
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result.value;};
  const screenshot=async name=>{const {data}=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name),Buffer.from(data,'base64'));};
  const navigate=async slug=>{
    errors.length=0;
    await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/detail/?product=${slug}&v=${baseline?'before':'after'}-${Date.now()}`});
    for(let i=0;i<100;i++){
      if(await evaluate("document.querySelector('#breadcrumb-brand')?.textContent && document.querySelector('#featured-image')?.naturalWidth > 0")) return;
      await new Promise(done=>setTimeout(done,100));
    }
    throw Error(`${slug} detail did not load`);
  };
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  for(const width of [1280,390]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
    for(const state of ['before','after']){
      baseline=state==='before';
      await navigate('blu-101');
      await screenshot(`${state}-blu-101-${width}.png`);
      const links=await evaluate("(() => ({breadcrumb:document.querySelector('#breadcrumb-brand').href,footer:document.querySelector('#footer-manufacturer').href,subtitle:document.querySelector('#product-subtitle').textContent,overflow:document.documentElement.scrollWidth-innerWidth}))()");
      assert.ok(links.overflow<=0,JSON.stringify(links));
      if (state === 'after') {
        const keyboard=await evaluate("(() => {const a=document.querySelector('#breadcrumb-brand');a.focus();const breadcrumb=document.activeElement===a;const b=document.querySelector('#footer-manufacturer');b.focus();return {breadcrumb,footer:document.activeElement===b}})()");
        assert.ok(keyboard.breadcrumb && keyboard.footer);
      }
      await evaluate("document.querySelector('#zoom-button').click()");
      await new Promise(done=>setTimeout(done,200));
      const loupe=await evaluate("(() => { const wrap=document.querySelector('#dialog-image-wrap'),image=document.querySelector('#dialog-image'),r=image.getBoundingClientRect();wrap.dispatchEvent(new PointerEvent('pointermove',{pointerType:'mouse',bubbles:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));const l=document.querySelector('#dialog-loupe');return {hidden:l.hidden,width:l.getBoundingClientRect().width,height:l.getBoundingClientRect().height,zoom:l.style.backgroundSize}})()");
      await screenshot(`${state}-blu-101-${width}-loupe.png`);
      await evaluate("document.querySelector('#dialog-close').click()");
      assert.equal(loupe.width,state==='before'?180:216);
      assert.equal(loupe.height,state==='before'?180:216);
      assert.equal(errors.length,0,errors.join('\n'));
      console.log(JSON.stringify({state,width,links,loupe,errors:errors.length}));
    }
    baseline=false;
    for (const [slug,expected] of [['lh43qhcebgcxkr','Samsung'],['brc-am7','Sony'],['blu-101','BSS Audio']]){
      await navigate(slug);
      const brand=await evaluate("new URL(document.querySelector('#breadcrumb-brand').href).searchParams.get('brand')");
      assert.equal(brand,expected,slug);
      await evaluate("document.querySelector('#breadcrumb-brand').click()");
      for(let i=0;i<100;i++){
        if(await evaluate("location.pathname==='/' && document.querySelector('#cards')?.children.length>0"))break;
        await new Promise(done=>setTimeout(done,100));
      }
      const result=await evaluate("(() => ({brand:new URL(location.href).searchParams.get('brand'),sort:new URL(location.href).searchParams.get('sort'),cards:document.querySelector('#cards')?.children.length,count:document.querySelector('#result-count')?.textContent}))()");
      assert.equal(result.brand,expected);assert.equal(result.sort,'brand');assert.ok(result.cards>0,JSON.stringify(result));
      console.log(JSON.stringify({slug,width,result}));
    }
    for (const state of ['before','after']) {
      baseline=state==='before';
      await navigate('srg-x40uh');
      await evaluate("[...document.querySelectorAll('#thumbnails button')].find(button=>button.textContent.trim()==='Rear').click()");
      for(let i=0;i<80;i++){
        if(await evaluate("document.querySelector('.port-photo-stage')?.classList.contains('map-active')")) break;
        await new Promise(done=>setTimeout(done,100));
      }
      await evaluate("window.scrollTo(0,document.querySelector('#gallery').getBoundingClientRect().top+scrollY-80)");
      await new Promise(done=>setTimeout(done,120));
      const port=await evaluate("(() => { const stage=document.querySelector('.port-photo-stage'),image=document.querySelector('#port-map-layer svg image'),clip=document.querySelector('#port-map-layer svg clipPath rect'),svg=document.querySelector('#port-map-layer svg'),l=document.querySelector('#port-map-loupe'); if(!image||!clip)return {active:false};const t=svg.getScreenCTM(),a=new DOMPoint(Number(clip.getAttribute('x')),Number(clip.getAttribute('y'))).matrixTransform(t),b=new DOMPoint(Number(clip.getAttribute('x'))+Number(clip.getAttribute('width')),Number(clip.getAttribute('y'))+Number(clip.getAttribute('height'))).matrixTransform(t),x=(a.x+b.x)/2,y=(a.y+b.y)/2;stage.dispatchEvent(new PointerEvent('pointermove',{pointerType:'mouse',bubbles:true,clientX:x,clientY:y}));return {active:true,hidden:l.hidden,width:l.getBoundingClientRect().width,visibleWidth:b.x-a.x,visibleHeight:b.y-a.y,scrollWidth:document.querySelector('.port-photo-scroll').clientWidth,scrollY,overflow:document.documentElement.scrollWidth-innerWidth}})()");
      await screenshot(`${state}-srg-x40uh-${width}-port-loupe.png`);
      assert.equal(errors.length,0,errors.join('\n'));
      console.log(JSON.stringify({state,width,port}));
    }
  }
} finally {
  ws?.close();chrome.kill();server.close();
  await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:250}).catch(()=>{});
}
