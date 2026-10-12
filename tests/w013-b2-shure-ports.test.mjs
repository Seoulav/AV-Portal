import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';

const library = await expectedBuilderLibrary();
const item = id => {
  const value = library.products.find(product => product.productId === id);
  assert.ok(value, `missing product ${id}`);
  return value;
};
const allPorts = product => product.units.flatMap(unit => [
  ...unit.equipment.inputs,
  ...unit.equipment.outputs,
  ...unit.equipment.bidirectional,
]);

test('phantom power rows do not create duplicate Shure physical ports', () => {
  for (const [id, ioIndex, expectedPorts] of [['mx392-c', 3, 3], ['mx395', 1, 1], ['mx418d-c', 1, 1]]) {
    const product = item(id);
    assert.ok(!product.unresolved.some(row => row.ioIndex === ioIndex), `${id} phantom power row is resolved`);
    assert.equal(allPorts(product).length, expectedPorts, `${id} has no duplicate power terminal`);
    assert.ok(!allPorts(product).some(port => port.signals.includes('POWER')), `${id} power is supplied over its audio cable`);
  }
});

test('MXA925W-R uses its documented two RJ45 connectors without a duplicate PoE port', () => {
  const product = item('mxa925w-r');
  const rj45 = allPorts(product).filter(port => port.connector === 'RJ45');
  assert.equal(rj45.length, 2);
  assert.ok(rj45.every(port => port.signals.includes('DANTE')));
  assert.ok(product.unresolved.some(row => row.ioIndex === 0), 'conflicting phantom-powered audio wording stays visible for review');
});

test('MXCWAPT-W has one RJ45 Dante/PoE physical connector', () => {
  const product = item('mxcwapt-w');
  const rj45 = allPorts(product).filter(port => port.connector === 'RJ45');
  assert.equal(rj45.length, 1);
  assert.ok(rj45[0].signals.includes('DANTE'));
  assert.ok(!product.unresolved.some(row => row.ioIndex === 2));
});
