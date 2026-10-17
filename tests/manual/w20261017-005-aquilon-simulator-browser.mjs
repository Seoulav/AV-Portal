// Manual visual review: node tests/manual/w20261017-005-aquilon-simulator-browser.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const root = process.cwd();
const output = path.join(root, 'outputs', 'w005-preview');
fs.mkdirSync(output, {recursive: true});
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const relative = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
  const file = path.resolve(root, `.${relative}`);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404).end(); return;
  }
  const types = {'.html':'text/html','.mjs':'application/javascript','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
  response.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = 9389;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless','--disable-gpu','--hide-scrollbars','--no-first-run','--remote-allow-origins=*',
  `--remote-debugging-port=${port}`,`--user-data-dir=${path.join(os.tmpdir(), `w005-preview-${process.pid}`)}`,'about:blank',
], {windowsHide: true, stdio: 'ignore'});
let socket;
try {
  let target;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(item => item.type === 'page'); } catch {}
    if (target) break;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  assert.ok(target, 'Chrome DevTools target unavailable');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, {once: true}));
  const pending = new Map(); let sequence = 0;
  socket.addEventListener('message', event => {
    const response = JSON.parse(event.data);
    const call = pending.get(response.id); if (!call) return;
    pending.delete(response.id);
    response.error ? call.reject(Error(response.error.message)) : call.resolve(response.result);
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
  for (const slug of ['aquilon-rs2', 'aquilon-cplus', 'zenith-200']) for (const width of [760, 390]) {
    await cdp('Emulation.setDeviceMetricsOverride', {width, height:900, deviceScaleFactor:1, mobile:false});
    await cdp('Page.navigate', {url:`http://127.0.0.1:${server.address().port}/beta/site/detail/?product=${slug}`});
    let loaded = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      loaded = await evaluate("!!document.querySelector('#analogway-layer-standards .aw-layer-standards-cautions')");
      if (loaded) break;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    assert.ok(loaded, `${slug}: standards card unavailable`);
    const measure = await evaluate(`(() => {
      const card = document.querySelector('#analogway-layer-standards');
      const caution = card.querySelector('.aw-layer-standards-cautions');
      caution.open = true;
      const text = caution.textContent;
      const rect = card.getBoundingClientRect();
      return {slug:'${slug}',width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
        tableCount:card.querySelectorAll('table').length,cautionOpen:caution.open,
        simulatorEvidence:text.includes('AW LivePremier Simulator 6.2.2'),
        regionEvidence:text.includes('24개')&&text.includes('12개'),
        clip:{x:0,y:Math.max(0,rect.top+scrollY-8),width:innerWidth,height:Math.min(6000,rect.height+16),scale:1}};
    })()`);
    assert.equal(measure.scrollWidth, width, `${slug} ${width}px page overflow`);
    assert.equal(measure.tableCount, 4);
    assert.equal(measure.cautionOpen, true);
    assert.equal(measure.simulatorEvidence, true);
    assert.equal(measure.regionEvidence, true);
    const filename = `${slug}-${width}.png`;
    const screenshot = await cdp('Page.captureScreenshot', {format:'png',captureBeyondViewport:true,fromSurface:true,clip:measure.clip});
    fs.writeFileSync(path.join(output, filename), Buffer.from(screenshot.data, 'base64'));
    delete measure.clip;
    measurements.push({...measure, filename});
    console.log(JSON.stringify(measure));
  }
  fs.writeFileSync(path.join(output, 'measurements.json'), JSON.stringify(measurements, null, 2));
  await cdp('Browser.close');
} finally {
  socket?.close(); chrome.kill(); server.close();
}
