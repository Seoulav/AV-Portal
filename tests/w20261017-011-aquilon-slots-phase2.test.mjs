import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {enhancementErrors} from '../beta/site/detail/detail-enhancements.mjs';
import {portMapGeometry} from '../beta/site/detail/detail-enhancement-view.mjs';
import {portMapSegments} from './portmap-segment-audit.mjs';
import {beforeW20261017_011Stage2Product} from './w20261017-011-stage2-history.mjs';

const fixture=JSON.parse(readFileSync(new URL('./fixtures/w20261017-011-stage2-prior-maps.json',import.meta.url),'utf8'));
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const read=slug=>JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`,import.meta.url),'utf8'));
// Each letter is the card visibly installed at that left-to-right, top-to-bottom slot.
const plans={
  'aquilon-rsalpha':['H','H','O','B','B','B','B','B'],
  'aquilon-rs1':['H','H','O','D','S','O','B','B'],
  'aquilon-rs3':['H','H','O','H','S','O','D','D','O','B','B'],
  'aquilon-rs4':['H','H','O','H','S','O','D','D','O','O','B'],
  'aquilon-rs5':['H','H','O','H','H','O','D','D','O','S','S','O','B','B'],
  'aquilon-rs6':['H','H','O','H','H','O','D','D','O','S','S','O','O','B'],
  'aquilon-cmini':['H','S','P','O','L'],
  'aquilon-c':['H','H','O','D','S','O','O','B'],
  'aquilon-cmax':['H','H','O','H','H','O','D','D','O','S','S','O','O','O']
};
const cardText={H:'HDMI 입력 카드',D:'DisplayPort 입력 카드',S:'SDI 입력 카드',O:'HDMI 출력 카드',P:'DisplayPort 출력 카드',L:'LINK 카드'};
const controls=['USB','SYNC','AC 전원','LOCK','LAN','ON/OFF','멀티뷰어','Dante'];

test('the nine remaining Rear maps identify slots in spatial order and distinguish installed examples from covered slots',()=>{
  for(const [slug,cards] of Object.entries(plans)){
    const p=read(slug),map=p.portMap,items=map.items;
    assert.deepEqual(enhancementErrors(p),[],slug);
    assert.equal(items.length,cards.length+controls.length,slug);
    assert.deepEqual(items.map(item=>item.n),Array.from({length:items.length},(_,i)=>i+1),slug);
    assert.match(items[0].desc,/사진은 카드 장착 예시이며 실제 구성은 주문에 따라 다릅니다/);
    for(const [index,card] of cards.entries()){
      const item=items[index];
      assert.ok(item.label.startsWith(`슬롯 ${index+1} ·`),`${slug} slot ${index+1}`);
      assert.ok(item.desc.includes(`슬롯 ${index+1} —`),`${slug} slot ${index+1} description`);
      if(card==='B')assert.match(item.desc,/빈 슬롯\(덮개\)/,`${slug} slot ${index+1}`);
      else assert.ok(item.desc.includes(cardText[card]),`${slug} slot ${index+1} card`);
    }
    for(const [index,prefix] of controls.entries())
      assert.ok(items[cards.length+index].label.toLowerCase().startsWith(prefix.toLowerCase()) ||
        (prefix==='멀티뷰어' && items[cards.length+index].label.startsWith('MULTIVIEW')),
        `${slug} fixed ${prefix}`);
    assert.equal(map.image,'Rear',slug);
    const {portMap,...facts}=p;
    assert.equal(sha(facts),fixture[slug].otherSha256,`${slug} photo/spec/io unchanged`);
    assert.deepEqual(beforeW20261017_011Stage2Product(p,slug).portMap,fixture[slug].portMap,slug);
  }
});

test('the nine maps keep every number outside the photo with short, separated leaders',()=>{
  for(const slug of Object.keys(plans)){
    const map=read(slug).portMap;
    const geo=portMapGeometry(map,map.measuredImage.width,map.measuredImage.height);
    const photo={left:geo.image.x,right:geo.image.x+geo.image.width,top:geo.photoTop,bottom:geo.photoBottom};
    for(const mark of geo.markers){
      assert.ok(mark.cx+10<=photo.left||mark.cx-10>=photo.right||mark.cy+10<=photo.top||mark.cy-10>=photo.bottom,
        `${slug} #${mark.item.n}: number inside photo`);
      const item=mark.item;
      if(item.x1!==undefined)assert.ok(item.x2-item.x1<=map.measuredImage.width/4,`${slug} #${item.n}: wide bracket`);
    }
    for(let i=0;i<geo.markers.length;i++)for(let j=i+1;j<geo.markers.length;j++){
      const a=geo.markers[i],b=geo.markers[j];
      assert.ok(Math.hypot(a.cx-b.cx,a.cy-b.cy)>=20-1e-6,`${slug} #${a.item.n}/#${b.item.n}: circles overlap`);
    }
    const segments=portMapSegments(map);
    assert.deepEqual(segments.tooLong,[],`${slug}: horizontal photo leader exceeds one quarter`);
    assert.deepEqual(segments.close,[],`${slug}: leaders less than 6px apart`);
  }
});

test('selective phase 2 rewind rejects unapproved changes',()=>{
  for(const slug of Object.keys(plans)){
    const mutated=read(slug);
    mutated.portMap.items[0].desc+=' altered';
    assert.throws(()=>beforeW20261017_011Stage2Product(mutated,slug),/unexpected W-20261017-011 phase 2 map change/);
  }
});
