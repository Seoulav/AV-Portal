import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW20261016_015B4Product } from './w20261016-015-b4-history.mjs';
const history = JSON.parse(readFileSync(new URL('./fixtures/w20261016-015-b4-portmap-history.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
const approvedLayout = map => ({crop:map.crop??null,items:map.items.map(item=>({n:item.n,side:item.side,...Object.fromEntries(['x','x1','x2','y','y1','y2','via'].filter(k=>Object.hasOwn(item,k)).map(k=>[k,item[k]]))}))});

const slugs = [
  'duecanali-1604-dsp','duecanali-1604-dspd','duecanali-804-dsp','duecanali-804-dspd',
  'mezzo-322-a','mezzo-322-ad','mezzo-324-a','mezzo-324-ad','mezzo-602-a','mezzo-602-ad','mezzo-604-a','mezzo-604-ad',
  'quattrocanali-1204-dsp','quattrocanali-1204-dspd','quattrocanali-2404-dsp','quattrocanali-2404-dspd','quattrocanali-4804-dsp','quattrocanali-4804-dspd',
  'mxcwapt-w','qlxd4','slxd1-plus','slxd4-plus','slxd4d-plus','ua844-swb','ua845uwb','ua864a','ulxd1','ulxd4','ulxd4d','ulxd4q'
];
const crops = {
  'duecanali-1604-dsp':{top:24,bottom:30},'duecanali-804-dsp':{top:24,bottom:30},
  'duecanali-1604-dspd':{top:12,bottom:10},'duecanali-804-dspd':{top:12,bottom:10},
  'mezzo-322-a':{top:25,bottom:14},'mezzo-322-ad':{top:25,bottom:14},'mezzo-324-a':{top:25,bottom:14},'mezzo-324-ad':{top:25,bottom:14},
  'mezzo-602-a':{top:25,bottom:14},'mezzo-602-ad':{top:25,bottom:14},'mezzo-604-a':{top:25,bottom:14},'mezzo-604-ad':{top:25,bottom:14},
  'quattrocanali-1204-dsp':{top:24,bottom:30},'quattrocanali-1204-dspd':{top:12,bottom:10},
  'quattrocanali-2404-dsp':{top:24,bottom:30},'quattrocanali-2404-dspd':{top:12,bottom:10},
  'quattrocanali-4804-dsp':{top:24,bottom:30},'quattrocanali-4804-dspd':{top:12,bottom:10},
  'mxcwapt-w':{top:0,bottom:200},'qlxd4':{top:245,bottom:45},'slxd4-plus':{top:950,bottom:65},'slxd4d-plus':{top:1080,bottom:120},
  'ua844-swb':{top:270,bottom:150},'ua845uwb':{top:330,bottom:150},'ua864a':{top:160,bottom:120},'ulxd4':{top:115,bottom:45},
  'ulxd4d':{top:25,bottom:25},'ulxd4q':{top:25,bottom:25}
};
const interior = {'mxcwapt-w':[1],'slxd4-plus':[5],'ua845uwb':[7],'ulxd4':[6],'ulxd4d':[3,4,9,10],'ulxd4q':[3,4,5,6,11]};
const viaExpected = {'slxd1-plus':{1:[[270,1070],[0,1070]]},'ulxd1':{1:[[220,1140],[0,1140]],2:[[640,1221],[640,1320],[753,1320]]}};
const read = slug => JSON.parse(readFileSync(`beta/site/detail/data/${slug}.json`,'utf8'));

test('W-015 bundle 4 moves Powersoft and Shure maps to edge brackets while preserving only justified middle-row y', () => {
  for (const slug of slugs) {
    const product = read(slug);
    const map = product.portMap;
    assert.equal(hash(JSON.stringify(approvedLayout(map))), history[slug].approvedLayoutSha256, `${slug}: approved layout hash`);
    const restored = beforeW20261016_015B4Product(product, slug);
    assert.equal(hash(JSON.stringify(restored, null, 2) + '\n'), history[slug].priorFileSha256, `${slug}: full prior product hash`);
    const changedLabel = structuredClone(product);
    changedLabel.portMap.items[0].label += ' unexpected';
    assert.throws(() => beforeW20261016_015B4Product(changedLabel, slug), /non-layout Port Map change/, `${slug}: reject altered connector data`);
    assert.deepEqual(map.crop ?? null, crops[slug] ?? null, `${slug}: framing crop`);
    for (const item of map.items) {
      const retainY = interior[slug]?.includes(item.n) ?? false;
      assert.equal(item.y !== undefined, retainY, `${slug} marker ${item.n}: interior y decision`);
      assert.ok(['top','bottom','left','right'].includes(item.side), `${slug} marker ${item.n}: bracket side`);
      assert.deepEqual(item.via ?? null, viaExpected[slug]?.[item.n] ?? null, `${slug} marker ${item.n}: via route`);
      if (item.y !== undefined) assert.ok(item.y >= (map.crop?.top ?? 0) && item.y <= map.measuredImage.height-(map.crop?.bottom ?? 0), `${slug} marker ${item.n}: y inside crop`);
    }
  }
});