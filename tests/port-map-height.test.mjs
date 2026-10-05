import { beforeW032Raw } from './w032-history.mjs';
import { isW029Name } from './w029-history.mjs';
import { isW030Name } from './w030-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {portMapGeometry,renderPortMap} from '../prototype/brc-am7/detail-enhancement-view.mjs';
import {beforeDisplayW04013Raw} from './display-w04013-history.mjs';
import {beforeBssW04015Raw} from './bss-w04015-history.mjs';
import {beforeBssAlignment,beforeBssAlignmentRaw} from './bss-alignment-history.mjs';
import {beforeW026Product,beforeW026Raw} from './w026-history.mjs';

const root=new URL('../',import.meta.url);
const baseline=JSON.parse(readFileSync(new URL('Work/기록/W-20261004-014-baseline.json',root),'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const details=new URL('beta/site/detail/data/',root);
const products=readdirSync(details).filter(file=>file.endsWith('.json') && file !== 'lh43behhlbfxkr.json' && !isW029Name(file) && !isW030Name(file)).sort();
const read=slug=>JSON.parse(readFileSync(new URL(`${slug}.json`,details),'utf8'));
const size=product=>{
  const resolution=product.images.find(image=>image.role===product.portMap.image)?.resolution;
  const match=/^(\d+)\s*[x×]\s*(\d+)$/.exec(resolution);
  assert.ok(match,`${product.model}: published image size`);
  return [Number(match[1]),Number(match[2])];
};

test('published Port Map renderer is the exact generated copy',()=>{
  assert.equal(readFileSync(new URL('beta/site/detail/detail-enhancement-view.mjs',root),'utf8'),
    readFileSync(new URL('prototype/brc-am7/detail-enhancement-view.mjs',root),'utf8'));
});

test('only tall maps receive an automatic 900px geometry and no product data changes',()=>{
  const inventory=createHash('sha256');
  for(const file of products){
    const slug=file.slice(0,-5);
    inventory.update(file).update('\0').update(beforeDisplayW04013Raw(beforeBssW04015Raw(beforeBssAlignmentRaw(beforeW032Raw(beforeW026Raw(readFileSync(new URL(file,details),'utf8').replace(/\r\n/g,'\n'),slug), slug),slug),slug),slug));
  }
  assert.equal(products.length,242);
  assert.equal(inventory.digest('hex'),'43ff5a44d72b1f5683cfb92960906e7250c80d8c4fdc21d39115e6c450cb0b2b');
  const product=read('lh115qhfebgxkr');
  assert.equal(product.portMap.displayWidth,undefined);
  const geometry=portMapGeometry(product.portMap,...size(product));
  assert.ok(geometry.height<=900+1e-8,`actual geometry height ${geometry.height}`);
  assert.ok(geometry.height>899,'cap uses the available 900px');
  assert.ok(geometry.width<400,'vertical photograph is no longer 760px wide');
  assert.equal(geometry.markers.length,11);
});

test('all 51 earlier Port Maps retain their exact pre-change geometry',()=>{
  let checked=0;
  for(const [slug,expected] of Object.entries(baseline)) {
    const product=beforeBssAlignment(beforeW026Product(read(slug),slug),slug);
    const geometry=portMapGeometry(product.portMap,...size(product));
    assert.equal(geometry.width,expected.width,`${slug} width`);
    assert.equal(geometry.height,expected.height,`${slug} height`);
    assert.equal(sha(JSON.stringify(geometry)),expected.geometrySha256,`${slug} full geometry`);
    checked++;
  }
  assert.equal(checked,51);
});

test('an explicit displayWidth still overrides the automatic height cap',()=>{
  const product=read('lh115qhfebgxkr');
  const manual={...product.portMap,displayWidth:500};
  const geometry=portMapGeometry(manual,...size(product));
  assert.equal(geometry.width,500);
  assert.ok(geometry.height>900,'explicit width takes precedence even when tall');
});

test('automatic cap also accounts for extra top and bottom marker lanes',()=>{
  const product=read('lh115qhfebgxkr');
  const crowded={...product.portMap,items:Array.from({length:4},(_,index)=>({
    n:index+1,label:`Port ${index+1}`,desc:'',side:'top',x1:100,x2:120,y:50
  }))};
  const geometry=portMapGeometry(crowded,...size(product));
  assert.ok(geometry.topMargin>40,'the synthetic map actually needs extra margin');
  assert.ok(geometry.height<=900+1e-8,`crowded geometry height ${geometry.height}`);
});

test('the capped SVG overrides only its inherited 560px minimum display width',()=>{
  const original=globalThis.document;
  globalThis.document={createElementNS(_namespace,tag){
    return {tag,style:{},attributes:{},children:[],setAttribute(key,value){this.attributes[key]=value;},append(...nodes){this.children.push(...nodes);}};
  }};
  try {
    const product=read('lh115qhfebgxkr');
    const [naturalWidth,naturalHeight]=size(product);
    const svg=renderPortMap(product.portMap,{naturalWidth,naturalHeight,src:'rear.webp',alt:'Rear'},product.model);
    assert.equal(svg.children.filter(child=>child.tag==='circle').length,11);
    assert.equal(svg.style.minWidth,'0px');
    assert.ok(Math.abs(parseFloat(svg.style.maxWidth)-portMapGeometry(product.portMap,naturalWidth,naturalHeight).width)<1e-6);
    assert.equal(svg.children.find(child=>child.tag==='text').attributes['font-size'],'11');
    const earlier=read('ua864a');
    const [w,h]=size(earlier);
    const earlierSvg=renderPortMap(earlier.portMap,{naturalWidth:w,naturalHeight:h,src:'rear.webp'},earlier.model);
    assert.equal(earlierSvg.style.minWidth,undefined);
    assert.equal(earlierSvg.style.maxWidth,undefined);
    const manualSvg=renderPortMap({...product.portMap,displayWidth:500},{naturalWidth,naturalHeight,src:'rear.webp'},product.model);
    assert.equal(manualSvg.style.maxWidth,'500px');
    assert.equal(manualSvg.style.minWidth,undefined);
  } finally { globalThis.document=original; }
});
