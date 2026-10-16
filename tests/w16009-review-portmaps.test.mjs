import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {beforeW16009Product, beforeW16009Raw} from './w16009-history.mjs';
import {portMapGeometry} from '../beta/site/detail/detail-enhancement-view.mjs';
const slugs=['pt-mz11k','pt-mz14k','pt-mz17k','x100pro-2u','eb-l895e'];
const read=s=>JSON.parse(readFileSync(new URL('../beta/site/detail/data/'+s+'.json',import.meta.url),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
test('W-009 selective inverse restores only approved fields and exposes unrelated regressions',()=>{
 for(const slug of slugs){
  const raw=readFileSync(new URL('../beta/site/detail/data/'+slug+'.json',import.meta.url),'utf8');
  const prior=execFileSync('git',['show','origin/main:beta/site/detail/data/'+slug+'.json'],{encoding:'utf8'});
  assert.equal(beforeW16009Raw(raw,slug),prior,slug);
  const current=JSON.parse(raw);
  const unrelated=structuredClone(current);
  unrelated.model='INVALID';
  assert.equal(beforeW16009Product(unrelated,slug).model,'INVALID',slug);
  const ioDrift=structuredClone(current);
  if(slug!=='eb-l895e'){
   ioDrift.io=[];
   assert.deepEqual(beforeW16009Product(ioDrift,slug).io,[],slug);
  }
  const approvedDrift=structuredClone(current);
  approvedDrift.portMap.items[0].label='INVALID';
  assert.throws(()=>beforeW16009Product(approvedDrift,slug),/unexpected W-009 portMap/,slug);
 }
});
test('Panasonic maps use original panel pixels without printed numbers',()=>{
 const bytes=slugs.filter(s=>s.startsWith('pt-')).map(s=>readFileSync(new URL('../beta/site/detail/images/'+s+'-clean-panels.png',import.meta.url)));
 assert.ok(bytes.every(x=>sha(x)===sha(bytes[0])));
 for(const slug of slugs.filter(s=>s.startsWith('pt-'))){
  const p=read(slug),m=p.portMap;
  assert.deepEqual(p.images.map(x=>x.role).slice(-2),['Other','Diagram']);
  assert.equal(m.measuredImage.file,slug+'-clean-panels.png');
  assert.deepEqual(m.items.map(x=>x.n),[1,2,3,4,5,6,7,8,9,10]);
  const g=portMapGeometry(m,890,440);
  assert.ok(g.markers.every(x=>x.side==='top'?x.cy<g.photoTop:x.cy>g.photoBottom));
 }
});
test('Colorlight board rows and Epson serial socket have distinct source-backed markers',()=>{
 const c=read('x100pro-2u');
 assert.deepEqual(c.portMap.items.map(x=>x.side),['left','right','left']);
 assert.deepEqual(c.portMap.items.map(x=>[x.y1,x.y2]),[[50,223],[50,318],[235,318]]);
 assert.equal(c.images.find(x=>x.role==='Rear').file,'x100pro-2u-rear.webp');
 const cg=portMapGeometry(c.portMap,1500,370);
 assert.ok(cg.markers.filter(x=>x.side==='left').every(x=>x.cx<cg.image.x));
 assert.ok(cg.markers.filter(x=>x.side==='right').every(x=>x.cx>cg.image.x+cg.image.width));
 const e=read('eb-l895e');
 assert.equal(e.io.length,9);
 assert.match(e.io[8].condition,/22·184·276쪽/);
 assert.equal(e.io[8].quantity,'1');
 assert.equal(e.io[8].verification,'VERIFIED');
 const m6=e.portMap.items.find(x=>x.n===6),m9=e.portMap.items.find(x=>x.n===9);
 assert.deepEqual([m6.side,m9.side],['top','bottom']);
 assert.ok(m6.y<45 && m9.y>175);
 assert.deepEqual([m9.x1,m9.x2],[634,700]);
});
