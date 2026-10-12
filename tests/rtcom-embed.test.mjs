import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { rtcomProductViewUrl, rtcomEmbedLayout } from '../beta/site/detail/rtcom-embed.mjs';

test('RTCOM embed accepts only a registered-looking product ID and keeps the original product URL', () => {
  assert.equal(rtcomProductViewUrl('xdm'), 'https://seoulav.github.io/rtcom-configurator/#products/xdm');
  assert.equal(rtcomProductViewUrl('qms-88ux'), 'https://seoulav.github.io/rtcom-configurator/#products/qms-88ux');
  for (const id of ['', '../xdm', 'XDM', 'xdm?embed=1']) assert.equal(rtcomProductViewUrl(id), null);
});

test('all published RTCOM copies retain an original product-view target', () => {
  const root = new URL('../beta/site/rtcom/raw/products/', import.meta.url);
  const ids = readdirSync(root).filter(file => file.endsWith('.json')).map(file => file.slice(0, -5));
  assert.equal(ids.length, 32);
  for (const id of ids) {
    const raw = JSON.parse(readFileSync(new URL(`${id}.json`, root), 'utf8'));
    assert.equal(raw.id, id);
    assert.equal(rtcomProductViewUrl(id), `https://seoulav.github.io/rtcom-configurator/#products/${id}`);
  }
});

test('embed presentation keeps portal-only sections and puts duplicate data behind a disclosure', () => {
  assert.deepEqual(rtcomEmbedLayout(), {
    primary: ['gallery', 'related-products', 'documents', 'sources'],
    disclosure: ['overview', 'io', 'specifications', 'features', 'setting-*']
  });
});
