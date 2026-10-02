import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareEnhancements, portMapImageMatches} from '../prototype/brc-am7/detail-enhancements.mjs';

const bytes = path => readFileSync(new URL('../' + path, import.meta.url));
const read = path => JSON.parse(bytes(path));
const sha = value => createHash('sha256').update(value).digest('hex');
const textSha = value => sha(value.toString('utf8').replaceAll('\r\n', '\n'));
const proof = read('Work/기록/W-20261002-002-port-map-evidence.json');
const target = ['dm7','rio1608-d3','rio3224-d3','tio1608-d2','gs728tppv3','gsm4212p','vs10','vs5','ultripower','ultritouch-2-hr','ki-pro-go2','blu-50v2','rally-mic-pod-hub','novastar-h2','srg-x40uh'];
const excluded = ['rio1608-d3','rally-mic-pod-hub'];
const approved = target.filter(slug => !excluded.includes(slug));

test('G1–G5-qualified maps render with exact PDF pages, model images and original technical values', () => {
  assert.deepEqual(Object.keys(proof.products), approved);
  for (const [slug, e] of Object.entries(proof.products)) {
    const product = read(`beta/site/detail/data/${slug}.json`);
    const map = prepareEnhancements(product).portMap;
    assert.ok(map, `${slug}: map must survive renderer validation`);
    assert.equal(sha(bytes('beta/site/' + e.pdf)), e.pdfSha256, slug + ' PDF');
    assert.deepEqual(map.items, e.markers.map(({pages, ...item}) => item));
    assert.deepEqual(map.items.map(item => item.n), map.items.map((_, index) => index + 1));
    const image = product.images.find(image => image.role === 'Rear');
    assert.equal(image.file, e.image.file);
    assert.equal(sha(bytes('beta/site/detail/images/' + image.file)), e.image.sha256);
    assert.deepEqual(map.measuredImage, {file:image.file,width:e.image.width,height:e.image.height});
    assert.ok(portMapImageMatches(image,e.image.width,e.image.height,map));
    for (const item of e.markers) {
      assert.ok(item.pages.length && item.pages.every(page => Number.isInteger(page) && page > 0 && page <= e.pageCount));
      assert.ok(item.x1 >= 0 && item.x2 > item.x1 && item.x2 <= e.image.width);
      assert.ok(Number.isFinite(item.y) && item.y >= 0 && item.y <= e.image.height);
    }
    delete product.portMap;
    assert.equal(sha(JSON.stringify(product)),e.coreSha256,slug+' original values');
    assert.ok(/^[a-f0-9]{64}$/.test(e.previousFileSha256),slug+' pre-change Git bytes');
  }
  assert.equal(proof.products['rio3224-d3'].modelPages[0],5);
  assert.equal(proof.products['novastar-h2'].panelPages[0],7);
  assert.equal(proof.products['novastar-h2'].markers.some(m => /카드 슬롯/.test(m.label)),false);
  assert.equal(proof.products.vs10.markers.some(m => m.label==='Ethernet'),false);
  assert.ok(proof.products.vs10.markers.findIndex(m => m.label==='오디오 입력 2') < proof.products.vs10.markers.findIndex(m => m.label==='AUX 출력 1'));
});

test('DM7 groups repeated XLRs by the three separate rear-panel blocks', () => {
  const product = read('beta/site/detail/data/dm7.json');
  const items = product.portMap.items;
  assert.equal(items.length, 18);
  assert.deepEqual(items.slice(0, 2).map(({label, desc, x1, x2}) => ({label, desc, x1, x2})), [
    {label:'아날로그 입력 1–16', desc:'밸런스 XLR 16개 · 1–16번 마이크 또는 라인 레벨 소스를 연결합니다.', x1:1219, x2:1566},
    {label:'아날로그 입력 17–32', desc:'밸런스 XLR 16개 · 17–32번 마이크 또는 라인 레벨 소스를 연결합니다.', x1:814, x2:1161}
  ]);
  assert.equal(items[5].label, '워드 클록 입력');
  assert.deepEqual(items[6].label, 'OMNI OUT 1–16');
  assert.deepEqual([items[6].x1, items[6].x2], [421,768]);
  assert.equal(items[6].desc, '밸런스 XLR 16개 · 아날로그 오디오를 출력합니다.');
  assert.equal(new Set(items.map(item => item.desc)).size, 18);
  assert.deepEqual(items.map(item => item.n), Array.from({length:18}, (_, index) => index + 1));
});

test('Rio1608 and Rally retain fallback and the other 227 product JSON Git blobs remain unchanged', () => {
  assert.deepEqual(proof.excluded,excluded);
  for (const slug of excluded){const product=read(`beta/site/detail/data/${slug}.json`);assert.equal(product.portMap,undefined);assert.equal(prepareEnhancements(product).portMap,null);}
  assert.equal(target.filter(slug => read(`beta/site/detail/data/${slug}.json`).portMap).length,13);
  assert.equal(Object.keys(proof.preservedProducts).length,227);
  for(const [file,hash] of Object.entries(proof.preservedProducts))assert.equal(textSha(bytes('beta/site/detail/data/'+file)),hash,file+' protected Git bytes');
});

test('all 489 published images, PDFs and catalog files retain their baseline SHA-256', () => {
  assert.equal(Object.keys(proof.assets).length,489);
  for(const [path,hash] of Object.entries(proof.assets)){
    const hashFile=/\.(json|svg)$/.test(path)?textSha:sha;
    assert.equal(hashFile(bytes('beta/site/'+path)),hash,path);
  }
});
