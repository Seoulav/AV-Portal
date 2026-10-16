// W-015 group6b: compare this historical task with the approved later layout rewound.
import {readBeforeGroup6bFileSync as readFileSync} from './group6b-w16015-history.mjs';
import {beforeW16015Group5Raw, beforeW16015Group5Product} from './w16015-group5-history.mjs';
import {beforeJblW15010Raw,beforeJblW15010Product} from './jbl-w15010-history.mjs';
import { beforeW20261016_015B4Product, beforeW20261016_015B4Raw } from './w20261016-015-b4-history.mjs';
import { beforeW15004ImageSha } from './w15004-shure-photo-history.mjs';
import { beforeW15012ImageSha } from './w15012-black-background-history.mjs';
import { beforeW013Product, beforeW013Raw } from './w013-history.mjs';
import { beforeW12005Product, beforeW12005Raw } from './w12005-history.mjs';
import { beforeUltritouchFollowupImageSha } from './w12005-ultritouch-history.mjs';
import { beforeKiprogo2Mx395ImageSha } from './w12005-kiprogo2-mx395-history.mjs';
import { beforeMxc420PhotoImageSha } from './mxc420-photo-history.mjs';
import { beforeW13001ImageSha } from './w13001-powersoft-history.mjs';
import { verifyAverW12009ReplacedImage } from './aver-w12009-history.mjs';
import { beforeW032Product, beforeW032Raw } from './w032-history.mjs';
import {beforeHarmanW03014,beforeHarmanW03014Raw,harmanW03014Slug} from './harman-w03014-history.mjs';
import {beforeBssW04004,beforeBssW04004Raw,bssW04004Slugs} from './bss-w04004-history.mjs';
import {beforeBssAlignment} from './bss-alignment-history.mjs';
import {beforeW026Product as priorbeforeW026Product,beforeW026Raw as priorbeforeW026Raw} from './w026-history.mjs';
import { beforeW12001Raw, beforeW12001Product } from './w12001-history.mjs';
import { beforeW12001IdentityRaw, beforeW12001IdentityProduct } from './w12001-identity-history.mjs';
const beforeW026RawWithoutGroup5 = (value, slug) => priorbeforeW026Raw(beforeW12001Raw(beforeW12001IdentityRaw(beforeW12005Raw(beforeW013Raw(beforeJblW15010Raw(value, slug), slug), slug), slug), slug), slug);
const beforeW026Raw = (value, slug) => beforeW026RawWithoutGroup5(beforeW16015Group5Raw(value, slug), slug);
const beforeW026ProductWithoutGroup5 = (value, slug) => priorbeforeW026Product(beforeW12001Product(beforeW12001IdentityProduct(beforeW12005Product(beforeW013Product(beforeJblW15010Product(value, slug), slug), slug), slug), slug), slug);
const beforeW026Product = (value, slug) => beforeW026ProductWithoutGroup5(beforeW16015Group5Product(value, slug), slug);

import test from 'node:test';
import assert from 'node:assert/strict';

import {createHash} from 'node:crypto';
import {prepareEnhancements, portMapImageMatches} from '../prototype/brc-am7/detail-enhancements.mjs';
import { beforeAmxW03008, amxW03008Slug } from './amx-w03008-history.mjs';
import { beforeCrownW03009, crownW03009Slug } from './crown-w03009-history.mjs';
import { beforeJblW03010, jblW03010Slug } from './jbl-w03010-history.mjs';
import { beforeBssW03011, bssW03011Slug } from './bss-w03011-history.mjs';
import { beforeCrownW03013 } from './crown-w03013-history.mjs';
import {beforeShureW04003Raw,shureW04003Slug} from './shure-w04003-history.mjs';

