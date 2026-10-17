// Manual browser contract: node tests/manual/w20261017-010-pdf-browser.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const site=path.resolve('beta/site');
const output=path.resolve('Work/기록/W-20261017-010-screens');
fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.mjs':'application/javascript','.js':'application/javascript','.json':'application/json','.css':'text/css','.pdf':'application/pdf'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
  const file=path.resolve(site,`.${pathname.endsWith('/')?`${pathname}index.html`:pathname}`);
  if(!file.startsWith(site+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){response.writeHead(404).end();return;}
  response.setHeader('Content-Type',mime[path.extname(file)]??'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const chromePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port=9520;
const chrome=spawn(chromePath,['--headless','--disable-gpu','--hide-scrollbars','--no-first-run','--remote-allow-origins=*',`--remote-debugging-port=${port}`,`--user-data-dir=${path.join(os.tmpdir(),`w010-pdf-${process.pid}`)}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
let socket;
try{
  let target;
  for(let i=0;i<100;i++){
    try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(item=>item.type==='page');}catch{}
    if(target)break;
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  assert.ok(target,'Chrome CDP target unavailable');
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  const pending=new Map();let sequence=0;
  socket.addEventListener('message',event=>{const message=JSON.parse(event.data);const call=pending.get(message.id);if(!call)return;pending.delete(message.id);message.error?call.reject(Error(message.error.message)):call.resolve(message.result);});
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const result=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result.value;};
  const waitFor=async(expression,label)=>{for(let i=0;i<120;i++){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,100));}throw Error(`Timed out: ${label}`);};
  await cdp('Page.enable');
  for(const width of [1280,390]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
    await cdp('Page.navigate',{url:`${base}/analogway/#documents`});
    await waitFor("document.documentElement.dataset.ready === 'true'",'Analog Way documents');
    const actions=await evaluate(`(()=>[...document.querySelectorAll('#document-list .aw-document')].map(card=>({view:card.querySelector('a[href*="/pdfjs/web/viewer.html"]')?.href,download:card.querySelector('a[download]')?.getAttribute('href'),downloadName:card.querySelector('a[download]')?.getAttribute('download')})))()`);
    assert.equal(actions.length,4);
    await evaluate("document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0,document.querySelector('#document-list').getBoundingClientRect().top+scrollY-80); true");
    await new Promise(resolve=>setTimeout(resolve,100));
    const cardsImage=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync(path.join(output,`analogway-documents-${width}.png`),Buffer.from(cardsImage.data,'base64'));
    for(const action of actions){
      assert.ok(action.view?.includes('file=')&&action.download?.endsWith('.pdf')&&action.downloadName?.endsWith('.pdf'),JSON.stringify(action));
      const response=await fetch(new URL(action.download,base));
      assert.equal(response.status,200,action.download);
      const stream=response.body.getReader();const first=await stream.read();await stream.cancel();
      assert.equal(Buffer.from(first.value).subarray(0,5).toString(),'%PDF-',action.download);
    }
    await cdp('Page.navigate',{url:actions[0].view});
    await waitFor("document.querySelector('#pdf-dialog')?.open",'PDF.js dialog');
    await waitFor("document.querySelector('.pdf-page canvas')?.width > 0",'rendered PDF page');
    const state=await evaluate("({pages:document.querySelectorAll('.pdf-page').length,canvasWidth:document.querySelector('.pdf-page canvas')?.width,download:document.querySelector('#pdf-dialog a[download]')?.getAttribute('href'),overflow:document.documentElement.scrollWidth-innerWidth})");
    assert.ok(state.pages>0&&state.canvasWidth>0&&state.download?.endsWith('.pdf'),JSON.stringify(state));
    assert.equal(state.overflow,0);
    const image=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync(path.join(output,`analogway-pdf-${width}.png`),Buffer.from(image.data,'base64'));
    console.log(`${width}px: ${actions.length} cards, separate viewer/download, ${state.pages} PDF pages, overflow 0`);
  }
  await cdp('Page.navigate',{url:`${base}/detail/?product=aquilon-rs2`});
  await waitFor("document.querySelector('#documents-list button[data-pdf-open]')",'product detail document');
  const detailActions=await evaluate("({view:!!document.querySelector('#documents-list button[data-pdf-open]'),download:!!document.querySelector('#documents-list a[download]')})");
  assert.ok(detailActions.view&&detailActions.download,JSON.stringify(detailActions));
  await evaluate("document.querySelector('#documents-list button[data-pdf-open]').click(); true");
  await waitFor("document.querySelector('#pdf-dialog')?.open && document.querySelector('.pdf-page canvas')?.width > 0",'detail PDF.js viewer');
  const detailImage=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(output,'product-detail-pdf-390.png'),Buffer.from(detailImage.data,'base64'));
  console.log('390px product detail: existing PDF.js view and separate download verified');
}finally{socket?.close();chrome.kill();server.close();}
