import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeW16015RallyProduct} from './w16015-rally-history.mjs';

const read=slug=>JSON.parse(readFileSync(new URL('../beta/site/detail/data/'+slug+'.json',import.meta.url)));
const prior=JSON.parse(readFileSync(new URL('./w16015-rally-prior.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('Rally Plus replaces printed callouts with a clean model-matched diagram while retaining the source',()=>{
  const p=read('rally-plus');
  assert.equal(p.portMap.measuredImage.file,'rally-plus-port-panels.webp');
  assert.deepEqual(p.portMap.items.map(x=>x.n),Array.from({length:11},(_,i)=>i+1));
  assert.equal(p.images.find(x=>x.file==='rally-plus-diagram.webp').role,'Other');
  assert.equal(p.images.find(x=>x.role==='Diagram').file,p.portMap.measuredImage.file);
  assert.equal(p.portMap.measuredImage.width,640);
  assert.equal(p.portMap.measuredImage.height,360);
  const old=beforeW16015RallyProduct(p,'rally-plus');
  for(const field of ['images','imageStatuses','portMap'])assert.deepEqual(old[field],prior[field].prior);
  for(const field of Object.keys(p))if(!['images','imageStatuses','portMap'].includes(field))assert.deepEqual(old[field],p[field],field);
  const currentOriginal=readFileSync(new URL('../beta/site/detail/images/rally-plus-diagram.webp',import.meta.url));
  assert.equal(sha(currentOriginal),'c9fe38cbd84761ae591b81517a5aadc205e3628c427c2b4156f0131bb8ad5de1');
});

test('Rally inverse rejects approved-field drift and exposes unrelated current changes',()=>{
  const p=read('rally-plus');
  const changed=structuredClone(p);changed.portMap.items[0].x1++;
  assert.throws(()=>beforeW16015RallyProduct(changed,'rally-plus'),/unexpected W-015 Rally Plus portMap change/);
  const status=structuredClone(p);status.imageStatuses[0].status='MISSING';
  assert.throws(()=>beforeW16015RallyProduct(status,'rally-plus'),/unexpected W-015 Rally Plus imageStatuses change/);
  const io=structuredClone(p);io.io=[];
  assert.deepEqual(beforeW16015RallyProduct(io,'rally-plus').io,[]);
});
