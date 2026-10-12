import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';

const library = await expectedBuilderLibrary();
const product = id => {
  const found = library.products.find(record => record.productId === id);
  assert.ok(found, `missing product ${id}`);
  return found;
};
const ports = (record, direction, connector, signal) => record.units.flatMap(unit => unit.equipment[direction]).filter(port => (!connector || port.connector === connector) && (!signal || port.signals.includes(signal)));
const unresolvedAt = (record, ioIndex) => record.unresolved.some(row => row.ioIndex === ioIndex);

test('Powersoft MEZZO Dante rows are carried by the shared dual RJ45 connectors', () => {
  for (const id of ['mezzo-324-ad', 'mezzo-602-ad', 'mezzo-604-ad']) {
    const record = product(id);
    assert.equal(ports(record, 'bidirectional', 'RJ45', 'ETHERNET').length, 2, id);
    assert.equal(ports(record, 'bidirectional', 'RJ45', 'DANTE').length, 0, id);
    assert.ok(!record.unresolved.some(row => row.ioIndex === (id === 'mezzo-324-ad' ? 3 : id === 'mezzo-602-ad' ? 4 : 3) || row.ioIndex === (id === 'mezzo-324-ad' ? 4 : id === 'mezzo-602-ad' ? 5 : 4)), id);
  }
});

test('Powersoft MEZZO 322 AD has two physical GPI inputs', () => {
  const record = product('mezzo-322-ad');
  assert.equal(ports(record, 'inputs', 'TERMINAL-BLOCK', 'GPIO').length, 2);
  assert.equal(ports(record, 'outputs', 'TERMINAL-BLOCK', 'RELAY').length, 1);
  assert.ok(!unresolvedAt(record, 2));
});

test('BSS BLU-160 exposes the maximum 16 optional card I/O terminals', () => {
  const record = product('blu-160');
  for (const index of [0, 1, 2, 3, 4]) assert.ok(!unresolvedAt(record, index), `card row ${index}`);
  assert.equal(ports(record, 'inputs', 'TERMINAL-BLOCK', 'LINE-AUDIO').length, 16);
  assert.equal(ports(record, 'outputs', 'TERMINAL-BLOCK', 'LINE-AUDIO').length, 16);
});

test('BSS BLU-50v2 watchdog output uses one documented Phoenix control terminal', () => {
  const record = product('blu-50v2');
  assert.equal(ports(record, 'outputs', 'TERMINAL-BLOCK', 'RELAY').length, 1);
  assert.ok(!unresolvedAt(record, 6));
});
