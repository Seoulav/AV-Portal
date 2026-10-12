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

test('Panasonic MZ20K-family Korean manual rows map serial, remote, and USB terminals', () => {
  for (const id of ['pt-mz11k', 'pt-mz14k']) {
    const record = product(id);
    assert.equal(ports(record, 'inputs', 'DSUB-9', 'RS-232').length, 1, id);
    assert.equal(ports(record, 'outputs', 'DSUB-9', 'RS-232').length, 1, id);
    assert.equal(ports(record, 'inputs', 'DSUB-9', 'GPIO').length, 1, id);
    assert.equal(ports(record, 'inputs', 'TRS-3.5', 'GPIO').length, 1, id);
    assert.equal(ports(record, 'outputs', 'TRS-3.5', 'GPIO').length, 1, id);
    assert.equal(ports(record, 'bidirectional', 'USB-A', 'USB').length, 1, id);
    assert.ok(!record.unresolved.some(row => [2,3,4,7].includes(row.ioIndex)), id);
  }
});

test('Panasonic PT-MZ17K and PT-MZ882 map their manual-listed serial and remote terminals', () => {
  const mz17 = product('pt-mz17k');
  assert.equal(ports(mz17, 'inputs', 'DSUB-9', 'RS-232').length, 1);
  assert.equal(ports(mz17, 'outputs', 'DSUB-9', 'RS-232').length, 1);
  assert.equal(ports(mz17, 'inputs', 'DSUB-9', 'GPIO').length, 1);
  assert.equal(ports(mz17, 'inputs', 'TRS-3.5', 'GPIO').length, 1);
  assert.equal(ports(mz17, 'outputs', 'TRS-3.5', 'GPIO').length, 1);
  assert.ok(unresolvedAt(mz17, 10), 'model-specific power row remains missing');

  const mz882 = product('pt-mz882');
  assert.equal(ports(mz882, 'inputs', 'DSUB-9', 'RS-232').length, 1);
  assert.equal(ports(mz882, 'outputs', 'DSUB-9', 'RS-232').length, 1);
  assert.equal(ports(mz882, 'inputs', 'TRS-3.5', 'GPIO').length, 1);
  assert.equal(ports(mz882, 'inputs', 'DSUB-9', 'GPIO').length, 1);
  assert.ok(!mz882.unresolved.some(row => [3,4,5].includes(row.ioIndex)));
});
