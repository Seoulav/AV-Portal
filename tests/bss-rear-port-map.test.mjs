import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareEnhancements} from '../prototype/brc-am7/detail-enhancements.mjs';
import {portMapGeometry} from '../prototype/brc-am7/detail-enhancement-view.mjs';
import {beforeBssW04004,beforeBssW04004Raw} from './bss-w04004-history.mjs';
import {beforeBssAlignment,beforeBssAlignmentRaw} from './bss-alignment-history.mjs';

const root=new URL('../',import.meta.url);
const read=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const evidence=read('Work/기록/W-20261004-004-evidence.json');
const targets={
  'blu-100':{width:4096,height:575,sha256:'6f9e5d1bfe98f1ec5b846af1657b58d987a09c01e057b8d27617f7480a2353c3',attachment:'1329_1729004086',file:'BLU-100rear_x_large_2x.webp'},
  'blu-101':{width:4096,height:410,sha256:'dddec58e5888c11f15598cc3b12b3f6ba960c0bb40342b5918f9dc1505ebf31a',attachment:'1331_1729004096',file:'BLU-101_Rear_x_large_2x.webp'},
  'blu-160':{width:4096,height:586,sha256:'3c8afc9cedab6c55797437dc07937bcdd0ed8bdab9707c8ec79887241b9f3122',attachment:'1345_1729004062',file:'BLU-160_Rear_x_large_2x.webp'},
  'blu-dan':{width:4096,height:776,sha256:'d37b07e1e3633e1cd5d54cedf5a54fab2e1dca2c591984e80e7b186b9bd73748',attachment:'1994_1729004520',file:'BLU-DAN_Rear_x_large_2x.webp'}
};
const dims=bytes=>{
  assert.equal(bytes.subarray(0,4).toString(),'RIFF');
  assert.equal(bytes.subarray(8,12).toString(),'WEBP');
  assert.equal(bytes.subarray(12,16).toString(),'VP8X');
  return [bytes.readUIntLE(24,3)+1,bytes.readUIntLE(27,3)+1];
};

test('four model-linked BSS rear photos render valid port maps on the published pixels',()=>{
  for(const [slug,want] of Object.entries(targets)){
    const product=read(`beta/site/detail/data/${slug}.json`);
    const proof=evidence.products[slug];
    const rear=product.images.find(image=>image.role==='Rear');
    assert.ok(rear,`${slug}: Rear`);
    assert.equal(rear.file,`${slug}-rear.webp`);
    assert.equal(rear.model,product.images[0].model);
    assert.equal(rear.provider,'BSS Audio');
    assert.equal(rear.officialSource,true);
    assert.equal(rear.verificationStatus,'FOUND');
    assert.equal(rear.publicationStatus,'사용자 게시 승인 · 공식 출처 기록');
    assert.ok(rear.sourceUrl.includes(`/${want.attachment}/${want.file}`));
    assert.equal(rear.originalSize,`${want.width}x${want.height}`);
    assert.equal(rear.resolution,`${want.width}x${want.height}`);
    assert.equal(product.imageStatuses.find(image=>image.role==='Rear').status,'FOUND');
    assert.equal(product.imageStatuses.find(image=>image.role==='Rear').sourceUrl,rear.sourceUrl);
    const bytes=readFileSync(new URL(`beta/site/detail/images/${rear.file}`,root));
    assert.equal(sha(bytes),want.sha256);
    assert.deepEqual(dims(bytes),[want.width,want.height]);
    const map=prepareEnhancements(product).portMap;
    assert.ok(map,`${slug}: valid and visible map`);
    assert.deepEqual(map.measuredImage,{file:rear.file,width:want.width,height:want.height});
    assert.equal(map.image,'Rear');
    assert.ok(map.items.length>=4&&map.items.length<=12,slug);
    assert.deepEqual(map.items.map(item=>item.n),map.items.map((_,index)=>index+1));
    assert.equal(sha(JSON.stringify(beforeBssW04004(structuredClone(product),slug))),proof.coreSha256,`${slug}: all pre-existing fields intact`);
    assert.deepEqual(beforeBssAlignment(product,slug).portMap.items,proof.markers.map(({ioRows,...marker})=>marker),`${slug}: historical mapped coordinates and labels`);
    assert.deepEqual(proof.unmatchedIoRows,[],`${slug}: all I/O rows mapped`);
    const covered=new Set();
    for(const marker of proof.markers){
      assert.ok(marker.ioRows.length,`${slug}: marker ${marker.n} has I/O evidence`);
      for(const index of marker.ioRows){assert.ok(product.io[index],`${slug}: I/O ${index}`);covered.add(index);}
    }
    assert.deepEqual([...covered].sort((a,b)=>a-b),product.io.map((_,index)=>index),`${slug}: no I/O row left out`);
    const geometry=portMapGeometry(map,want.width,want.height);
    assert.ok(geometry.markers.every(marker=>marker.side==='top'?marker.cy+10<=geometry.photoTop:marker.cy-10>=geometry.photoBottom),`${slug}: numbers outside photo`);
    assert.ok(geometry.markers.every((marker,i)=>geometry.markers.slice(i+1).every(next=>Math.hypot(marker.cx-next.cx,marker.cy-next.cy)>=20)),`${slug}: number circles do not overlap`);
  }
});

