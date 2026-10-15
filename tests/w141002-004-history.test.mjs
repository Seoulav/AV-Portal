import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeW141002004Product,beforeW141002004Raw} from './w141002-004-history.mjs';
import {beforeW20261015_002EpsonProduct,beforeW20261015_002EpsonRaw} from './w20261015-002-history.mjs';
import {portMapGeometry} from '../prototype/brc-am7/detail-enhancement-view.mjs';

const fixture=JSON.parse(readFileSync(new URL('./fixtures/w141002-004-history.json',import.meta.url),'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const digits=value=>[...JSON.stringify(value).matchAll(/\d+(?:[.,/]\d+)*/g)].map(match=>match[0]);

test('approved wording and Port Map changes selectively rewind to exact prior JSON',()=>{
  for(const [slug,record] of Object.entries(fixture)){
    const raw=readFileSync(new URL(`../beta/site/detail/data/${slug}.json`,import.meta.url),'utf8');
    const product=JSON.parse(raw);
    const restored=beforeW141002004Product(beforeW20261015_002EpsonProduct(product,slug),slug);
    assert.equal(sha(beforeW141002004Raw(beforeW20261015_002EpsonRaw(raw,slug),slug)),record.priorRawSha256,slug);
    assert.deepEqual(beforeW141002004Product(restored,slug),restored,slug);
    for(const field of Object.keys(record.fields)){
      if(field==='portMap')continue;
      assert.deepEqual(digits(restored[field]),digits(product[field]),`${slug}: ${field} numerical facts`);
    }
    const changed=structuredClone(product);
    const field=Object.keys(record.fields)[0];
    changed[field]={unexpected:true};
    assert.throws(()=>beforeW141002004Product(changed,slug),/unexpected W-002–004/,slug);
  }
});

test('X100 Pro board ranges and Panasonic numbers render outside their source images',()=>{
  for(const slug of ['x100pro-2u','x100pro-4u','x100pro-7u','pt-mz11k','pt-mz14k','pt-mz17k']){
    const product=JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`,import.meta.url),'utf8'));
    const map=product.portMap;
    const {width,height}=map.measuredImage;
    const geometry=portMapGeometry(map,width,height);
    for(const marker of geometry.markers){
      if(slug.startsWith('pt-mz')){
        assert.equal(marker.side,marker.item.n<=5?'top':'bottom',slug);
        assert.equal(marker.item.y,marker.item.n<=5?0:height,slug);
        assert.ok(marker.item.n<=5?marker.cy<geometry.photoTop:marker.cy>geometry.photoBottom,slug);
      }else{
        assert.equal(marker.side,'top',slug);
        assert.ok(marker.cy<geometry.photoTop,slug);
        assert.ok(marker.item.x2-marker.item.x1>500,slug);
      }
    }
  }
});
