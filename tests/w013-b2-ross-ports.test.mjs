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

test('Ross Ultritouch ports include the dual PSU inputs, two Ethernet, HDMI, and USB terminals', () => {
  const record = product('ultritouch-2-hr');
  assert.equal(ports(record, 'inputs', 'DC', 'POWER').length, 2);
  assert.equal(ports(record, 'bidirectional', 'RJ45', 'ETHERNET').length, 2);
  assert.equal(ports(record, 'outputs', 'HDMI', 'HDMI').length, 1);
  assert.equal(ports(record, 'bidirectional', 'USB', 'USB').length, 1);
  assert.ok(!record.unresolved.some(row => [0,1,2,3].includes(row.ioIndex)));
});

test('Ross Ultrix FR2 control ports and Ultripower required AC input are represented', () => {
  const fr2 = product('ultrix-ns-fr2');
  assert.equal(ports(fr2, 'bidirectional', 'RJ45', 'ETHERNET').length, 2);
  assert.ok(!unresolvedAt(fr2, 4));
  const power = product('ultripower');
  assert.equal(ports(power, 'inputs', 'IEC', 'POWER').length, 1);
  assert.ok(!unresolvedAt(power, 0));
});

test('Ross Ultrix HDX-IO keeps the option-dependent SFP/AUX row unresolved', () => {
  assert.ok(unresolvedAt(product('ultrix-hdx-io'), 2));
});
