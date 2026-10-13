import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';
import { beforeW013A3Product } from './w013-a3-history.mjs';

const library = await expectedBuilderLibrary();
const product = id => library.products.find(item => item.productId === id);
const detail = async id => JSON.parse(await readFile(new URL(`../beta/site/detail/data/${id}.json`, import.meta.url), 'utf8'));
const rowPorts = async (id, index) => {
  const row = (await detail(id)).io[index];
  return product(id).units.flatMap(unit => [
    ...unit.equipment.inputs, ...unit.equipment.outputs, ...unit.equipment.bidirectional
  ]).filter(port => port.portalIo?.connector === row.connector && port.portalIo?.signal === row.signal);
};

test('Powersoft Duecanali and Quattrocanali rear control connectors are distinct physical ports', async () => {
  for (const family of ['duecanali-804', 'duecanali-1604', 'quattrocanali-1204', 'quattrocanali-2404', 'quattrocanali-4804']) {
    for (const variant of ['dsp', 'dspd']) {
      const id = `${family}-${variant}`;
      const indices = variant === 'dsp' ? [4, 5] : [5, 6];
      for (const index of indices) {
        assert.equal((await detail(id)).io[index].quantity, '1', `${id} io[${index}] quantity`);
        assert.equal(product(id).unresolved.some(row => row.ioIndex === index), false, `${id} io[${index}] unresolved`);
        assert.equal((await rowPorts(id, index)).length, 1, `${id} io[${index}] builder port`);
      }
    }
  }
});

test('Powersoft Mezzo GPI connections follow the manual channel labels, not amplifier output count guesses', async () => {
  for (const model of ['322', '324', '602', '604']) {
    for (const variant of ['a', 'ad']) {
      const id = `mezzo-${model}-${variant}`;
      const d = await detail(id);
      const index = d.io.findIndex(row => row.signal === '다목적 GPIO');
      const quantity = ['322', '602'].includes(model) ? 2 : 4;
      assert.notEqual(index, -1, id);
      assert.equal(d.io[index].quantity, String(quantity), id);
      assert.equal(product(id).unresolved.some(row => row.ioIndex === index), false, id);
      assert.equal((await rowPorts(id, index)).length, quantity, id);
    }
  }
});

test('Mezzo 322 AD existing override yields one stereo mini-jack without duplicate ports', async () => {
  const id = 'mezzo-322-ad';
  const row = (await detail(id)).io[7];
  assert.equal(row.quantity, '2채널');
  assert.equal((await rowPorts(id, 7)).length, 0);
  assert.equal(product(id).unresolved.some(item => item.ioIndex === 7), false);
  const inputs = product(id).units.flatMap(unit => unit.equipment.inputs);
  assert.equal(inputs.filter(port => port.connector === 'TRS-3.5' && port.signals.includes('LINE-AUDIO')).length, 1);
});

test('historical inverse rewinds only approved quantities and leaves unrelated changes visible', async () => {
  const id = 'mezzo-322-ad';
  const current = await detail(id);
  const prior = beforeW013A3Product(current, id);
  assert.equal(prior.io[6].quantity, '');
  assert.equal(prior.io[7].quantity, '2채널');
  assert.equal(prior.io[7].condition, 'MEZZO Series User Guide 39쪽 · 채널 1·2 입력');
  const unrelated = structuredClone(current);
  unrelated.model = 'INVALID';
  unrelated.io[0].signal = 'INVALID';
  const restored = beforeW013A3Product(unrelated, id);
  assert.equal(restored.model, 'INVALID');
  assert.equal(restored.io[0].signal, 'INVALID');
  const approvedMutation = structuredClone(current);
  approvedMutation.io[6].quantity = '3';
  assert.throws(() => beforeW013A3Product(approvedMutation, id), /unexpected W-013 A3/);
});
