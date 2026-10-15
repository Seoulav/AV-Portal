import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const detail = new URL('../beta/site/detail/', import.meta.url);
const read = slug => JSON.parse(readFileSync(new URL(`data/${slug}.json`, detail), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');

test('Crown DCi 4|600DA input and output ranges match the identical rear photograph used by 4|300DA', () => {
  const small = read('dci-4-300da');
  const large = read('dci-4-600da');
  const image = product => sha(readFileSync(new URL(`images/${product.portMap.measuredImage.file}`, detail)));
  assert.equal(image(small), image(large));
  for (const n of [1, 2, 3, 4]) {
    const a = small.portMap.items.find(item => item.n === n);
    const b = large.portMap.items.find(item => item.n === n);
    assert.equal(a.label, b.label);
    assert.deepEqual([b.x1, b.x2, b.y], [a.x1, a.x2, a.y], b.label);
  }
});
