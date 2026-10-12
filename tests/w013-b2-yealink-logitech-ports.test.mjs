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

test('Yealink AVHub and UVC86 documented USB and VCH ports map with physical counts', () => {
  const avhub = product('avhub');
  assert.equal(ports(avhub, 'bidirectional', 'USB-A', 'USB').length, 2);
  assert.equal(ports(avhub, 'bidirectional', 'USB-B', 'USB').length, 1);
  assert.equal(ports(avhub, 'bidirectional', 'RJ45', 'ETHERNET').length, 7);
  assert.ok(unresolvedAt(avhub, 2), 'Codec Port connector/direction remains unspecified');
  const uvc = product('uvc86');
  assert.equal(ports(uvc, 'bidirectional', 'USB-A', 'USB').length, 1);
  assert.equal(ports(uvc, 'bidirectional', 'RJ45', 'ETHERNET').length, 1);
  assert.ok(!uvc.unresolved.some(row => [1,2].includes(row.ioIndex)));
});

test('Logitech Rally proprietary mic and hub links map without guessing the cable extension connector', () => {
  assert.equal(ports(product('rally-bar'), 'inputs', 'PROPRIETARY', 'MIC-AUDIO').length, 1);
  assert.equal(ports(product('rally-mic-pod'), 'inputs', 'PROPRIETARY', 'MIC-AUDIO').length, 1);
  assert.equal(ports(product('rally-mic-pod-hub'), 'bidirectional', 'PROPRIETARY', 'MIC-AUDIO').length, 3);
  assert.equal(ports(product('rally-plus'), 'bidirectional', 'RJ45', 'ETHERNET').length, 1);
  assert.equal(ports(product('rally-plus'), 'inputs', 'PROPRIETARY', 'MIC-AUDIO').length, 1);
  assert.ok(unresolvedAt(product('rally-mic-pod-extension-cable'), 0), 'estimated connector remains unresolved');
});
