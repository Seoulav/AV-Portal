import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
function harness({keepInside=true,visible=rect(50,100,680,300),scroll=rect(visible.left-40,visible.top-40,visible.width+80,visible.height+80),wrapBox=rect(10,20,760,400),zoom=1.2}={}) {
 const listeners={},loupe={hidden:true,style:{}},wrap={getBoundingClientRect:()=>wrapBox,addEventListener:(type,fn)=>listeners[type]=fn};
 const state={image:{rect:visible,visible,src:'rear.webp',keepInside,zoom}};
 const source=read('prototype/brc-am7/app.js'),start=source.indexOf('  const LOUPE_SIZE ='),end=source.indexOf("  attachLoupe($('#dialog-image-wrap')",start);
 assert.ok(start>=0&&end>start);
 vm.runInNewContext(source.slice(start,end)+'\nattachLoupe(wrap,loupe,()=>state.image);',{wrap,loupe,state,$:()=>({getBoundingClientRect:()=>scroll})});
 const move=(x,y,pointerType='mouse')=>listeners.pointermove({clientX:x,clientY:y,pointerType});
 return {loupe,state,move,listeners};
}
test('full-height inline Sony lens preserves 216px and 1.2x; dialog keeps 216px and 3x',()=>{
 for(const [keepInside,zoom] of [[true,1.2],[false,3]]){
  const h=harness({keepInside,zoom});h.move(300,240);assert.equal(h.loupe.hidden,false);
  assert.equal(h.loupe.style.width,'216px');assert.equal(h.loupe.style.height,'216px');
  assert.equal(h.loupe.style.left,'182px');assert.equal(h.loupe.style.top,'112px');
  assert.equal(h.loupe.style.backgroundSize,680*zoom+'px '+300*zoom+'px');
  assert.equal(h.loupe.style.backgroundPosition,(108-250*zoom)+'px '+(108-140*zoom)+'px');
 }
});
test('medium-height images fit the lens inside the visible photograph',()=>{
 const h=harness({visible:rect(50,100,680,180)});h.move(100,110);
 assert.equal(h.loupe.hidden,false);assert.equal(h.loupe.style.width,'180px');
 assert.equal(h.loupe.style.left,'40px');assert.equal(h.loupe.style.top,'80px');
});
test('thin rack images get a readable 120px lens, allowing symmetric photo overflow',()=>{
 const h=harness({visible:rect(50,100,680,64)});h.move(300,104);
 assert.equal(h.loupe.hidden,false);assert.equal(h.loupe.style.width,'120px');
 assert.equal(h.loupe.style.top,'52px');assert.equal(h.loupe.style.backgroundPosition,'-240px 55.2px');
});
test('horizontal scroll bounds clamp the lens and reject the clipped photo area',()=>{
 const h=harness({visible:rect(50,100,680,180),scroll:rect(100,90,400,220)});h.move(490,180);
 assert.equal(h.loupe.hidden,false);assert.equal(h.loupe.style.left,'310px');
 h.move(80,180);assert.equal(h.loupe.hidden,true);
 const gone=harness({scroll:rect(800,100,100,300)});gone.move(300,200);assert.equal(gone.loupe.hidden,true);
});
test('touch, pen, outside image, missing image and leave/cancel/up hide the lens',()=>{
 const h=harness();
 for(const kind of ['touch','pen']){h.move(300,220);h.move(300,220,kind);assert.equal(h.loupe.hidden,true);}
 for(const type of ['pointerleave','pointercancel','pointerup']){h.move(300,220);h.listeners[type]();assert.equal(h.loupe.hidden,true);}
 h.move(300,99);assert.equal(h.loupe.hidden,true);h.state.image=null;h.move(300,220);assert.equal(h.loupe.hidden,true);
});
test('a later full-size image resets a previously reduced lens size',()=>{
 const h=harness({keepInside:false,visible:rect(50,100,680,300),zoom:3});h.move(300,220);assert.equal(h.loupe.style.width,'216px');
 const inline=harness({visible:rect(50,100,680,64),scroll:rect(50,100,680,400)});inline.move(300,120);
 inline.state.image={...inline.state.image,rect:rect(50,100,680,300),visible:rect(50,100,680,300)};inline.move(300,220);assert.equal(inline.loupe.style.width,'216px');
});
test('both shipped copies enable Diagram and prevent repeated images inside a short lens',()=>{
 for(const prefix of ['prototype/brc-am7','beta/site/detail']){
  const app=read(prefix+'/app.js'),css=read(prefix+'/styles.css');
  assert.doesNotMatch(app,/role === 'Diagram'\) return null/);
  assert.match(css,/\.image-loupe\s*\{[^}]*background-repeat:\s*no-repeat/);
 }
 const loupeBlock=s=>s.slice(s.indexOf('  const LOUPE_SIZE ='),s.indexOf('  const presentConnectors ='));
 assert.equal(loupeBlock(read('prototype/brc-am7/app.js')),loupeBlock(read('beta/site/detail/app.js')));
});

test('short dialog photographs also shrink the lens and reserve a 120px viewing area',()=>{
 for(const [height,expected] of [[150,150],[64,120]]){
  const h=harness({keepInside:false,visible:rect(50,100,680,height),zoom:3});h.move(300,120);
  assert.equal(h.loupe.hidden,false);assert.equal(h.loupe.style.width,expected+'px');
  assert.equal(h.loupe.style.backgroundSize,'2040px '+height*3+'px');
 }
 assert.match(read('prototype/brc-am7/styles.css'),/\.dialog-image-wrap\s*\{[^}]*min-height:\s*120px/);
});

test('a narrow mouse viewport never makes the lens taller than its scroll stage',()=>{
 const h=harness({visible:rect(40,129,480,42),scroll:rect(20,100,350,101),wrapBox:rect(20,100,560,101)});h.move(200,150);
 assert.equal(h.loupe.hidden,false);assert.equal(h.loupe.style.height,'101px');
 assert.ok(parseFloat(h.loupe.style.top)>=0);assert.ok(parseFloat(h.loupe.style.top)+101<=101);
});
