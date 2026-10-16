import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {portMapGeometry,renderPortMap} from '../prototype/brc-am7/detail-enhancement-view.mjs';
import {enhancementErrors} from '../prototype/brc-am7/detail-enhancements.mjs';
import {withSvgDocument} from './w20261016-017-svg-dom.mjs';
const baseline=JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-017-svg-before.json',import.meta.url)));
const side=(n,y,where='left')=>({n,label:'Port '+n,desc:'Port',side:where,y1:y-5,y2:y+5});
const image={naturalWidth:680,naturalHeight:200,src:'rear.webp',alt:'Rear'};
const paths=svg=>svg.children.filter(x=>x.tag==='path').map(x=>x.attrs.d);
const render=(map,im=image)=>withSvgDocument(()=>renderPortMap(map,im,'Test'));

test('side lanes keep midpoint height, alternate outward columns and reuse a free column',()=>{
 const map={items:[side(3,119),side(2,100),side(1,80),side(4,142),side(5,100,'right')]};
 const g=portMapGeometry(map,680,200),byN=n=>g.markers.find(m=>m.item.n===n);
 assert.deepEqual([1,2,3,4].map(n=>byN(n).cy),[120,140,159,182]);
 assert.deepEqual([1,2,3,4].map(n=>byN(n).cx),[40,16,40,40]);
 assert.equal(byN(5).cy,140);assert.equal(byN(5).cx,768);
 assert.equal(byN(2).y1,135);assert.equal(byN(2).y2,145);
 assert.equal(g.image.x,64);assert.equal(g.width,784);
 assert.equal(paths(render(map))[3],'M58 140H26');
 for(const m of g.markers)assert.equal(m.cy,(m.y1+m.y2)/2);
 const positions=x=>x.markers.map(m=>[m.item.n,m.cx,m.cy]).sort();
 assert.deepEqual(positions(portMapGeometry({...map,items:[...map.items].reverse()},680,200)),positions(g));
});

test('22px boundary keeps legacy SVG; extra side columns grow horizontal gutters only',()=>{
 const map={items:[side(1,100),side(2,122),side(3,100,'right')]};
 const g=portMapGeometry(map,680,200);assert.deepEqual(g.markers.map(m=>m.cy),[140,162,140]);
 assert.equal(paths(render(map))[1],'M34 140H26');assert.equal(g.width,760);
 const crowded={items:['left','right'].flatMap((sideName,i)=>[1,2,3,4].map(n=>side(n+i*4,195,sideName)))};
 const overflow=portMapGeometry(crowded,680,200);
 assert.equal(overflow.bottomMargin,40);assert.equal(overflow.height,280);
 assert.equal(overflow.image.x,112);assert.equal(overflow.width,904);
 assert.deepEqual(overflow.markers.slice(0,4).map(m=>m.cx),[88,64,40,16]);
 assert.deepEqual(overflow.markers.slice(4).map(m=>m.cx),[816,840,864,888]);
 assert.ok(overflow.markers.every(m=>m.cy===235 && m.cx-10>=0 && m.cx+10<=overflow.width));
 assert.ok(paths(render(crowded)).filter((_,i)=>i%2).every(d=>/^M[\d.]+ [\d.]+H[\d.]+$/.test(d)));
 const tall=portMapGeometry({items:Array.from({length:12},(_,n)=>side(n+1,1790))},680,1800);
 assert.ok(tall.height<=900+1e-8);assert.ok(tall.markers.every(m=>m.cy+10<=tall.height+1e-8));
});

test('side via uses final waypoint height and shares outward collision columns with plain sides',()=>{
 const map={crop:{top:100,bottom:0},items:[
  {...side(1,300),x:250,via:[[100,400]]},
  {...side(2,500),x:400,via:[[100,400]]},
  side(3,400),
  {...side(4,300,'right'),x:400,via:[[1000,400]]},
  {...side(5,600,'right'),x:500,via:[[1000,400]]}
 ]};
 const g=portMapGeometry(map,1360,800);
 assert.deepEqual(g.markers.map(m=>m.cy),[190,190,190,190,190]);
 assert.deepEqual(g.markers.map(m=>m.cx),[64,40,16,792,816]);
 assert.equal(g.width,832);assert.equal(g.image.x,88);
 assert.equal(g.markers[0].y1,137.5);assert.equal(g.markers[1].y1,237.5);
 const im={...image,naturalWidth:1360,naturalHeight:800};
 assert.equal(paths(render(map,im))[1],'M207 140H138V190H74');
 assert.equal(paths(render(map,im))[3],'M282 240H138V190H50');
});

test('via uses original pixels with crop and scaling, orthogonal starts and circle endpoints',()=>{
 const map={crop:{top:100,bottom:100},items:[{n:1,x1:200,x2:240,y:300,side:'top',labelX:80,via:[[220,260],[80,260],[80,100]]}]};
 const im={...image,naturalWidth:1360,naturalHeight:600};
 assert.equal(paths(render(map,im))[1],'M150 134V120H80V40V26');
 for(const where of ['left','right']){
  const m={items:[{...side(1,100,where),via:[[40,100],[40,140]]},side(2,100,where)]};
  const p=paths(render(m));assert.ok(p.every(d=>!/[LC]/.test(d)));assert.match(p[1],where==='left'?/H26$/:/H734$/);
 }
});

