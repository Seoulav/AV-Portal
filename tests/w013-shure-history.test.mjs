import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW013Product, w013PriorProductSha, w013Slugs } from './w013-history.mjs';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('W-013 Shure I/O changes rewind to their exact pre-batch whole-product hashes', () => {
  const shure = ['mx395','mxc420-c','mxcwapt-w','qlxd1','qlxd4','slxd1-plus','slxd4-plus','slxd4d-plus','ua844-swb','ua845uwb','ua864a','ua874xa','ulxd1'];
  assert.ok(shure.every(slug => w013Slugs.has(slug)));
  for (const slug of shure) {
    const current = JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
    const prior = beforeW013Product(current, slug);
    assert.equal(digest(prior), w013PriorProductSha(slug), `${slug} prior product SHA`);
    const changed = structuredClone(current);
    changed.io[0].condition += 'unexpected';
    assert.throws(() => beforeW013Product(changed, slug), /unexpected W-013(?: B2)? I\/O change/);
    const outside = structuredClone(current);
    outside.model += ' preserved';
    assert.equal(beforeW013Product(outside, slug).model, outside.model, `${slug} unrelated fields remain current`);
  }
});
