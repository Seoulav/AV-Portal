import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('Ross Video distributor link uses the exact model and manufacturer pair', async () => {
  const { distributorLinks, distributorLinkFor, distributorRuleFor } = await import('../beta/distributor-links.mjs');
  const ross = distributorLinks.filter(item => item.distributor === '한국에빅스');
  assert.deepEqual(ross.map(item => item.slug), [
    'ultrix-hdx-io', 'ultriscape', 'ultrimix-mxr', 'ultrisync-18', 'ultrimix-dante'
  ]);
  const link = ross[0];
  assert.equal(link.model, 'ULTRIX-HDX-IO');
  assert.equal(link.url, 'http://avics.co.kr/ross/routing-switcher');
  assert.equal(link.checkedAt, '2026-10-12');
  assert.ok(link.pageTitle.includes('Routing Switcher'));
  assert.match(link.url, distributorRuleFor('Ross Video').urlPattern);
  assert.equal(distributorLinkFor('ultrix-hdx-io', 'Ross Video'), link);
  assert.equal(distributorLinkFor('ultrix-hdx-io', 'AMX'), null);
  for (const slug of ['ultrix-ns-fr2', 'ultripower', 'ultripower-ps', 'ultritouch-2-hr']) {
    assert.equal(distributorLinkFor(slug, 'Ross Video'), null);
  }
  const detail = JSON.parse(await readFile(new URL('beta/site/detail/data/ultrix-hdx-io.json', root), 'utf8'));
  assert.equal(link.model, detail.model);
});

test('distributor display name follows the verified link', async () => {
  const app = await readFile(new URL('prototype/brc-am7/app.js', root), 'utf8');
  assert.match(app, /distributorLink\.distributor/);
  assert.match(app, /distributorName === '한국에빅스' \? 'avics\.co\.kr'/);
  assert.match(app, /parsed\.hostname === allowedHttpHost/);
});
