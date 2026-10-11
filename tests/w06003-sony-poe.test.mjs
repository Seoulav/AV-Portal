import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beforeW06003Product } from './w06003-history.mjs';

const read = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const expected = [
  ['brc-am7', 'Network/PoE++', 'IEEE 802.3bt Type 4 Class 8', '적합 PoE++ 스위치 필요'],
  ['srg-a40', 'Network/PoE++', 'PoE++ (IEEE 802.3bt Type 4 Class 8)', 'IP 스트리밍·VISCA over IP·HTTP 제어'],
  ['srg-x40uh', 'Network/PoE+', 'PoE+ (IEEE802.3at)', 'LAN 속도 규격은 공식 사양에 명시 없음(정보 없음)'],
];

test('Sony camera LAN rows distinguish PoE classes and preserve prior conditions', () => {
  for (const [slug, signal, standard, priorCondition] of expected) {
    const product = read(slug);
    const rows = product.io.filter(row => row.connector === 'LAN RJ-45');
    assert.equal(rows.length, 1, slug);
    assert.equal(rows[0].signal, signal, slug);
    assert.ok(rows[0].condition.includes(priorCondition), slug);
    assert.ok(rows[0].condition.includes(standard), slug);
  }
});

test('Sony controllers, camera Port Map and key facts remain outside this change', () => {
  for (const slug of ['rm-ip10', 'rm-ip500']) {
    assert.equal(read(slug).io.some(row => /PoE/.test(row.signal ?? '')), false, slug);
  }
  assert.equal(read('srg-x40uh').portMap.items.length, 6);
  for (const [slug] of expected) assert.equal(read(slug).keyFacts?.length ?? 0, 0, slug);
});

test('historical inverse restores only the LAN row and rejects an unexpected change', () => {
  const product = read('brc-am7');
  const prior = beforeW06003Product(product, 'brc-am7');
  assert.equal(prior.io.find(row => row.connector === 'LAN RJ-45').signal, 'Network/PoE');
  const unrelated = structuredClone(product);
  unrelated.io[0].quantity = '99';
  assert.equal(beforeW06003Product(unrelated, 'brc-am7').io[0].quantity, '99');
  const altered = structuredClone(product);
  altered.io.find(row => row.connector === 'LAN RJ-45').quantity = '99';
  assert.throws(() => beforeW06003Product(altered, 'brc-am7'), /unexpected W-003/);
});
