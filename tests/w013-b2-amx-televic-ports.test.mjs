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
const allPorts = record => record.units.flatMap(unit => Object.values(unit.equipment).flat());
const unresolvedAt = (record, index) => record.unresolved.some(row => row.ioIndex === index);

test('AMX NX AxLink control terminals map to bidirectional GPIO ports', () => {
  for (const [id, count, index] of [['nx-1200',1,1],['nx-2200',1,2],['nx-3200',2,2]]) {
    const record = product(id);
    assert.equal(allPorts(record).filter(port => port.portalIo?.signal === 'AxLink').length, count, id);
    assert.ok(!unresolvedAt(record, index), id);
  }
});

test('Televic Plixus network terminals map with their model-specific quantities', () => {
  const flex = product('confidea-flex');
  assert.equal(ports(flex, 'bidirectional', 'RJ45', 'ETHERNET').length, 2);
  assert.ok(!unresolvedAt(flex, 0));
  const ae = product('plixus-ae-r-dante');
  assert.equal(allPorts(ae).filter(port => port.portalIo?.signal === '회의 네트워크 포트(델리게이트 유닛)').length, 4);
  assert.ok(!unresolvedAt(ae, 0));
  const next = product('plixus-next');
  assert.equal(ports(next, 'inputs', 'RJ45', 'ETHERNET').length, 2);
  assert.equal(ports(next, 'outputs', 'RJ45', 'ETHERNET').length, 4);
  assert.ok(!next.unresolved.some(row => [0,1].includes(row.ioIndex)));
});
