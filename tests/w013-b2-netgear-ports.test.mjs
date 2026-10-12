import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';

const library = await expectedBuilderLibrary();
const product = id => {
  const found = library.products.find(record => record.productId === id);
  assert.ok(found, `missing product ${id}`);
  return found;
};
const consolePorts = record => record.units.flatMap(unit => unit.equipment.inputs).filter(port => port.signals.includes('RS-232') || port.connector === 'USB-C');

test('M4250 model console rows represent distinct RJ45 RS232 and USB-C physical ports', () => {
  for (const id of ['gsm4230p', 'gsm4230px', 'gsm4248p', 'xsm4216f']) {
    const record = product(id);
    const ports = consolePorts(record);
    assert.equal(ports.filter(port => port.connector === 'RJ45' && port.signals.includes('RS-232')).length, 1, `${id} RJ45 RS232 console`);
    assert.equal(ports.filter(port => port.connector === 'USB-C' && port.signals.includes('USB')).length, 1, `${id} USB-C console`);
    assert.ok(!record.unresolved.some(row => row.ioIndex === record.readiness.ioRows - 1), `${id} console row resolved`);
  }
  for (const id of ['gs728tppv3', 'gsm4212p']) assert.ok(product(id).unresolved.length > 0, `${id} unknown/service direction is preserved`);
});
