// Capture the two stage-1 Aquilon Rear maps before/after the slot-number change.
// Usage: node tests/manual/w20261017-011-aquilon-slots-browser.mjs before|after
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const stage = process.argv[2];
assert.ok(['before', 'after'].includes(stage), 'expected before or after');
const root = process.cwd();
const output = path.join(root, 'Work', '기록', 'W-20261017-011-preview');
fs.mkdirSync(output, {recursive: true});
const prior=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/w20261017-011-stage1-prior-maps.json'),'utf8'));
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const relative = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
  const file = path.resolve(root, `.${relative}`);
  const slug=/\/data\/(aquilon-rs2|aquilon-cplus)\.json$/.exec(url.pathname)?.[1];
  if(stage==='before'&&slug){
    const product=JSON.parse(fs.readFileSync(file,'utf8'));
    product.portMap=prior[slug].portMap;
    response.setHeader('Content-Type','application/json');
    response.end(JSON.stringify(product));return;
  }
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404).end(); return;
  }
  const types = {'.html':'text/html','.mjs':'application/javascript','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
  response.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = 9398;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'w011-slot-preview-'));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--remote-allow-origins=*',
  `--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank',
], {windowsHide:true, stdio:'ignore'});
let socket;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  let target;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(item => item.type === 'page'); } catch {}
    if (target) break;
    await wait(150);
  }
  assert.ok(target, 'Chrome DevTools target unavailable');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, {once:true}));
  const pending = new Map(); let sequence = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data), call = pending.get(message.id);
    if (!call) return;
    pending.delete(message.id);
    message.error ? call.reject(Error(message.error.message)) : call.resolve(message.result);
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence; pending.set(id, {resolve, reject});
    socket.send(JSON.stringify({id, method, params}));
  });
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', {expression, awaitPromise:true, returnByValue:true});
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
    return result.result.value;
  };
  await cdp('Page.enable');
  const measurements = [];
  for (const slug of ['aquilon-rs2', 'aquilon-cplus']) for (const width of [760,390]) {
    await cdp('Emulation.setDeviceMetricsOverride', {width,height:1800,deviceScaleFactor:1,mobile:false});
    await cdp('Page.navigate', {url:`http://127.0.0.1:${server.address().port}/beta/site/detail/?product=${slug}`});
    let ready = false;
    for (let attempt=0; attempt<120; attempt++) {
      ready = await evaluate("!!document.querySelector('.port-map-svg') && !!document.querySelector('.port-map-panel')");
      if (ready) break;
      await wait(100);
    }
    assert.ok(ready, `${slug}: Rear map unavailable`);
    const info = await evaluate(`(() => {
      const panel=document.querySelector('.port-map-panel'), scroll=document.querySelector('.port-photo-scroll');
      panel.scrollIntoView({block:'start'}); window.scrollBy(0,-70);
      return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,photoScrollWidth:scroll.scrollWidth,
        photoClientWidth:scroll.clientWidth,height:Math.ceil(panel.getBoundingClientRect().height),
        markerCount:document.querySelectorAll('.port-map-svg circle').length};
    })()`);
    const edges = info.photoScrollWidth > info.photoClientWidth ? ['left','right'] : ['left'];
    for (const edge of edges) {
      await evaluate(`document.querySelector('.port-photo-scroll').scrollLeft=${edge==='right'?'99999':'0'}`);
      await wait(150);
      const y = await evaluate('Math.max(0,Math.floor(document.querySelector(".port-map-panel").getBoundingClientRect().top))');
      const screenshot = await cdp('Page.captureScreenshot', {format:'png',captureBeyondViewport:true,
        clip:{x:0,y,width,height:Math.min(info.height,1600),scale:1}});
      const filename = `${slug}-${stage}-${width}-${edge}.png`;
      fs.writeFileSync(path.join(output, filename), Buffer.from(screenshot.data,'base64'));
      measurements.push({...info,slug,stage,edge,filename});
      console.log(JSON.stringify(measurements.at(-1)));
    }
    const listTop=await evaluate(`(() => {
      const list=document.querySelector('#port-map-list');
      list.scrollIntoView({block:'start'});window.scrollBy(0,-12);
      return {y:Math.max(0,Math.floor(list.getBoundingClientRect().top)),h:Math.ceil(list.getBoundingClientRect().height)};
    })()`);
    const listShot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,
      clip:{x:0,y:listTop.y,width,height:Math.min(listTop.h,1250),scale:1}});
    fs.writeFileSync(path.join(output,`${slug}-${stage}-${width}-list.png`),Buffer.from(listShot.data,'base64'));
  }
  fs.writeFileSync(path.join(output, `measurements-${stage}.json`), JSON.stringify(measurements,null,2)+'\n');
  await cdp('Browser.close');
} finally {
  socket?.close(); chrome.kill(); server.close();
  try { fs.rmSync(profile,{recursive:true,force:true}); } catch {}
}
