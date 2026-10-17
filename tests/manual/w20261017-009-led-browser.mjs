// Manual visual and browser contract check: node tests/manual/w20261017-009-led-browser.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const root=process.cwd();
const output=path.join(root,'Work','\uAE30\uB85D','W-20261017-009-screens');
fs.mkdirSync(output,{recursive:true});
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
  const file=path.resolve(root,`.${pathname.endsWith('/')?`${pathname}index.html`:pathname}`);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){response.writeHead(404).end();return;}
  const mime={'.html':'text/html','.mjs':'application/javascript','.js':'application/javascript','.json':'application/json','.css':'text/css'};
  response.setHeader('Content-Type',mime[path.extname(file)]??'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const chromePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const debugPort=9510;
const chrome=spawn(chromePath,['--headless','--disable-gpu','--hide-scrollbars','--no-first-run','--remote-allow-origins=*',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${path.join(os.tmpdir(),`w009-led-${process.pid}`)}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
let socket;
const pending=new Map();let sequence=0;
try{
  let target;
  for(let attempt=0;attempt<100;attempt++){
    try{target=(await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(item=>item.type==='page');}catch{}
    if(target)break;
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  assert.ok(target,'Chrome CDP target unavailable');
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  socket.addEventListener('message',event=>{const message=JSON.parse(event.data);const call=pending.get(message.id);if(!call)return;pending.delete(message.id);message.error?call.reject(Error(message.error.message)):call.resolve(message.result);});
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const value=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(value.exceptionDetails)throw Error(value.exceptionDetails.text);return value.result.value;};
  await cdp('Page.enable');
  const measures=[];
  for(const width of [1280,390]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await cdp('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/beta/site/analogway/?ledw=6144&ledh=3456&layers=2`});
    let ready=false;
    for(let attempt=0;attempt<100;attempt++){
      ready=await evaluate("document.documentElement.dataset.ready === 'true' || !document.querySelector('#load-error')?.hidden");
      if(ready)break;
      await new Promise(resolve=>setTimeout(resolve,150));
    }
    assert.ok(ready,`${width}px page unavailable`);
    assert.equal(await evaluate("document.querySelector('#load-error').hidden"),true,await evaluate("document.querySelector('#load-error').textContent"));
    const state=await evaluate(`(()=>({mode:document.querySelector('#guide [data-field="inputMode"]').value,width:Number(document.querySelector('#guide [data-field="width"]').value),height:Number(document.querySelector('#guide [data-field="height"]').value),layers:Number(document.querySelector('#guide [data-field="layers"]').value),tiles:document.querySelectorAll('.aw-tile-grid span').length,summary:document.querySelector('.aw-guide-led-metrics')?.textContent,cards:document.querySelectorAll('.aw-guide-possible-models .aw-guide-model').length,overflow:document.documentElement.scrollWidth-innerWidth}))()`);
    assert.equal(state.mode,'ledPixels');assert.deepEqual([state.width,state.height,state.layers,state.tiles],[6144,3456,2,4]);
    assert.ok(state.summary?.includes('6,144')&&state.summary?.includes('7,680'));
    assert.ok(state.cards>0);assert.equal(state.overflow,0);
    let jumped=false;
    for(let attempt=0;attempt<30;attempt++){
      jumped=await evaluate("scrollY > 0");
      if(jumped)break;
      await new Promise(resolve=>setTimeout(resolve,50));
    }
    assert.equal(jumped,true,'valid LED link must scroll to the guide');
    const rect=await evaluate("(()=>{const r=document.querySelector('#guide').getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()");
    const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{...rect,scale:1}});
    fs.writeFileSync(path.join(output,`led-6144x3456-${width}.png`),Buffer.from(shot.data,'base64'));
    measures.push({viewport:width,...state});
    console.log(`${width}px: LED pixels -> 2x2, wall layers 2, model cards, overflow 0`);
  }
  await cdp('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/beta/site/analogway/?ledw=15360&ledh=4320&layers=3`});
  for(let attempt=0;attempt<100;attempt++){
    if(await evaluate("document.documentElement.dataset.ready === 'true'"))break;
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  assert.equal(await evaluate("Number(document.querySelector('#guide [data-field=\\\"layers\\\"]').value)"),6,'URL group layers must become wall-wide PIP windows');
  await cdp('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/beta/site/analogway/?ledw=0&ledh=3456`});
  for(let attempt=0;attempt<100;attempt++){
    if(await evaluate("document.documentElement.dataset.ready === 'true'"))break;
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  assert.equal(await evaluate("document.querySelector('#guide [data-field=\\\"inputMode\\\"]').value"),'topology','invalid query must leave default screen');
  fs.writeFileSync(path.join(output,'measurements.json'),JSON.stringify(measures,null,2)+'\n');
}finally{socket?.close();chrome.kill();server.close();}
