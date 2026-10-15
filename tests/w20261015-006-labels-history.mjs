import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const approved = {
  'aquilon-rs1': 'fcd407116b1d2407b27ea6e62d636dd250921ea9fd7700ea51eb81f8a1e91729',
  'aquilon-rs2': '9ba3a7e310ff9f6c1324a54c234cab9ab4197b3cb0b3886be22aaa7e30607366',
  'aquilon-rs3': '81fa9a2875c2ac086f8a1d1a88f0ee29d40b954d0adc3f461b45729c13c26b88',
  'aquilon-rs4': 'ecd406cbc358975e15c28002e7505d71b462850648426c4cb592a4576977f1e9',
  'aquilon-rs5': '5da041042ad3dc94cf21260f6556f2f743ddc409ec3ef50256c37ad673eec602',
  'aquilon-rs6': '32b350f989c3ecaab0a873435155cf207ee09008869b39f0f041cad310fb2800',
};
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Undo only this follow-up's six label offsets before the W-006 map hash gate.
export function beforeW20261015_006LabelsProduct(product, slug) {
  if (!approved[slug] || product.portMap === undefined) return product;
  assert.equal(sha(product.portMap), approved[slug], `${slug}: approved marker offsets changed`);
  const prior = structuredClone(product);
  for (const item of prior.portMap.items.filter(item => item.n >= 4 && item.n <= 6)) {
    assert.equal(item.labelX, (item.x1 + item.x2) / 2 - 120, `${slug}: unexpected marker offset`);
    delete item.labelX;
  }
  return prior;
}

export function beforeW20261015_006LabelsRaw(raw, slug) {
  if (!approved[slug]) return raw;
  return JSON.stringify(beforeW20261015_006LabelsProduct(JSON.parse(raw), slug), null, 2) + '\n';
}
