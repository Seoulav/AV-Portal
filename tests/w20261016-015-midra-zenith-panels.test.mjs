import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { enhancementErrors } from '../prototype/brc-am7/detail-enhancements.mjs';
import { portMapGeometry } from '../prototype/brc-am7/detail-enhancement-view.mjs';
import { portMapSegments } from './portmap-segment-audit.mjs';

const slugs=['pulse-4k','eikos-4k','zenith-100','zenith-200'];
const prior=JSON.parse(fs.readFileSync(new URL('./fixtures/w015-midra-zenith-prior.json',import.meta.url),'utf8'));
const read=slug=>JSON.parse(fs.readFileSync(new URL(`../beta/site/detail/data/${slug}.json`,import.meta.url),'utf8'));
const stable=map=>map.items.map(({n,label,desc})=>({n,label,desc}));

test('Midra/Zenith panels preserve a Rear overview and provide a complete Other connector map',()=>{
 for(const slug of slugs){
  const product=read(slug);
  assert.deepEqual(enhancementErrors(product),[],slug);
  assert.deepEqual(product.portMaps.map(map=>map.image),['Rear','Other'],slug);
  assert.deepEqual(product.portMap,product.portMaps[0],slug);
  const panel=product.portMaps[1];
  assert.deepEqual(stable(panel),stable(prior[slug].portMap),slug);
  assert.equal(product.images.filter(image=>image.role==='Other').length,1,slug);
  assert.equal(product.images.find(image=>image.role==='Other').file,`${slug}-io-panel.png`,slug);
  assert.deepEqual(panel.items.map(item=>item.n),prior[slug].portMap.items.map(item=>item.n),slug);
  const middle=slug==='zenith-100'?new Set([1,2,10,11,12]):slug==='zenith-200'?new Set([1,2,12,13,14,15]):new Set();
  for(const item of panel.items){
   if(middle.has(item.n)){
    assert.ok(item.via?.length>=1&&item.via.length<=3,`${slug} middle ${item.n} has a routed leader`);
    assert.ok(Number.isFinite(item.x)&&Number.isFinite(item.y1)&&Number.isFinite(item.y2),`${slug} middle ${item.n} uses an edge bracket`);
   }else assert.ok(!('y'in item)&&!('via'in item)&&!('x'in item),`${slug} outer row ${item.n} uses the nearest panel edge`);
  }
  const size=fs.readFileSync(new URL(`../beta/site/detail/images/${slug}-io-panel.png`,import.meta.url));
  assert.equal(size.toString('hex',0,8),'89504e470d0a1a0a',slug);
  assert.equal(size.readUInt32BE(16),panel.measuredImage.width,slug);
  assert.equal(size.readUInt32BE(20),panel.measuredImage.height,slug);
  for(const map of product.portMaps){
   const geometry=portMapGeometry(map,map.measuredImage.width,map.measuredImage.height);
   for(const marker of geometry.markers) assert.ok(marker.cx+10<=geometry.image.x||marker.cx-10>=geometry.image.x+geometry.image.width||marker.cy+10<=geometry.photoTop||marker.cy-10>=geometry.photoBottom,`${slug} marker ${marker.item.n} overlaps photo`);
   const segments=portMapSegments(map);
   assert.deepEqual(segments.tooLong,[],slug);
   assert.deepEqual(segments.close,[],slug);
  }
 }
});

test('only the four assigned products change their Port Map image/layout fields',()=>{
 for(const slug of slugs){
  const current=read(slug),base=prior[slug];
  assert.deepEqual(current.io,base.io,slug);
  assert.deepEqual(current.specs,base.specs,slug);
  assert.deepEqual(current.features,base.features,slug);
  assert.deepEqual(current.videoLayerPlan,base.videoLayerPlan,slug);
  const panel=current.images.find(image=>image.role==='Other');
  const rear=current.images.find(image=>image.role==='Rear');
  assert.equal(panel.officialSource,true,slug);
  assert.equal(panel.sourceUrl,rear.sourceUrl,slug);
  assert.match(panel.note,/후면 사진.*확대 패널/,slug);
  const otherStatus=current.imageStatuses.find(status=>status.role==='Other');
  assert.equal(otherStatus.status,'VERIFIED',slug);
  assert.equal(otherStatus.sourceUrl,rear.sourceUrl,slug);
  const existingImages=current.images.filter(image=>image.role!=='Other');
  assert.deepEqual(existingImages,base.images,slug);
 }
});


import { beforeW20261016_015MidraProduct, beforeW20261016_015MidraRaw } from './w20261016-015-midra-zenith-history.mjs';

test('Midra/Zenith historical inverse rolls back only the approved maps and Other panel',()=>{
 for(const slug of slugs){
  const current=read(slug),base=prior[slug];
  const later=structuredClone(current);later.model+=' later';later.io.push({group:'later'});
  const restored=beforeW20261016_015MidraProduct(later,slug);
  assert.equal(restored.model,later.model,slug);
  assert.deepEqual(restored.io,later.io,slug);
  assert.deepEqual(restored.portMap,base.portMap,slug);
  assert.equal(restored.portMaps,undefined,slug);
  assert.deepEqual(restored.images,base.images,slug);
  assert.deepEqual(restored.imageStatuses,base.imageStatuses,slug);
  assert.equal(beforeW20261016_015MidraRaw(JSON.stringify(current),slug),JSON.stringify(baseProduct(current,base),null,2)+'\n',slug);
 }
 const notTarget={};assert.equal(beforeW20261016_015MidraProduct(notTarget,'other'),notTarget);
 const changed=read('zenith-100');changed.portMaps[1].items[0].x1++;
 assert.throws(()=>beforeW20261016_015MidraProduct(changed,'zenith-100'),/unexpected W-015 Midra\/Zenith Port Map layout/);
});
function baseProduct(current,base){const p=structuredClone(current);p.portMap=base.portMap;delete p.portMaps;p.images=base.images;p.imageStatuses=base.imageStatuses;return p;}
\n
