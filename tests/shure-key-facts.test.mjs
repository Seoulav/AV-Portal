import { isW029Name } from './w029-history.mjs';
import { isW030Name } from './w030-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from './w032-history-fs.mjs';
import {createHash} from 'node:crypto';
import {prepareEnhancements} from '../prototype/brc-am7/detail-enhancements.mjs';
import {beforeBssW04004Raw} from './bss-w04004-history.mjs';
import {beforeBssAlignmentRaw} from './bss-alignment-history.mjs';
import {beforeSamsungW04010Raw} from './samsung-w04010-history.mjs';

const root=new URL('../',import.meta.url);
const dir=new URL('../beta/site/detail/data/',import.meta.url);
const products=readdirSync(dir).filter(name=>name.endsWith('.json') && name !== 'lh43behhlbfxkr.json').map(name=>[name.slice(0,-5),JSON.parse(readFileSync(new URL(name,dir),'utf8'))]);
const targets=products.filter(([,product])=>product.manufacturer==='Shure'&&product.model!=='ULXD4D');
const evidence=JSON.parse(readFileSync(new URL('Work/기록/W-20261004-003-evidence.json',root),'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const previousBssRaw=name=>beforeBssW04004Raw(beforeSamsungW04010Raw(beforeBssAlignmentRaw(readFileSync(new URL(name,dir),'utf8').replace(/\r\n/g,'\n'),name.slice(0,-5)),name.slice(0,-5)),name.slice(0,-5));

test('Shure 29 authored 01 cards use only their own verified specification rows',()=>{
  assert.equal(targets.length,29);
  assert.deepEqual(Object.keys(evidence.products).sort(),targets.map(([slug])=>slug).sort());
  for(const [slug,product] of targets){
    const proof=evidence.products[slug];
    assert.ok(product.keyFacts?.length>=2&&product.keyFacts?.length<=4,slug);
    assert.equal(prepareEnhancements(product).keyFacts.length,product.keyFacts.length,`${slug}: visible`);
    assert.equal(product.keyFacts.length,proof.facts.length,slug);
    assert.equal(product.lead,proof.lead,slug);
    assert.equal(product.subtitle,proof.subtitle,slug);
    assert.equal((product.lead.match(/\*\*/g)||[]).length,2,`${slug}: one bold span`);
    assert.equal((product.lead.match(/[^.!?]+[.!?]/g)||[]).length,2,`${slug}: two sentences`);
    for(const [i,fact] of product.keyFacts.entries()){
      const anchor=proof.facts[i];
      assert.deepEqual(Object.keys(fact).sort(),['label','unit','value'],slug);
      assert.equal(fact.value.toLocaleLowerCase().includes(fact.label.split('·')[0].trim().toLocaleLowerCase()),false,`${slug}: label head duplicated in value`);
      const expectedLabel=slug==='mxa925w-r'&&anchor.label==='RJ45 · 1번만 PoE'?'커넥터 타입 · 1번만 PoE':anchor.label;
      assert.deepEqual(fact,{label:expectedLabel,value:anchor.value,unit:anchor.unit},slug);
      assert.equal(anchor.kind,'spec',slug);
      const row=product.specifications[anchor.index];
      assert.ok(['VERIFIED','FOUND'].includes(row.verification),`${slug}: verified anchor`);
      assert.equal(row.name,anchor.rowName,slug);
      assert.equal(row.group,anchor.rowGroup,slug);
      assert.equal(row.condition||'',anchor.rowCondition,slug);
      assert.equal(row.value,fact.value,`${slug}: original value`);
      assert.equal(row.unit||'',fact.unit,`${slug}: original unit`);
    }
    const core=structuredClone(product);
    delete core.lead;delete core.subtitle;delete core.keyFacts;
    assert.equal(sha(JSON.stringify(core)),proof.coreSha256,`${slug}: only three fields added`);
  }
});

test('ULXD4D pilot and the other 212 products retain original JSON bytes',()=>{
  const names=readdirSync(dir).filter(name=>name.endsWith('.json') && name !== 'lh43behhlbfxkr.json' && !isW029Name(name) && !isW030Name(name)).sort();
  const targetsSet=new Set(targets.map(([slug])=>slug));
  const otherNames=names.filter(name=>!targetsSet.has(name.slice(0,-5)));
  assert.equal(otherNames.length,213);
  const raw=otherNames.map(name=>`${name}\0${previousBssRaw(name)}`).join('');
  assert.equal(sha(raw),evidence.otherDetailRawSha256);
  const parsed=otherNames.map(name=>[name,JSON.parse(previousBssRaw(name))]);
  assert.equal(sha(JSON.stringify(parsed)),evidence.otherDetailJsonSha256);
  assert.equal(parsed.filter(([,p])=>p.manufacturer==='Shure').length,1);
  assert.equal(parsed.find(([name])=>name==='ulxd4d.json')?.[1].keyFacts.length,4);
});

test('corrected Shure classification covers all 30 products exactly once',()=>{
  const counts=new Map();
  for(const proof of Object.values(evidence.products))counts.set(proof.family,(counts.get(proof.family)||0)+1);
  assert.deepEqual(Object.fromEntries(counts),{
    '단독 · 설치 액세서리':1,'유선 마이크':4,'단독 · 천장 배열 마이크':1,'단독 · 무선 회의 단말':1,
    '단독 · 회의 액세스 포인트':1,'바디팩 송신기':3,'핸드헬드 송신기':8,'무선 수신기':5,
    '안테나 분배':2,'안테나':2,'단독 · 구즈넥 베이스 송신기':1
  });
  const pilot=products.find(([slug])=>slug==='ulxd4d')[1];
  assert.equal(pilot.productName.includes('Receiver'),true);
  assert.equal(products.find(([slug])=>slug==='ulxd8')[1].productName.includes('Transmitter'),true);
});
