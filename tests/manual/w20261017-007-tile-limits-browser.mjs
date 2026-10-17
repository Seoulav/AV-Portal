// Manual visual and browser contract check: node tests/manual/w20261017-007-tile-limits-browser.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const root=process.cwd();
const output=path.join(root,'Work','기록','W-20261017-007-screens');
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
const debugPort=9507;
const chrome=spawn(chromePath,['--headless','--disable-gpu','--hide-scrollbars','--no-first-run','--remote-allow-origins=*',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${path.join(os.tmpdir(),`w007-tiles-${process.pid}`)}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
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
    await evaluate(`(()=>{const mode=document.querySelector('#guide [data-field="inputMode"]');mode.value='tiles';mode.dispatchEvent(new Event('change',{bubbles:true}));for(const [field,value] of [['tileColumns','4'],['tileRows','2'],['layers','2']]){const input=document.querySelector('#guide [data-field="'+field+'"]');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}})()`);
    const readState=`(()=>({cards:[...document.querySelectorAll('.aw-guide-possible-models .aw-guide-model')].map(card=>({name:card.querySelector('h4').textContent,limit:card.querySelector('.aw-guide-tile-limit')?.textContent,converted:[...card.querySelectorAll('.aw-guide-tile-limit-note')].some(note=>note.textContent.includes('환산'))})),evidence:[...document.querySelectorAll('.aw-guide-summary .aw-guide-tile-caveat')].map(node=>node.textContent),overflow:document.documentElement.scrollWidth-innerWidth}))()`;
    const state=await evaluate(readState);
    for(const [name,limit,converted] of [
      ['Aquilon RS2','4K60 믹싱 최대 8개 · 분할 최대 16개',false],
      ['Aquilon RS4','4K60 믹싱 최대 12개 · 분할 최대 24개',true],
      ['Aquilon RS6','4K60 믹싱 16개까지 확인(평가 입력 상한) · 분할 32개까지 확인 — 실제 한도는 이보다 클 수 있습니다',true],
    ]){
      const card=state.cards.find(item=>item.name===name);
      assert.equal(card?.limit,limit);
      assert.equal(card.converted,converted);
    }
    assert.ok(state.evidence.some(note=>note.includes('RS2 데이터시트 8쪽')));
    assert.equal(state.overflow,0,`${width}px horizontal overflow`);
    const rect=await evaluate("(()=>{const r=document.querySelector('#guide').getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()");
    const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{...rect,scale:1}});
    fs.writeFileSync(path.join(output,`guide-4x2-${width}.png`),Buffer.from(shot.data,'base64'));
    await evaluate(`(()=>{const col=document.querySelector('#guide [data-field="tileColumns"]');col.value='2';col.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    const small=await evaluate(readState);
    assert.equal(small.cards.find(card=>card.name==='Aquilon RS4')?.limit,'4K60 믹싱 8개까지 확인(평가 입력 상한) · 분할 16개까지 확인 — 실제 한도는 이보다 클 수 있습니다');
    assert.equal(small.overflow,0,`${width}px 2×2 horizontal overflow`);
    const smallRect=await evaluate("(()=>{const r=document.querySelector('#guide').getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()");
    const smallShot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{...smallRect,scale:1}});
    fs.writeFileSync(path.join(output,`guide-2x2-${width}.png`),Buffer.from(smallShot.data,'base64'));
    measures.push({width,fourByTwo:state,twoByTwo:small});
    console.log(`${width}px: proven and input-ceiling wording correct, overflow 0`);
  }
  fs.writeFileSync(path.join(output,'measurements.json'),JSON.stringify(measures,null,2)+'\n');
}finally{socket?.close();chrome.kill();server.close();}
