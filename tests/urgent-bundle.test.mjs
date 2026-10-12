import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { beforeKiprogo2Mx395Product } from './w12005-kiprogo2-mx395-history.mjs';

const dir = new URL('../beta/site/detail/data/', import.meta.url);
const read = slug => JSON.parse(readFileSync(new URL(`${slug}.json`, dir), 'utf8'));

test('published product wording uses boundary microphone throughout', () => {
  for (const file of readdirSync(dir).filter(name => name.endsWith('.json'))) {
    assert.ok(!readFileSync(new URL(file, dir), 'utf8').includes('경계면 마이크'), file);
  }
  for (const slug of ['mx392-c', 'mx395']) {
    const p = read(slug);
    assert.match(`${p.lead} ${p.subtitle}`, /바운더리 마이크/, slug);
  }
});

test('TR315 retains documented optical and digital zoom but does not invent total zoom', () => {
  const p = read('tr315');
  const row = p.specifications.find(item => item.name === '광학줌/디지털줌');
  assert.ok(row);
  assert.equal(row.value, '12X / 12X');
  assert.match(row.condition, /총줌.*불일치.*미기재/);
  assert.ok(!p.specifications.some(item => item.name.includes('총줌')));
});

test('urgent historical inverse restores approved fields only and rejects later drift', () => {
  for (const [slug, field] of [
    ['mx392-c', 'lead'], ['mx395', 'images'], ['tr315', 'specifications'],
    ['nx-1200', 'keyFacts'], ['nx-2200', 'portMap'], ['nx-3200', 'keyFacts'],
  ]) {
    const current = read(slug);
    const inverse = beforeKiprogo2Mx395Product(current, slug);
    assert.notDeepEqual(inverse[field], current[field], `${slug}: approved change restored`);
    assert.deepEqual(inverse.io, current.io, `${slug}: unrelated I/O passes through`);
    const changedIo = structuredClone(current);
    changedIo.io = [];
    assert.deepEqual(beforeKiprogo2Mx395Product(changedIo, slug).io, []);
    const changedApproved = structuredClone(current);
    changedApproved[field] = null;
    assert.throws(() => beforeKiprogo2Mx395Product(changedApproved, slug), /unexpected/);
  }
});
