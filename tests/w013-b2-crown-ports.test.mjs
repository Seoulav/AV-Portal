import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';

const library = await expectedBuilderLibrary();
const item = id => {
  const product = library.products.find(record => record.productId === id);
  assert.ok(product, `missing product ${id}`);
  return product;
};
const ports = (product, direction, connector, signal) => product.units.flatMap(unit => unit.equipment[direction]).filter(port => (!connector || port.connector === connector) && (!signal || port.signals.includes(signal)));
const unresolvedAt = (product, ioIndex) => product.unresolved.some(row => row.ioIndex === ioIndex);

test('Crown CDi BL models expose two BLU link jacks and one HiQnet control jack', () => {
  for (const [id, index] of [['cdi-2-1200bl', 1], ['cdi-2-300bl', 2], ['cdi-2-600bl', 1], ['cdi-4-1200bl', 1], ['cdi-4-300bl', 1], ['cdi-4-600bl', 1]]) {
    const product = item(id);
    assert.equal(ports(product, 'bidirectional', 'RJ45', 'BLU-LINK').length, 2, id);
    assert.ok(!unresolvedAt(product, index), `${id} BLU link row resolved`);
  }
  for (const [id, index] of [['cdi-2-300', 2], ['cdi-2-300bl', 3], ['cdi-2-600bl', 2]]) {
    const product = item(id);
    assert.equal(ports(product, 'bidirectional', 'RJ45', 'ETHERNET').length, 1, id);
    assert.ok(!unresolvedAt(product, index), `${id} HiQnet row resolved`);
  }
});

test('Crown CDi GPIO/AUX block exposes two GPIO inputs, two GPIO outputs, sleep input, and status output', () => {
  for (const [id, index] of [['cdi-2-300bl', 4], ['cdi-4-300', 1]]) {
    const product = item(id);
    assert.equal(ports(product, 'inputs', 'TERMINAL-BLOCK', 'GPIO').length, 3, id);
    assert.equal(ports(product, 'outputs', 'TERMINAL-BLOCK', 'GPIO').length, 3, id);
    assert.ok(!unresolvedAt(product, index), `${id} GPIO/AUX row resolved`);
  }
});

test('Crown DCi Network models expose one HiQnet RJ45, two-in/two-out GPIO, and AUX sleep/status', () => {
  for (const id of ['dci-2-300n', 'dci-2-600n', 'dci-4-300n', 'dci-4-600n']) {
    const product = item(id);
    assert.equal(ports(product, 'bidirectional', 'RJ45', 'ETHERNET').length, 1, id);
    assert.equal(ports(product, 'inputs', 'RJ11', 'GPIO').length, 2, id);
    assert.equal(ports(product, 'outputs', 'RJ11', 'GPIO').length, 2, id);
    assert.equal(ports(product, 'inputs', 'TERMINAL-BLOCK', 'GPIO').length, 1, id);
    assert.equal(ports(product, 'outputs', 'TERMINAL-BLOCK', 'GPIO').length, 1, id);
    assert.ok(!product.unresolved.some(row => [3, 4, 5].includes(row.ioIndex)), id);
  }
});

test('Crown DCi Dante/AES67 row exposes the two model-documented RJ45 network ports', () => {
  const product = item('dci-4-300da');
  assert.equal(ports(product, 'bidirectional', 'RJ45', 'DANTE').length, 2);
  assert.ok(!unresolvedAt(product, 1));
});

test('Crown ComTech D 2- and 4-channel models expose four GPI inputs on the six-pin block', () => {
  for (const id of ['comtech-d-2125', 'comtech-d-4125']) {
    const product = item(id);
    assert.equal(ports(product, 'inputs', 'TERMINAL-BLOCK', 'GPIO').length, 4, id);
    assert.ok(!unresolvedAt(product, 3), `${id} GPI row resolved`);
  }
});

test('Crown ComTech D models expose the separate fault relay output', () => {
  for (const id of ['comtech-d-2125', 'comtech-d-4125']) {
    const product = item(id);
    assert.equal(ports(product, 'outputs', 'TERMINAL-BLOCK', 'RELAY').length, 1, id);
    assert.ok(!unresolvedAt(product, 4), `${id} relay output resolved`);
  }
});

test('I-Tech 4x3500HD keeps the connector-option row unresolved until the exact variant is known', () => {
  const product = item('i-tech-4x3500hd');
  assert.ok(unresolvedAt(product, 0));
});
