import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {prepareEnhancements,enhancementErrors} from '../prototype/brc-am7/detail-enhancements.mjs';
import {renderPortMap} from '../prototype/brc-am7/detail-enhancement-view.mjs';import {withSvgDocument} from './w20261016-017-svg-dom.mjs';
const baseline=JSON.parse(fs.readFileSync(new URL('./fixtures/h5/maps-before.json',import.meta.url)));
const prior=JSON.parse(fs.readFileSync(new URL('./fixtures/h5/prior-product.json',import.meta.url)));
const sha=s=>createHash('sha256').update(s).digest('hex');
function twoMaps(){const p=structuredClone(prior);p.images.push({...p.images[1],role:'Other',file:'control-panel.png'});p.portMaps=[p.portMap,{...structuredClone(p.portMap),image:'Other',measuredImage:{...p.portMap.measuredImage,file:'control-panel.png'}}];return p;}
const errors=p=>enhancementErrors(p).filter(x=>/portMap/.test(x));
test('H5 follow-up: general products accept Rear and Other maps and reject invalid arrays/maps/roles',()=>{
 const p=twoMaps();assert.deepEqual(errors(p),[]);assert.equal(prepareEnhancements(p).portMaps.length,2);
 for(const mutate of [p=>{p.portMaps=[]},p=>{p.portMaps=Array(9).fill(p.portMap)},p=>{p.portMaps[1].items[0].x2=99999},p=>{p.portMaps[1]=structuredClone(p.portMap)},p=>{p.portMap=structuredClone(p.portMaps[1])},p=>{p.portMaps[1].imageFile='control-panel.png'}]){const bad=twoMaps();mutate(bad);assert.ok(errors(bad).includes('Invalid optional detail field: portMaps'));}
 const single=twoMaps();single.portMap=single.portMaps[1];delete single.portMaps;assert.deepEqual(errors(single),[]);
});
test('H5 follow-up: all existing 180 general and 36 RTCOM map SVGs and validation results are unchanged',()=>{
 let portal=0,rtcom=0;
 for(const b of baseline){const e=prepareEnhancements(b.input);assert.deepEqual(errors(b.input),b.errors,b.id);assert.equal(!!e.portMap,b.portMap,b.id);assert.equal(e.portMaps.length,b.portMaps,b.id);
 for(const s of b.svgs){assert.equal(sha(withSvgDocument(()=>renderPortMap(s.map,s.image,s.model).outerHTML)),s.svgSha,b.id);b.id.startsWith('portal/')?portal++:rtcom++;}}
 assert.equal(portal,180);assert.equal(rtcom,36);
 const duplicates=baseline.filter(b=>b.id.startsWith('rtcom/')&&b.portMaps>1&&new Set(b.input.portMaps.map(m=>m.image)).size<b.portMaps);assert.equal(duplicates.length,3);for(const b of duplicates)assert.equal(prepareEnhancements(b.input).portMaps.length,2);
});
import {beforeH5PanelProduct,beforeH5PanelRaw} from './h5-panel-history.mjs';
import {portMapGeometry} from '../prototype/brc-am7/detail-enhancement-view.mjs';import {portMapSegments} from './portmap-segment-audit.mjs';
const current=()=>JSON.parse(fs.readFileSync(new URL('../beta/site/detail/data/novastar-h5.json',import.meta.url)));
const approved=JSON.parse(fs.readFileSync(new URL('./fixtures/h5/approved-layout.json',import.meta.url)));
test('H5 two maps cover 1..13 once, preserve meanings and facts, and keep every number outside',()=>{
 const p=current();assert.deepEqual(enhancementErrors(p),[]);assert.deepEqual(p.portMap,p.portMaps[0]);assert.deepEqual(p.portMaps.map(m=>m.image),['Rear','Other']);assert.equal(p.images.filter(i=>i.role==='Other').length,1);
 const items=p.portMaps.flatMap(m=>m.items).sort((a,b)=>a.n-b.n);assert.deepEqual(items.map(i=>i.n),Array.from({length:13},(_,n)=>n+1));assert.deepEqual(items.map(({n,label,desc})=>({n,label,desc})),prior.portMap.items.map(({n,label,desc})=>({n,label,desc})));
 assert.deepEqual(beforeH5PanelProduct(p,'novastar-h5'),prior);
 for(const map of p.portMaps){const g=portMapGeometry(map,map.measuredImage.width,map.measuredImage.height);for(const m of g.markers)assert.ok(m.cx+10<=g.image.x||m.cx-10>=g.image.x+g.image.width||m.cy+10<=g.photoTop||m.cy-10>=g.photoBottom,'outside #'+m.item.n);const a=portMapSegments(map);assert.deepEqual(a.tooLong,[]);assert.deepEqual(a.close,[]);assert.ok(map.items.every(i=>!('y'in i)&&!('via'in i)&&!('x'in i)));}
 assert.equal(sha(fs.readFileSync(new URL('../beta/site/detail/images/h5-rear.webp',import.meta.url))),approved.sourcePhotoSha);assert.equal(sha(fs.readFileSync(new URL('../beta/site/detail/images/h5-control-panel.png',import.meta.url))),approved.panelSha);
});
test('H5 historical inverse rejects unexpected layout/image edits and preserves later facts',()=>{
 const p=current();assert.equal(beforeH5PanelProduct(prior,'novastar-h5'),prior);assert.equal(beforeH5PanelProduct(p,'other'),p);assert.equal(beforeH5PanelRaw(JSON.stringify(p),'novastar-h5'),JSON.stringify(prior,null,2)+'\n');
 const changed=structuredClone(p);changed.io=[];changed.model='later';changed.portMaps[1].items[0].desc='later description';const r=beforeH5PanelProduct(changed,'novastar-h5');assert.deepEqual(r.io,[]);assert.equal(r.model,'later');assert.equal(r.portMap.items.find(i=>i.n===2).desc,'later description');
 for(const mutate of [p=>p.portMaps[1].items[0].x1++,p=>p.portMaps[1].items[0].n=99,p=>p.images.at(-1).note='changed']){const bad=structuredClone(p);mutate(bad);assert.throws(()=>beforeH5PanelProduct(bad,'novastar-h5'),/unexpected H5/);}
});

test('H5 historical inverse rejects divergent legacy marker facts',()=>{
 const p=current();p.portMap.items[0].desc+=' later description';assert.throws(()=>beforeH5PanelProduct(p,'novastar-h5'),/unexpected H5 panel mirror/);
});
