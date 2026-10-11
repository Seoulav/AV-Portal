import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beforeW06002Product, w06002NewSlugs } from './w06002-history.mjs';

const read = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const catalog = JSON.parse(readFileSync(new URL('../beta/site/catalog.json', import.meta.url), 'utf8'));
const variants = [
  ['aquilon-rs3', 24, 12, 8, '5RU', '850'],
  ['aquilon-rs4', 24, 16, 12, '5RU', '1010'],
  ['aquilon-rs5', 32, 16, 12, '6RU', '1050'],
  ['aquilon-rs6', 32, 20, 16, '6RU', '1300'],
  ['aquilon-rsalpha', 8, 4, 4, '4RU', '400'],
];

test('five Aquilon models retain their own data-sheet capacities and two photos', () => {
  for (const [slug, inputs, outputs, layers, ru, watts] of variants) {
    const p = read(slug), item = catalog.find(x => x.slug === slug);
    assert.ok(item, slug);
    assert.equal(item.brandSort, undefined);
    assert.equal(p.io[0].quantity, String(inputs));
    assert.equal(p.io[1].quantity, String(outputs));
    assert.match(p.specifications.find(x => x.name === '레이어').value, new RegExp(`최대 ${layers}x 4K`));
    assert.equal(p.specifications.find(x => x.name === '크기(RU)').value, ru);
    assert.equal(p.specifications.find(x => x.name === '최대 소비전력').value, watts);
    assert.deepEqual(p.images.map(x => x.role), ['Front', 'Rear']);
    assert.equal(p.portMap, undefined);
    assert.equal(p.images.every(x => x.officialSource && new URL(x.sourceUrl).hostname === 'www.analogway.com'), true);
  }
  assert.equal(w06002NewSlugs.size, 5);
  assert.equal(read('aquilon-rsalpha').model, 'Aquilon RS alpha');
});

test('three Colorlight products gain only rear photo metadata; other current fields remain visible to history', () => {
  for (const n of ['2u', '4u', '7u']) {
    const slug = `x100pro-${n}`, p = read(slug), old = beforeW06002Product(p, slug);
    assert.deepEqual(p.images.map(x => x.role), ['Front', 'Rear']);
    assert.deepEqual(p.images[0], old.images[0]);
    assert.equal(old.images.length, 1);
    assert.equal(p.portMap, undefined);
    assert.equal(p.io.length, 2);
    const tampered = structuredClone(p); tampered.io = [];
    assert.deepEqual(beforeW06002Product(tampered, slug).io, []);
    tampered.images[1].model = 'wrong';
    assert.throws(() => beforeW06002Product(tampered, slug), /unexpected/);
  }
});
