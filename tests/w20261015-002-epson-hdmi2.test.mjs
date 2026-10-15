import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../beta/site/detail/', import.meta.url);
const read = slug => JSON.parse(readFileSync(new URL(`data/${slug}.json`, root), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');

test('Epson PQ HDMI 2 markers span the same visible connector in the shared rear photograph', () => {
  const slugs = ['eb-pq2213b', 'eb-pq2216b', 'eb-pq2220b'];
  const rows = slugs.map(read);
  const imageHashes = rows.map(product => sha(readFileSync(new URL(`images/${product.portMap.measuredImage.file}`, root))));
  assert.equal(new Set(imageHashes).size, 1);
  for (const product of rows) {
    const hdmi2 = product.portMap.items.find(item => item.label === 'HDMI 2 입력');
    assert.deepEqual([hdmi2.x1, hdmi2.x2, hdmi2.y], [483, 511, 66], product.model);
  }
});
