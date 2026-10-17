// Manual visual check: node tests/manual/w20261017-006-tiles-browser.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const root=process.cwd();
const output=path.join(root,'Work','기록','W-20261017-006-screens');
fs.mkdirSync(output,{recursive:true});
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
  const relative=pathname.endsWith('/')?`${pathname}index.html`:pathname;
  const file=path.resolve(root,`.${relative}`);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){response.writeHead(404).end();return;}
  const mime={'.html':'text/html','.mjs':'application/javascript','.js':'application/javascript','.json':'application/json','.css':'text/css','.woff2':'font/woff2'};
  response.setHeader('Content-Type',mime[path.extname(file)]??'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const chromePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const debugPort=9506;
const chrome=spawn(chromePath,['--headless','--disable-gpu','--hide-scrollbars','--no-first-run','--remote-allow-origins=*',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${path.join(os.tmpdir(),`w006-tiles-${process.pid}`)}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
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
  socket.addEventListener('message',event=>{
    const message=JSON.parse(event.data);const call=pending.get(message.id);if(!call)return;
    pending.delete(message.id);message.error?call.reject(Error(message.error.message)):call.resolve(message.result);
  });
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{
    const value=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(value.exceptionDetails)throw Error(value.exceptionDetails.text);
    return value.result.value;
  };
  await cdp('Page.enable');
  const measures=[];
  for(const width of [1280,760,390]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await cdp('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/beta/site/analogway/`});
    let ready=false;
    for(let attempt=0;attempt<100;attempt++){
      ready=await evaluate("document.documentElement.dataset.ready === 'true' || !document.querySelector('#load-error')?.hidden");
      if(ready)break;
      await new Promise(resolve=>setTimeout(resolve,150));
    }
    assert.ok(ready,`${width}px page unavailable`);
    assert.equal(await evaluate("document.querySelector('#load-error').hidden"),true,`${width}px load error`);
    assert.equal(await evaluate('document.documentElement.scrollWidth'),width,`${width}px page overflow`);
    assert.equal(await evaluate("document.querySelectorAll('#tile-reference-table tbody tr').length"),18);
    await evaluate(`(()=>{const mode=document.querySelector('#guide [data-field="inputMode"]');mode.value='tiles';mode.dispatchEvent(new Event('change',{bubbles:true}));const col=document.querySelector('#guide [data-field="tileColumns"]');col.value='3';col.dispatchEvent(new Event('input',{bubbles:true}));const row=document.querySelector('#guide [data-field="tileRows"]');row.value='2';row.dispatchEvent(new Event('input',{bubbles:true}));const layers=document.querySelector('#guide [data-field="layers"]');layers.value='2';layers.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    const state=await evaluate(`(()=>({metrics:document.querySelector('.aw-guide-tile-metrics')?.textContent,grid:document.querySelectorAll('.aw-tile-grid span').length,possible:[...document.querySelectorAll('.aw-guide-possible-models .aw-guide-model h4')].map(node=>node.textContent),scrollWidth:document.documentElement.scrollWidth}))()`);
    assert.match(state.metrics,/11,520×4,320@60.*출력 6개.*링크 12개.*VPU 최소 2개/);
    assert.equal(state.grid,6);
    assert.equal(state.possible.length,8);
    assert.equal(state.scrollWidth,width);
    for(const [id,selector] of [['table','#tile-reference'],['guide','#guide']]){
      const rect=await evaluate(`(()=>{const node=document.querySelector('${selector}');const r=node.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()`);
      const screenshot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{x:rect.x,y:rect.y,width:rect.width,height:rect.height,scale:1}});
      fs.writeFileSync(path.join(output,`${id}-${width}.png`),Buffer.from(screenshot.data,'base64'));
      if(id==='table'&&width===390){
        await evaluate("(()=>{const table=document.querySelector('#tile-reference .aw-table-scroll');table.scrollLeft=table.scrollWidth-table.clientWidth;})()");
        const right=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{x:rect.x,y:rect.y,width:rect.width,height:rect.height,scale:1}});
        fs.writeFileSync(path.join(output,'table-390-right.png'),Buffer.from(right.data,'base64'));
      }
    }
    if(width===390){
      await evaluate("[...document.querySelectorAll('.aw-tile-presets button')].find(button=>button.textContent==='4×4').click()");
      assert.equal(await evaluate("document.querySelectorAll('.aw-tile-grid span').length"),16);
      assert.equal(await evaluate("document.querySelectorAll('.aw-guide-possible-models .aw-guide-model').length"),2);
      const rect=await evaluate("(()=>{const r=document.querySelector('#guide').getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()");
      const screenshot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{x:rect.x,y:rect.y,width:rect.width,height:rect.height,scale:1}});
      fs.writeFileSync(path.join(output,'guide-390-4x4.png'),Buffer.from(screenshot.data,'base64'));
    }
    measures.push({width,...state});
    console.log(`${width}px: 18 reference rows, ${state.possible.length} possible models, overflow 0`);
  }
  await cdp('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/beta/site/detail/?product=aquilon-rs2`});
  let detailReady=false;
  for(let attempt=0;attempt<100;attempt++){
    detailReady=await evaluate("!!document.querySelector('#analogway-layer-guide [data-field=\"inputMode\"]')");
    if(detailReady)break;
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  assert.ok(detailReady,'shared detail guide unavailable');
  await evaluate(`(()=>{const guide=document.querySelector('#analogway-layer-guide');const mode=guide.querySelector('[data-field="inputMode"]');mode.value='tiles';mode.dispatchEvent(new Event('change',{bubbles:true}));for(const [field,value] of [['tileColumns','3'],['tileRows','2'],['layers','2']]){const input=guide.querySelector('[data-field="'+field+'"]');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}})()`);
  assert.equal(await evaluate("document.querySelectorAll('#analogway-layer-guide .aw-guide-possible-models .aw-guide-model').length"),8);
  assert.equal(await evaluate('document.documentElement.scrollWidth'),390,'390px detail overflow');
  const detailRect=await evaluate("(()=>{const r=document.querySelector('#analogway-layer-guide').getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()");
  const detailShot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{x:detailRect.x,y:detailRect.y,width:detailRect.width,height:detailRect.height,scale:1}});
  fs.writeFileSync(path.join(output,'detail-guide-390.png'),Buffer.from(detailShot.data,'base64'));
  fs.writeFileSync(path.join(output,'measurements.json'),JSON.stringify(measures,null,2)+'\n');
}finally{socket?.close();chrome.kill();server.close();}
