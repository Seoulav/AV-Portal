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
const gpio = (product, direction) => product.units[0].equipment[direction === 'in' ? 'inputs' : 'outputs'].filter(port => port.signals.includes('GPIO'));

for (const id of ['blu-100', 'blu-101', 'blu-160']) {
  test(`${id} exposes the documented Phoenix GPIO input and output counts`, () => {
    const product = item(id);
    assert.equal(gpio(product, 'in').length, 12, '12 control inputs');
    assert.equal(gpio(product, 'out').length, 6, '6 logic outputs');
    assert.ok(gpio(product, 'in').every(port => port.connector === 'TERMINAL-BLOCK'));
    assert.ok(gpio(product, 'out').every(port => port.connector === 'TERMINAL-BLOCK'));
    assert.ok(!product.unresolved.some(row => row.group === 'Control'), 'control row resolved');
  });
}

test('BLU-50v2 exposes documented GPIO channels while preserving its unknown connector shape', () => {
  const product = item('blu-50v2');
  assert.equal(gpio(product, 'in').length, 12);
  assert.equal(gpio(product, 'out').length, 6);
  assert.ok(gpio(product, 'in').every(port => port.connector === 'UNKNOWN'));
  assert.ok(gpio(product, 'out').every(port => port.connector === 'UNKNOWN'));
  assert.ok(!product.unresolved.some(row => row.ioIndex === 5), 'documented GPIO row resolved');
});

test('BSS GPIO overrides preserve source connector, direction, signal, and quantity wording', () => {
  const rows = [['blu-100', 5], ['blu-101', 5], ['blu-160', 8], ['blu-50v2', 5]];
  for (const [id, index] of rows) {
    const source = JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${id}.json`, import.meta.url), 'utf8'));
    const row = source.io[index];
    assert.equal(row.signal, '제어 입력/로직 출력(GPIO)', id);
    assert.equal(row.direction, 'IN/OUT', id);
    assert.equal(row.quantity, '12 입력 / 6 출력', id);
  }
});