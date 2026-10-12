import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW013B2Product, w013B2Slugs } from './w013-b2-history.mjs';
import { beforeW13001Product } from './w13001-powersoft-history.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w013-b2-product-history.json', import.meta.url), 'utf8'));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('every W-013 B2 I/O change rewinds to the exact pre-batch product hash', () => {
  assert.ok(w013B2Slugs.size > 1);
  for (const slug of w013B2Slugs) {
    const current = beforeW13001Product(JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8')), slug);
    const prior = beforeW013B2Product(current, slug);
    assert.equal(digest(prior), fixture[slug].approved.productShaBefore, slug);
    assert.equal(digest(prior.io), digest(fixture[slug].priorIo), `${slug} prior I/O`);
    const changed = structuredClone(current);
    changed.io[0].condition += ' unexpected';
    assert.throws(() => beforeW013B2Product(changed, slug), /unexpected W-013 B2 I\/O change/, slug);
    const outside = structuredClone(current);
    outside.model += ' preserved';
    assert.throws(() => beforeW013B2Product(outside, slug), /unexpected non-I\/O W-013 B2 change/, slug);
  }
});
