import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW032Product, beforeW032Raw } from './w032-history.mjs';

const root = new URL('../beta/site/detail/data/', import.meta.url);
const raw = slug => readFileSync(new URL(`${slug}.json`, root), 'utf8').replace(/\r\n/g, '\n');
const sha = value => createHash('sha256').update(value).digest('hex');
const changed = ['brc-am7', 'srg-a40', 'srg-x40uh', 'rm-ip10', 'rm-ip500'];
const untouched = new Map([
  ['cl01', '8640ad9e0b6cd2074d8d54c7598735f1f54e3386335f146788a5de40ca95520c'],
  ['tr315', '6d703cfd3e67fa7ca8e2db6c66fd7738d824d28184e66f1f26fd7b50f0abe7b1'],
  ['tr335', '2a40dc0b3aeb7e1cd976d27e638e48b0158b6ad05e93ce019fe51b0e3b4a6461']
]);

test('current camera technical fields are identical to the pre-W-032 baseline', () => {
  for (const slug of changed) {
    const current = JSON.parse(raw(slug));
    const baseline = JSON.parse(readFileSync(new URL(`./fixtures/w032-before/${slug}.json`, import.meta.url), 'utf8'));
    for (const key of ['model', 'io', 'specifications', 'keyFacts', 'images', 'portMap']) {
      assert.deepEqual(current[key], baseline[key], `${slug}: ${key}`);
    }
  }
  for (const [slug, hash] of untouched) assert.equal(sha(raw(slug)), hash, slug);
});

test('historical inverse keeps current I/O, model and Port Map changes visible', () => {
  for (const [slug, field, change] of [
    ['brc-am7', 'io', product => { product.io = []; }],
    ['brc-am7', 'model', product => { product.model = 'INVALID'; }],
    ['srg-x40uh', 'portMap', product => { product.portMap.items[0].x1 += 1; }]
  ]) {
    const current = JSON.parse(raw(slug));
    const baselineHash = sha(beforeW032Raw(JSON.stringify(current, null, 2) + '\n', slug));
    change(current);
    const historical = beforeW032Product(current, slug);
    assert.deepEqual(historical[field], current[field], `${slug}: ${field} must pass through`);
    assert.notEqual(sha(JSON.stringify(historical, null, 2) + '\n'), baselineHash, `${slug}: ${field} mutation must fail old hash`);
  }
});
