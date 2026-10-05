import { isW029Name } from './w029-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as model from '../prototype/brc-am7/product-detail-model.mjs';
import {beforeSamsungW04011} from './samsung-w04011-history.mjs';
import {beforeBssW04015Raw} from './bss-w04015-history.mjs';
import {beforeBssAlignmentRaw} from './bss-alignment-history.mjs';

const root=new URL('../',import.meta.url);
const folder=new URL('beta/site/detail/data/',root);
const evidence=JSON.parse(readFileSync(new URL('Work/기록/W-20261004-013-evidence.json',root),'utf8'));
const read=slug=>beforeSamsungW04011(JSON.parse(readFileSync(new URL(`${slug}.json`,folder),'utf8')),slug);
const hash=value=>createHash('sha256').update(value).digest('hex');
const normalized=text=>text.replace(/\r\n/g,'\n');
const physicalSize=name=>/^크기\([^)]*가로x높이x깊이\)$/.test(name);
const late=name=>/^(영상 처리 엔진(?:\(.*\))?|패널 특성|화질 처리|전문가 모드|운영 시간(?: 등급)?)$/.test(name);

test('the 131 approved removals leave every other display field and all 225 other JSON files unchanged',()=>{
  assert.equal(evidence.deletedRows.length,131);
  assert.equal(Object.keys(evidence.products).length,17);
  assert.equal(Object.keys(evidence.untouched).length,225);
  let total=0;
  for(const [slug,record] of Object.entries(evidence.products)){
    const product=read(slug);
    const {specifications,...core}=product;
    assert.equal(hash(JSON.stringify(core)),record.coreSha256,`${slug} non-specification fields`);
    assert.equal(hash(JSON.stringify(product.sources)),record.sourcesSha256,`${slug} sources`);
    assert.equal(hash(JSON.stringify(specifications)),record.retainedSpecificationsSha256,`${slug} retained rows and order`);
    assert.equal(specifications.length,record.after,`${slug} count`);
    assert.ok(specifications.every(row=>!evidence.deletedRows.some(deleted=>deleted.slug===slug&&deleted.name===row.name)),`${slug} deleted name remains`);
    assert.ok(specifications.every(row=>row.verification!=='REVIEW REQUIRED'||String(row.source??'').trim()),`${slug} unsourced REVIEW REQUIRED remains`);
    total+=specifications.length;
  }
  assert.equal(total,503);
  const brightness=read('lh115qhfebgxkr').specifications.filter(row=>row.name.startsWith('밝기'));
  assert.deepEqual(brightness.map(row=>[row.name,row.value,row.verification,row.source]),[['밝기(최대)','1000','FOUND','S5']]);
  for(const [slug,expected] of Object.entries(evidence.untouched)){
    assert.equal(hash(beforeBssW04015Raw(beforeBssAlignmentRaw(normalized(readFileSync(new URL(`${slug}.json`,folder),'utf8')),slug),slug)),expected,`${slug} untouched pre-flow bytes`);
  }
  assert.equal(readdirSync(folder).filter(file=>file.endsWith('.json') && file !== 'lh43behhlbfxkr.json' && !isW029Name(file)).length,242);
});

test('all 54 published Samsung key facts keep a sourced FOUND or VERIFIED row',()=>{
  assert.equal(evidence.keyFactSupport.length,54);
  for(const entry of evidence.keyFactSupport){
    const product=read(entry.slug);
    assert.ok(product.keyFacts.some(fact=>fact.label===entry.factLabel&&fact.value===entry.factValue),`${entry.slug} fact retained`);
    assert.ok(entry.sourceRows.some(source=>product.specifications.some(row=>
      row.name===source.name&&row.value===source.value&&row.source===source.source&&
      ['FOUND','VERIFIED'].includes(row.verification))),`${entry.slug} ${entry.factLabel} evidence lost`);
  }
});

test('Samsung display rows place real dimensions after screen size and description rows below the first twelve',()=>{
  assert.equal(typeof model.orderSpecificationRows,'function');
  let dimensionProducts=0;
  for(const slug of Object.keys(evidence.products)){
    const prepared=model.prepareProductDetail(read(slug));
    const names=model.orderSpecificationRows(prepared).map(({spec})=>spec.name);
    assert.equal(names.length,prepared.specifications.length,`${slug} rendered count`);
    if(names.includes('화면 크기')){
      assert.equal(names[0],'화면 크기',`${slug} screen first`);
      const sizes=names.map((name,index)=>({name,index})).filter(({name})=>physicalSize(name));
      assert.ok(sizes.length>0,`${slug} product dimensions present`);
      assert.ok(sizes.every(({index})=>index<12),`${slug} dimensions within initial twelve`);
      dimensionProducts++;
      const area=names.indexOf('디스플레이 면적');
      if(area>=0)assert.ok(area>sizes.at(-1).index&&area<12,`${slug} area follows dimensions`);
    }
    assert.ok(names.every((name,index)=>!late(name)||index>=12),`${slug} descriptive row in initial twelve`);
    assert.ok(names.every(name=>!name.startsWith('박스 크기')||!physicalSize(name)),`${slug} box dimensions not treated as product dimensions`);
    const survivingGroups=new Set(prepared.specifications.map(row=>row.group));
    for(const item of evidence.lostGroups.filter(item=>item.slug===slug))assert.ok(!survivingGroups.has(item.group),`${slug} empty group ${item.group}`);
  }
  assert.equal(dimensionProducts,14);
  const names=model.orderSpecificationRows(model.prepareProductDetail(read('lh115qhfebgxkr'))).map(({spec})=>spec.name);
  assert.deepEqual(names.slice(0,3),['화면 크기','크기(가로x높이x깊이)','디스플레이 면적']);
});

test('all 225 non-Samsung products retain their original specification display order',()=>{
  assert.equal(typeof model.orderSpecificationRows,'function');
  for(const slug of Object.keys(evidence.untouched)){
    const prepared=model.prepareProductDetail(read(slug));
    const original=prepared.specificationGroups.flatMap(group=>group.entries);
    assert.deepEqual(model.orderSpecificationRows(prepared).map(({spec})=>spec),original,`${slug} order`);
  }
});

test('04 specification table omits the uniform PRODUCT type while all 242 records retain itemType',()=>{
  for(const path of ['prototype/brc-am7/app.js','beta/site/detail/app.js']){
    const source=readFileSync(new URL(path,root),'utf8');
    assert.doesNotMatch(source,/specificationRows\.push\(\['종류',\s*data\.itemType\]\)/,`${path} renders type`);
    assert.match(source,/specificationRows\.push\(\['시리즈',\s*data\.series\]\)/,`${path} keeps series`);
  }
  for(const file of readdirSync(folder).filter(file=>file.endsWith('.json') && file !== 'lh43behhlbfxkr.json')){
    assert.equal(JSON.parse(readFileSync(new URL(file,folder),'utf8')).itemType,'PRODUCT',`${file} keeps itemType`);
  }
});
