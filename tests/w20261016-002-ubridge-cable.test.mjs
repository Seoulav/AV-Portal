// W-015 group6b: compare this historical task with the approved later layout rewound.
import {readBeforeGroup6bFileSync as readFileSync} from './group6b-w16015-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { enhancementErrors } from '../beta/site/detail/detail-enhancements.mjs';
import { renderSignalFlow } from '../beta/site/detail/detail-enhancement-view.mjs';
import { beforeW20261016_005Raw } from './w20261016-005-history.mjs';

class Node {
  constructor(tag,value=''){this.tag=tag;this.value=String(value);this.children=[];this.attrs={};this.dataset={};}
  append(...children){this.children.push(...children);}
  setAttribute(key,value){this.attrs[key]=String(value);}
  addEventListener(){}
  cloneNode(){return this;}
  get textContent(){return this.value+this.children.map(x=>typeof x==='string'?x:x.textContent).join('');}
  set textContent(value){this.value=String(value);this.children=[];}
}
globalThis.document={createElement:tag=>new Node(tag),createElementNS:(_ns,tag)=>new Node(tag),createTextNode:value=>new Node('#text',value)};
const walk=node=>[node,...node.children.flatMap(x=>typeof x==='string'?[]:walk(x))];
const product=()=>JSON.parse(readFileSync(new URL('../beta/site/detail/data/u-bridge-3.json',import.meta.url),'utf8'));

test('user-confirmed shielded CAT6A requirement is sourced separately from manufacturer guidance',()=>{
  const d=product();
  const cable=d.specifications.filter(x=>x.group==='Link'&&x.name==='연장 케이블');
  assert.equal(cable.length,1);
  assert.equal(cable[0].value,'CAT6A U/FTP 이상 차폐형(U/FTP·S/FTP) 필수');
  assert.match(cable[0].condition,/UTP.*불가/);
  assert.equal(cable[0].source,'U');
  assert.equal(cable[0].verification,'FOUND');
  assert.match(d.sources.find(x=>x.code==='U')?.scope||'',/2026-10-16/);
  assert.ok(d.issues.some(x=>x.status==='INFO'&&/INO-CAT6A/.test(x.detail)&&/강화 조건/.test(x.detail)));
  assert.match(d.korean,/차폐.*필수.*UTP.*불가/);
  assert.match(d.overview,/차폐.*필수/);
  assert.ok(d.features.some(x=>x.source==='U'&&/차폐.*필수/.test(x.text)&&/UTP.*불가/.test(x.text)));
  assert.equal(d.specifications.find(x=>x.name==='전송 거리').value,'최대 100');
  assert.deepEqual(enhancementErrors(d),[]);
});

test('both public signal-flow scenarios label shielded cable as mandatory while keeping U/FTP and 100 m',()=>{
  const d=product();
  assert.ok(d.signalFlow.notes.some(x=>/차폐.*필수.*UTP.*불가/.test(x)));
  const view=renderSignalFlow(d.signalFlow,d.model);
  const articles=walk(view).filter(x=>x.tag==='article');
  assert.equal(articles.length,2);
  for(const article of articles){
    const graphic=walk(article).find(x=>x.tag==='svg');
    assert.match(graphic.textContent,/CAT6A U\/FTP.*차폐.*필수.*UTP.*불가/);
    assert.match(graphic.textContent,/한 가닥.*100m/);
  }
});
import { createHash } from 'node:crypto';
import { beforeW20261016_002Product, beforeW20261016_002Raw, beforeW20261016_002View } from './w20261016-002-history.mjs';
import {beforeW014View} from './w014-analogway-history.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');

test('W-002 inverse restores exact prior U-BRIDGE data and scoped renderer bytes',()=>{
  const raw=readFileSync(new URL('../beta/site/detail/data/u-bridge-3.json',import.meta.url),'utf8');
  assert.equal(sha(beforeW20261016_002Raw(beforeW20261016_005Raw(raw,'u-bridge-3'),'u-bridge-3')),'3d601ec684b48020e9eeb1917e2a939412e604f2c1b63eacc10a32fad46308d3');
  const prior=beforeW20261016_002Product(JSON.parse(beforeW20261016_005Raw(raw,'u-bridge-3')),'u-bridge-3');
  assert.ok(prior.korean.includes('CAT6A U/FTP 한 가닥'));
  assert.ok(!prior.sources.some(x=>x.code==='U'));
  assert.equal(beforeW20261016_002Raw('{"x":1}','toggle-dock-2x1'),'{"x":1}');
  for(const path of ['../prototype/brc-am7/detail-enhancement-view.mjs','../beta/site/detail/detail-enhancement-view.mjs']){
    const view=readFileSync(new URL(path,import.meta.url),'utf8');
    assert.equal(sha(beforeW20261016_002View(beforeW014View(view))),'4c8a1937ba089644657fb10773ec51d7e01beab87a489dd65708d86c68850264');
  }
});
