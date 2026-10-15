import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const approved = {
  'eb-pq2213b': 'c16e7202dbb8a5c15e8bfab4335c21fc77d8be2c7528fd767e0139266fc4e5e0',
  'eb-pq2216b': '12555cf8659b59a12d2af93021d0ffac545b8cf95aa519de5d5befa1fc119713',
};
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Undo only W-007's two appended markers for older exact-product checks.
export function beforeW20261015_007Product(product, slug) {
  if (!approved[slug]) return product;
  assert.equal(sha(product.portMap), approved[slug], `${slug}: approved Port Map changed`);
  const prior = structuredClone(product);
  assert.deepEqual(prior.portMap.items.slice(-2).map(item => item.n), [13, 14]);
  prior.portMap.items.splice(-2);
  return prior;
}

export function beforeW20261015_007Raw(raw, slug) {
  if (!approved[slug]) return raw;
  return JSON.stringify(beforeW20261015_007Product(JSON.parse(raw), slug), null, 2) + '\n';
}