const product=()=>JSON.parse(readFileSync(new URL('../beta/site/detail/data/srg-x40uh.json',import.meta.url)));
const accepts=via=>{const p=product();p.portMap.items[0].via=via;return !enhancementErrors(p).some(e=>e.includes('portMap'));};
test('via validation allows one to three finite original-pixel pairs inside the visible crop',()=>{
 for(const via of [[[0,1640]],[[0,1640],[1888,2000]],[[20,1800],[40,1800],[40,2000]]])assert.equal(accepts(via),true,JSON.stringify(via));
 for(const via of [[],null,{},[[1,2,3]],[[1]],[[1,'1700']],[[NaN,1700]],[[1,Infinity]],[[1,1639]],[[1,2001]],[[-1,1700]],[[1889,1700]],[[1,1700],[2,1700],[3,1700],[4,1700]]])assert.equal(accepts(via),false,JSON.stringify(via));
 const p=product();delete p.portMap.crop;p.portMap.items[0].via=[[0,0],[1888,2000]];assert.deepEqual(enhancementErrors(p),[]);
 // Side marker rules and bounds stay active with via.
 p.portMap.items=[{...side(1,100),via:[[20,100]]}];assert.deepEqual(enhancementErrors(p),[]);
 p.portMap.items[0].x=-1;assert.ok(enhancementErrors(p).includes('Invalid optional detail field: portMap'));
});

test('all 176 Portal and 36 RTCOM maps retain exact SVG bytes except crowded side labels',()=>{
 const changed=[];
 for(const f of baseline.maps){
  const svg=withSvgDocument(()=>renderPortMap(f.map,f.image,f.model).outerHTML);
  if(f.crowded){assert.notEqual(svg,f.svg,f.id);changed.push(f.id);}else assert.equal(svg,f.svg,f.id);
 }
 assert.equal(baseline.maps.filter(f=>f.id.startsWith('portal/')).length,176);
 assert.equal(baseline.maps.filter(f=>f.id.startsWith('rtcom/')).length,36);
 assert.deepEqual(changed,['portal/rally-bar/0','portal/ultritouch-2-hr/0']);
});


test('side via keeps brackets at x and labels outside, legacy x remains unchanged',()=>{
 const plain={items:[{...side(1,100),x:250},{...side(2,100,'right'),x:400}]};
 const legacy=portMapGeometry(plain,680,200);
 assert.deepEqual(legacy.markers.map(m=>m.cx),[266,464]);
 const routed={items:plain.items.map(m=>({...m,via:[[20,100]]}))};
 const g=portMapGeometry(routed,680,200);
 assert.deepEqual(g.markers.map(m=>m.cx),[16,744]);
 assert.deepEqual(g.markers.map(m=>m.edgeX),[290,440]);
 assert.equal(paths(render(plain))[1],'M284 140H276');
 const pair=portMapGeometry({items:[{...routed.items[0],n:1},{...routed.items[0],n:2,x:400}]},680,200);
 assert.deepEqual(pair.markers.map(m=>m.cy),[140,140]);
 assert.deepEqual(pair.markers.map(m=>m.cx),[40,16]);
});
import {createHash} from 'node:crypto';
import {beforeW20261016_017Product,beforeW20261016_017Raw} from './w20261016-017-history.mjs';
const prior=JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-017-prior-fields.json',import.meta.url)));
const sha=x=>createHash('sha256').update(x).digest('hex');
test('Sony changes preserve photos and facts; selective inverse restores exact prior bytes',()=>{
 for(const [slug,f] of Object.entries(prior.products)){
  const p=JSON.parse(readFileSync(new URL('../beta/site/detail/data/'+slug+'.json',import.meta.url)));
  const {portMap,...other}=p;assert.equal(sha(JSON.stringify(other)),f.unchangedSha,slug);
  assert.equal(sha(readFileSync(new URL('../beta/site/detail/images/'+portMap.measuredImage.file,import.meta.url))),f.imageSha,slug);
  const meaning=m=>m.items.map(({n,label,desc})=>({n,label,desc}));assert.deepEqual(meaning(portMap),meaning(f.priorPortMap),slug);
  assert.equal(sha(beforeW20261016_017Raw(JSON.stringify(p,null,2)+'\n',slug)),f.priorRawSha,slug);
  const changed=structuredClone(p);changed.model='CHANGED';changed.io=[];
  assert.equal(beforeW20261016_017Product(changed,slug).model,'CHANGED');assert.deepEqual(beforeW20261016_017Product(changed,slug).io,[]);
  changed.portMap.items[0].label='WRONG';assert.throws(()=>beforeW20261016_017Product(changed,slug),/unexpected W-017 portMap change/);
  const g=portMapGeometry(portMap,portMap.measuredImage.width,portMap.measuredImage.height);
  assert.deepEqual(enhancementErrors(p),[],slug);
  assert.ok(g.markers.every(m=>m.cx+10<=g.image.x||m.cx-10>=g.image.x+g.image.width||m.cy+10<=g.photoTop||m.cy-10>=g.photoBottom),slug+' numbers outside photo');
  assert.ok(g.markers.every((m,i)=>g.markers.slice(i+1).every(q=>Math.hypot(q.cx-m.cx,q.cy-m.cy)>=20)),slug+' circles separated');
 }
});

import {beforeW20261016_017View} from './w20261016-017-history.mjs';
import {beforeW014View} from './w014-analogway-history.mjs';
test('renderer inverse exposes unrelated changes and rejects edits inside the approved block',()=>{
 const view=readFileSync(new URL('../prototype/brc-am7/detail-enhancement-view.mjs',import.meta.url),'utf8');
 assert.equal(sha(beforeW20261016_017View(beforeW014View(view))),prior.priorViewSha);
 assert.ok(beforeW20261016_017View(beforeW014View(view+'\n// unrelated')).endsWith('// unrelated'));
 assert.throws(()=>beforeW20261016_017View(view.replace('cx += marker.direction * 24','cx += marker.direction * 25')),/unexpected W-017 renderer change/);
});
