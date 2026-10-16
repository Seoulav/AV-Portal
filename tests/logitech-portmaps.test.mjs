import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {beforeLogitechW14001Product,logitechW14001Slugs} from './logitech-w14001-history.mjs';
import {beforeW16015Group5Product} from './w16015-group5-history.mjs';

const load=slug=>JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`,import.meta.url)));
const fixture=JSON.parse(readFileSync(new URL('../Work/기록/W-20261014-001-prior-fields.json',import.meta.url)));

test('five evidenced Logitech maps retain current unrelated fields',()=>{
  assert.equal(logitechW14001Slugs.size,5);
  for(const slug of logitechW14001Slugs){
    const current=load(slug);
    assert.ok(current.portMap.items.length>=2,slug);
    assert.equal(current.images.find(i=>i.role===current.portMap.image).file,current.portMap.measuredImage.file,slug);
    const historical=beforeLogitechW14001Product(beforeW16015Group5Product(current,slug),slug);
    for(const [field,oldValue] of Object.entries(fixture[slug].prior)){
      assert.deepEqual(historical[field]??null,oldValue,`${slug} prior ${field}`);
    }
    for(const field of Object.keys(current))if(!(field in fixture[slug].prior))assert.deepEqual(historical[field],current[field],`${slug} current ${field}`);
    const changed=structuredClone(current);changed.portMap.items[0].label='INVALID';
    assert.throws(()=>beforeLogitechW14001Product(beforeW16015Group5Product(changed,slug),slug),/unexpected (?:W-015 group-5 portMap|W-20261014-001 portMap) change/);
    const unrelated=structuredClone(current);unrelated.model='INVALID';
    assert.equal(beforeLogitechW14001Product(beforeW16015Group5Product(unrelated,slug),slug).model,'INVALID');
  }
});

test('Rally Bar map declares label-only evidence and the cable map identifies distinct official ends',()=>{
  const bar=load('rally-bar');
  assert.match(bar.images.find(i=>i.role==='Diagram').note,/커버 닫힘 상태, 소켓 모양 비표시/);
  const cable=load('strong-usb-cable');
  assert.deepEqual(cable.portMap.items.map(i=>i.label),['USB-C','USB-A']);
  assert.equal(load('rally-mic-pod-extension-cable').portMap,undefined);
});

test('Rally Plus map uses both HDMI inputs and leaves old camera wiring intact',()=>{
  const plus=load('rally-plus');
  assert.equal(plus.io[6].quantity,'2');
  assert.match(plus.io[6].condition,/설치 가이드 24쪽/);
  assert.equal(plus.portMap.items.find(i=>i.label==='HDMI 입력 1–2')?.n,4);
  assert.equal(plus.io[0].group,'Camera');
});
