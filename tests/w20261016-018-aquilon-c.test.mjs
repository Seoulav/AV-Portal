import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {enhancementErrors,validFlow,validLayerPlan} from '../prototype/brc-am7/detail-enhancements.mjs';
const read=path=>JSON.parse(fs.readFileSync(new URL('../beta/site/'+path,import.meta.url)));
const expected=[['aquilon-cmini','Aquilon Cmini','AQL-CMINI',8,12,1,3,610],['aquilon-c','Aquilon C','AQL-C',16,16,2,4,740],['aquilon-cplus','Aquilon C+','AQL-C+',24,20,3,5,1050],['aquilon-cmax','Aquilon Cmax','AQL-CMAX',32,24,4,6,1500]];
test('W-018 registers four distinct BTO C models with cited maximum capacities',()=>{
 const catalog=read('catalog.json');
 for(const [slug,model,code,inputs,outputs,vpus,ru,power] of expected){const p=read('detail/data/'+slug+'.json');assert.equal(p.model,model);assert.ok(p.productName.includes(code));assert.equal(catalog.filter(x=>x.slug===slug).length,1);assert.match(p.lead,/BTO 최대 구성/);assert.ok(p.specifications.some(x=>x.name==='최대 소비전력'&&x.value===String(power)));assert.ok(p.specifications.some(x=>x.name==='랙 유닛'&&x.value===String(ru)));assert.deepEqual(p.layerPlan.models.map(x=>[x.inputs4k,x.outputConnectors4k,x.vpus]),expected.map(x=>[x[3],x[4],x[5]]));assert.equal(p.layerPlan.models.find(x=>x.slug===slug).screens2x2,vpus);assert.equal(validLayerPlan(p.layerPlan,p),true);assert.equal(validFlow(p.signalFlow,p),true);assert.deepEqual(enhancementErrors(p),[]);}
});
test('W-018 reuses the posted brochure and the applicable v6.2 manual without duplicate PDFs',()=>{
 const manifest=read('docs/manifest.json');
 for(const [slug]of expected){const p=read('detail/data/'+slug+'.json');assert.ok(p.documents.some(x=>x.type==='User Manual'&&x.url.endsWith('Aquilon_User_Manual_v6.2.pdf')));const brochure=p.documents.find(x=>x.type==='Brochure');assert.equal(brochure.file,'manuals/analog-way-aquilon-brochure-april-2026.pdf');assert.equal(brochure.quickSlot,'technical');assert.equal(manifest.uploads.filter(x=>x.slug===slug&&x.file===brochure.file).length,1);assert.equal(p.images.length,2);assert.equal(p.images.find(x=>x.role==='Rear').verificationStatus,'FOUND');assert.match(p.images.find(x=>x.role==='Rear').note,/장착.*기준/);assert.ok(p.layerPlan.notes.some(x=>x.includes('BTO 최대 구성')));}
});

import {beforeW018Catalog,beforeW018Uploads,beforeW018Snapshot,readBeforeW018FileSync,readBeforeW018File,readdirBeforeW018Sync} from './w20261016-018-history.mjs';
import {portMapGeometry} from '../prototype/brc-am7/detail-enhancement-view.mjs';
import {portMapSegments} from './portmap-segment-audit.mjs';
test('W-018 historical adapter removes only approved additions and rejects changed or incomplete additions',async()=>{
 const catalog=read('catalog.json'),uploads=read('docs/manifest.json').uploads;
 assert.equal(catalog.length-beforeW018Catalog(catalog).length,4);assert.equal(uploads.length-beforeW018Uploads(uploads).length,4);
 for(const [rows,fn]of [[catalog,beforeW018Catalog],[uploads,beforeW018Uploads]]){
  const bad=structuredClone(rows);bad.find(x=>x.slug==='aquilon-c').unexpected='changed';assert.throws(()=>fn(bad),/Unexpected W-018/);
  assert.throws(()=>fn(rows.filter(x=>x.slug!=='aquilon-c')),/Unexpected W-018/);
  const extra={slug:'future-unrelated',value:'must remain'};assert.deepEqual(fn([...rows,extra]).at(-1),extra);
  const prior=fn(rows);assert.equal(fn(prior),prior);
 }
 const file=new URL('../beta/site/catalog.json',import.meta.url),text=JSON.stringify(beforeW018Catalog(catalog),null,2)+'\n';
 assert.equal(readBeforeW018FileSync(file,'utf8'),text);assert.deepEqual(readBeforeW018FileSync(file),Buffer.from(text));assert.equal(await readBeforeW018File(file,'utf8'),text);
 const data=new URL('../beta/site/detail/data/',import.meta.url);assert.equal(fs.readdirSync(data).length-readdirBeforeW018Sync(data).length,4);
 const snapshot={catalog:{count:8},details:Object.fromEntries([...expected.map(x=>[x[0],{}]),['existing',{preserved:true}]])};assert.deepEqual(beforeW018Snapshot(snapshot),{catalog:{count:4},details:{existing:{preserved:true}}});
 for(const slug of expected.map(x=>x[0])){const url=new URL('../beta/site/detail/data/'+slug+'.json',import.meta.url);assert.deepEqual(readBeforeW018FileSync(url),fs.readFileSync(url),'new product contents are never rewound');}
});
test('W-018 four current port maps preserve outside numbers, short orthogonal leaders and 6px in-photo clearance',()=>{
 for(const [slug]of expected){const p=read('detail/data/'+slug+'.json'),m=p.portMap,g=portMapGeometry(m,m.measuredImage.width,m.measuredImage.height);assert.deepEqual(enhancementErrors(p),[],slug);assert.equal(new Set(m.items.map(x=>x.n)).size,m.items.length);
 for(const marker of g.markers){const {cx,cy}=marker;assert.ok(cx+10<=g.image.x||cx-10>=g.image.x+g.image.width||cy+10<=g.photoTop||cy-10>=g.photoBottom,slug+' #'+marker.item.n);}
 const a=portMapSegments(m);assert.deepEqual(a.tooLong,[],slug);assert.deepEqual(a.close,[],slug);
 for(const text of [...p.features.map(x=>x.text),...m.items.map(x=>x.desc)])assert.doesNotMatch(text,/(?:한다|합니다|할 수 있다|할 수 있습니다)\.?$/);
 }
});

// Work independent review: fixed control parts must not read as optional cards.
test('W-018 distinguishes six fixed common connectors from configurable video and multiviewer cards',()=>{
 for(const [slug]of expected){const p=read('detail/data/'+slug+'.json');const fixed=p.io.filter(x=>!['4K60p input','4K60p output','Multiviewer'].includes(x.signal));assert.equal(fixed.length,6);for(const row of fixed)assert.equal(row.availability,'고정 · 모든 Aquilon 공통(매뉴얼 39–41쪽)',slug+' '+row.connector);assert.equal(p.io.find(x=>x.signal==='Multiviewer').availability,'카드 구성에 따름');assert.equal(p.io.filter(x=>x.availability==='카드 구성에 따름').length,3);}
});
