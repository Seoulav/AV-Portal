import {beforeW026Raw, beforeW026Product} from './w026-history.mjs';
import { beforeW032Raw } from './w032-history.mjs';
import { isW029Name } from './w029-history.mjs';
import { isW030Name } from './w030-history.mjs';
import test from 'node:test';
import { beforeW024Raw } from './mpf-images-history.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { prepareEnhancements as publicPrepare } from '../beta/site/detail/detail-enhancements.mjs';
import { prepareEnhancements as prototypePrepare } from '../prototype/brc-am7/detail-enhancements.mjs';
import { portMapGeometry } from '../prototype/brc-am7/detail-enhancement-view.mjs';
import { beforeBssAlignment, beforeBssAlignmentRaw } from './bss-alignment-history.mjs';

const root = new URL('../', import.meta.url);
const dataDir = new URL('beta/site/detail/data/', root);
const imagesDir = new URL('beta/site/detail/images/', root);
const a = ['lh43qmcebgcxkr', 'lh85qmcebgcxkr', 'lh98qmcebgcxkr', 'lh43qhcebgcxkr', 'lh75qhcebgcxkr'];
const b = 'lh32qmcebgcxkr';
// W-20261004-020 also changes QH115FX from Rear to its own Diagram.
const selected = new Set([...a, b, 'lh115qhfebgxkr']);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const product = slug => JSON.parse(readFileSync(new URL(`${slug}.json`, dataDir), 'utf8'));
const imageFile = slug => `${slug}-diagram.webp`;

test('both validators accept a bounded Diagram map while preserving old map rules', () => {
  const diagram = { role: 'Diagram', file: 'sample-diagram.webp', resolution: '290x1420', originalSize: '290x1420' };
  const item = { n: 1, label: 'USB 2', desc: 'USB', y1: 80, y2: 160, side: 'left' };
  const candidate = { images: [diagram], portMap: { image: 'Diagram', measuredImage: { file: diagram.file, width: 290, height: 1420 }, items: [item] } };
  for (const prepare of [publicPrepare, prototypePrepare]) {
    assert.ok(prepare(candidate).portMap);
    assert.equal(prepare({ ...candidate, portMap: { ...candidate.portMap, items: [{ ...item, y2: 1421 }] } }).portMap, null);
    assert.equal(prepare({ ...candidate, portMap: { ...candidate.portMap, items: [{ ...item, x1: 10 }] } }).portMap, null);
  }
});

test('five QMC/QHC products use identical diagram pixels and coordinates; QM32C has no DP marker', () => {
  const maps = a.map(product);
  const coordinates = maps[0].portMap.items.map(({ n, y1, y2, side }) => ({ n, y1, y2, side }));
  const hashes = [];
  const files = new Set();
  for (const [index, current] of maps.entries()) {
    const slug = a[index];
    const diagram = current.images.find(image => image.role === 'Diagram');
    assert.equal(diagram.file, imageFile(slug));
    files.add(diagram.file);
    assert.equal(diagram.resolution, '290x1420');
    assert.equal(diagram.originalSize, '290x1420');
    assert.equal(diagram.verificationStatus, 'VERIFIED');
    assert.equal(current.portMap.image, 'Diagram');
    assert.equal(current.portMap.items.length, 11);
    assert.deepEqual(current.portMap.items.map(({ n, y1, y2, side }) => ({ n, y1, y2, side })), coordinates);
    assert.deepEqual(current.portMap.items.map(item => item.n), Array.from({ length: 11 }, (_, i) => i + 1));
    assert.deepEqual(current.portMap.measuredImage, { file: imageFile(slug), width: 290, height: 1420 });
    assert.ok(publicPrepare(current).portMap && prototypePrepare(current).portMap, slug);
    assert.ok(current.io.some(item => item.connector === '오디오 입력' && item.availability?.includes('미지원')));
    assert.ok(current.portMap.items.every(item => item.label !== '오디오 입력'), `${slug}: absent audio input has no marker`);
    hashes.push(sha(readFileSync(new URL(diagram.file, imagesDir))));
    const geometry = portMapGeometry(current.portMap, 290, 1420);
    assert.ok(geometry.height <= 900 && geometry.markers.every(marker => marker.y1 >= geometry.photoTop && marker.y2 <= geometry.photoBottom));
  }
  assert.equal(new Set(hashes).size, 1, 'published A diagrams have identical content');
  assert.equal(files.size, 5, 'the existing 1:1 image-file audit keeps five product-specific files');
  const q32 = product(b);
  assert.equal(q32.images.find(image => image.role === 'Diagram').file, imageFile(b));
  assert.equal(q32.portMap.items.length, 10);
  assert.deepEqual(q32.portMap.items.map(item => item.n), Array.from({ length: 10 }, (_, i) => i + 1));
  assert.ok(q32.portMap.items.every(item => !/DP|DisplayPort/i.test(item.label)));
  assert.ok(q32.portMap.items.every(item => item.label !== '오디오 입력'));
  assert.equal(q32.io.find(item => item.connector === 'DisplayPort').availability, '미지원(사양표 "No")');
  assert.ok(publicPrepare(q32).portMap && prototypePrepare(q32).portMap);
  assert.ok(portMapGeometry(q32.portMap, 290, 1480).height <= 900);
});

test('other 235 product JSON and all 51 unchanged maps keep their baseline content', () => {
  const otherHash = createHash('sha256');
  const mapHash = createHash('sha256');
  let maps = 0;
  for (const file of readdirSync(dataDir).filter(name => name.endsWith('.json') && name !== 'lh43behhlbfxkr.json' && !isW029Name(name) && !isW030Name(name)).sort()) {
    const source = beforeW024Raw(beforeBssAlignmentRaw(beforeW032Raw(beforeW026Raw(readFileSync(new URL(file, dataDir), 'utf8').replace(/\r\n/g, '\n'), file.slice(0,-5)), file.slice(0,-5)),file.slice(0,-5)),file.slice(0,-5));
    const current = JSON.parse(source);
    if (!selected.has(file.slice(0, -5))) otherHash.update(file).update('\0').update(source);
    if (current.portMap && !selected.has(file.slice(0, -5))) {
      maps++;
      mapHash.update(file).update('\0').update(JSON.stringify(beforeBssAlignment(current,file.slice(0,-5)).portMap));
      assert.ok(publicPrepare(current).portMap && prototypePrepare(current).portMap, file);
    }
  }
  assert.equal(maps, 51);
  assert.equal(otherHash.digest('hex'), 'dba2efb2d8ea8592461463830e347391f66cb576b5f7a27493247769fbda7d66');
  assert.equal(mapHash.digest('hex'), '1f2ca43ea7cd67ce86f9096fefd4086ca9eaeecfd917d1e0c61266c1232fff29');
});
