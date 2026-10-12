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
const unresolvedAt = (record, index) => record.unresolved.some(row => row.ioIndex === index);

test('Lumantek VS10 analog audio and remote terminals retain the source counts', () => {
  const record = product('vs10');
  assert.equal(ports(record, 'inputs', 'XLR', 'LINE-AUDIO').length, 2);
  assert.equal(ports(record, 'outputs', 'XLR', 'LINE-AUDIO').length, 2);
  assert.equal(ports(record, 'bidirectional', 'UNKNOWN', 'GPIO').length, 1);
  assert.ok(!unresolvedAt(record, 4) && !unresolvedAt(record, 7));
});

test('Lumantek DB9 audio breakout rows expose one combined physical connector', () => {
  for (const id of ['ez-md-plus', 'vs5']) {
    const record = product(id);
    assert.equal(ports(record, 'bidirectional', 'DSUB-9', 'LINE-AUDIO').length, 1, id);
    const index = id === 'ez-md-plus' ? 5 : 7;
    assert.ok(!unresolvedAt(record, index), id);
  }
});
