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

test('AJA Ki Pro GO2 maps documented SDI and reference loop terminals without duplicating timecode jacks', () => {
  const record = product('ki-pro-go2');
  assert.equal(ports(record, 'inputs', 'BNC', 'SDI').length, 4);
  assert.equal(ports(record, 'outputs', 'BNC', 'SDI').length, 5);
  assert.equal(ports(record, 'inputs', 'BNC', 'SYNC').length, 1);
  assert.equal(ports(record, 'outputs', 'BNC', 'SYNC').length, 1);
  assert.ok(!record.unresolved.some(row => [0,2,3,8].includes(row.ioIndex)));
  assert.ok(!unresolvedAt(record, 9), 'timecode uses the already mapped SDI input or right audio XLR');
});

test('Yamaha DM7 AES/EBU two-stereo-pair rows produce two XLR ports per direction', () => {
  const record = product('dm7');
  assert.equal(ports(record, 'inputs', 'XLR', 'AES3').length, 2);
  assert.equal(ports(record, 'outputs', 'XLR', 'AES3').length, 2);
  assert.ok(!record.unresolved.some(row => [2,3].includes(row.ioIndex)));
});
