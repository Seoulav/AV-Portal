import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildProduct, validateOverride } from '../beta/builder-library.mjs';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';
import { beforeW013Product, w013PriorProductSha } from './w013-history.mjs';
import { createHash } from 'node:crypto';

test('ULXD4 exposes verified RF, analog outputs, and Ethernet control without Dante', async () => {
  const library = await expectedBuilderLibrary();
  const product = library.products.find(item => item.productId === 'ulxd4');
  assert.ok(product);
  assert.equal(product.unresolved.length, 0, JSON.stringify(product.unresolved));
  const equipment = product.units[0].equipment;
  assert.equal(equipment.inputs.filter(port => port.connector === 'BNC' && port.signals.includes('RF')).length, 2);
  assert.equal(equipment.outputs.filter(port => port.connector === 'XLR' && port.signals.includes('LINE-AUDIO')).length, 1);
  assert.equal(equipment.outputs.filter(port => port.connector === 'TRS-6.3' && port.signals.includes('LINE-AUDIO')).length, 1);
  assert.equal(equipment.bidirectional.filter(port => port.connector === 'RJ45' && port.signals.includes('ETHERNET')).length, 1);
  assert.equal(equipment.bidirectional.some(port => port.signals.includes('DANTE')), false);
  const originalOutputRow = JSON.parse(fs.readFileSync(new URL('../beta/site/detail/data/ulxd4.json', import.meta.url), 'utf8')).io[1];
  assert.equal(originalOutputRow.connector, '1/4" (6.35 mm) TRS 및 XLR');
  assert.equal(originalOutputRow.signal, 'Audio output');
  assert.equal(originalOutputRow.quantity, '1 per connector');
});

test('ULXD4D exposes two XLR channels and two Dante network ports', async () => {
  const library = await expectedBuilderLibrary();
  const product = library.products.find(item => item.productId === 'ulxd4d');
  assert.ok(product);
  assert.equal(product.unresolved.length, 0, JSON.stringify(product.unresolved));
  const equipment = product.units[0].equipment;
  assert.equal(equipment.outputs.filter(port => port.connector === 'XLR' && port.signals.includes('LINE-AUDIO')).length, 2);
  assert.equal(equipment.bidirectional.filter(port => port.connector === 'RJ45' && port.signals.includes('DANTE')).length, 2);
});

test('multi-port IO_OVERRIDES validate and generate distinct ports without rewriting source rows', () => {
  const connector = 'XLR and RJ-45';
  const signal = 'Analog input and CobraNet';
  const override = {
    match: { connector, signal },
    ports: [
      { connector: 'XLR', signals: ['LINE-AUDIO'], direction: 'in', quantity: 4 },
      { connector: 'RJ45', signals: ['COBRANET', 'ETHERNET'], direction: 'in', quantity: 1 },
    ],
    note: 'official manufacturer manual rear-panel diagram',
  };
  assert.doesNotThrow(() => validateOverride('x#0', override));
  const result = buildProduct({
    productId: 'x', source: 'portal', brand: 'Crown', product: 'Amp', categories: ['오디오', 'Audio', 'Power Amplifier'],
    detail: { model: 'Amp', io: [{ group: 'Audio', connector, signal, direction: 'IN', quantity: '4채널' }] },
  }, { 'x#0': override });
  assert.equal(result.unresolved.length, 0);
  assert.deepEqual(result.units[0].equipment.inputs.map(port => port.connector), ['XLR', 'XLR', 'XLR', 'XLR', 'RJ45']);
  assert.equal(result.units[0].equipment.inputs[0].portalIo.connector, connector);
  for (const bad of [{ ...override, ports: [] }, { ...override, ports: [{ ...override.ports[0], quantity: 0 }] }]) {
    assert.throws(() => validateOverride('x#0', bad), /IO_OVERRIDES/);
  }
});

test('I-TECH 4x3500HD keeps its source row intact and exposes distinct analog, AES3, and network connectors', async () => {
  const library = await expectedBuilderLibrary();
  const product = library.products.find(item => item.productId === 'i-tech-4x3500hd');
  assert.ok(product);
  assert.deepEqual(product.unresolved.map(item => item.ioIndex), [0]); // The optional Speakon/Binding Post output stays review-only.
  const inputRow = JSON.parse(fs.readFileSync(new URL('../beta/site/detail/data/i-tech-4x3500hd.json', import.meta.url), 'utf8')).io[1];
  assert.equal(inputRow.connector, 'XLR-3F(아날로그·AES3 입력), etherCON/RJ-45(CobraNet·VDrive)');
  const equipment = product.units[0].equipment;
  assert.equal(equipment.inputs.filter(port => port.connector === 'XLR' && port.signals.includes('LINE-AUDIO')).length, 4);
  assert.equal(equipment.inputs.filter(port => port.connector === 'XLR' && port.signals.includes('AES3')).length, 2);
  assert.equal(equipment.inputs.filter(port => port.connector === 'RJ45' && port.signals.includes('COBRANET')).length, 1);
});


test('ULXD4 history rewind restores only the approved I/O field and matches the prior whole-product hash', async () => {
  const library = await expectedBuilderLibrary();
  const detail = JSON.parse(fs.readFileSync(new URL('../beta/site/detail/data/ulxd4.json', import.meta.url), 'utf8'));
  const restored = beforeW013Product(detail, 'ulxd4');
  const sha = createHash('sha256').update(JSON.stringify(restored)).digest('hex');
  assert.equal(sha, w013PriorProductSha('ulxd4'));
  const altered = structuredClone(detail);
  altered.io[0].quantity = '999';
  assert.throws(() => beforeW013Product(altered, 'ulxd4'), /unexpected W-013 I.O change/);
  assert.ok(library.products.some(item => item.productId === 'ulxd4'));
});
