import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const folder = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(folder, '../../../');
const out = path.join(folder, 'screenshots');
fs.mkdirSync(out, { recursive: true });
const models = [
  ['aquilon-rsalpha','Aquilon RSalpha'],['aquilon-rs1','Aquilon RS1'],['aquilon-rs2','Aquilon RS2'],
  ['aquilon-rs3','Aquilon RS3'],['aquilon-rs4','Aquilon RS4'],['aquilon-rs5','Aquilon RS5'],
  ['aquilon-rs6','Aquilon RS6'],['pulse-4k','Pulse 4K'],['eikos-4k','Eikos 4K'],
  ['zenith-100','Zenith 100'],['zenith-200','Zenith 200']
];
const serverScript = path.join(folder, 'preview-server.mjs');
const servers = [
  spawn(process.execPath, [serverScript, 'before', '4175'], { cwd: root, windowsHide: true, stdio: 'ignore' }),
  spawn(process.execPath, [serverScript, 'after', '4176'], { cwd: root, windowsHide: true, stdio: 'ignore' })
];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
for (let i=0;i<60;i++) {
  try { await Promise.all([4175,4176].map(port=>fetch(`http://127.0.0.1:${port}/detail/`).then(r=>{if(!r.ok)throw Error('server');}))); break; }
  catch { if(i===59) throw Error('Preview servers did not start on 4175 and 4176'); await wait(150); }
}
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'w014-portmap-chrome-'));
const chrome = spawn(chromePath, ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9397','--user-data-dir='+profile,'about:blank'], { windowsHide:true, stdio:'ignore' });
let ws;
const pending = new Map(); let seq = 0;
try {
  let pages;
  for(let i=0;i<100;i++) { try { pages=await(await fetch('http://127.0.0.1:9397/json')).json(); if(pages.length) break; } catch {} await wait(150); }
  if(!pages?.length) throw Error('Chrome DevTools endpoint did not start');
  ws = new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ ws.addEventListener('open',resolve,{once:true}); ws.addEventListener('error',reject,{once:true}); });
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
  const snap=async (filename,x,y,width,height)=>{const r=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x,y,width,height,scale:1}});fs.writeFileSync(path.join(out,filename),Buffer.from(r.data,'base64'));console.log(filename);};
  await cdp('Page.enable'); await cdp('Runtime.enable');
  async function open(slug,mode,width,height=1800){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await cdp('Page.navigate',{url:`http://127.0.0.1:${mode==='before'?4175:4176}/detail/?product=${slug}`});
    for(let i=0;i<120;i++){if(await evaluate(`!!document.querySelector('.port-map-svg') && !document.querySelector('#port-map-list').hidden`))return;await wait(100);}
    throw Error(`${slug} ${mode}: rendered Port Map was not ready`);
  }
  for (const [slug] of models) for(const mode of ['before','after']) {
    for (const width of [760,390]) {
      await open(slug,mode,width,1800);
      const info=await evaluate(`(()=>{const p=document.querySelector('.port-map-panel'),s=document.querySelector('.port-photo-scroll');p.scrollIntoView({block:'start'});window.scrollBy(0,-80);return {h:Math.ceil(p.getBoundingClientRect().height),y:Math.max(0,Math.floor(p.getBoundingClientRect().top)),sw:s.scrollWidth,cw:s.clientWidth}})()`);
      if(width===390 && info.sw<=info.cw) throw Error(`${slug}: expected horizontal map overflow at 390px (${info.sw}/${info.cw})`);
      const base=`${slug}-${mode}-${width}`;
      if(width===760) await snap(`${base}.png`,0,info.y,width,Math.min(info.h,1600));
      else for(const edge of ['left','right']){
        await evaluate(`document.querySelector('.port-photo-scroll').scrollLeft=${edge==='right'?'99999':'0'};`);
        await wait(120);
        const y=await evaluate('Math.max(0,Math.floor(document.querySelector(".port-map-panel").getBoundingClientRect().top))');
        await snap(`${base}-${edge}.png`,0,y,width,Math.min(info.h,1600));
      }
    }
  }
  for(const slug of ['aquilon-rs6','zenith-200','dci-4-600']){
    await open(slug,'after',1280,2400);
    const info=await evaluate(`(()=>{const g=document.querySelector('#gallery'),l=document.querySelector('#port-map-list');g.scrollIntoView({block:'start'});const gr=g.getBoundingClientRect(),lr=l.getBoundingClientRect();return {y:Math.max(0,Math.floor(gr.top)),h:Math.min(2200,Math.ceil(lr.bottom-gr.top)),lw:lr.width,items:l.innerText}})()`);
    if(!info.items.trim()) throw Error(`${slug}: Port Map number list is empty`);
    await snap(`${slug}-number-list-1280.png`,0,info.y,1280,Math.max(300,info.h));
  }
  await cdp('Browser.close');
} finally {
  ws?.close();
  for(const child of servers) child.kill();
  chrome.kill();
  try { fs.rmSync(profile,{recursive:true,force:true}); } catch {}
}

