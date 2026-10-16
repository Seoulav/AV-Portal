import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeW16015SamsungHotelPlacementProduct} from './w16015-samsung-hotel-placement-history.mjs';
import {prepareEnhancements} from '../beta/site/detail/detail-enhancements.mjs';
import {portMapGeometry} from '../beta/site/detail/detail-enhancement-view.mjs';
const root=new URL('../',import.meta.url);
const sizes=['43','50','55','65','75','85'];
const read=slug=>JSON.parse(readFileSync(new URL(`beta/site/detail/data/${slug}.json`,root),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('U800F top and bottom brackets stay outside the panel and printed labels',()=>{
  const hashes=[];
  for(const size of sizes){
  const slug=`hg${size}u800fnfxkr`,current=read(slug),prior=beforeW16015SamsungHotelPlacementProduct(current,slug);
  assert.ok(prepareEnhancements(current).portMap,slug);
  assert.deepEqual(current.portMap.items.map(({n,y,side})=>({n,y,side})),[
   {n:1,y:undefined,side:'left'},{n:2,y:undefined,side:'left'},{n:3,y:undefined,side:'left'},
   {n:4,y:undefined,side:'left'},{n:5,y:undefined,side:'left'},
   {n:6,y:554,side:'top'},{n:7,y:554,side:'top'},{n:8,y:554,side:'top'},
   {n:9,y:859,side:'bottom'},{n:10,y:859,side:'bottom'},
  ],slug);
  const expected=structuredClone(prior.portMap);
  for(const item of expected.items){if([6,7,8].includes(item.n))item.y=554;if([9,10].includes(item.n))item.y=859;}
  assert.deepEqual(current.portMap,expected,`${slug}: only marker placement changed`);
  const diagram=current.images.find(image=>image.role==='Diagram');
  hashes.push(sha(readFileSync(new URL(`beta/site/detail/images/${diagram.file}`,root))));
  const geometry=portMapGeometry(current.portMap,900,1120);
  const mapped=['top','bottom'].flatMap(side=>geometry.markers.filter(marker=>marker.side===side));
  assert.ok(mapped.every(marker=>(marker.x2-marker.x1)<=geometry.image.width/4),`${slug}: photo horizontal bracket runs stay within one quarter of photo width`);
  for(const side of ['top','bottom']){
   const parallel=geometry.markers.filter(marker=>marker.side===side).sort((a,b)=>a.x1-b.x1);
   for(let i=1;i<parallel.length;i++)assert.ok(parallel[i].x1-parallel[i-1].x2>=6,`${slug}: parallel brackets have at least 6px clearance`);
  }
 }
 assert.equal(new Set(hashes).size,1,'the six sizes use the same diagram pixels');
});

test('W-015 Samsung hotel history inverse restores only its approved Port Map coordinates',()=>{
 const slug='hg55u800fnfxkr',current=read(slug),restored=beforeW16015SamsungHotelPlacementProduct(current,slug);
 assert.equal(restored.portMap.items.find(item=>item.n===6).y,634);
 assert.equal(restored.portMap.items.find(item=>item.n===9).y,764);
 const bad=structuredClone(current);bad.portMap.items[0].y1++;
 assert.throws(()=>beforeW16015SamsungHotelPlacementProduct(bad,slug),/unexpected W-015 Samsung hotel Port Map placement change/);
 const unrelated=structuredClone(current);unrelated.io[0].quantity='999';
 assert.equal(beforeW16015SamsungHotelPlacementProduct(unrelated,slug).io[0].quantity,'999');
});
