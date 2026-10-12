import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeW06004Product} from './w06004-history.mjs';
import {prepareEnhancements} from '../prototype/brc-am7/detail-enhancements.mjs';

const root=new URL('../',import.meta.url);
const proof=JSON.parse(readFileSync(new URL('Work/기록/W-20261006-004-image-hashes.json',root)));
const fixture=JSON.parse(readFileSync(new URL('Work/기록/W-20261006-004-prior-fields.json',root)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('nine replacement images are the approved bytes and metadata names their measured sizes',()=>{
  assert.equal(Object.keys(proof).length,9);
  for(const [name,record] of Object.entries(proof)) {
    const bytes=readFileSync(new URL(`beta/site/detail/images/${name}`,root));
    assert.equal(sha(bytes),record.approvedSha256,name);
    assert.notEqual(record.priorSha256,record.approvedSha256,name);
  }
  for(const [slug,{prior}] of Object.entries(fixture)) {
    const current=JSON.parse(readFileSync(new URL(`beta/site/detail/data/${slug}.json`,root)));
    const restored=beforeW06004Product(current,slug);
    assert.deepEqual(restored.images,prior.images,slug);
    assert.deepEqual(restored.portMap,prior.portMap===undefined?undefined:prior.portMap,slug);
    const currentOther=structuredClone(current),previousOther=structuredClone(restored);
    delete currentOther.images;delete previousOther.images;
    if(slug==='ua864a'){delete currentOther.portMap;delete previousOther.portMap;}
    assert.deepEqual(currentOther,previousOther,slug+' unrelated fields');
    for(const image of current.images) {
      assert.ok(proof[image.file],image.file);
      const [width,height]=image.resolution.split(/[x×]/).map(Number);
      assert.ok(width>0&&height>0,image.file+' dimensions');
    }
  }
});

test('UA864A markers follow the new Rear photo but preserve their identities and text',()=>{
  const current=JSON.parse(readFileSync(new URL('beta/site/detail/data/ua864a.json',root)));
  const previous=fixture.ua864a.prior.portMap;
  assert.equal(current.portMap.image,'Rear');
  assert.deepEqual(current.portMap.measuredImage,{file:'ua864a-rear.webp',width:2400,height:2140});
  assert.equal(prepareEnhancements(current).portMap!==null,true);
  for(const [index,item] of current.portMap.items.entries()) {
    const old=previous.items[index];
    for(const field of ['n','label','desc','side'])assert.equal(item[field],old[field],field);
    assert.ok(item.x1>=0&&item.x1<item.x2&&item.x2<=2400);
    assert.ok(item.y>=0&&item.y<=2140);
  }
  assert.ok(current.portMap.items[0].y<current.portMap.items[1].y);
});

test('inverse rejects changed approved metadata, while unrelated fields pass through',()=>{
  const current=JSON.parse(readFileSync(new URL('beta/site/detail/data/ua864a.json',root)));
  const mutated=structuredClone(current);mutated.portMap.items[0].x1++;
  assert.throws(()=>beforeW06004Product(mutated,'ua864a'),/unexpected W-004 portMap/);
  const changed=structuredClone(current);changed.io=[];
  assert.deepEqual(beforeW06004Product(changed,'ua864a').io,[]);
});
