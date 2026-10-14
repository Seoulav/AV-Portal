import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const approvedFlowHash = '46c40b840df4c0f31493f3a0a0560d806e151b5976cb771d202d6292acc32f59';
const hash = value => createHash('sha256').update(value).digest('hex');

export function beforeW20261015_001Product(product, slug) {
  if (slug !== 'hdf-ccf') return product;
  assert.ok(product && Object.hasOwn(product, 'signalFlow'), 'HDF-CCF approved flow must exist');
  assert.equal(hash(JSON.stringify(product.signalFlow)), approvedFlowHash, 'HDF-CCF approved flow changed');
  const copy = structuredClone(product);
  delete copy.signalFlow;
  return copy;
}
export function beforeW20261015_001Raw(raw, slug) {
  if (slug !== 'hdf-ccf') return raw;
  return JSON.stringify(beforeW20261015_001Product(JSON.parse(raw), slug), null, 2) + '\n';
}
