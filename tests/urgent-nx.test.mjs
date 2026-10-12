import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const counts = {
  'nx-1200': { serial: 1, combo: 1, relay: 0 },
  'nx-2200': { serial: 3, combo: 1, relay: 4 },
  'nx-3200': { serial: 6, combo: 2, relay: 8 },
};

for (const [slug, count] of Object.entries(counts)) {
  test(`${slug} key facts show supported RS-232 and relay counts within four slots`, () => {
    const p = read(slug);
    assert.ok(p.keyFacts.length <= 4);
    const text = p.keyFacts.map(f => `${f.label} ${f.value} ${f.unit}`).join(' · ');
    assert.match(text, new RegExp(`RS-232 ${count.serial}`));
    assert.match(text, new RegExp(`RS-232/422/485 ${count.combo}`));
    if (count.relay) assert.match(text, new RegExp(`릴레이 ${count.relay}`));
    else assert.doesNotMatch(text, /릴레이 [1-9]/);
  });
  test(`${slug} map numbers progress from left to right`, () => {
    const centers = read(slug).portMap.items.map(i => i.x1 === undefined ? i.x : (i.x1 + i.x2) / 2);
    assert.deepEqual(centers, [...centers].sort((a, b) => a - b));
  });
}
