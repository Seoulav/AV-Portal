// W-015 C cards: preserve product facts/photos while simplifying only portMap.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {enhancementErrors} from '../beta/site/detail/detail-enhancements.mjs';
import {beforeW20261017_011Stage1Product} from './w20261017-011-stage1-history.mjs';
const root=new URL('../beta/site/detail/',import.meta.url);
const prior=JSON.parse(fs.readFileSync(new URL('./fixtures/aquilon-c-cards-before.json',import.meta.url)));
const read=slug=>JSON.parse(fs.readFileSync(new URL('data/'+slug+'.json',root)));
const sha=x=>createHash('sha256').update(x).digest('hex');

test('C card grouping preserves every non-Port-Map fact and all eight original photos',()=>{
 for(const [slug,b]of Object.entries(prior)){
  const{portMap,...facts}=read(slug);
  assert.equal(sha(JSON.stringify(facts)),b.factsSha256,slug+' non-map data');
  for(const im of b.images)assert.equal(sha(fs.readFileSync(new URL('images/'+im.file,root))),im.sha256,im.file);
 }
});

test('C card maps reduce 14/16/19/23 circles to 12 each without losing controls or photo-installed card counts',()=>{
 const counts={
  'aquilon-cmini':{hdmi:1,sdi:1,outputs:2},
  'aquilon-c':{hdmi:2,dp:1,sdi:1,outputs:3},
  'aquilon-cplus':{hdmi:3,dp:2,sdi:1,outputs:4},
  'aquilon-cmax':{hdmi:4,dp:2,sdi:2,outputs:6}
 };
 assert.deepEqual(Object.values(prior).map(b=>b.beforeMarkerCount),[14,16,19,23]);
 for(const [slug,c]of Object.entries(counts)){
  // W-011 changes C+ to per-slot numbering; validate the original W-015 grouping after selective rewind.
  const p=beforeW20261017_011Stage1Product(read(slug),slug),items=p.portMap.items;
  assert.deepEqual(enhancementErrors(p),[],slug);
  assert.deepEqual(items.map(i=>i.n),Array.from({length:12},(_,n)=>n+1),slug);
  for(const [type,count]of [['HDMI',c.hdmi],['DP',c.dp],['SDI',c.sdi]]){
   const cards=items.filter(i=>i.label.startsWith(type+' 입력 카드'));
   assert.equal(cards.length,count?1:0,slug+' '+type);
   if(count){assert.ok(cards[0].desc.includes(`${type} 입력 카드 ${count}장`));assert.match(cards[0].desc,/사진 장착 예/);}
  }
  const output=items.filter(i=>i.label.includes('출력 카드'));
  assert.equal(output.length,1);assert.equal(output[0].side,'right');assert.equal(output[0].x,undefined);
  if(slug==='aquilon-cmini')assert.match(output[0].desc,/DP 출력 카드 1장\(위\)·HDMI 출력 카드 1장\(아래\)/);
  else assert.ok(output[0].desc.includes(`HDMI 출력 카드 ${c.outputs}장`));
  for(const prefix of ['USB','SYNC IN/OUT','LOCK INPUT','LAN','MULTIVIEWERS','AC 전원','ON/OFF','Dante']){
   const controls=items.filter(i=>i.label.startsWith(prefix));assert.equal(controls.length,1,slug+' '+prefix);assert.equal(controls[0].side,'bottom');
  }
  assert.match(items.find(i=>i.label.startsWith('SYNC')).desc,/SYNC IN 1·2 및 SYNC OUT 1·2/);
  if(slug==='aquilon-cmini')assert.match(items.find(i=>i.label.startsWith('LINK')).desc,/QSFP\+ 케이지 6개/);
 }
});
