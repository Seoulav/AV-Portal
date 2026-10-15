import assert from 'node:assert/strict';
const slug='u-bridge-3';
const original='CAT6A U/FTP 한 가닥으로 연결해 USB 3.2 Gen 1(최대 5Gbps) 장치 3개를 최대 100m 연장한다.';
const addition=' 연장 케이블은 CAT6A U/FTP 이상 차폐형(U/FTP·S/FTP) 필수이며 비차폐(UTP)는 사용 불가.';
const feature='CAT6A U/FTP 이상 차폐 케이블 필수(비차폐 UTP 사용 불가)';
const value='CAT6A U/FTP 이상 차폐형(U/FTP·S/FTP) 필수';
const note='CAT6A U/FTP 이상 차폐 케이블 필수(UTP 사용 불가). U/FTP 또는 S/FTP, CAT6A 이상 사용.';
const caption='CAT6A U/FTP 이상 차폐 케이블 필수(UTP 불가)';
export function beforeW20261016_002Product(product, name) {
  if(name!==slug) return product;
  const p=structuredClone(product);
  const leadSuffix=' 연장 케이블은 CAT6A U/FTP 이상 차폐형 필수(UTP 불가).';
  assert.ok(p.korean.endsWith(leadSuffix),'W-002 one-glance lead changed');
  p.korean=p.korean.slice(0,-leadSuffix.length);
  assert.ok(p.overview.includes(original+addition),'W-002 overview changed');
  p.overview=p.overview.replace(original+addition,original);
  assert.deepEqual(p.features[1],{text:feature,source:'U'},'W-002 feature changed');
  p.features.splice(1,1);
  assert.deepEqual(p.specifications[1],{group:'Link',name:'연장 케이블',value,unit:'',condition:'비차폐(UTP) 사용 불가',source:'U',verification:'FOUND'},'W-002 specification changed');
  p.specifications.splice(1,1);
  assert.equal(p.sources.at(-1)?.code,'U','W-002 source changed');
  assert.match(p.sources.at(-1).scope,/2026-10-16/);
  p.sources.pop();
  assert.equal(p.issues.at(-1)?.code,'CABLE-SHIELD','W-002 issue changed');
  assert.equal(p.issues.at(-1).status,'INFO');
  p.issues.pop();
  for(const id of ['cat1','cat2']){
    const cable=p.signalFlow.processes.find(x=>x.id===id);
    assert.equal(cable?.caption,caption,`W-002 ${id} caption changed`);
    cable.caption='한 가닥 · 최대 100m';
  }
  assert.equal(p.signalFlow.notes[0],note,'W-002 flow note changed');
  p.signalFlow.notes.shift();
  return p;
}
export function beforeW20261016_002Raw(raw,name) {
  if(name!==slug) return raw;
  return JSON.stringify(beforeW20261016_002Product(JSON.parse(raw),name),null,2)+'\n';
}
export function beforeW20261016_002View(view) {
  let result=view;
  const replacements=[
    ['function figure(group,index,toggle,flow) {','function figure(group,index,toggle) {'],
    ["    const cable=flow.processes.find(p=>p.id===(index===0?'cat1':'cat2'));\n    r(a,356,43,399,54,'cable-flow-pill'); t(a,555,67,cable.caption,'cable-flow-pill-main'); t(a,555,87,'한 가닥 · USB 3.0 · 최대 100m','cable-flow-pill-sub');",
     "    r(a,428,43,255,54,'cable-flow-pill'); t(a,555,67,'CAT6A U/FTP · 한 가닥','cable-flow-pill-main'); t(a,555,87,'USB 3.0 · 최대 100m','cable-flow-pill-sub');"],
    ['const pic=figure(group,index,toggle,flow);','const pic=figure(group,index,toggle);']
  ];
  for(const [current,prior] of replacements){assert.ok(result.includes(current),`W-002 renderer changed: ${current.slice(0,35)}`);result=result.replace(current,prior);}
  return result;
}
