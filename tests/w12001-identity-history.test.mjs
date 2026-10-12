import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beforeW12001IdentityProduct, beforeW12001IdentityRaw } from './w12001-identity-history.mjs';

const records = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-001-prior-identity.json', import.meta.url), 'utf8'));
const directory = new URL('../beta/site/detail/data/', import.meta.url);

test('NX identity history restores only rear USB marker text', () => {
  assert.deepEqual(Object.keys(records), ['nx-2200', 'nx-3200']);
  for (const [slug, record] of Object.entries(records)) {
    const current = JSON.parse(readFileSync(new URL(`${slug}.json`, directory), 'utf8'));
    const restored = beforeW12001IdentityProduct(current, slug);
    assert.deepEqual(current.portMap.items.find(item => item.n === 8),
      { ...restored.portMap.items.find(item => item.n === 8), label: record.approved.label, desc: record.approved.desc });
    assert.equal(restored.portMap.items.find(item => item.n === 8).label, record.prior.label);
    assert.equal(restored.portMap.items.find(item => item.n === 8).desc, record.prior.desc);
    const edited = structuredClone(current);
    edited.portMap.items.find(item => item.n === 8).desc += ' changed';
    assert.throws(() => beforeW12001IdentityProduct(edited, slug), /unexpected W-001 identity change/);
  }
});

test('NX identity history leaves unrelated products untouched', () => {
  const raw = readFileSync(new URL('nx-1200.json', directory), 'utf8');
  assert.equal(beforeW12001IdentityRaw(raw, 'nx-1200'), raw);
  const product = JSON.parse(raw);
  assert.strictEqual(beforeW12001IdentityProduct(product, 'nx-1200'), product);
});
