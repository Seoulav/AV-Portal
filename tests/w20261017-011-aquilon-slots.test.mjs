import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {enhancementErrors} from '../beta/site/detail/detail-enhancements.mjs';
import {portMapGeometry} from '../beta/site/detail/detail-enhancement-view.mjs';
import {portMapSegments} from './portmap-segment-audit.mjs';
import {beforeW20261017_011Stage1Product} from './w20261017-011-stage1-history.mjs';

const fixture=JSON.parse(readFileSync(new URL('./fixtures/w20261017-011-stage1-prior-maps.json',import.meta.url),'utf8'));
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const read=s=>JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${s}.json`,import.meta.url),'utf8'));
const plans={
  'aquilon-rs2':{
    slots:['HDMI 입력','HDMI 입력','HDMI 출력','DisplayPort 입력','SDI 입력','HDMI 출력','HDMI 출력','빈 슬롯'],
    controls:['USB','SYNC','AC 전원','LOCK','LAN','ON/OFF','멀티뷰어','Dante'],
    sideNumbers:{left:[1,4,11],right:[3,6,7,8]}
  },
  'aquilon-cplus':{
    slots:['HDMI 입력','HDMI 입력','HDMI 출력','HDMI 입력','SDI 입력','HDMI 출력','DisplayPort 입력','DisplayPort 입력','HDMI 출력','HDMI 출력','빈 슬롯'],
    controls:['USB','SYNC','AC 전원','LOCK','LAN','ON/OFF','MULTIVIEWERS','Dante'],
    sideNumbers:{left:[1,4,7,14],right:[3,6,9,10,11]}
  }
};

test('RS2 and C+ alone use spatial slot numbers with photo-card examples and a covered option slot',()=>{
  for(const [slug,plan] of Object.entries(plans)){
    const product=read(slug),map=product.portMap,items=map.items;
    assert.deepEqual(enhancementErrors(product),[],slug);
    const slotCount=plan.slots.length;
    assert.deepEqual(items.slice(0,slotCount).map(item=>item.n),Array.from({length:slotCount},(_,i)=>i+1),slug);
    for(const [index,item] of items.slice(0,slotCount).entries()){
      assert.equal(item.label,`슬롯 ${index+1} · ${plan.slots[index].includes('빈')?'빈 슬롯':plan.slots[index].includes('출력')?'출력':'입력'}`);
      assert.match(item.desc,new RegExp(`슬롯 ${index+1} — `));
      assert.ok(item.desc.includes(plan.slots[index]),`${slug} slot ${index+1} photo card`);
    }
    assert.match(items[0].desc,/사진은 카드 장착 예시이며 실제 구성은 주문에 따라 다릅니다/);
    assert.match(items[slotCount-1].desc,/빈 슬롯\(덮개\)/);
    assert.deepEqual([...new Set(items.slice(slotCount).map(item=>item.n))],
      Array.from({length:plan.controls.length},(_,i)=>slotCount+i+1));
    for(const [index,name] of plan.controls.entries()){
      assert.ok(items.some(item=>item.n===slotCount+index+1&&item.label.startsWith(name)),`${slug}: ${name}`);
    }
    for(const [side,numbers] of Object.entries(plan.sideNumbers)){
      const marks=items.filter(item=>item.side===side);
      assert.deepEqual(marks.map(item=>item.n),numbers,`${slug} ${side} top-to-bottom order`);
      assert.ok(marks.every((item,index)=>index===0||item.y1>marks[index-1].y2),`${slug} ${side} brackets separated`);
    }
    const geo=portMapGeometry(map,map.measuredImage.width,map.measuredImage.height);
    const photo={left:geo.image.x,right:geo.image.x+geo.image.width,top:geo.photoTop,bottom:geo.photoBottom};
    for(const marker of geo.markers){
      assert.ok(marker.cx+10<=photo.left||marker.cx-10>=photo.right||marker.cy+10<=photo.top||marker.cy-10>=photo.bottom,
        `${slug} #${marker.item.n}: circle overlays photo`);
      const item=marker.item;
      if(item.x1!==undefined)assert.ok(item.x2-item.x1<=map.measuredImage.width/4,`${slug} #${item.n}: wide bracket`);
    }
    const segments=portMapSegments(map);
    assert.deepEqual(segments.tooLong,[],`${slug}: an in-photo horizontal leader exceeds a quarter of the photo`);
    assert.deepEqual(segments.close,[],`${slug}: an in-photo leader runs within 6px of another marker`);
    const {portMap,...other}=product;
    assert.equal(sha(other),fixture[slug].otherSha256,`${slug}: photo and non-map facts unchanged`);
    assert.deepEqual(beforeW20261017_011Stage1Product(product,slug).portMap,fixture[slug].portMap);
  }
});

test('selective rewind rejects unexpected edits to the new slot map',()=>{
  for(const slug of Object.keys(plans)){
    const changed=read(slug);
    changed.portMap.items[0].desc+=' altered';
    assert.throws(()=>beforeW20261017_011Stage1Product(changed,slug),/unexpected W-20261017-011 map change/);
  }
});
