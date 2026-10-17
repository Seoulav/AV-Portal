// W-015 closeout: Work 2026-10-17 requires nine maps to separate nearby leaders.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{createHash}from'node:crypto';
import{portMapSegments}from'./portmap-segment-audit.mjs';
import{beforeW20261017_002Product}from'./w20261017-002-history.mjs';
import{portMapGeometry}from'../beta/site/detail/detail-enhancement-view.mjs';
import{enhancementErrors}from'../beta/site/detail/detail-enhancements.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/w015-closeout-before.json',import.meta.url)));
const read=s=>beforeW20261017_002Product(JSON.parse(fs.readFileSync(new URL('../beta/site/detail/data/'+s+'.json',import.meta.url))),s);
const sha=x=>createHash('sha256').update(x).digest('hex');
const allowed=s=>s==='brc-am7'?[1,7]:s==='srg-a40'?[4,5]:s==='aquilon-rsalpha'?[5,6,7,8]:[7,8,9,10];
const withoutCoordinates=i=>Object.fromEntries(Object.entries(i).filter(([k])=>!['x','x1','x2','y','y1','y2','via','labelX'].includes(k)));
test('closeout preserves facts, photos, marker identity and every non-target placement',()=>{
 for(const[s,f]of Object.entries(fixture)){const{portMap,...facts}=read(s);assert.equal(sha(JSON.stringify(facts)),f.factsSha256,s);for(const i of f.images)assert.equal(sha(fs.readFileSync(new URL('../beta/site/detail/images/'+i.file,import.meta.url))),i.sha256);
 assert.deepEqual({...portMap,items:null},{...f.portMap,items:null},s+' map settings');assert.equal(portMap.items.length,f.portMap.items.length);
 for(let n=0;n<portMap.items.length;n++){const a=portMap.items[n],b=f.portMap.items[n];if(allowed(s).includes(a.n))assert.deepEqual(withoutCoordinates(a),withoutCoordinates(b));else assert.deepEqual(a,b,s+' marker '+a.n);}
 }
});
for(const slug of Object.keys(fixture))test(slug+' has separated leaders and outside, non-overlapping numbers',()=>{
 const p=read(slug),map=p.portMap;assert.deepEqual(enhancementErrors(p),[],slug);const a=portMapSegments(map);
 // Work excludes parallel runs of <=8 SVG px, irrespective of distance.
 assert.deepEqual(a.close.filter(x=>x.overlap>8+1e-6),[],slug+' parallel run >8px must have >=6px clear space');
 if(slug.startsWith('aquilon-'))assert.deepEqual(a.tooLong,[],slug+' horizontal leader <=1/4 photo');
 const g=portMapGeometry(map,map.measuredImage.width,map.measuredImage.height),ms=g.markers;
 for(const m of ms){assert.ok(m.cx+10<=g.image.x||m.cx-10>=g.image.x+g.image.width||m.cy+10<=g.photoTop||m.cy-10>=g.photoBottom,slug+' outside #'+m.item.n);}
 for(let i=0;i<ms.length;i++)for(let j=i+1;j<ms.length;j++)assert.ok(Math.hypot(ms[i].cx-ms[j].cx,ms[i].cy-ms[j].cy)>=20-1e-6,slug+' circles');
});

import{beforeW015CloseoutProduct}from'./w015-closeout-history.mjs';
test('closeout inverse restores only approved maps and exposes unrelated changes or map mutations',()=>{
 for(const[slug,f]of Object.entries(fixture)){const p=read(slug);assert.deepEqual(beforeW015CloseoutProduct(p,slug).portMap,f.portMap);
 const later=structuredClone(p);later.model='Later';later.io=[];const inverse=beforeW015CloseoutProduct(later,slug);assert.equal(inverse.model,'Later');assert.deepEqual(inverse.io,[]);
 for(const change of [m=>{m.items[0].label+='wrong'},m=>{m.items.at(-1).via=[[1,1]]}]){const bad=structuredClone(p);change(bad.portMap);assert.throws(()=>beforeW015CloseoutProduct(bad,slug),/unexpected.*closeout/);}
 assert.equal(beforeW015CloseoutProduct({...p,portMap:f.portMap},slug).portMap,f.portMap);
 }
});

import{beforeW014AnalogWayProduct}from'./w014-analogway-history.mjs';
import{beforeW20261016_017Product}from'./w20261016-017-history.mjs';
test('older historical restorations stay idempotent and reject unexpected mutations',()=>{
 for(const slug of Object.keys(fixture)){
  const rewind=slug.startsWith('aquilon-')?beforeW014AnalogWayProduct:beforeW20261016_017Product;
  const old=rewind(read(slug),slug);assert.deepEqual(rewind(old,slug),old,slug+' rewind twice');
  const bad=structuredClone(old);bad.portMap.items[0].label+='mutation';assert.throws(()=>rewind(bad,slug),/unexpected/);
 }
 const rs=read('aquilon-rs6');assert.equal(beforeW20261016_017Product(rs,'aquilon-rs6'),rs,'W-017 leaves RS to its own history');
});
