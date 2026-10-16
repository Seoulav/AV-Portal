import {beforeCrownW16015Product} from './crown-w16015-history.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const slug = 'dci-4-600da';
const changedCoordsHash = '9d6532f8ccb23d01c6466cf530d60f7a5bbab867b560570eb09503b9aa5e0618';
const prior = [[1705, 1806], [1569, 1668], [1515, 1768], [1245, 1495]];
const coords = product => product.portMap.items.slice(0, 4).map(item =>
  ({ n: item.n, x1: item.x1, x2: item.x2, y: item.y }));

export function beforeW20261015_005Product(product, productSlug) {
  if (productSlug !== slug) return product;
  if (coords(product).every((item, index) => item.x1 === prior[index][0] && item.x2 === prior[index][1])) return product;
  product = beforeCrownW16015Product(product, productSlug);
  const current = coords(product);
  assert.equal(createHash('sha256').update(JSON.stringify(current)).digest('hex'), changedCoordsHash,
    'Crown DCi 4|600DA approved connector ranges changed');
  const copy = structuredClone(product);
  copy.portMap.items.slice(0, 4).forEach((item, index) => {
    [item.x1, item.x2] = prior[index];
  });
  return copy;
}

export function beforeW20261015_005Raw(raw, productSlug) {
  if (productSlug !== slug) return raw;
  return JSON.stringify(beforeW20261015_005Product(JSON.parse(raw), productSlug), null, 2) + '\n';
}