test('approved BLU-50v2 stays fixed and four unsupported BSS models gain no map',()=>{
  const fixed={
    'blu-50v2':'444a0cb4ef81fc9f693c55e1391d612db3b63028e192d5bc7e5c606f76fddbc3',
    'blu-aec-in':'fe73438a7ef72285ad22ad5e477d98a1128424e71321340bed0081e218805d00',
    'blucard-in':'fea26ff22aa42840a7395ca94dd3a6408e4c6cf1655b35f01b1b149f5c2246d1',
    'blucard-out':'9b45bbb098e2737699e9985aac408c7b253c5fcc101a5c83c42d8b9d9988027d',
    'ec-4bv':'9a2f39fa5c31c62a32754b6c00070a5f2956cc4091e473617648815912915b1b'
  };
  for(const [slug,want] of Object.entries(fixed)){
    const bytes=readFileSync(new URL(`beta/site/detail/data/${slug}.json`,root));
    assert.equal(sha(slug==='blu-50v2'?beforeBssW04004Raw(beforeBssAlignmentRaw(bytes.toString('utf8').replace(/\r\n/g,'\n'),slug),slug):bytes),want,`${slug}: existing pre-flow JSON bytes`);
    if(slug==='blu-50v2')continue;
    const product=JSON.parse(bytes);
    assert.equal(product.images.some(image=>image.role==='Rear'),false,slug);
    assert.equal(Object.hasOwn(product,'portMap'),false,slug);
  }
});

test('printed BSS bank numbers and BLU-160 card-slot positions stay literal',()=>{
  for(const slug of ['blu-100','blu-101']){
    const items=read(`beta/site/detail/data/${slug}.json`).portMap.items;
    assert.deepEqual(items.slice(0,5).map(item=>item.label),[
      '아날로그 입력 A · 1–4','아날로그 입력 B · 1–4','아날로그 입력 C · 1–4',
      '아날로그 출력 D · 1–4','아날로그 출력 E · 1–4'
    ],`${slug}: each photographed bank prints its own 1–4`);
  }
  const slots=read('beta/site/detail/data/blu-160.json').portMap.items.slice(0,4);
  assert.deepEqual(slots.map(({label,y,side})=>({label:label.at(-1),y,side})),[
    {label:'A',y:250,side:'top'},
    {label:'B',y:250,side:'top'},
    {label:'C',y:410,side:'bottom'},
    {label:'D',y:410,side:'bottom'}
  ],'BLU-160 upper B and lower D match printed slot letters');
});