const bytes = path => readFileSync(new URL('../' + path, import.meta.url));
const read = path => {
  const original=JSON.parse(bytes(path));
  const product=beforeW20261016_015B4Product(original,path.split('/').at(-1).slice(0,-5));
  return path.startsWith('beta/site/detail/data/')?beforeBssW04004(beforeBssAlignment(beforeW026Product(product,path.split('/').at(-1).slice(0,-5)),path.split('/').at(-1).slice(0,-5)),path.split('/').at(-1).slice(0,-5)):product;
};
const sha = value => createHash('sha256').update(value).digest('hex');
const textSha = value => sha(value.toString('utf8').replaceAll('\r\n', '\n'));
const proof = read('Work/기록/W-20261002-002-port-map-evidence.json');
const samsung = read('Work/기록/W-20261002-005-samsung-sources-evidence.json');
const target = ['dm7','rio1608-d3','rio3224-d3','tio1608-d2','gs728tppv3','gsm4212p','vs10','vs5','ultripower','ultritouch-2-hr','ki-pro-go2','blu-50v2','rally-mic-pod-hub','novastar-h2','srg-x40uh'];
const excluded = ['rio1608-d3','rally-mic-pod-hub'];
const approved = target.filter(slug => !excluded.includes(slug));

test('G1–G5-qualified maps render with exact PDF pages, model images and original technical values', () => {
  assert.deepEqual(Object.keys(proof.products), approved);
  for (const [slug, e] of Object.entries(proof.products)) {
    const product = beforeHarmanW03014(read(`beta/site/detail/data/${slug}.json`),slug);
    const map = prepareEnhancements(product).portMap;
    assert.ok(map, `${slug}: map must survive renderer validation`);
    assert.equal(sha(bytes('beta/site/' + e.pdf)), e.pdfSha256, slug + ' PDF');
    assert.deepEqual(map.items, e.markers.map(({pages, ...item}) => item));
    assert.deepEqual(map.items.map(item => item.n), map.items.map((_, index) => index + 1));
    const image = product.images.find(image => image.role === 'Rear');
    assert.equal(image.file, e.image.file);
    assert.equal(beforeUltritouchFollowupImageSha(beforeW15012ImageSha(sha(bytes('beta/site/detail/images/' + image.file)), image.file), image.file), e.image.sha256);
    assert.deepEqual(map.measuredImage, {file:image.file,width:e.image.width,height:e.image.height});
    assert.ok(portMapImageMatches(image,e.image.width,e.image.height,map));
    for (const item of e.markers) {
      assert.ok(item.pages.length && item.pages.every(page => Number.isInteger(page) && page > 0 && page <= e.pageCount));
      assert.ok(item.x1 >= 0 && item.x2 > item.x1 && item.x2 <= e.image.width);
      assert.ok(Number.isFinite(item.y) && item.y >= 0 && item.y <= e.image.height);
    }
    delete product.portMap;
    assert.equal(sha(JSON.stringify(beforeW032Product(product, slug))),e.coreSha256,slug+' original values');
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
  const priorRead = path => beforeW032Product(read(path), path.split('/').at(-1).slice(0, -5));
  const priorRaw = path => beforeW032Raw(beforeW026Raw(beforeW20261016_015B4Raw(bytes(path).toString('utf8').replaceAll('\r\n', '\n'), path.split('/').at(-1).slice(0, -5)), path.split('/').at(-1).slice(0, -5)), path.split('/').at(-1).slice(0, -5));
  for(const [file,hash] of Object.entries(proof.preservedProducts)){
    // W-20261002-005 updates only Samsung provenance; its new audit locks the current rows.
    const later = samsung.products[file.slice(0,-5)];
    if (later) assert.equal(later.previousFileSha256,hash,file+' prior approved Git bytes');
    else if (crownW03009Slug(file.slice(0,-5))) {
      const previous = beforeCrownW03009(beforeCrownW03013(beforeHarmanW03014(priorRead('beta/site/detail/data/'+file),file.slice(0,-5)),file.slice(0,-5)),file.slice(0,-5));
      assert.equal(textSha(Buffer.from(JSON.stringify(previous,null,2)+'\n')),hash,file+' pre-W-009 Git bytes');
    } else if (jblW03010Slug(file.slice(0,-5))) {
      const previous = beforeJblW03010(beforeHarmanW03014(priorRead('beta/site/detail/data/'+file),file.slice(0,-5)),file.slice(0,-5));
      assert.equal(textSha(Buffer.from(JSON.stringify(previous,null,2)+'\n')),hash,file+' pre-W-010 Git bytes');
    } else if (bssW03011Slug(file.slice(0,-5))) {
      const previous = beforeBssW03011(beforeHarmanW03014(priorRead('beta/site/detail/data/'+file),file.slice(0,-5)),file.slice(0,-5));
      assert.equal(textSha(Buffer.from(JSON.stringify(previous,null,2)+'\n')),hash,file+' pre-W-011 Git bytes');
    } else if (amxW03008Slug(file.slice(0,-5))) {
      const previous = beforeAmxW03008(beforeHarmanW03014(priorRead('beta/site/detail/data/'+file),file.slice(0,-5)),file.slice(0,-5));
      assert.equal(textSha(Buffer.from(JSON.stringify(previous,null,2)+'\n')),hash,file+' pre-W-008 Git bytes');
    } else if (harmanW03014Slug(file.slice(0,-5))) {
      const prior=beforeHarmanW03014Raw(priorRaw('beta/site/detail/data/'+file),file.slice(0,-5));
      assert.equal(textSha(Buffer.from(prior)),hash,file+' pre-W-014 Git bytes');
    } else if(shureW04003Slug(file.slice(0,-5))) {
      const prior=beforeShureW04003Raw(priorRaw('beta/site/detail/data/'+file),file.slice(0,-5));
      assert.equal(textSha(Buffer.from(prior)),hash,file+' pre-W-003 Git bytes');
    } else if(bssW04004Slugs.has(file.slice(0,-5))) {
      assert.equal(textSha(Buffer.from(beforeBssW04004Raw(priorRaw('beta/site/detail/data/'+file),file.slice(0,-5)))),hash,file+' pre-W-004 Git bytes');
    } else assert.equal(textSha(Buffer.from(priorRaw('beta/site/detail/data/'+file))),hash,file+' protected Git bytes');
  }
});

test('surviving published images and PDFs retain their baseline SHA-256', () => {
  const updatedImages=JSON.parse(bytes('Work/기록/W-20261006-004-image-hashes.json'));
  assert.equal(Object.keys(proof.assets).length,489);
  for(const [path,hash] of Object.entries(proof.assets)){
    if(path.startsWith('detail/images/') && verifyAverW12009ReplacedImage(path.split('/').at(-1), hash)) continue;
    // Historical evidence includes the W-20261002-011 discontinued product.
    // W-20261003-002 extends the manifest; its test preserves prior entries.
    // W-026 explicitly recrops GSM4248PX's existing Rear asset; the new
    // product-specific test locks its current bytes and dimensions.
    if(path==='detail/images/lh98qecedgcxkr-main.webp'||path==='detail/images/gsm4248px-rear.webp'||path==='catalog.json'||path==='docs/manifest.json') continue;
    if(path.startsWith('detail/images/')&&updatedImages[path.split('/').at(-1)]) {
      assert.equal(hash,updatedImages[path.split('/').at(-1)].priorSha256,path+' prior image bytes');
      assert.equal(sha(bytes('beta/site/'+path)),updatedImages[path.split('/').at(-1)].approvedSha256,path+' approved replacement');
      continue;
    }
    const hashFile=/\.(json|svg)$/.test(path)?textSha:sha;
    const currentHash = hashFile(bytes('beta/site/'+path));
    assert.equal(beforeW13001ImageSha(beforeUltritouchFollowupImageSha(beforeKiprogo2Mx395ImageSha(beforeMxc420PhotoImageSha(beforeW15004ImageSha(beforeW15012ImageSha(currentHash, path.split('/').at(-1)), path.split('/').at(-1)), path.split('/').at(-1)), path.split('/').at(-1)), path.split('/').at(-1)), path.split('/').at(-1)),hash,path);
  }
});
