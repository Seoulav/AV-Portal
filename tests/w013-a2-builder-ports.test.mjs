import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';
import { beforeW013A2Product } from './w013-a2-history.mjs';

const library = await expectedBuilderLibrary();
const product = id => library.products.find(item => item.productId === id);
const portsForRow = async (id, index) => {
  const detail = JSON.parse(await readFile(new URL(`../beta/site/detail/data/${id}.json`, import.meta.url), 'utf8'));
  const { connector, signal } = detail.io[index];
  return product(id).units.flatMap(unit => [
    ...unit.equipment.inputs, ...unit.equipment.outputs, ...unit.equipment.bidirectional
  ]).filter(port => port.portalIo?.connector === connector && port.portalIo?.signal === signal);
};

test('QM32C manual-backed single jacks are available to the builder', async () => {
  for (const index of [3, 5, 6, 7, 8]) {
    assert.equal(product('lh32qmcebgcxkr').unresolved.some(row => row.ioIndex === index), false, `io[${index}]`);
    assert.equal((await portsForRow('lh32qmcebgcxkr', index)).length, 1, `io[${index}]`);
  }
});

test('Aquilon RS standard HDMI multiviewer connectors are not silently omitted', async () => {
  for (const id of ['aquilon-rs2', 'aquilon-rs3', 'aquilon-rs4', 'aquilon-rs5', 'aquilon-rs6', 'aquilon-rsalpha']) {
    assert.equal(product(id).unresolved.some(row => row.ioIndex === 2), false, id);
    assert.deepEqual((await portsForRow(id, 2)).map(port => [port.connector, port.signals[0], port.direction]),
      [['HDMI', 'HDMI', 'out'], ['HDMI', 'HDMI', 'out']], id);
  }
});

test('Midra 4K mirrored HDMI and SDI output jacks remain separate physical ports', async () => {
  for (const id of ['eikos-4k', 'pulse-4k']) {
    for (const [index, quantity] of [[4, 2], [5, 1]]) {
      assert.equal(product(id).unresolved.some(row => row.ioIndex === index), false, `${id} io[${index}]`);
      const ports = await portsForRow(id, index);
      assert.equal(ports.filter(port => port.connector === 'HDMI' && port.signals.includes('HDMI')).length, quantity, `${id} HDMI io[${index}]`);
      assert.equal(ports.filter(port => port.connector === 'BNC' && port.signals.includes('SDI')).length, quantity, `${id} SDI io[${index}]`);
    }
  }
});

test('Alta 4K standard mirrored output jacks are represented separately', async () => {
  for (const id of ['zenith-100', 'zenith-200']) {
    for (const [index, quantity] of [[4, 2], [6, 1]]) {
      assert.equal(product(id).unresolved.some(row => row.ioIndex === index), false, `${id} io[${index}]`);
      const ports = await portsForRow(id, index);
      assert.equal(ports.filter(port => port.connector === 'HDMI' && port.signals.includes('HDMI')).length, quantity, `${id} HDMI io[${index}]`);
      assert.equal(ports.filter(port => port.connector === 'BNC' && port.signals.includes('SDI')).length, quantity, `${id} SDI io[${index}]`);
    }
  }
});

test('Roland V-02HD MK II program and preview outputs have two HDMI jacks', async () => {
  const id = 'v-02hd-mk-ii';
  assert.equal(product(id).unresolved.some(row => row.ioIndex === 1), false);
  assert.deepEqual((await portsForRow(id, 1)).map(port => [port.connector, port.signals[0], port.direction]),
    [['HDMI', 'HDMI', 'out'], ['HDMI', 'HDMI', 'out']]);
});

test('historical inverse exposes unrelated current QM32C changes', async () => {
  const id = 'lh32qmcebgcxkr';
  const current = JSON.parse(await readFile(new URL(`../beta/site/detail/data/${id}.json`, import.meta.url), 'utf8'));
  const prior = beforeW013A2Product(current, id);
  assert.equal(prior.io[3].quantity, '');
  assert.equal(prior.sources.some(source => source.code === 'M1'), false);
  const unrelated = structuredClone(current);
  unrelated.io[0].signal = 'INVALID';
  unrelated.model = 'INVALID';
  const restored = beforeW013A2Product(unrelated, id);
  assert.equal(restored.io[0].signal, 'INVALID');
  assert.equal(restored.model, 'INVALID');
  const changedApproved = structuredClone(current);
  changedApproved.io[3].quantity = '2';
  assert.throws(() => beforeW013A2Product(changedApproved, id), /unexpected W-013-A2/);
});
