import {beforeH5PanelProduct} from './h5-panel-history.mjs';
import {portMapSegments} from './portmap-segment-audit.mjs';
import {beforeGroup6bW16015Product,beforeGroup6bW16015Raw,group6bGeometry,readBeforeGroup6bFileSync,readBeforeGroup6bFile} from './group6b-w16015-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareEnhancements} from '../prototype/brc-am7/detail-enhancements.mjs';
import {portMapGeometry} from '../prototype/brc-am7/detail-enhancement-view.mjs';
const records=JSON.parse(fs.readFileSync(new URL('../Work/기록/W-20261016-015-group6b-prior-coords.json',import.meta.url)));
const keys=['side','x1','x2','y','x','y1','y2','labelX','via'];
const read=slug=>JSON.parse(fs.readFileSync(new URL('../beta/site/detail/data/'+slug+'.json',import.meta.url)));
const sha=v=>createHash('sha256').update(Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
test('W-015 Group 6b 13 maps use edges or documented side routes, with numbers outside the photo',()=>{
 assert.equal(Object.keys(records).length,13);
 for(const slug of Object.keys(records)){
  const p=read(slug),m=prepareEnhancements(p).portMap;assert.ok(m,slug);
  assert.deepEqual(m.items.filter(i=>Object.hasOwn(i,'y')).map(i=>i.n),records[slug].internalY,slug+' documented internal y');
  const g=portMapGeometry(m,m.measuredImage.width,m.measuredImage.height);
  for(const a of g.markers){
   assert.ok(a.cx+10<=g.image.x||a.cx-10>=g.image.x+g.image.width||a.cy+10<=g.photoTop||a.cy-10>=g.photoBottom,slug+' number '+a.item.n);
  }
 }
});
test('Group 6b work preserves all non-layout fields, marker meanings and source photo bytes',()=>{
 for(const [slug,r]of Object.entries(records)){
  const p=read(slug),image=p.portMap.measuredImage.file;delete p.portMap.crop;
  for(const i of p.portMap.items)for(const k of keys)delete i[k];
  assert.equal(sha(p),r.unchanged,slug+' non-layout data');
  assert.equal(sha(fs.readFileSync(new URL('../beta/site/detail/images/'+image,import.meta.url))),r.photo,slug+' photo');
 }
});


test('Group 6b historical H5 stays unchanged after undoing the approved 2026-10-17 panel',()=>{assert.equal(sha(beforeH5PanelProduct(read('novastar-h5'),'novastar-h5')),'054fb4810efc007ffeb6ddb7635c3d6010a2516ed5a2b7e71973c2bbe376f316');});

test('U-BRIDGE 3 retains the user-approved W-005 through W-007 layout',()=>{assert.equal(sha(read('u-bridge-3')),'f3cb59e4a4ba4db0d3f12c847bc3c8e5675982a5566bad7886e320bcf8c8abbf');});

test('Group 6b inverse checks every approved geometry and preserves unrelated current data',()=>{
 for(const [slug,r]of Object.entries(records)){
  const p=read(slug),prior=beforeGroup6bW16015Product(p,slug);
  assert.equal(sha(group6bGeometry(p)),r.approved,slug+' approved');
  assert.deepEqual(group6bGeometry(prior),r.prior,slug+' prior');
  assert.equal(beforeGroup6bW16015Product(prior,slug),prior,slug+' idempotent');
  const changed=structuredClone(p);changed.portMap.items[0].desc+=' LATER';changed.io=[];changed.overview+=' LATER';
  const restored=beforeGroup6bW16015Product(changed,slug);
  assert.match(restored.portMap.items[0].desc,/LATER$/);assert.deepEqual(restored.io,[]);assert.match(restored.overview,/LATER$/);
  const wrong=structuredClone(p);wrong.portMap.items[0].n=999;
  assert.throws(()=>beforeGroup6bW16015Product(wrong,slug),/unexpected W-015 Group 6b geometry/);
  wrong.portMap.items[0].n=p.portMap.items[0].n;wrong.portMap.crop.top++;
  assert.throws(()=>beforeGroup6bW16015Product(wrong,slug),/unexpected W-015 Group 6b geometry/);
 }
});
test('historical file adapter restores only target JSON and preserves buffers, text and other files',async()=>{
 for(const slug of Object.keys(records)){
  const url=new URL('../beta/site/detail/data/'+slug+'.json',import.meta.url),raw=fs.readFileSync(url,'utf8');
  const expected=beforeGroup6bW16015Raw(raw,slug);
  assert.equal(readBeforeGroup6bFileSync(url,'utf8'),expected);
  assert.deepEqual(readBeforeGroup6bFileSync(url),Buffer.from(expected));
  assert.equal(await readBeforeGroup6bFile(url,'utf8'),expected);
 }
 for(const relative of ['../beta/site/detail/data/u-bridge-3.json','../beta/site/detail/data/novastar-h5.json','../beta/site/detail/images/h5-rear.webp']){
  const url=new URL(relative,import.meta.url);assert.deepEqual(readBeforeGroup6bFileSync(url),fs.readFileSync(url));
 }
});

test('Group 6b inside-photo leaders stay within a quarter width and 6px from parallel callouts',()=>{
 for(const slug of Object.keys(records)){
  const measured=portMapSegments(read(slug).portMap);
  assert.deepEqual(measured.tooLong,[],slug+' inside-photo horizontal leader exceeds 1/4 width');
  assert.deepEqual(measured.close,[],slug+' inside-photo parallel leader clearance below 6px');
 }
});
