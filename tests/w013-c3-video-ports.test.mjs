import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';
import { readFile } from 'node:fs/promises';
import { beforeW013C3Product } from './w013-c3-history.mjs';

const library = await expectedBuilderLibrary();
const product = id => library.products.find(item => item.productId === id);
const ports = record => record.units.flatMap(unit => [
  ...unit.equipment.inputs, ...unit.equipment.outputs, ...unit.equipment.bidirectional,
]);

test('VARIA-80 has the one USB-C OTG jack shown in its model-specific quick guide', () => {
  const record = product('varia-80');
  assert.equal(record.unresolved.some(row => row.ioIndex === 1), false);
  const usb = ports(record).filter(port => port.portalIo?.signal === 'USB OTG');
  assert.deepEqual(usb.map(port => [port.connector, port.direction, port.signals]),
    [['USB-C', 'both', ['USB']]]);
});

test('Ki Pro GO2 timecode shares existing SDI BNC and right XLR inputs', () => {
  const record = product('ki-pro-go2');
  assert.equal(record.unresolved.some(row => row.ioIndex === 9), false);
  assert.equal(ports(record).filter(port => port.portalIo?.signal === 'Timecode').length, 0);
  assert.equal(ports(record).filter(port => port.portalIo?.signal === 'Analog audio').length, 2);
});

test('Roland model-specific RS-232 pinouts expose one full-duplex DB-9 jack', () => {
  for (const [id, index] of [['v-160hd', 16], ['v-1hd-plus', 10], ['v-80hd', 13], ['vr-6hd', 12]]) {
    const record = product(id);
    assert.equal(record.unresolved.some(row => row.ioIndex === index), false, id);
    const serial = ports(record).filter(port => port.portalIo?.signal === 'RS-232');
    assert.deepEqual(serial.map(port => [port.connector, port.direction, port.signals]),
      [['DSUB-9', 'both', ['RS-232']]], id);
  }
});

test('AVer TR535 keeps each physical output and control jack once', () => {
  const record = product('tr535');
  assert.equal(record.unresolved.some(row => row.ioIndex === 0), false);
  const all = ports(record);
  const row = index => all.filter(port => port.portalIo?.connector ===
    ['3G-SDI, HDMI ×2, IP, USB', 'USB 3.2 Gen 1', 'RS-232, RS-422, IP, USB', 'RJ-45'][index]);
  assert.deepEqual(row(0).map(port => [port.connector, port.signals[0], port.direction]),
    [['HDMI', 'HDMI', 'out'], ['HDMI', 'HDMI', 'out'], ['BNC', 'SDI', 'out']]);
  assert.deepEqual(row(2).map(port => [port.connector, port.signals[0], port.direction]),
    [['MINI-DIN-8', 'RS-232', 'both'], ['RJ45', 'RS-422', 'both']]);
  assert.equal(row(1).length, 1, 'USB output is already in its own row');
  assert.equal(row(3).length, 1, 'IP/PoE RJ45 is already in its own row');
});

test('VARIA-80 history rewind rejects changes to approved fields and preserves unrelated fields', async () => {
  const current = JSON.parse(await readFile(new URL('../beta/site/detail/data/varia-80.json', import.meta.url), 'utf8'));
  const prior = beforeW013C3Product(current, 'varia-80');
  assert.equal(prior.io[1].quantity, '');
  assert.equal(prior.sources.some(source => source.code === 'Q1'), false);
  const unrelated = structuredClone(current);
  unrelated.model = 'changed model';
  assert.equal(beforeW013C3Product(unrelated, 'varia-80').model, 'changed model');
  const bad = structuredClone(current);
  bad.io[1].quantity = '2';
  assert.throws(() => beforeW013C3Product(bad, 'varia-80'), /unexpected W-013-C3/);
});
