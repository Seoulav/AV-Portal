import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {beforeW13007Product} from './w13007-videowall-history.mjs';

const slugs = ['lh55vhcrbgbxkr', 'lh55vmcrbgbxkr'];
const labels = [
  'IR 출력', 'IR 입력', 'DVI 입력', 'HDMI 입력 1', 'HDMI 입력 2',
  'DP 입력', '오디오 출력', '오디오 입력', 'RS-232C 출력',
  'RS-232C 입력', 'DP 출력(LOOPOUT)', 'SERVICE', 'RJ45(LAN)',
];
const history = JSON.parse(readFileSync(new URL('./fixtures/w13007-videowall-history.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('VHC-R and VMC-R show their applicable Korean-manual rear diagram', () => {
  for (const slug of slugs) {
    const product = JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
    assert.equal(hash(Object.fromEntries(Object.entries(product).filter(([field]) => !['images','imageStatuses','portMap'].includes(field)))), history[slug].coreSha256, `${slug}: pre-existing product fields`);
    const diagram = product.images.find(image => image.role === 'Diagram');
    assert.ok(diagram, `${slug}: diagram`);
    assert.equal(diagram.file, `${slug}-diagram.webp`);
    assert.match(diagram.note, /BN81-25348H-02 14쪽/);
    assert.equal(product.imageStatuses.find(image => image.role === 'Diagram').status, 'VERIFIED');
    const bytes = readFileSync(new URL(`../beta/site/detail/images/${diagram.file}`, import.meta.url));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(product.portMap.image, 'Diagram');
    assert.deepEqual(product.portMap.measuredImage, { file: diagram.file, width: 480, height: 2280 });
    assert.deepEqual(product.portMap.items.map(item => item.label), labels);
    assert.deepEqual(product.portMap.items.map(item => item.n), labels.map((_, index) => index + 1));
    for (const item of product.portMap.items) {
      assert.equal(item.side, 'left');
      assert.ok(item.y1 >= 0 && item.y2 > item.y1 && item.y2 <= 2280);
    }
    assert.equal(product.portMap.items.some(item => /Power Out|전원 출력/.test(item.label)), false);
  }
});

test('historical inverse exposes unrelated current mutations and rejects unapproved maps', () => {
  const slug = slugs[0];
  const product = JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
  const changedIo = structuredClone(product);
  changedIo.io[0].quantity = 'INVALID';
  const restored = beforeW13007Product(changedIo, slug);
  assert.equal(restored.io[0].quantity, 'INVALID');
  assert.equal(restored.portMap, undefined);
  const changedMap = structuredClone(product);
  changedMap.portMap.items[0].y1++;
  assert.throws(() => beforeW13007Product(changedMap, slug), /unexpected W-007 portMap change/);
});
