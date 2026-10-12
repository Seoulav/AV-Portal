import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareEnhancements } from '../beta/site/detail/detail-enhancements.mjs';
import { beforeAverW12009Product } from './aver-w12009-history.mjs';

const detail = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const cameraPorts = ['LAN/PoE+', 'RS-232', 'RS-422', 'USB 3.0 출력', '오디오 입력', 'HDMI 출력', '3G-SDI 출력', 'DC 12V 입력'];
const fileSha = file => createHash('sha256').update(readFileSync(new URL(`../beta/site/detail/images/${file}`, import.meta.url))).digest('hex');

test('TR315 and TR335 use clean model-linked Front/Rear photos and map all eight documented sockets', () => {
  for (const slug of ['tr315', 'tr335']) {
    const product = detail(slug);
    assert.deepEqual(product.images.map(image => image.role), ['Front', 'Rear']);
    assert.deepEqual(product.images.map(image => image.file), [`${slug}-front.webp`, `${slug}-rear.webp`]);
    assert.ok(product.images.every(image => image.originalSize === '551x351' && image.sourceUrl.includes(`/Model/${slug}/`)));
    assert.ok(product.images.every(image => image.note.includes('TR315/TR335 공용')));
    assert.ok(product.images.every(image => !/NDI|주석/.test(image.alt)));
    assert.equal(product.io.length,6);
    assert.deepEqual(product.portMap.items.map(item => item.label), cameraPorts);
    assert.deepEqual(product.portMap.items.map(item => item.n), Array.from({length:8},(_,index)=>index+1));
    assert.equal(prepareEnhancements(product).portMap.items.length, 8);
    assert.ok(product.io.some(row => row.signal === 'Audio input' && row.source === 'D'));
    assert.ok(product.io.some(row => row.signal === 'DC power in' && row.source === 'D'));
  }
});

test('replacement pixels are exact and each model has its own same-content files', () => {
  assert.equal(existsSync(new URL('../beta/site/detail/images/tr315-perspective.webp', import.meta.url)), false);
  assert.equal(fileSha('tr315-front.webp'), 'e74911a067469d48c6f8b2700330eb67e2e3bc6d1ca7fe511a3bbfb0950762b3');
  assert.equal(fileSha('tr335-front.webp'), fileSha('tr315-front.webp'));
  assert.equal(fileSha('tr315-rear.webp'), '215043bb1f1c7dcfe01932cb39e1112af8febf7cf96f4c4bbaab73912857e49f');
  assert.equal(fileSha('tr335-rear.webp'), fileSha('tr315-rear.webp'));
});

test('historical inverse keeps all unrelated current fields visible', () => {
  const product = detail('tr335');
  const changedModel = structuredClone(product);
  changedModel.model = 'INVALID';
  assert.equal(beforeAverW12009Product(changedModel, 'tr335').model, 'INVALID');
  const changedMap = structuredClone(product);
  changedMap.portMap.items[0].x1 = 1;
  assert.throws(() => beforeAverW12009Product(changedMap, 'tr335'), /unexpected W-009 portMap/);
});

test('CL01 keeps its official Rear photo and maps its five existing I/O rows', () => {
  const product=detail('cl01');
  assert.deepEqual(product.portMap.items.map(item=>item.label), ['펌웨어 업데이트', 'RS-422 제어', 'RS-232 제어', 'LAN 제어', 'DC 12V 입력']);
  assert.equal(product.portMap.items.length,5);
  assert.equal(prepareEnhancements(product).portMap.items.length,5);
});
