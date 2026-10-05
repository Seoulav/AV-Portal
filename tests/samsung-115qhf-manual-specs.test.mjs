import { beforeW032Raw } from './w032-history.mjs';
import { isW029Name } from './w029-history.mjs';
import { isW030Name } from './w030-history.mjs';
import {beforeHarmanW03014,beforeHarmanW03014Raw,harmanW03014Slug} from './harman-w03014-history.mjs';
import {shureW04003Slug} from './shure-w04003-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {beforeBssW04004Raw} from './bss-w04004-history.mjs';
import {beforeBssAlignmentRaw} from './bss-alignment-history.mjs';
import {beforeDisplayW04013Raw} from './display-w04013-history.mjs';
import { beforeSamsungWhiteboard } from './samsung-w03006-history.mjs';
import { beforeAmxW03008, amxW03008Slug } from './amx-w03008-history.mjs';
import { beforeCrownW03009, crownW03009Slug } from './crown-w03009-history.mjs';
import { beforeJblW03010, jblW03010Slug } from './jbl-w03010-history.mjs';
import { beforeBssW03011, bssW03011Slug } from './bss-w03011-history.mjs';
import { beforeCrownW03013 } from './crown-w03013-history.mjs';
import { beforeSamsungW04010 } from './samsung-w04010-history.mjs';

const root=new URL('../',import.meta.url);
const evidence=JSON.parse(readFileSync(new URL('Work/기록/W-20261003-003-evidence.json',root),'utf8'));
const product=beforeSamsungW04010(JSON.parse(readFileSync(new URL(`beta/site/detail/data/${evidence.slug}.json`,root),'utf8')),evidence.slug);
const sha=value=>createHash('sha256').update(value).digest('hex');
const row=name=>{
  const matches=product.specifications.filter(item=>item.name===name);
  assert.equal(matches.length,1,name);
  return matches[0];
};
const manual=row=>String(row.source).split(',').map(code=>code.trim()).includes('M1');

test('QH115FX manual verifies existing rows, corrects humidity and adds four exact-model specifications',()=>{
  assert.equal(evidence.before.reviewRequired,27);
  assert.equal(product.specifications.length,evidence.before.specifications.length+4);
  assert.equal(product.specifications.filter(item=>item.verification==='REVIEW REQUIRED').length,24);
  for(const name of ['해상도','전원 사양','동작 온도','동작 습도']){
    const current=row(name);
    assert.equal(current.verification,'VERIFIED',name);
    assert.ok(manual(current),`${name}: M1 source`);
  }
  for(const name of ['해상도','전원 사양','동작 온도']){
    const before=evidence.before.specifications.find(item=>item.name===name);
    assert.equal(row(name).value,before.value,`${name}: unchanged value`);
  }
  assert.equal(evidence.before.specifications.find(item=>item.name==='동작 습도').value,'20 - 95% (Operating)');
  assert.equal(row('동작 습도').value,'10 - 80%');
  assert.equal(row('동작 습도').condition,'비액화');
  for(const [name,value,unit,condition] of [
    ['최대 주사율','120','Hz','HDMI·DisplayPort'],
    ['디스플레이 면적','2534.4 x 1425.6','mm',''],
    ['보관 온도','-20 - 45','℃',''],
    ['보관 습도','5 - 95','%','비액화']
  ]){
    const current=row(name);
    assert.equal(current.value,value,name);
    assert.equal(current.unit,unit,name);
    assert.equal(current.condition,condition,name);
    assert.equal(current.verification,'VERIFIED',name);
    assert.equal(current.source,'M1',name);
  }
  const source=product.sources.filter(item=>item.code==='M1');
  assert.equal(source.length,1,'reuse existing manual source');
  assert.deepEqual({...source[0],scope:evidence.before.sources.find(item=>item.code==='M1').scope},evidence.before.sources.find(item=>item.code==='M1'));
  assert.match(source[0].scope,/105쪽/);
});

test('frequency ranges, remaining review rows and fields outside specifications/sources are untouched',()=>{
  const changed=new Set(['해상도','전원 사양','동작 온도','동작 습도']);
  const before=evidence.before.specifications;
  for(const original of before.filter(item=>!changed.has(item.name))){
    assert.deepEqual(row(original.name),original,`${original.name}: historical row`);
  }
  for(const name of ['수평 주사 주파수','수직 주사 주파수','최대 픽셀 주파수']){
    assert.equal(row(name).verification,'REVIEW REQUIRED',name);
    assert.equal(row(name).value,before.find(item=>item.name===name).value,name);
  }
  const {specifications,sources,...core}=product;
  assert.equal(sha(JSON.stringify(core)),evidence.before.coreSha256);
  assert.equal(product.sources.length,evidence.before.sources.length);
});

test('every other product detail JSON retains its pre-change Git LF bytes',()=>{
  const dir=new URL('beta/site/detail/data/',root);
  const hash=createHash('sha256');
  for(const name of readdirSync(dir).filter(name=>name.endsWith('.json') && name !== 'lh43behhlbfxkr.json'&&!isW029Name(name) && !isW030Name(name)&&name!==`${evidence.slug}.json`).sort()){
    const slug=name.slice(0,-5);
    const raw=beforeBssW04004Raw(beforeDisplayW04013Raw(beforeBssAlignmentRaw(beforeW032Raw(readFileSync(new URL(name,dir),'utf8').replace(/\r\n/g,'\n'), slug),slug),slug),slug);
    const historical=['lh55wmfwbgcxkr','lh75wmfwlgcxkr'].includes(slug)||amxW03008Slug(slug)||crownW03009Slug(slug)||jblW03010Slug(slug)||bssW03011Slug(slug)||harmanW03014Slug(slug)||shureW04003Slug(slug)
      ? JSON.stringify(beforeCrownW03013(beforeBssW03011(beforeJblW03010(beforeCrownW03009(beforeAmxW03008(beforeSamsungWhiteboard(beforeHarmanW03014(JSON.parse(raw),slug),slug),slug),slug),slug),slug),slug),null,2)+'\n'
      : raw;
    hash.update(name).update('\0').update(historical);
  }
  assert.equal(hash.digest('hex'),evidence.otherDetailJsonSha256);
});
