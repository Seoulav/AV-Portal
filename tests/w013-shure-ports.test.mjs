import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedBuilderLibrary } from '../beta/build-builder-library.mjs';

function ports(library, id) {
  const product = library.products.find(item => item.productId === id);
  assert.ok(product, `missing product ${id}`);
  return product.units[0].equipment;
}

const count = (equipment, group, connector, signal) => equipment[group].filter(port => port.connector === connector && port.signals.includes(signal)).length;

test('Shure QLXD1 and ULXD1 expose one transmitter SMA RF output and TA4M input; SLXD1+ has TA4M input', async () => {
  const library = await expectedBuilderLibrary();
  for (const id of ['qlxd1', 'ulxd1']) {
    const equipment = ports(library, id);
    assert.equal(count(equipment, 'outputs', 'SMA', 'RF'), 1, `${id} SMA RF output`);
    assert.equal(count(equipment, 'inputs', 'PROPRIETARY', 'MIC-AUDIO'), 1, `${id} TA4M audio input`);
  }
  const slxd = ports(library, 'slxd1-plus');
  assert.equal(count(slxd, 'inputs', 'PROPRIETARY', 'MIC-AUDIO'), 1, 'slxd1-plus TA4M audio input');
});

test('Shure single-channel QLXD4 and SLXD4+ expose two antennas, one XLR, one TRS, and one Ethernet port', async () => {
  const library = await expectedBuilderLibrary();
  for (const id of ['qlxd4', 'slxd4-plus']) {
    const equipment = ports(library, id);
    assert.equal(count(equipment, 'inputs', 'BNC', 'RF'), 2, `${id} antenna inputs`);
    assert.equal(count(equipment, 'outputs', 'XLR', 'LINE-AUDIO'), 1, `${id} XLR output`);
    assert.equal(count(equipment, 'outputs', 'TRS-6.3', 'LINE-AUDIO'), 1, `${id} TRS output`);
    assert.equal(count(equipment, 'bidirectional', 'RJ45', 'ETHERNET'), 1, `${id} network port`);
  }
});

test('Shure SLXD4D+ exposes two XLR and two 1/4-inch audio outputs', async () => {
  const equipment = ports(await expectedBuilderLibrary(), 'slxd4d-plus');
  assert.equal(count(equipment, 'outputs', 'XLR', 'LINE-AUDIO'), 2);
  assert.equal(count(equipment, 'outputs', 'TRS-6.3', 'LINE-AUDIO'), 2);
});

test('Shure MXC420/C and MXCW640 expose their model-matched 10-pin microphone connectors', async () => {
  const library = await expectedBuilderLibrary();
  assert.equal(count(ports(library, 'mxc420-c'), 'outputs', 'PROPRIETARY', 'MIC-AUDIO'), 1, 'mxc420-c microphone connector output');
  assert.equal(count(ports(library, 'mxcw640'), 'inputs', 'PROPRIETARY', 'MIC-AUDIO'), 1, 'mxcw640 microphone connector input');
});

test('Shure MXCWAPT-W has one analog XLR input and output', async () => {
  const equipment = ports(await expectedBuilderLibrary(), 'mxcwapt-w');
  assert.equal(count(equipment, 'inputs', 'XLR', 'LINE-AUDIO'), 1);
  assert.equal(count(equipment, 'outputs', 'XLR', 'LINE-AUDIO'), 1);
});

test('Shure MX395 exposes one generic XLR microphone output across connector variants', async () => {
  const library = await expectedBuilderLibrary();
  const product = library.products.find(item => item.productId === 'mx395');
  const equipment = product.units[0].equipment;
  assert.equal(count(equipment, 'outputs', 'XLR', 'MIC-AUDIO'), 1);
  assert.ok(!product.unresolved.some(item => item.ioIndex === 1), 'phantom power shares the existing audio XLR');
});

test('Shure ambiguous analog and Dante/PoE rows remain unresolved without new generated ports', async () => {
  const library = await expectedBuilderLibrary();
  const mxa = library.products.find(item => item.productId === 'mxa925w-r');
  const mxaPorts = mxa.units[0].equipment.bidirectional.filter(port => port.connector === 'RJ45');
  assert.equal(mxaPorts.length, 2); // The two physical RJ45 ports; PoE is carried by port 1.
  assert.ok(mxa.unresolved.some(item => item.ioIndex === 0 && item.reason === 'no-signal'));
  assert.equal(mxa.units[0].equipment.outputs.length, 0);
  const apt = library.products.find(item => item.productId === 'mxcwapt-w');
  assert.equal(apt.units[0].equipment.bidirectional.filter(port => port.connector === 'RJ45').length, 1);
  assert.ok(!apt.unresolved.some(item => item.group === 'Network' && item.connector === 'RJ45'));
});

test('Shure UA844 and UA845 expose documented antenna distribution and DC output counts', async () => {
  const library = await expectedBuilderLibrary();
  for (const id of ['ua844-swb', 'ua845uwb']) {
    const equipment = ports(library, id);
    assert.equal(count(equipment, 'inputs', 'BNC', 'RF'), 2, `${id} antenna inputs`);
    assert.equal(count(equipment, 'outputs', 'BNC', 'RF'), 10, `${id} receiver and cascade outputs`);
    assert.equal(count(equipment, 'outputs', 'UNKNOWN', 'POWER'), 4, `${id} DC outputs`);
  }
});

test('Shure UA864A and UA874XA each expose one BNC RF output', async () => {
  const library = await expectedBuilderLibrary();
  for (const id of ['ua864a', 'ua874xa']) {
    assert.equal(count(ports(library, id), 'outputs', 'BNC', 'RF'), 1, `${id} RF output`);
  }
});
