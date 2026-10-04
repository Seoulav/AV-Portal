import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeBssW04004,beforeBssW04004Raw} from './bss-w04004-history.mjs';
import {beforeBssAlignment,beforeBssAlignmentRaw} from './bss-alignment-history.mjs';
import {beforeShureW04003,beforeShureW04003Raw} from './shure-w04003-history.mjs';
import {prepareEnhancements} from '../prototype/brc-am7/detail-enhancements.mjs';
import {beforeSamsungW04010,beforeSamsungW04010Raw} from './samsung-w04010-history.mjs';

const root=new URL('../',import.meta.url);
const read=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const dir=new URL('beta/site/detail/data/',root);
const sha=value=>createHash('sha256').update(value).digest('hex');
const evidence=read('Work/기록/W-20261003-014-evidence.json');
const targets=Object.keys(evidence.products).sort();
const brands=new Map([['JBL',16],['BSS Audio',9],['AMX',7]]);

test('32 JBL, BSS and AMX cards use exact verified product rows',()=>{
  assert.equal(targets.length,32);
  for(const [brand,count] of brands){
    assert.equal(targets.filter(slug=>evidence.products[slug].brand===brand).length,count);
  }
  for(const slug of targets){
    const product=beforeBssW04004(beforeBssAlignment(read(`beta/site/detail/data/${slug}.json`),slug),slug);
    const proof=evidence.products[slug];
    assert.equal(product.manufacturer,proof.brand,slug);
    assert.equal(product.overview,proof.overview,slug);
    assert.equal(product.series??null,proof.series,slug);
    assert.ok(product.lead && product.subtitle,`${slug}: lead/subtitle`);
    assert.equal((product.lead.match(/\*\*/g)||[]).length,2,`${slug}: one bold span`);
    assert.equal((product.lead.match(/[^.!?]+[.!?]/g)||[]).length,2,`${slug}: two sentences`);
    assert.ok(product.keyFacts?.length>=2&&product.keyFacts.length<=4,`${slug}: two to four facts`);
    assert.equal(prepareEnhancements(product).keyFacts.length,product.keyFacts.length,`${slug}: visible facts`);
    assert.equal(product.keyFacts.length,proof.facts.length,slug);
    for(const [position,fact] of product.keyFacts.entries()){
      const anchor=proof.facts[position];
      assert.deepEqual(Object.keys(fact).sort(),['label','unit','value'],slug);
      assert.deepEqual(fact,{label:anchor.label,value:anchor.value,unit:anchor.unit},slug);
      const row=anchor.kind==='io'?product.io[anchor.index]:product.specifications[anchor.index];
      assert.ok(['VERIFIED','FOUND'].includes(row.verification),`${slug}: verified anchor`);
      assert.equal(row[anchor.kind==='io'?'signal':'name'],anchor.rowName,slug);
      assert.equal(row.group,anchor.rowGroup,slug);
      assert.equal(row.condition||'',anchor.rowCondition,slug);
      if(anchor.kind==='io'){
        assert.equal(String(row.quantity),fact.value,`${slug}: exact port count`);
        assert.equal(fact.unit,'포트',slug);
      }else{
        assert.equal(row.value,fact.value,`${slug}: exact source value`);
        assert.equal(row.unit||'',fact.unit,`${slug}: exact source unit`);
      }
    }
    const core=structuredClone(product);
    delete core.lead;delete core.subtitle;delete core.keyFacts;
    assert.equal(sha(JSON.stringify(core)),proof.coreSha256,`${slug}: only presentation fields change`);
  }
});

test('Crown 26 and all other 210 product JSON files remain unchanged',()=>{
  const names=readdirSync(dir).filter(name=>name.endsWith('.json') && name !== 'lh43behhlbfxkr.json').sort();
  const otherNames=names.filter(name=>!targets.includes(name.slice(0,-5)));
  assert.equal(otherNames.length,210);
  const other=otherNames.map(name=>[name,beforeShureW04003(beforeBssW04004(beforeSamsungW04010(beforeBssAlignment(read(`beta/site/detail/data/${name}`),name.slice(0,-5)),name.slice(0,-5)),name.slice(0,-5)),name.slice(0,-5))]);
  assert.equal(sha(JSON.stringify(other)),evidence.otherDetailJsonSha256);
  const raw=otherNames.map(name=>`${name}\0${beforeShureW04003Raw(beforeBssW04004Raw(beforeSamsungW04010Raw(beforeBssAlignmentRaw(readFileSync(new URL(`beta/site/detail/data/${name}`,root),'utf8').replace(/\r\n/g,'\n'),name.slice(0,-5)),name.slice(0,-5)),name.slice(0,-5)),name.slice(0,-5))}`).join('');
  assert.equal(sha(raw),evidence.otherDetailRawSha256);
  assert.equal(other.filter(([,p])=>p.manufacturer==='Crown').length,26);
});
