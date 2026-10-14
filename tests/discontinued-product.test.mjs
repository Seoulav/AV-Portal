import { isW20261014_007DetailFile } from './w20261014-007-history.mjs';
import { beforeW20261014_005Catalog, beforeW20261014_005Snapshot, isW20261014_005DetailFile } from './w20261014-005-history.mjs';
import { beforeW009Catalog, beforeW009Snapshot, isW009DetailFile } from './w009-history.mjs';
import { isW004Name } from './w004-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {group1Images, cardImages} from '../beta/group1-images.mjs';
import { beforeW1010Catalog, isW1010Name } from './w1010-history.mjs';
import { beforeW1012Catalog, isW1012Name } from './w1012-history.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const slug = 'lh98qecedgcxkr';

test('discontinued LH98QEC is absent from every active Library artifact', () => {
  assert.equal(existsSync(new URL(`beta/site/detail/data/${slug}.json`, root)), false);
  assert.equal(existsSync(new URL(`beta/site/detail/images/${slug}-main.webp`, root)), false);

  const catalog = beforeW20261014_005Catalog(beforeW1010Catalog(beforeW1012Catalog(beforeW009Catalog(read('beta/site/catalog.json')))));
  assert.equal(catalog.length, 274);
  assert.equal(catalog.filter(item => item.brand === 'Samsung').length, 35);
  assert.equal(catalog.some(item => item.slug === slug), false);
  assert.equal(Object.hasOwn(group1Images, slug), false);
  assert.equal(Object.hasOwn(cardImages, slug), false);

  const snapshot = beforeW009Snapshot(beforeW20261014_005Snapshot(read('beta/public-snapshot.json')));
  assert.equal(snapshot.catalog.count - 2, 274);
  assert.equal(Object.keys(snapshot.details).filter(name => !isW004Name(name) && !isW1010Name(name) && !isW1012Name(name) && !isW009DetailFile(name) && !isW20261014_007DetailFile(name)).length, 265);
  assert.equal(Object.hasOwn(snapshot.details, slug), false);
  assert.equal(readdirSync(new URL('beta/site/detail/data/', root)).filter(name => name.endsWith('.json') && !isW20261014_005DetailFile(name) && !isW004Name(name) && !isW1010Name(name) && !isW1012Name(name) && !isW009DetailFile(name) && !isW20261014_007DetailFile(name)).length, 265);

  assert.equal(read('beta/site/search-index.json').items.some(item => item.slug === slug), false);
  assert.equal(readFileSync(new URL('beta/site/catalog.html', root), 'utf8').includes('LH98QECEDGCXKR'), false);
  assert.equal(readFileSync(new URL('beta/site/llms.txt', root), 'utf8').includes('LH98QECEDGCXKR'), false);
});
