import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareEnhancements} from '../beta/site/detail/detail-enhancements.mjs';
import {beforeW026Product} from './w026-history.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const products = {
  gs108pp: {role:'Front', count:2, io:[0,0], imageSha:'8d0c656e0cd461fd3b08f46bfb5e1f66d78d9514f3398fd0e9668b0f1e48b433', core:'8bb0e474abba3f7dfd6faf4a6e70e33fe03ad7f1b9d89c9f3c591a6e40072c89'},
  gs116pp: {role:'Front', count:1, io:[0], imageSha:'b5266e4bb98c6ec78b070a9f90e016fd358b4248135b098b417e2075fb130f4b', core:'a05b5f9899de2613cd67cc3f5c3761684174654744e39b18d483d0bfb8a9c850'},
  gs728tppv3: {role:'Front', count:3, io:[0,1,2], core:'f051dbf761b3f5ee06b55e8a6c016d39f5b20caa8bd30db96b65b868e5a48b50'},
  gsm4212p: {role:'Rear', count:7, io:[3,4,5,0,1,2,8], core:'5ab994122b17b8fbc8dcbcfec3ca733600901b54be4f3527bba78ddd2b024715'},
  gsm4230p: {role:'Rear', count:5, io:[3,3,0,1,2], imageSha:'af12e2b32a12f219f52fa8814dc15a52746276a5922e30f60810771e5ee52f0d', core:'937e29085b13877534561045f7dea14a59f8eb943a6520b7c9c1c0f7063aea64'},
  gsm4230px: {role:'Rear', count:5, io:[3,3,0,1,2], imageSha:'8fcb450fb2a9f441832befc094846e0d9e7f1d2d2cc182871d16f56b92777052', core:'c42c05420f296df87fc848094d20d753bfd3d4efa3efe78191bab25e0a126c58'},
  gsm4248p: {role:'Rear', count:4, io:[2,2,0,1], imageSha:'39b4f30e5d726fb6f97ce5bc08af8a34d2f469dc98cccbabbae3b29e05f92abc', core:'6d864ad14b9432dfc44a129fb331dc942f8870203f50bd796aeaebe47ceccfe5'},
  gsm4248px: {role:'Rear', count:2, io:[0,1], imageSha:'a5a7055346058cae3ad372184a75dfbb0af96e0b63f1cd2bc164832a1af9b9af', core:'41ffb559626ed1c9403e011fa8443f29e30d677f955de45c5660b386de9b1e5f'},
  xsm4216f: {role:'Rear', count:3, io:[1,1,0], imageSha:'e8cfc49727e59c3ca86288bdb3898137d0a3bfb75468de1d66adc7e88dd0c345', core:'34cea10a128a0f679d49c62722cfa53fd14970325926ec38adbf912b94f4fbbe'},
};
// In the same order as products[slug].io, these labels document the intended
// I/O row for each physical bracket. A single I/O console row may have two.
const markerLabels = {
  gs108pp: ['RJ-45 1–4 · PoE+', 'RJ-45 5–8 · PoE+'],
  gs116pp: ['RJ-45 1–16 · PoE+'],
  gs728tppv3: ['USB 저장장치', 'PoE+ RJ-45 1–24', 'SFP 25–28'],
  gsm4212p: ['OOB RJ-45', 'RJ-45 콘솔', 'USB-C 콘솔', 'PoE+ RJ-45 1–8', 'RJ-45 9–10', 'SFP 11–12', 'IEC C14 전원'],
  gsm4230p: ['RJ-45 콘솔', 'USB-C 콘솔', 'PoE+ RJ-45 ×24', 'RJ-45 ×2', 'SFP ×4'],
  gsm4230px: ['RJ-45 콘솔', 'USB-C 콘솔', 'PoE+ RJ-45 ×24', 'RJ-45 ×2', 'SFP+ ×4'],
  gsm4248p: ['RJ-45 콘솔', 'USB-C 콘솔', 'PoE+ RJ-45 ×40', 'SFP ×8'],
  gsm4248px: ['PoE+ RJ45 ×40', 'SFP+ ×8'],
  xsm4216f: ['RJ-45 콘솔', 'USB-C 콘솔', 'SFP+ ×16'],
};
const read = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`,import.meta.url)));

test('nine NETGEAR maps group only visible connectors from their pictured face',()=>{
  for(const [slug,expected] of Object.entries(products)) {
    const product=read(slug);
    const map=prepareEnhancements(product).portMap;
    assert.ok(map,slug);
    assert.equal(map.image,expected.role,slug);
    assert.equal(map.items.length,expected.count,slug);
    assert.deepEqual(map.items.map(item=>item.n),Array.from({length:expected.count},(_,i)=>i+1),slug);
    assert.deepEqual(map.items.map(item=>item.label),markerLabels[slug],slug+' marker/I/O correspondence');
    assert.ok(map.items.every(item=>Object.keys(item).every(k=>['n','label','desc','x1','x2','y','side'].includes(k))),slug);
    const image=product.images.find(image=>image.role===map.image);
    assert.ok(image && image.role!=='Main',slug);
    const [width,height]=image.resolution.split(/[x×]/).map(Number);
    assert.deepEqual(map.measuredImage,{file:image.file,width,height},slug);
    assert.ok(map.items.every(item=>item.x1>=0 && item.x1<item.x2 && item.x2<=width && item.y>=0 && item.y<=height),slug);
    const imageBytes=readFileSync(new URL(`../beta/site/detail/images/${image.file}`,import.meta.url));
    assert.ok(imageBytes.length>0,slug);
    if(expected.imageSha) assert.equal(sha(imageBytes),expected.imageSha,slug+' published photograph bytes');
    assert.equal(sha(JSON.stringify({io:product.io,specifications:product.specifications,keyFacts:product.keyFacts})),expected.core,slug+' unchanged I/O/specifications/keyFacts');
    assert.equal(expected.io.length,expected.count,slug+' evidence index count');
    assert.ok(expected.io.every(index=>product.io[index]),slug+' every marker has an I/O evidence row');
  }
  assert.ok(!read('gs728tppv3').portMap.items.some(item=>/고객 사용 불가|AC 전원/.test(item.label)));
  assert.ok(!read('gsm4212p').portMap.items.some(item=>/LED EXT|USB Storage/.test(item.label)));
  assert.ok(!read('gsm4248px').portMap.items.some(item=>/콘솔/.test(item.label)));
});

test('historical inverse exposes unapproved changes to current I/O',()=>{
  const current=read('gsm4212p');
  const changed=structuredClone(current);
  changed.io[0].connector='INVALID';
  const oldCurrent=beforeW026Product(current,'gsm4212p');
  const oldChanged=beforeW026Product(changed,'gsm4212p');
  assert.notEqual(sha(JSON.stringify(oldCurrent)),sha(JSON.stringify(oldChanged)));
  assert.equal(oldChanged.io[0].connector,'INVALID');
  const moved=structuredClone(current);
  moved.portMap.items[0].x1+=1;
  assert.throws(()=>beforeW026Product(moved,'gsm4212p'),/unexpected W-026 portMap change/);
});
