// Manual visual check for W-20261004-027; run with `node tests/manual/mobile-header-rs232-browser.mjs`.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';

const site = resolve('beta/site');
const browser = process.env.CHROMIUM_BIN || [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
].find(existsSync);
assert.ok(browser, 'Chromium browser required');
const output = resolve('Work/기록/W-20261004-027-screens');
await mkdir(output, { recursive: true });
const mime = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json', '.css':'text/css', '.webp':'image/webp', '.woff2':'font/woff2', '.svg':'image/svg+xml' };
let baseline = false;
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const file = resolve(site, `.${relative}`);
  if (!file.startsWith(`${site}${sep}`)) { response.writeHead(404).end(); return; }
  try {
    const bytes = baseline && relative === '/detail/styles.css'
      ? execFileSync('git', ['show', '31b33fa:beta/site/detail/styles.css'])
      : await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' }).end(bytes);
  } catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const profile = await mkdtemp(join(tmpdir(), 'w027-chrome-'));
const port = 40000 + Math.floor(Math.random() * 10000);
const chrome = spawn(browser, ['--headless=old', '--disable-gpu', '--disable-software-rasterizer', '--no-sandbox', '--disable-dev-shm-usage', '--disable-3d-apis', '--no-first-run', '--no-default-browser-check', '--remote-allow-origins=*', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio:'ignore' });
let ws;
try {
  let target;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(item => item.type === 'page'); }
    catch { /* Starting. */ }
    if (target) break;
    await new Promise(done => setTimeout(done, 100));
  }
  assert.ok(target, 'Chromium did not start');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, fail) => { ws.addEventListener('open', done, { once:true }); ws.addEventListener('error', fail, { once:true }); });
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const call = pending.get(message.id);
    if (!call) return;
    pending.delete(message.id);
    message.error ? call.reject(new Error(message.error.message)) : call.resolve(message.result);
  });
  const send = (method, params={}) => new Promise((resolve,reject) => { const id=++nextId; pending.set(id,{resolve,reject}); ws.send(JSON.stringify({id,method,params})); });
  const evaluate = async expression => {
    const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(result.exceptionDetails) throw Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const errors=[];
  ws.addEventListener('message', event => {
    const message=JSON.parse(event.data);
    if(message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if(message.method==='Runtime.consoleAPICalled' && message.params.type==='error') errors.push(message.params.args.map(arg=>arg.value??arg.description??'').join(' '));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled',{cacheDisabled:true});
  for (const width of [390,1280]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
    for (const state of ['before','after']) {
      baseline=state==='before';
      errors.length=0;
      await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/detail/?product=lh43qmcebgcxkr&state=${state}-${width}`});
      let ready=false;
      for(let attempt=0;attempt<120;attempt++){
        ready=await evaluate("document.querySelector('.site-header') && document.querySelector('#featured-image')?.naturalWidth > 0");
        if(ready) break;
        await new Promise(done=>setTimeout(done,100));
      }
      assert.ok(ready,'detail loaded');
      const first=await evaluate("(() => ({top:document.querySelector('.site-header').getBoundingClientRect().top,position:getComputedStyle(document.querySelector('.site-header')).position,search:!!document.querySelector('#detail-search-toggle'),explore:!!document.querySelector('.header-actions a'),overflow:document.documentElement.scrollWidth-innerWidth}))()");
      await send('Page.captureScreenshot',{format:'png'}).then(({data})=>writeFile(join(output,`${state}-${width}-top.png`),Buffer.from(data,'base64')));
      await evaluate('window.scrollTo(0,650)');
      await new Promise(done=>setTimeout(done,300));
      const scrolled=await evaluate("(() => ({scrollY,top:document.querySelector('.site-header').getBoundingClientRect().top,overflow:document.documentElement.scrollWidth-innerWidth}))()");
      await send('Page.captureScreenshot',{format:'png'}).then(({data})=>writeFile(join(output,`${state}-${width}-scroll.png`),Buffer.from(data,'base64')));
      assert.ok(first.search && first.explore);
      assert.ok(first.overflow<=0 && scrolled.overflow<=0);
      assert.ok(scrolled.scrollY>500);
      assert.equal(errors.length,0,errors.join('\n'));
      if(width===390) {
        assert.equal(first.position,state==='before'?'sticky':'relative');
        state==='before'?assert.ok(scrolled.top>=0):assert.ok(scrolled.top<0);
      } else {
        assert.equal(first.position,'sticky');
        assert.ok(scrolled.top>=0);
      }
      console.log(JSON.stringify({state,width,first,scrolled,errors:errors.length}));
    }
  }
} finally {
  ws?.close(); chrome.kill(); server.close();
  await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:250}).catch(()=>{});
}
