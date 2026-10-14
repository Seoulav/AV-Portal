import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareEnhancements } from '../beta/site/detail/detail-enhancements.mjs';
import { beforeW13007WmfProduct } from './w13007-wmf-history.mjs';

const models = [
  ['lh55wmfwbgcxkr', 13, 760],
  ['lh75wmfwlgcxkr', 14, 800],
];
const labels = ['HDMI 출력', 'RJ45(LAN)', 'SERVICE', 'HDMI 입력', '오디오 출력', 'USB(후면)', 'TOUCH'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('two WMFX models use their own applicable Korean-manual rear diagrams', () => {
  const imageHashes=[];
  for(const [slug,page,height] of models){
    const product=JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`,import.meta.url)));
    const file=`${slug}-diagram.webp`;
    const diagram=product.images.find(image=>image.role==='Diagram');
    assert.equal(diagram?.file,file);
    assert.match(diagram.note,new RegExp(`BN81-28453F-02 ${page}쪽`));
    assert.equal(product.imageStatuses.find(image=>image.role==='Diagram').status,'VERIFIED');
    assert.deepEqual(product.portMap.measuredImage,{file,width:760,height});
    assert.equal(product.portMap.image,'Diagram');
    assert.deepEqual(product.portMap.items.map(item=>item.label),labels);
    assert.deepEqual(product.portMap.items.map(item=>item.n),[1,2,3,4,5,6,7]);
    assert.ok(product.portMap.items.every(item=>item.side==='left' && item.y2>item.y1));
    assert.ok(!product.portMap.items.some(item=>/USB-C|RS-232|전원/.test(item.label)));
    assert.ok(prepareEnhancements(product).portMap);
    imageHashes.push(sha(readFileSync(new URL(`../beta/site/detail/images/${file}`,import.meta.url))));
  }
  assert.equal(new Set(imageHashes).size,2,'the distinct model drawings must have distinct pixels');
});

test('WMFX history inverse restores only map/image fields',()=>{
  const slug=models[0][0];
  const current=JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`,import.meta.url)));
  const restored=beforeW13007WmfProduct(current,slug);
  assert.equal(restored.portMap,undefined);
  assert.equal(restored.images.length,1);
  const bad=structuredClone(current);bad.portMap.items[0].y1++;
  assert.throws(()=>beforeW13007WmfProduct(bad,slug),/unexpected W-007 WMF portMap change/);
  const other=structuredClone(current);other.io[0].quantity='99';
  assert.equal(beforeW13007WmfProduct(other,slug).io[0].quantity,'99');
});
