import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { beforeW20261015_007Product } from './w20261015-007-history.mjs';

const root = new URL('../beta/site/detail/', import.meta.url);
const read = slug => JSON.parse(readFileSync(new URL(`data/${slug}.json`, root), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('PQ2213B and PQ2216B show visible REMOTE and AC connectors in their exact shared photograph', () => {
  const slugs = ['eb-pq2213b', 'eb-pq2216b', 'eb-pq2220b'];
  const products = slugs.map(read);
  const imageHashes = products.map(({ portMap }) => sha(readFileSync(new URL(`images/${portMap.measuredImage.file}`, root))));
  assert.deepEqual([...new Set(imageHashes)], ['02f14fd8c156cb5c4bd9ce298130e38c1a23f5ece4eb92f7f0b8a3089feada79']);
  const reference = products[2].portMap.items;
  for (const [index, product] of products.slice(0, 2).entries()) {
    assert.equal(product.portMap.items.length, 14, slugs[index]);
    for (const [number, referenceNumber] of [[13, 8], [14, 14]]) {
      const marker = product.portMap.items.find(item => item.n === number);
      const source = reference.find(item => item.n === referenceNumber);
      assert.deepEqual({ ...marker, n: referenceNumber }, source, `${slugs[index]} marker ${number}`);
    }
    const prior = beforeW20261015_007Product(product, slugs[index]);
    assert.equal(prior.portMap.items.length, 12);
    assert.deepEqual(prior.portMap.items, product.portMap.items.slice(0, 12));
  }
});
