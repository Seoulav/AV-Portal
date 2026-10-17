// Manual local Chromium review: node tests/manual/w20261017-003-guide-v2-browser.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const root=process.cwd();
const out=path.join(root,'outputs','w003-v2');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((request,response)=>{
  const url=new URL(request.url,'http://127.0.0.1');
  const relative=url.pathname.endsWith('/')?`${url.pathname}index.html`:url.pathname;
  const file=path.resolve(root,`.${relative}`);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){response.writeHead(404).end();return;}
  const types={'.html':'text/html','.mjs':'application/javascript','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
  response.setHeader('Content-Type',types[path.extname(file)]??'application/octet-stream');fs.createReadStream(file).pipe(response);
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',[
  '--headless','--disable-gpu','--hide-scrollbars','--no-first-run','--remote-allow-origins=*',
  '--remote-debugging-port=9388',`--user-data-dir=${path.join(os.tmpdir(),`w003-v2-${process.pid}`)}`,'about:blank',
],{windowsHide:true,stdio:'ignore'});
let socket;const pending=new Map();let sequence=0;
try{
  let target;
  for(let attempt=0;attempt<100;attempt++){
    try{target=(await(await fetch('http://127.0.0.1:9388/json/list')).json()).find(item=>item.type==='page');}catch{}
    if(target)break;await new Promise(done=>setTimeout(done,150));
  }
  assert.ok(target,'Chromium target unavailable');
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(done=>socket.addEventListener('open',done,{once:true}));
  socket.addEventListener('message',event=>{
    const message=JSON.parse(event.data);if(!message.id)return;
    const call=pending.get(message.id);if(!call)return;pending.delete(message.id);
    message.error?call.reject(Error(message.error.message)):call.resolve(message.result);
  });
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const result=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result.value;};
  await cdp('Page.enable');
  const measures=[];
  for(const slug of ['aquilon-rs2','zenith-200','aquilon-cplus'])for(const width of [1280,760,390]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await cdp('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/beta/site/detail/?product=${slug}`});
    let ready=false;
    for(let attempt=0;attempt<100;attempt++){
      ready=await evaluate("!!document.querySelector('#analogway-layer-guide .aw-guide-screen-row')");
      if(ready)break;await new Promise(done=>setTimeout(done,150));
    }
    assert.ok(ready,`${slug} guide unavailable`);
    const measure=await evaluate(`(()=>{
      const guide=document.querySelector('#analogway-layer-guide'),row=guide.querySelector('.aw-guide-screen-row');
      const mode=row.querySelector('[data-field="inputMode"]');mode.value='resolution';mode.dispatchEvent(new Event('change',{bubbles:true}));
      for(const [name,value] of [['width','7680'],['height','4320'],['refresh','60'],['layers','4']]){
        const field=row.querySelector('[data-field="'+name+'"]');field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));
      }
      const rect=guide.getBoundingClientRect();
      return {slug:'${slug}',width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
        formStacked:guide.querySelector('.aw-guide-global-inputs').getBoundingClientRect().top >= guide.querySelector('.aw-guide-screens-panel').getBoundingClientRect().bottom,
        derived:guide.querySelector('.aw-guide-derived-formats')?.textContent,
        recommendation:guide.querySelector('.aw-guide-recommendation')?.textContent,
        simulatorLinks:guide.querySelectorAll('.aw-guide-simulator-link').length,
        exportButton:guide.querySelector('.aw-guide-copy')?.textContent,
        clip:{x:0,y:Math.max(0,rect.top+scrollY-8),width:innerWidth,height:Math.min(6000,rect.height+16),scale:1}};
    })()`);
    assert.equal(measure.width,width);assert.equal(measure.scrollWidth,width,`${slug} ${width}px overflow`);
    if(width===760) assert.equal(measure.formStacked,true,`${slug} ${width}px input form must have readable full-width rows`);
    assert.match(measure.derived,/7680×4320@60.*4K60 출력 4개/);
    assert.match(measure.recommendation,/Zenith 200/);
    assert.equal(measure.simulatorLinks,3);
    const file=`${slug}-${width}.png`;
    const screenshot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:measure.clip});
    fs.writeFileSync(path.join(out,file),Buffer.from(screenshot.data,'base64'));
    const uncertain=await evaluate(`(()=>{
      const guide=document.querySelector('#analogway-layer-guide');
      const hd=guide.querySelector('[data-field="hdLayers"]');hd.value='1';hd.dispatchEvent(new Event('input',{bubbles:true}));
      const text=guide.querySelector('.aw-guide-unconfirmed')?.textContent;
      return {text,modelCards:guide.querySelectorAll('.aw-guide-model').length};
    })()`);
    assert.match(uncertain.text,/미확인.*제조사 시뮬레이터/);
    assert.equal(uncertain.modelCards,0,'mixed HD must not show a 4K-only recommendation');
    delete measure.clip;measures.push({...measure,file});console.log(JSON.stringify(measure));
  }
  fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify(measures,null,2));
  await cdp('Browser.close');
}finally{socket?.close();chrome.kill();server.close();}
