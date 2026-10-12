import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';

const library = await expectedBuilderLibrary();
const item = id => {
  const product = library.products.find(record => record.productId === id);
  assert.ok(product, `missing product ${id}`);
  return product;
};
const countInput = (product, connector) => product.units[0].equipment.inputs.filter(port => port.connector === connector && port.signals.includes('LINE-AUDIO')).length;

test('Powersoft Mezzo models expose one shared stereo mini-jack input for channels 1 and 2', () => {
  for (const id of ['mezzo-322-a', 'mezzo-324-a', 'mezzo-324-ad', 'mezzo-602-a', 'mezzo-602-ad', 'mezzo-604-a', 'mezzo-604-ad']) {
    const product = item(id);
    assert.equal(countInput(product, 'TRS-3.5'), 1, `${id} physical mini-jack input`);
    assert.ok(!product.unresolved.some(row => row.connector === '3.5mm 스테레오 미니잭'), `${id} unbalanced input is resolved`);
  }
});

test('Powersoft Mezzo 322 AD combined source row maps to the documented balanced block and stereo mini-jack', () => {
  const product = item('mezzo-322-ad');
  assert.equal(countInput(product, 'TERMINAL-BLOCK'), 1, 'balanced input block');
  assert.equal(countInput(product, 'TRS-3.5'), 1, 'unbalanced stereo mini-jack');
  assert.ok(!product.unresolved.some(row => row.ioIndex === 0), 'combined source row is resolved');
});

test('Powersoft Mezzo 322 AD exposes its two-channel speaker output on one Euro terminal block', () => {
  const product = item('mezzo-322-ad');
  const outputs = product.units[0].equipment.outputs.filter(port => port.connector === 'TERMINAL-BLOCK' && port.signals.includes('SPEAKER'));
  assert.equal(outputs.length, 1, 'one physical Euro 5 mm output connector');
  assert.ok(!product.unresolved.some(row => row.ioIndex === 4), 'speaker output row is resolved');
});
test('Powersoft Mezzo I/O source rows retain their exact connector, signal, quantity, and condition wording', () => {
  for (const id of ['mezzo-322-a', 'mezzo-324-a', 'mezzo-324-ad', 'mezzo-602-a', 'mezzo-602-ad', 'mezzo-604-a', 'mezzo-604-ad']) {
    const source = JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${id}.json`, import.meta.url), 'utf8'));
    const row = source.io[2];
    assert.equal(row.connector, '3.5mm 스테레오 미니잭', id);
    assert.equal(row.signal, 'Unbalanced analog audio in', id);
    assert.equal(row.quantity, '2채널', id);
    assert.equal(row.condition, '입력1·2와 병렬', id);
  }
  const source = JSON.parse(readFileSync(new URL('../beta/site/detail/data/mezzo-322-ad.json', import.meta.url), 'utf8'));
  assert.deepEqual(source.io[0], {
    group: 'Audio', connector: 'MISSING', signal: 'Balanced/Unbalanced analog audio in', direction: 'IN',
    quantity: '2채널(언밸런스 2 + 밸런스 2 혼합)', protocol: '', availability: '',
    condition: '블록 커넥터 방식, 정확한 커넥터 규격 미확인', source: 'M', verification: 'PARTIAL',
  });
});
