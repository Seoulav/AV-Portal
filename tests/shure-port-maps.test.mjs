import {beforeHarmanW03014,beforeHarmanW03014Raw,harmanW03014Slug} from './harman-w03014-history.mjs';
import {beforeBssW04004,beforeBssW04004Raw,bssW04004Slugs} from './bss-w04004-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareEnhancements, portMapImageMatches} from '../prototype/brc-am7/detail-enhancements.mjs';
import { beforeAmxW03008, amxW03008Slug } from './amx-w03008-history.mjs';
import { beforeCrownW03009, crownW03009Slug } from './crown-w03009-history.mjs';
import { beforeJblW03010, jblW03010Slug } from './jbl-w03010-history.mjs';
import { beforeBssW03011, bssW03011Slug } from './bss-w03011-history.mjs';
import { beforeCrownW03013 } from './crown-w03013-history.mjs';
import {beforeShureW04003,beforeShureW04003Raw,shureW04003Slug} from './shure-w04003-history.mjs';

const bytes = path => readFileSync(new URL('../' + path, import.meta.url));
const read = path => {
  const product=JSON.parse(bytes(path));
  return path.startsWith('beta/site/detail/data/')?beforeBssW04004(product,path.split('/').at(-1).slice(0,-5)):product;
};
const sha = value => createHash('sha256').update(value).digest('hex');
// Git stores text with LF; compare repository bytes across Windows/Linux checkouts.
const textSha = value => sha(value.toString('utf8').replaceAll('\r\n', '\n'));
const proof = read('Work/기록/W-20261002-001-shure-port-map-evidence.json');
const remaining = read('Work/기록/W-20261002-002-port-map-evidence.json');
const samsung = read('Work/기록/W-20261002-005-samsung-sources-evidence.json');
const target = ['mxcw640', 'mxcwapt-w', 'qlxd4', 'slxd4-plus', 'slxd4d-plus', 'ua864a', 'ulxd4', 'ulxd4q', 'ulxd4d'];
const approved = ['qlxd4', 'slxd4-plus', 'ua864a', 'ulxd4', 'ulxd4q', 'ulxd4d'];

// Missing maps, unsupported keys, or wrong measured dimensions must not silently become fallback.
test('six evidence-qualified Shure models render maps tied to PDF pages and measured Rear images', () => {
  assert.deepEqual(Object.keys(proof.products), approved);
  for (const [slug, e] of Object.entries(proof.products)) {
    const product = read(`beta/site/detail/data/${slug}.json`);
    const map = prepareEnhancements(product).portMap;
    assert.ok(map, `${slug}: required map must survive renderer validation`);
    assert.equal(sha(bytes('beta/site/' + e.pdf)), e.pdfSha256, slug + ' PDF');
    assert.deepEqual(map.items, e.markers.map(({pages, ...item}) => item));
    assert.deepEqual(map.items.map(item => item.n), map.items.map((_, index) => index + 1));
    const image = product.images.find(image => image.role === 'Rear');
    assert.equal(image.file, e.image.file);
    assert.equal(sha(bytes('beta/site/detail/images/' + image.file)), e.image.sha256);
    assert.deepEqual(map.measuredImage, {file: image.file, width: e.image.width, height: e.image.height});
    assert.ok(portMapImageMatches(image, e.image.width, e.image.height, map), slug + ' image match');
    for (const item of e.markers) {
      assert.ok(item.pages.length && item.pages.every(page => Number.isInteger(page) && page > 0 && page <= e.pageCount));
      assert.ok(item.x1 >= 0 && item.x2 > item.x1 && item.x2 <= e.image.width);
      assert.ok(Number.isFinite(item.y) && item.y >= 0 && item.y <= e.image.height);
    }
    delete product.portMap;
    const prior=beforeShureW04003(product,slug);
    assert.equal(sha(JSON.stringify(prior)), e.coreSha256, slug + ' original values');
  }
  assert.equal(proof.products.ulxd4d.markers.length, 11);
  assert.equal(proof.products.ua864a.markers.filter(item => item.label.startsWith('RF 출력')).length, 1);
  assert.equal(proof.products.ulxd4q.markers.filter(item => item.label.startsWith('오디오 출력')).length, 4);
});

