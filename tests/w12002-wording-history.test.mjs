import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beforeW12002Product, beforeW12002Raw, w12002Slugs } from './w12002-wording-history.mjs';
import { beforeW12003Product } from './w12003-kiprogo2-history.mjs';
import { beforeW12005Product, beforeW12005Raw } from './w12005-history.mjs';

const product=slug=>beforeW12005Product(JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`,import.meta.url),'utf8')),slug);
test('wording history restores only approved feature and marker text',()=>{
  assert.equal(w12002Slugs.size,194);
  const current=product('ki-pro-go2');
  const prior=beforeW12002Product(current,'ki-pro-go2');
  assert.notEqual(prior.features[0].text,current.features[0].text);
  assert.notEqual(prior.portMap.items[0].desc,current.portMap.items[0].desc);
  const changed=beforeW12003Product(current,'ki-pro-go2');
  changed.model='INVALID';
  changed.io=[];
  changed.portMap.items[0].x1=-1;
  const inverse=beforeW12002Product(changed,'ki-pro-go2');
  assert.equal(inverse.model,'INVALID');
  assert.deepEqual(inverse.io,[]);
  assert.equal(inverse.portMap.items[0].x1,-1);
});

test('wording history rejects unexpected changed sentence, missing marker, or count',()=>{
  const original=beforeW12003Product(product('ki-pro-go2'),'ki-pro-go2');
  const feature=structuredClone(original);
  feature.features[0].text='altered';
  assert.throws(()=>beforeW12002Product(feature,'ki-pro-go2'),/feature 1/);
  const desc=structuredClone(original);
  desc.portMap.items[0].desc='altered';
  assert.throws(()=>beforeW12002Product(desc,'ki-pro-go2'),/desc 1/);
  const count=structuredClone(original);
  count.portMap.items.pop();
  assert.throws(()=>beforeW12002Product(count,'ki-pro-go2'),/marker count/);
});

test('raw inverse is limited to affected products',()=>{
  const raw=readFileSync(new URL('../beta/site/detail/data/ki-pro-go2.json',import.meta.url),'utf8');
  assert.notEqual(beforeW12002Raw(beforeW12005Raw(raw,'ki-pro-go2'),'ki-pro-go2'),raw);
  // blucard-in은 B-20261013-03에서 카드 키가 추가돼 되감기 대상이 됐다. 손대지 않은 BSS 제품으로 바꾼다
  const unrelated=readFileSync(new URL('../beta/site/detail/data/ec-4bv.json',import.meta.url),'utf8');
  assert.equal(beforeW12002Raw(unrelated,'ec-4bv'),unrelated);
});
