import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareEnhancements as prototypePrepare} from '../prototype/brc-am7/detail-enhancements.mjs';
import {prepareEnhancements as publicPrepare} from '../beta/site/detail/detail-enhancements.mjs';
import {portMapGeometry} from '../prototype/brc-am7/detail-enhancement-view.mjs';

const root = new URL('../', import.meta.url);
const product = JSON.parse(readFileSync(new URL('beta/site/detail/data/lh115qhfebgxkr.json', root), 'utf8'));
const evidence = JSON.parse(readFileSync(new URL('Work/기록/W-20261004-010-evidence.json', root), 'utf8'));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const synthetic = {
  images: [{role: 'Rear', file: 'rear.webp', originalSize: '1920x1280', resolution: '400x900'}]
};
const marker = {n: 1, label: 'USB 2', desc: 'USB 장치를 연결합니다.', y1: 50, y2: 70, side: 'right'};
const map = items => ({image: 'Rear', measuredImage: {file: 'rear.webp', width: 400, height: 900}, items});

test('left/right markers accept vertical ranges and reject mixed or out-of-bounds fields', () => {
  for (const prepare of [prototypePrepare, publicPrepare]) {
    for (const side of ['left', 'right']) {
      assert.ok(prepare({...synthetic, portMap: map([{...marker, side}])}).portMap, `${side} valid`);
    }
    for (const item of [
      {...marker, x1: 1, x2: 2}, {...marker, y: 60}, {...marker, x: -1},
      {...marker, y1: -1}, {...marker, y2: 901}, {...marker, y2: 50},
      {...marker, side: 'top'}, {...marker, extra: true}
    ]) assert.equal(prepare({...synthetic, portMap: map([item])}).portMap, null, `reject ${JSON.stringify(item)}`);
    const horizontal = {n: 1, label: 'HDMI', desc: '입력', x1: 380, x2: 401, side: 'top'};
    assert.equal(prepare({...synthetic, portMap: map([horizontal])}).portMap, null, 'x2 beyond image rejected');
    assert.ok(prepare({...synthetic, portMap: {...map([marker]), crop: {top: 20, bottom: 30}}}).portMap);
    assert.equal(prepare({...synthetic, portMap: {...map([{...marker, y1: 10}]), crop: {top: 20, bottom: 30}}}).portMap, null);
    assert.equal(prepare({...synthetic, portMap: {...map([marker]), image: 'Diagram'}}).portMap, null);
    assert.equal(prepare({...synthetic, portMap: {...map([marker]), extra: true}}).portMap, null);
  }
});

test('all 51 approved horizontal maps remain valid with their original fields', () => {
  const dir = new URL('beta/site/detail/data/', root);
  let count = 0, cropped = 0;
  for (const file of readdirSync(dir).filter(name => name.endsWith('.json') && name !== 'lh115qhfebgxkr.json')) {
    const p = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
    if (!p.portMap) continue;
    count++;
    if (p.portMap.crop) cropped++;
    assert.ok(prototypePrepare(p).portMap, `${file} prototype`);
    assert.ok(publicPrepare(p).portMap, `${file} public`);
    assert.ok(p.portMap.items.every(item => ['top', 'bottom'].includes(item.side)));
  }
  assert.equal(count, 51);
  assert.equal(cropped, 25);
});

test('QH115FX maps eleven visible physical ports on its own Rear photograph', () => {
  const rear = product.images.find(image => image.role === 'Rear');
  assert.ok(rear);
  assert.equal(rear.file, 'lh115qhfebgxkr-rear.webp');
  assert.equal(rear.sourceUrl, 'https://images.samsung.com/kdp/goods/2025/08/28/aefa2e63-89b2-4624-8204-55ae70b97b95.png');
  assert.equal(rear.originalSize, '1920x1280');
  const selected = publicPrepare(product).portMap;
  assert.ok(selected, 'map is not silently discarded');
  assert.equal(selected.image, 'Rear');
  assert.equal(selected.items.length, 11);
  assert.deepEqual(selected.items.map(item => item.n), Array.from({length: 11}, (_, index) => index + 1));
  assert.ok(selected.items.every(item => ['left', 'right'].includes(item.side)));
  assert.deepEqual(prototypePrepare(product).portMap, selected);
  assert.equal(publicPrepare(product).signalFlow, null);
  const geometry = portMapGeometry(selected, 270, 850);
  assert.ok(geometry.markers.every(item => item.cx + 10 < geometry.image.x), 'number circles stay outside the photograph');
  assert.ok(geometry.markers.every(item => item.y1 < item.y2 && item.cy >= item.y1 && item.cy <= item.y2));
  assert.deepEqual(evidence.markers.map(item => item.n), selected.items.map(item => item.n));
  assert.deepEqual([...new Set(evidence.markers.map(item => item.ioIndex))].sort((a, b) => a - b), [1, 2, 3, 4, 6, 7, 8, 9]);
  assert.equal(sha256(readFileSync(new URL(evidence.publishedImage.file, root))), evidence.publishedImage.sha256);
  assert.equal(sha256(readFileSync(new URL(evidence.manual.file, root))), evidence.manual.sha256);
  const core = structuredClone(product);
  delete core.images; delete core.imageStatuses; delete core.portMap;
  assert.equal(sha256(JSON.stringify(core)), evidence.coreSha256);
});
