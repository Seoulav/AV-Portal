import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {selectKeySpecifications,prepareProductDetail} from '../prototype/brc-am7/product-detail-model.mjs';
import {adaptRtcomDetail} from '../beta/site/shared/rtcom-adapter.mjs';

test('fallback prefers values up to 16 characters, then up to 20, and rejects longer values',()=>{
  const groups=[
    {name:'First',entries:[
      {name:'medium first',value:'x'.repeat(20),verification:'FOUND'},
      {name:'too long',value:'x'.repeat(21),verification:'FOUND'}
    ]},
    {name:'Second',entries:[
      {name:'short',value:'short',verification:'VERIFIED'},
      {name:'medium with unit',value:'x'.repeat(18),unit:'W',verification:'FOUND'}
    ]},
    {name:'Third',entries:[
      {name:'review',value:'review',verification:'REVIEW REQUIRED'},
      {name:'another short',value:'value',verification:'FOUND'}
    ]}
  ];
  assert.deepEqual(selectKeySpecifications(groups,4).map(item=>item.name),['short','another short','medium first','medium with unit']);
  assert.ok(selectKeySpecifications(groups).every(item=>[item.value,item.unit].filter(Boolean).join(' ').length<=20));
});

test('one available fallback value hides the grid; authored key facts still use their existing renderer',async()=>{
  const app=await readFile(new URL('../prototype/brc-am7/app.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../prototype/brc-am7/styles.css',import.meta.url),'utf8');
  assert.match(app,/fallbackSpecs\.length >= 2/);
  assert.match(app,/if \(enhancements\.keyFacts\.length\)/);
  assert.match(app,/renderKeyFacts\(enhancements\.keyFacts\)/);
  assert.match(css,/#key-specs\.av-fallback-facts dd\.long-key-value/);
  assert.doesNotMatch(css,/^\.pg-facts dd\.long-key-value\s*\{[^}]*-webkit-line-clamp/m);
});

test('all published fallback display values stay within 20 characters without changing authored cards',async()=>{
  const dir=new URL('../beta/site/detail/data/',import.meta.url);
  const files=(await readdir(dir)).filter(name=>name.endsWith('.json'));
  let authored=0,fallback=0;
  for(const file of files){
    const product=prepareProductDetail(JSON.parse(await readFile(new URL(file,dir))));
    if(product.enhancements.keyFacts.length>=2){authored++;continue;}
    fallback++;
    assert.ok(product.keySpecifications.every(item=>[item.value,item.unit].filter(Boolean).join(' ').length<=20),file);
  }
  // W-20261004-003 authors 29 Shure cards that previously used the fallback.
  assert.equal(authored,121); // W-006 adds eight authored television cards.
  assert.equal(fallback,137);
});

test('RTCOM detail keeps its existing unfiltered fallback presentation',async()=>{
  const rtcom=new URL('../beta/site/rtcom/raw/products/',import.meta.url);
  const files=(await readdir(rtcom)).filter(name=>name.endsWith('.json'));
  for(const file of files){
    const raw=JSON.parse(await readFile(new URL(file,rtcom)));
    const detail=prepareProductDetail(adaptRtcomDetail(raw),{compactFallback:false});
    const legacy=detail.specificationGroups.flatMap(group=>group.entries.slice(0,2))
      .filter(item=>!['REVIEW REQUIRED','CONFLICTED','MISSING'].includes(item.verification)).slice(0,10);
    assert.deepEqual(detail.keySpecifications,legacy,file);
    if(file==='umc.json') assert.deepEqual(detail.keySpecifications.slice(0,4).map(item=>item.name),['케이블','잠금 강도','인증','시험']);
  }
  assert.equal(files.length,32);
  const app=await readFile(new URL('../prototype/brc-am7/app.js',import.meta.url),'utf8');
  assert.match(app,/compactFallback:\s*!rtcomId/);
});
