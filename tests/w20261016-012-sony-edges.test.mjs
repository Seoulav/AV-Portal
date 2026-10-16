// W-015 group6b: compare this historical task with the approved later layout rewound.
import {readBeforeGroup6bFileSync as readFileSync} from './group6b-w16015-history.mjs';
import {beforeW20261016_017Product} from './w20261016-017-history.mjs';
import {beforeW20261016_015B4Product} from './w20261016-015-b4-history.mjs';
import {beforeW16015Product} from './w16015-group1-history.mjs';
import {beforeW16015Group5Product} from './w16015-group5-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {enhancementErrors,prepareEnhancements} from '../beta/site/detail/detail-enhancements.mjs';
import {adaptRtcomDetail} from '../beta/site/shared/rtcom-adapter.mjs';
const fixture=JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-012-prior-fields.json',import.meta.url)));
const read=slug=>JSON.parse(readFileSync(new URL('../beta/site/detail/data/'+slug+'.json',import.meta.url)));
const validate=map=>{const p=read('srg-x40uh');p.portMap=map;return enhancementErrors(p).filter(e=>e.includes('portMap'));};
// W-012/W-015, Work 2026-10-16 approval: omitted y anchors to the cropped edge.
test('cropped edge markers remain visible without y, while invalid explicit y is rejected',()=>{
 const map=structuredClone(fixture.products['srg-x40uh'].priorPortMap);
 for(const m of map.items)delete m.y;
 assert.deepEqual(validate(map),[]);
 for(const y of [929,2001,null,NaN,'1000']){
  const invalid=structuredClone(map);invalid.items[0].y=y;
  assert.deepEqual(validate(invalid),['Invalid optional detail field: portMap'],String(y));
 }
 for(const y of [930,2000]){
  const boundary=structuredClone(map);boundary.items[0].y=y;assert.deepEqual(validate(boundary),[]);
 }
});
test('all existing public maps keep their validation result, including maps without crop',()=>{
 const results={};
 for(const file of readdirSync(new URL('../beta/site/detail/data/',import.meta.url)).filter(f=>f.endsWith('.json'))){
  const slug=file.slice(0,-5),p=beforeW16015Product(beforeW20261016_017Product(beforeW20261016_015B4Product(beforeW16015Group5Product(read(slug),slug),slug,{allowHistorical:true}),slug),slug);if(!p.portMap)continue;
  // W-008 introduced this new map separately; its dedicated test covers it.
  if(slug==='belkin-connect-air')continue;

  // Isolate the validator change from the separately approved Sony coordinate changes.
  if(fixture.products[slug])p.portMap=structuredClone(fixture.products[slug].priorPortMap);
  results[slug]={accepted:!!prepareEnhancements(p).portMap,errors:enhancementErrors(p).filter(e=>e.includes('portMap')),crop:!!p.portMap.crop};
 }
 for(const file of readdirSync(new URL('../beta/site/rtcom/raw/products/',import.meta.url)).filter(f=>f.endsWith('.json'))){
  const p=adaptRtcomDetail(JSON.parse(readFileSync(new URL('../beta/site/rtcom/raw/products/'+file,import.meta.url))));
  if(p.portMap)results['rtcom-'+file.slice(0,-5)]={accepted:!!prepareEnhancements(p).portMap,errors:enhancementErrors(p).filter(e=>e.includes('portMap')),crop:!!p.portMap.crop};
 }
 assert.deepEqual(results,fixture.validation);
 assert.ok(Object.values(results).some(v=>!v.crop));
});
test('Sony leaders start at photo edges and all numbered circles stay outside the photo',async()=>{
 const {portMapGeometry}=await import('../beta/site/detail/detail-enhancement-view.mjs');
 for(const slug of Object.keys(fixture.products)){
  const p=read(slug),m=p.portMap,g=portMapGeometry(m,m.measuredImage.width,m.measuredImage.height);
  assert.deepEqual(enhancementErrors(p),[],slug);
  for(const marker of g.markers){
   assert.equal(marker.item.y,undefined,slug+' #'+marker.item.n);
   if(marker.side==='top'){assert.equal(marker.anchorY,g.photoTop);assert.ok(marker.cy+10<=g.photoTop);}
   else if(marker.side==='bottom'){assert.equal(marker.anchorY,g.photoBottom);assert.ok(marker.cy-10>=g.photoBottom);}
   else if(marker.side==='left'){assert.equal(marker.edgeX,g.image.x);assert.ok(marker.cx+10<g.image.x);}
   else {assert.equal(marker.edgeX,g.image.x+g.image.width);assert.ok(marker.cx-10>g.image.x+g.image.width);}
  }
 }
});

import {createHash} from 'node:crypto';
import {beforeW20261016_012Product,beforeW20261016_012Raw} from './w20261016-012-history.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
test('Sony placement changes preserve source photos, all facts and marker meaning',()=>{
 for(const [slug,f] of Object.entries(fixture.products)){
  const p=read(slug),{portMap,...other}=p;
  assert.equal(sha(JSON.stringify(other)),f.unchangedSha,slug);
  assert.equal(sha(readFileSync(new URL('../beta/site/detail/images/'+portMap.measuredImage.file,import.meta.url))),f.imageSha,slug);
  const meaning=m=>m.items.map(({n,label,desc})=>({n,label,desc}));
  assert.deepEqual(meaning(portMap),meaning(f.priorPortMap),slug);
  assert.deepEqual(portMap.measuredImage,f.priorPortMap.measuredImage,slug);
  assert.equal(portMap.image,f.priorPortMap.image,slug);
 }
});
test('Sony inverse restores exact prior bytes, exposes unrelated edits, and rejects map drift',()=>{
 for(const [slug,f] of Object.entries(fixture.products)){
  const p=read(slug),raw=JSON.stringify(p,null,2)+'\n';
  assert.equal(sha(beforeW20261016_012Raw(raw,slug)),f.priorRawSha,slug);
  const changed=structuredClone(p);changed.io=[];changed.model='NOT THE MODEL';
  assert.deepEqual(beforeW20261016_012Product(changed,slug).io,[]);
  assert.equal(beforeW20261016_012Product(changed,slug).model,'NOT THE MODEL');
  const drift=structuredClone(p);drift.portMap.items[0].label='WRONG';
  assert.throws(()=>beforeW20261016_012Product(drift,slug),/unexpected W-012 portMap change/);
 }
});
