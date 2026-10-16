import {beforeCrownW16015Product,crownGroup3Geometry} from './crown-w16015-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareEnhancements} from '../prototype/brc-am7/detail-enhancements.mjs';
import {portMapGeometry} from '../prototype/brc-am7/detail-enhancement-view.mjs';
const records=JSON.parse(fs.readFileSync(new URL('../Work/기록/W-20261016-015-group3-prior-coords.json',import.meta.url)));
const keys=['side','x1','x2','y','x','y1','y2','labelX','via'];
const read=slug=>JSON.parse(fs.readFileSync(new URL('../beta/site/detail/data/'+slug+'.json',import.meta.url)));
const sha=v=>createHash('sha256').update(Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
test('W-015 Crown 26 maps use edges or documented side routes, with numbers outside the photo',()=>{
 assert.equal(Object.keys(records).length,26);
 for(const slug of Object.keys(records)){
  const p=read(slug),m=prepareEnhancements(p).portMap;assert.ok(m,slug);
  assert.equal(m.items.filter(i=>Object.hasOwn(i,'y')).length,0,slug+' internal y');
  const g=portMapGeometry(m,m.measuredImage.width,m.measuredImage.height);
  for(const a of g.markers){
   assert.ok(a.cx+10<=g.image.x||a.cx-10>=g.image.x+g.image.width||a.cy+10<=g.photoTop||a.cy-10>=g.photoBottom,slug+' number '+a.item.n);
  }
 }
});
test('Crown work preserves all non-layout fields, marker meanings and source photo bytes',()=>{
 for(const [slug,r]of Object.entries(records)){
  const p=read(slug),image=p.portMap.measuredImage.file;delete p.portMap.crop;
  for(const i of p.portMap.items)for(const k of keys)delete i[k];
  assert.equal(sha(p),r.unchanged,slug+' non-layout data');
  assert.equal(sha(fs.readFileSync(new URL('../beta/site/detail/images/'+image,import.meta.url))),r.photo,slug+' photo');
 }
});

test('Crown selective rewind rejects geometry drift while preserving semantic mutations',()=>{
 for(const [slug,r]of Object.entries(records)){
  const p=read(slug),restored=beforeCrownW16015Product(p,slug);
  assert.deepEqual(crownGroup3Geometry(restored),r.prior,slug);
  assert.deepEqual(beforeCrownW16015Product(restored,slug),restored,slug+' idempotent');
  for(const field of ['label','desc']){
   const mutated=structuredClone(p);mutated.portMap.items[0][field]+=' sentinel';
   assert.equal(beforeCrownW16015Product(mutated,slug).portMap.items[0][field],mutated.portMap.items[0][field],slug+' '+field);
  }
  const io=structuredClone(p);io.io[0].quantity='sentinel';assert.equal(beforeCrownW16015Product(io,slug).io[0].quantity,'sentinel');
  const bad=structuredClone(p);bad.portMap.items[0].x1+=1;
  assert.throws(()=>beforeCrownW16015Product(bad,slug),/unexpected W-015 Crown geometry change/);
 }
});
