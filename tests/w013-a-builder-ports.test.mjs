import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';
import { beforeW013AProduct } from './w013-a-history.mjs';

const library = await expectedBuilderLibrary();
const product = id => library.products.find(item => item.productId === id);
const allPorts = id => product(id).units.flatMap(unit => [
  ...unit.equipment.inputs, ...unit.equipment.outputs, ...unit.equipment.bidirectional
]);
const rowPorts = async (id, index) => {
  const detail = JSON.parse(await readFile(new URL(`../beta/site/detail/data/${id}.json`, import.meta.url), 'utf8'));
  const row = detail.io[index];
  return allPorts(id).filter(port => port.portalIo?.connector === row.connector && port.portalIo?.signal === row.signal);
};

// Product I/O is the evidence. The builder must not silently discard these rows.
test('officially identified Epson SDI BNC inputs and outputs create distinct ports', async () => {
  for (const id of ['eb-pu2010w-b', 'eb-pu2213b', 'eb-pu2216b']) {
    assert.equal(product(id).unresolved.filter(row => [4, 5].includes(row.ioIndex)).length, 0, id);
    assert.deepEqual((await rowPorts(id, 4)).map(port => [port.connector, port.signals[0], port.direction]), [['BNC', 'SDI', 'in']], id);
    assert.deepEqual((await rowPorts(id, 5)).map(port => [port.connector, port.signals[0], port.direction]), [['BNC', 'SDI', 'out']], id);
  }
});

test('MX392 independent LED input and switch output create logic ports', async () => {
  assert.equal(product('mx392-c').unresolved.filter(row => [1, 2].includes(row.ioIndex)).length, 0);
  assert.deepEqual((await rowPorts('mx392-c', 1)).map(port => [port.connector, port.signals[0], port.direction]), [['TERMINAL-BLOCK', 'GPIO', 'in']]);
  assert.deepEqual((await rowPorts('mx392-c', 2)).map(port => [port.connector, port.signals[0], port.direction]), [['TERMINAL-BLOCK', 'GPIO', 'out']]);
});

test('Panasonic manual-backed analog jacks retain their input and output counts', async () => {
  assert.equal(product('pt-mz882').unresolved.some(row => row.ioIndex === 6), false);
  assert.deepEqual((await rowPorts('pt-mz882', 6)).map(port => port.direction).sort(), ['in', 'out']);
  for (const id of ['pt-vmz51', 'pt-vmz61', 'pt-vmz71']) {
    assert.equal(product(id).unresolved.some(row => row.ioIndex === 2), false, id);
    assert.deepEqual((await rowPorts(id, 2)).map(port => port.direction).sort(), ['in', 'in', 'out'], id);
  }
});

test('ULXD4Q antenna, XLR and Dante physical quantities follow the Shure rear panel', async () => {
  const detail = JSON.parse(await readFile(new URL('../beta/site/detail/data/ulxd4q.json', import.meta.url), 'utf8'));
  assert.deepEqual([0, 2, 3].map(index => detail.io[index].quantity), ['2', '4', '2']);
  assert.equal(product('ulxd4q').unresolved.filter(row => [0, 2, 3].includes(row.ioIndex)).length, 0);
  assert.deepEqual([0, 2, 3].map(index => allPorts('ulxd4q').filter(port => port.portalIo?.connector === detail.io[index].connector && port.portalIo?.signal === detail.io[index].signal).length), [2, 4, 2]);
});

test('historical inverse restores only approved ULXD4Q row fields and exposes other edits', async () => {
  const current = JSON.parse(await readFile(new URL('../beta/site/detail/data/ulxd4q.json', import.meta.url), 'utf8'));
  const prior = beforeW013AProduct(current, 'ulxd4q');
  assert.equal(prior.io[0].quantity, '');
  assert.equal(prior.io[2].quantity, '');
  assert.equal(prior.io[3].quantity, '');
  assert.equal(prior.model, current.model);
  const otherEdit = structuredClone(current);
  otherEdit.io[1].signal = 'INVALID';
  otherEdit.model = 'INVALID';
  const restored = beforeW013AProduct(otherEdit, 'ulxd4q');
  assert.equal(restored.io[1].signal, 'INVALID');
  assert.equal(restored.model, 'INVALID');
  const approvedEdit = structuredClone(current);
  approvedEdit.io[2].quantity = '3';
  assert.throws(() => beforeW013AProduct(approvedEdit, 'ulxd4q'), /unexpected W-013-A/);
});