test('Shure models that lack sufficient evidence keep photo fallback and all 235 protected JSON files remain unchanged', () => {
  assert.deepEqual(proof.excluded, ['slxd1-plus', 'ulxd1', 'mxa925w-r', 'ua844-swb', 'ua845uwb', 'mxcw640', 'mxcwapt-w', 'slxd4d-plus']);
  for (const slug of proof.excluded) {
    const product = read(`beta/site/detail/data/${slug}.json`);
    assert.equal(product.portMap, undefined, slug);
    assert.equal(prepareEnhancements(product).portMap, null, slug + ' fallback');
  }
  assert.equal(target.filter(slug => read(`beta/site/detail/data/${slug}.json`).portMap).length, 6);
  assert.equal(Object.keys(proof.preservedProducts).length, 235);
  for (const [file, hash] of Object.entries(proof.preservedProducts)) {
    const later = remaining.products[file.slice(0,-5)];
    const samsungLater = samsung.products[file.slice(0,-5)];
    if (samsungLater) {
      // W-20261002-005 audit verifies the revised Samsung rows independently.
      assert.equal(samsungLater.previousFileSha256,hash,file+' prior approved Git bytes');
    } else if (later) {
      assert.equal(later.previousFileSha256,hash,file+' prior approved Git bytes');
      const product = beforeHarmanW03014(read('beta/site/detail/data/' + file),file.slice(0,-5));
      delete product.portMap;
      assert.equal(sha(JSON.stringify(product)),later.coreSha256,file+' original values after later map');
    } else if (crownW03009Slug(file.slice(0,-5))) {
      const previous = beforeCrownW03009(beforeCrownW03013(beforeHarmanW03014(read('beta/site/detail/data/' + file),file.slice(0,-5)),file.slice(0,-5)),file.slice(0,-5));
      assert.equal(textSha(Buffer.from(JSON.stringify(previous,null,2)+'\n')),hash,file+' pre-W-009 Git bytes');
    } else if (jblW03010Slug(file.slice(0,-5))) {
      const previous = beforeJblW03010(beforeHarmanW03014(read('beta/site/detail/data/' + file),file.slice(0,-5)),file.slice(0,-5));
      assert.equal(textSha(Buffer.from(JSON.stringify(previous,null,2)+'\n')),hash,file+' pre-W-010 Git bytes');
    } else if (bssW03011Slug(file.slice(0,-5))) {
      const previous = beforeBssW03011(beforeHarmanW03014(read('beta/site/detail/data/' + file),file.slice(0,-5)),file.slice(0,-5));
      assert.equal(textSha(Buffer.from(JSON.stringify(previous,null,2)+'\n')),hash,file+' pre-W-011 Git bytes');
    } else if (amxW03008Slug(file.slice(0,-5))) {
      const previous = beforeAmxW03008(beforeHarmanW03014(read('beta/site/detail/data/' + file),file.slice(0,-5)),file.slice(0,-5));
      assert.equal(textSha(Buffer.from(JSON.stringify(previous,null,2)+'\n')),hash,file+' pre-W-008 Git bytes');
    } else if (harmanW03014Slug(file.slice(0,-5))) {
      const prior=beforeHarmanW03014Raw(bytes('beta/site/detail/data/'+file).toString('utf8').replace(/\r\n/g,'\n'),file.slice(0,-5));
      assert.equal(textSha(Buffer.from(prior)),hash,file+' pre-W-014 Git bytes');
    } else if(shureW04003Slug(file.slice(0,-5))) {
      const prior=beforeShureW04003Raw(bytes('beta/site/detail/data/'+file).toString('utf8').replace(/\r\n/g,'\n'),file.slice(0,-5));
      assert.equal(textSha(Buffer.from(prior)),hash,file+' pre-W-003 Git bytes');
    } else if(bssW04004Slugs.has(file.slice(0,-5))) {
      assert.equal(textSha(Buffer.from(beforeBssW04004Raw(bytes('beta/site/detail/data/'+file).toString('utf8'),file.slice(0,-5)))),hash,file+' pre-W-004 Git bytes');
    } else assert.equal(textSha(bytes('beta/site/detail/data/' + file)), hash, file + ' protected Git bytes');
  }
});

test('Shure mapping preserves published source images, PDFs and catalog bytes', () => {
  for (const [path, hash] of Object.entries(proof.assets)) {
    // Historical evidence includes the W-20261002-011 discontinued product.
    // W-20261003-002 adds approved uploads to the manifest. Its dedicated test
    // locks the original mirrors and five uploads while checking the new PDFs.
    if (path === 'detail/images/lh98qecedgcxkr-main.webp' || path === 'catalog.json' || path === 'docs/manifest.json') continue;
    const hashFile = /\.(json|svg)$/.test(path) ? textSha : sha;
    assert.equal(hashFile(bytes('beta/site/' + path)), hash, path);
  }
});
