import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeVideowallProse} from './videowall-w03001-history.mjs';
import {beforeHotelTvIo} from './hoteltv-w03004-history.mjs';
import {beforeSamsung115ManualSpecs} from './samsung-w03003-history.mjs';

const root=new URL('../',import.meta.url);
const read=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const evidence=read('Work/기록/W-20261002-015-evidence.json');
const groups={
  qhc:['lh43qhcebgcxkr','lh43qmcebgcxkr','lh75qhcebgcxkr','lh85qmcebgcxkr','lh98qmcebgcxkr'],
  qhf:['lh115qhfebgxkr'],
  wall:['lh55vhcrbgbxkr','lh55vmcrbgbxkr'],
};
const load=slug=>read(`beta/site/detail/data/${slug}.json`);
const row=(p,name)=>{
  const found=p.io.filter(item=>item.connector===name);
  assert.equal(found.length,1,`${p.model}: ${name} count`);
  return found[0];
};
const manualCode=item=>String(item.source).split(',').map(x=>x.trim()).includes('M1');

test('only eight exact-model Samsung products change, and specifications remain byte-equivalent',()=>{
  assert.equal(Object.keys(evidence.products).length,8);
  for(const [slug,before] of Object.entries(evidence.products)){
    const p=beforeVideowallProse(beforeSamsung115ManualSpecs(load(slug),slug),slug);
    const {io,sources,...other}=p;
    assert.equal(sha(JSON.stringify(other)),before.coreSha256,`${slug}: outside io/sources`);
    assert.deepEqual(p.io.filter(x=>x.connector==='오디오 입력'&&x.availability.includes('미지원')).map(x=>x.quantity),
      before.previousIo.filter(x=>x.connector==='오디오 입력'&&x.availability.includes('미지원')).map(x=>x.quantity));
  }
  for(const [slug,expected] of Object.entries(evidence.excludedFileSha256)){
    const current=load(slug);
    const prior=beforeHotelTvIo(current,slug);
    const bytes=slug.startsWith('hg') ? Buffer.from(JSON.stringify(prior,null,2)+'\n') : readFileSync(new URL(`beta/site/detail/data/${slug}.json`,root));
    assert.equal(sha(bytes),expected,`${slug}: excluded JSON bytes`);
  }
});

test('all eight exact-model manuals are cited and every supported row is verified',()=>{
  for(const [kind,slugs] of Object.entries(groups))for(const slug of slugs){
    const p=load(slug);
    const m=p.sources.find(x=>x.code==='M1');
    assert.ok(m,`${slug}: manual source`);
    const id=kind==='qhc'?'BN81-24537G-14':kind==='qhf'?'BN81-26720E-04':'BN81-25348H-02';
    assert.match(m.name,new RegExp(id));
    assert.match(m.scope,new RegExp(`${evidence.manuals[id].page}쪽`));
    assert.match(m.scope,new RegExp(evidence.manuals[id].sha256.slice(0,12),'i'));
    assert.equal(p.io.length,kind==='wall'?13:kind==='qhf'?10:9,`${slug}: grouped connector rows`);
    for(const entry of p.io){
      if(entry.connector==='무선(물리 단자 없음)')continue;
      assert.equal(entry.verification,'VERIFIED',`${slug}: ${entry.connector}`);
      assert.ok(manualCode(entry),`${slug}: ${entry.connector} manual citation`);
    }
  }
});

test('QHC/QMC and 115QHF group the physical jacks by manual quantities and keep absent audio input blank',()=>{
  for(const slug of [...groups.qhc,...groups.qhf]){
    const p=load(slug);
    for(const [name,qty] of Object.entries({HDMI:'3',DisplayPort:'1','IR 입력':'1','오디오 출력':'1','RS-232C 입력':'1','RS-232C 출력':'1','RJ45(LAN)':'1'})){
      assert.equal(row(p,name).quantity,qty,`${slug}: ${name} quantity`);
    }
    assert.match(row(p,'HDMI').availability,/HDMI (?:IN )?3.*ARC/);
    assert.match(row(p,'USB').availability,/USB 2.*1\.0 A.*USB 1.*0\.5 A/);
    assert.match(row(p,'RJ45(LAN)').availability,/10\/100 Mbps.*CAT 7\(STP\)/);
    assert.equal(row(p,'오디오 입력').quantity,'');
    assert.equal(row(p,'오디오 입력').availability,'미지원(사양표 "No")');
  }
  assert.equal(load(groups.qhf[0]).io.filter(x=>x.verification==='REVIEW REQUIRED').length,0);
});

test('videowall HDMI is input-only, DP alone loops out, SERVICE is not user USB, and IR OUT is present',()=>{
  for(const slug of groups.wall){
    const p=load(slug);
    const hdmi=row(p,'HDMI');
    assert.equal(hdmi.direction,'IN');assert.equal(hdmi.signal,'비디오 입력');assert.equal(hdmi.quantity,'2');
    assert.doesNotMatch(JSON.stringify(hdmi),/데이지 ?체인|루프아웃|LOOPOUT/);
    const dpIn=row(p,'DisplayPort');assert.equal(dpIn.direction,'IN');assert.equal(dpIn.quantity,'1');
    const dpOut=row(p,'DisplayPort 출력(LOOPOUT)');
    assert.equal(dpOut.direction,'OUT');assert.equal(dpOut.quantity,'1');
    assert.match(dpOut.availability,/같은 모델.*UHD\/FHD/);
    const service=row(p,'SERVICE(서비스 전용)');
    assert.equal(service.group,'Control');assert.equal(service.quantity,'1');
    assert.match(service.availability,/서비스 전용.*사용자 USB 저장장치 연결 단자가 아님/);
    assert.equal(p.io.some(x=>x.connector==='USB'),false);
    const irOut=row(p,'IR 출력');assert.equal(irOut.direction,'OUT');assert.equal(irOut.quantity,'1');
    assert.equal(irOut.signal,'IR 루프아웃');
    assert.match(row(p,'IR 입력').signal,/조도 센서/);
    assert.equal(row(p,'전원 출력(Power Out)').quantity,'');
    assert.equal(row(p,'전원 출력(Power Out)').availability,'미지원(사양표 "No")');
    assert.match(row(p,'RJ45(LAN)').availability,/10\/100 Mbps/);
  }
});
