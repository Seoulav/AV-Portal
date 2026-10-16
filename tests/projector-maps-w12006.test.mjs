import {beforeW16015Product} from './w16015-group1-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW12006Raw, beforeW12006Product, w12006Slugs } from './w12006-history.mjs';

const fixture=JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-006-prior-fields.json',import.meta.url),'utf8'));
const raw=slug=>readFileSync(new URL(`../beta/site/detail/data/${slug}.json`,import.meta.url),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');

test('22 projector maps use a present source image, unique positive numbers and measured coordinates',()=>{
 assert.equal(w12006Slugs.size,22);
 for(const slug of w12006Slugs){
  const p=JSON.parse(raw(slug)),m=p.portMap;
  assert.ok(m?.items?.length>0,`${slug}: missing map`);
  assert.equal(new Set(m.items.map(i=>i.n)).size,m.items.length,`${slug}: repeated number`);
  assert.deepEqual(m.items.map(i=>i.n),m.items.map((_,i)=>i+1),`${slug}: sequence`);
  assert.ok(p.images.some(i=>i.role===m.image&&i.file===m.measuredImage.file),`${slug}: image mismatch`);
  const bytes=readFileSync(new URL(`../beta/site/detail/images/${m.measuredImage.file}`,import.meta.url));
  assert.ok(bytes.length>0,`${slug}: missing image bytes`);
  for(const item of m.items){
   if(item.side==='left'||item.side==='right'){
    assert.ok(item.y1>=0&&item.y1<item.y2&&item.y2<=m.measuredImage.height,`${slug}: vertical bounds`);
   }else{
    assert.ok(item.x1>=0&&item.x1<item.x2&&item.x2<=m.measuredImage.width,`${slug}: horizontal bounds`);
    assert.ok(item.y===undefined || item.y>=0&&item.y<=m.measuredImage.height,`${slug}: y bounds`);
   }
  }
 }
});

test('all seven Panasonic maps and I/O cite their applicable Korean operating instructions',()=>{
 const mz=JSON.parse(raw('pt-mz17k'));
 assert.equal(mz.io.filter(i=>i.verification==='VERIFIED').length,10);
 assert.equal(mz.io.filter(i=>i.verification==='MISSING').length,1);
 for(const slug of [...w12006Slugs].filter(s=>s.startsWith('pt-'))){
  const p=JSON.parse(raw(slug));
  const page=slug.startsWith('pt-vmz')?25:slug==='pt-mz882'?27:28;
  const source=p.sources.find(s=>s.code===(slug==='pt-mz17k'?'M':'M1'));
  assert.match(source.name,/한국어 사용설명서/);
  assert.match(source.scope,new RegExp(`${page}쪽 연결 단자`));
  assert.ok(p.io.filter(row=>row.verification!=='MISSING').every(row=>row.condition.includes(`${page}쪽 연결 단자`)),`${slug}: I/O evidence`);
  assert.ok(p.portMap.items.every(item=>item.desc.includes(`한국어 사용설명서 ${page}쪽`)),`${slug}: map evidence`);
 }
});

test('selective historical inverse restores only approved fields and exposes unrelated corruption',()=>{
 for(const slug of w12006Slugs){
  const restored=beforeW12006Raw(raw(slug),slug);
  assert.equal(sha(restored),fixture[slug].baselineSha256,`${slug}: original bytes`);
 }
 const p=beforeW16015Product(JSON.parse(raw('eb-l690u')),'eb-l690u');
 p.portMap.items[0].x1+=2;
 assert.throws(()=>beforeW12006Product(p,'eb-l690u',true),/unexpected W-006 portMap/);
 const q=JSON.parse(raw('eb-l690u'));
 q.model='INVALID';
 assert.equal(beforeW12006Product(q,'eb-l690u').model,'INVALID');
 assert.notEqual(sha(JSON.stringify(beforeW12006Product(q,'eb-l690u'),null,2)+'\n'),fixture['eb-l690u'].baselineSha256);
 const m=JSON.parse(raw('pt-mz17k'));
 m.io[0].quantity='99';
 assert.throws(()=>beforeW12006Product(m,'pt-mz17k'),/unexpected W-006 io/);
});
