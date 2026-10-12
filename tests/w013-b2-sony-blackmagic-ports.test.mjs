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

test('Sony BRC-AM7 model-specific VISCA and audio inputs map to documented terminals', () => {
  const record = product('brc-am7');
  assert.equal(ports(record, 'inputs', 'RJ45', 'RS-422').length, 1);
  assert.equal(ports(record, 'outputs', 'RJ45', 'RS-422').length, 1);
  assert.equal(ports(record, 'inputs', 'XLR', 'MIC-AUDIO').length, 2);
  assert.equal(ports(record, 'inputs', 'TRS-3.5', 'MIC-AUDIO').length, 1);
  assert.ok(!record.unresolved.some(row => [5,6,7,8].includes(row.ioIndex)));
});

test('Blackmagic HyperDeck Studio HD Plus and Pro map SDI, HDMI, and RS-422 counts', () => {
  for (const id of ['hyperdeck-studio-hd-plus', 'hyperdeck-studio-hd-pro']) {
    const record = product(id);
    assert.equal(ports(record, 'outputs', 'BNC', 'SDI').length, 3, id);
    assert.equal(ports(record, 'inputs', 'HDMI', 'HDMI').length, 1, id);
    assert.equal(ports(record, 'outputs', 'HDMI', 'HDMI').length, 1, id);
    assert.equal(ports(record, 'inputs', 'DSUB-9', 'RS-422').length, 1, id);
    assert.equal(ports(record, 'outputs', 'DSUB-9', 'RS-422').length, 1, id);
    assert.ok(!record.unresolved.some(row => [1,2,3].includes(row.ioIndex)), id);
  }
});
