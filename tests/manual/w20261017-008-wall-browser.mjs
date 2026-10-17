// Manual visual and browser contract check: node tests/manual/w20261017-008-wall-browser.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const root=process.cwd();
const output=path.join(root,'Work','기록','W-20261017-008-screens');
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
const debugPort=9509;
const chrome=spawn(chromePath,['--headless','--disable-gpu','--hide-scrollbars','--no-first-run','--remote-allow-origins=*',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${path.join(os.tmpdir(),`w008-wall-${process.pid}`)}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
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
    await cdp('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/beta/site/analogway/`});
    let ready=false;
    for(let attempt=0;attempt<100;attempt++){
      ready=await evaluate("document.documentElement.dataset.ready === 'true' || !document.querySelector('#load-error')?.hidden");
      if(ready)break;
      await new Promise(resolve=>setTimeout(resolve,150));
    }
    assert.ok(ready,`${width}px page unavailable`);
    assert.equal(await evaluate("document.querySelector('#load-error').hidden"),true);
    assert.equal(await evaluate("document.querySelectorAll('.aw-guide-tile-limit').length"),0,'ordinary input mode must remain unchanged');
    await evaluate(`(()=>{const mode=document.querySelector('#guide [data-field="inputMode"]');mode.value='tiles';mode.dispatchEvent(new Event('change',{bubbles:true}));for(const [field,value] of [['tileColumns','4'],['tileRows','2'],['layers','8']]){const input=document.querySelector('#guide [data-field="'+field+'"]');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}})()`);
    const readState=`(()=>({layers:Number(document.querySelector('#guide [data-field="layers"]').value),windows:document.querySelectorAll('.aw-wall-pip').length,aux:document.querySelectorAll('.aw-wall-aux span').length,cards:[...document.querySelectorAll('.aw-guide-possible-models .aw-guide-model')].map(card=>card.querySelector('h4').textContent),unavailable:[...document.querySelectorAll('.aw-guide-unavailable .aw-guide-model')].map(card=>card.querySelector('h4').textContent),limits:Object.fromEntries([...document.querySelectorAll('.aw-guide-model')].filter(card=>card.querySelector('.aw-guide-tile-limit')).map(card=>[card.querySelector('h4').textContent,card.querySelector('.aw-guide-tile-limit').textContent])),reason:document.querySelector('.aw-guide-unconfirmed')?.textContent??'',addDisabled:document.querySelector('[data-action="add-pip"]').disabled,inputMax:Number(document.querySelector('#guide [data-field="layers"]').max),overflow:document.documentElement.scrollWidth-innerWidth}))()`;
    const state=await evaluate(readState);
    assert.equal(state.layers,8);assert.equal(state.windows,8);
    assert.ok(state.cards.includes('Aquilon RS2'));
    assert.ok(await evaluate("document.querySelector('[data-tiles=\"3x4\"]').textContent.includes('6×2')"));
    assert.equal(state.overflow,0,`${width}px horizontal overflow`);
    const rect=await evaluate("(()=>{const r=document.querySelector('#guide').getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()");
    const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{...rect,scale:1}});
    fs.writeFileSync(path.join(output,`wall-4x2-${width}.png`),Buffer.from(shot.data,'base64'));
    await evaluate("document.querySelector('[data-action=\"add-pip\"]').click()");
    const ninth=await evaluate(readState);
    assert.equal(ninth.layers,9);assert.equal(ninth.windows,9);
    assert.ok(ninth.unavailable.includes('Aquilon RS2'));
    await evaluate("document.querySelector('[data-action=\"remove-pip\"]').click()");
    assert.deepEqual((await evaluate(readState)).layers,8);
    await evaluate(`(()=>{const count=document.querySelector('#guide [data-field="layers"]');count.value='16';count.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    assert.equal(await evaluate("document.querySelector('[data-action=\"add-pip\"]').disabled"),true,'16 is the two-group evaluator ceiling');
    await evaluate(`(()=>{const count=document.querySelector('#guide [data-field="layers"]');count.value='3';count.dispatchEvent(new Event('input',{bubbles:true}));const aux=document.querySelector('#aw-guide-aux');aux.value='2';aux.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    const synced=await evaluate(readState);assert.equal(synced.windows,3);assert.equal(synced.aux,2);
    await evaluate("document.querySelector('.aw-tile-presets button:last-child').previousElementSibling.click()");
    const wide=await evaluate(readState);
    assert.equal(wide.overflow,0);assert.ok(wide.cards.includes('Aquilon RS4'));
    assert.match(wide.limits['Aquilon RS6'],/믹싱 최대 16개/);
    const wideRect=await evaluate("(()=>{const r=document.querySelector('#guide').getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()");
    const wideShot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{...wideRect,scale:1}});
    fs.writeFileSync(path.join(output,`wall-6x2-${width}.png`),Buffer.from(wideShot.data,'base64'));
    await evaluate(`(()=>{for(const [field,value] of [['tileColumns','5'],['tileRows','5'],['layers','0']]){const input=document.querySelector('#guide [data-field="'+field+'"]');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}})()`);
    const nineGroups=await evaluate(readState);
    assert.match(nineGroups.reason,/출력 그룹 9개가 평가 가능한 화면 수 한도 8개를 넘습니다/);
    assert.equal(nineGroups.addDisabled,true);assert.equal(nineGroups.inputMax,0);
    const invalidShot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{...wideRect,scale:1}});
    fs.writeFileSync(path.join(output,`wall-5x5-invalid-${width}.png`),Buffer.from(invalidShot.data,'base64'));
    await evaluate(`(()=>{for(const [field,value] of [['tileColumns','3'],['tileRows','5'],['layers','0']]){const input=document.querySelector('#guide [data-field="'+field+'"]');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}})()`);
    const threeByFive=await evaluate(readState);
    assert.match(threeByFive.limits['Aquilon Cmax'],/믹싱 최대 16개 · 분할 32개 환산\(동일 창 배분 직접 평가 불가\)/);
    assert.equal(threeByFive.overflow,0);
    const splitRect=await evaluate("(()=>{const r=document.querySelector('#guide').getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()");
    const splitShot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{...splitRect,scale:1}});
    fs.writeFileSync(path.join(output,`wall-3x5-split-${width}.png`),Buffer.from(splitShot.data,'base64'));
    measures.push({width,fourByTwo:state,ninth,synced,sixByTwo:wide,nineGroups,threeByFive});
    console.log(`${width}px: PIP count, RS2 8→9 transition, 6×2 RS6=16, 9-group reason, overflow 0`);
  }
  fs.writeFileSync(path.join(output,'measurements.json'),JSON.stringify(measures,null,2)+'\n');
}finally{socket?.close();chrome.kill();server.close();}
