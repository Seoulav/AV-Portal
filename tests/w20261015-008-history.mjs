import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const approved = {
  'brc-am7': '59e537b64434426854a324948adac3b8e5dab1813309b7f93f30906e8acd2e07',
  'rm-ip10': '9478037ad56226c5ad633d59d4d83ecb70d8038b8e6330c355e02f5fa87df9fe',
  'rm-ip500': '7521de8b0fa6a2138087e10dc96e308319990355665db7d871a049520f64ee68',
};
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Remove only W-008's approved map before older whole-product checks.
// Every other field remains visible to those historical assertions.
export function beforeW20261015_008Product(product, slug) {
  if (!approved[slug] || product.portMap === undefined) return product;
  assert.equal(sha(product.portMap), approved[slug], `${slug}: approved Sony map changed`);
  const prior = structuredClone(product);
  delete prior.portMap;
  return prior;
}

export function beforeW20261015_008Raw(raw, slug) {
  if (!approved[slug]) return raw;
  return JSON.stringify(beforeW20261015_008Product(JSON.parse(raw), slug), null, 2) + '\n';
}
