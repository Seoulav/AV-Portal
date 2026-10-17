import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolveRelatedProductName, relationshipLabel } from '../beta/site/detail/related-products.mjs';

test('related product names resolve from catalog and RTCOM public index', () => {
  const catalog = [{ slug: 'matrix-1', product: 'MATRIX-1', model: 'MATRIX-1' }];
  const rtcomIndex = { products: [{ id: 'xdm-ctr100', productName: 'XDM-CTR100', model: 'XDM-CTR100' }] };

  assert.equal(resolveRelatedProductName({ target: 'matrix-1' }, catalog, rtcomIndex), 'MATRIX-1');
  assert.equal(resolveRelatedProductName({ target: 'xdm-ctr100' }, catalog, rtcomIndex), 'XDM-CTR100');
});

test('unknown related product ids fall back to uppercase ids', () => {
  assert.equal(resolveRelatedProductName({ target: 'new-model-id' }, [], { products: [] }), 'NEW-MODEL-ID');
});

test('known relationship labels render in Korean', () => {
  assert.equal(relationshipLabel('PART_OF_SERIES'), '시리즈 구성품');
  assert.equal(relationshipLabel('WORKS_WITH'), '함께 사용하는 제품');
  assert.equal(relationshipLabel('FUTURE_RELATION'), '관련 제품');
  assert.equal(relationshipLabel(''), '');
});

test('all published RTCOM related targets resolve to display names and Korean tags', () => {
  const index = JSON.parse(fs.readFileSync('beta/site/rtcom/raw/index.json', 'utf8'));
  const products = new Map(index.products.map(product => [product.id, product]));
  const rawDirectory = 'beta/site/rtcom/raw/products';
  let count = 0;
  const relationCounts = new Map();

  for (const file of fs.readdirSync(rawDirectory).filter(name => name.endsWith('.json'))) {
    const source = JSON.parse(fs.readFileSync(`${rawDirectory}/${file}`, 'utf8'));
    for (const related of source.related ?? []) {
      const name = resolveRelatedProductName(related, [], index);
      assert.equal(name, products.get(related.target)?.model ?? products.get(related.target)?.productName, `${file} → ${related.target}`);
      assert.match(relationshipLabel(related.relation), /^[가-힣 ]+$/u, `${related.relation} label`);
      relationCounts.set(related.relation, (relationCounts.get(related.relation) ?? 0) + 1);
      count += 1;
    }
  }

  assert.equal(count, 50);
  assert.deepEqual(Object.fromEntries(relationCounts), { PART_OF_SERIES: 23, WORKS_WITH: 27 });
  assert.equal(resolveRelatedProductName({ target: 'xdm-mr4s' }, [], index), 'XDM-MR4S');
});

test('public detail requests the RTCOM name index from its deployed relative path', async () => {
  const app = await readFile('beta/site/detail/app.js', 'utf8');
  assert.match(app, /fetch\('\.\.\/rtcom\/raw\/index\.json'\)/);
  assert.doesNotMatch(app, /fetch\('\.\.\/\.\.\/beta\/site\/rtcom\/raw\/index\.json'\)/);
});
