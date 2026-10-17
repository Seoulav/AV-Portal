import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {buildHubModel, assertHubParity} from '../Work/기록/W-20261017-004-preview/model.mjs';

const root = new URL('../beta/site/', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('catalog.json', root), 'utf8'));
const entries = catalog.filter(entry => entry.brand === 'Analog Way');
const products = Object.fromEntries(entries.map(entry => [entry.slug, JSON.parse(readFileSync(new URL(`detail/data/${entry.slug}.json`, root), 'utf8'))]));

test('all public Analog Way products appear once, and every comparison value matches its own JSON', () => {
  const model = buildHubModel(entries, products);
  assert.equal(model.cards.reduce((sum, card) => sum + card.models.length, 0), entries.length);
  assert.equal(model.rows.length, entries.length - 1);
  assert.equal(model.cards.at(-1).models[0].slug, 'rc400t');
  assert.equal(assertHubParity(model, entries, products), true);
  for (const row of model.rows) {
    assert.equal(row.fields.length, 6, row.slug);
    assert.ok(row.fields.every(field => field.value && field.path), row.slug);
    const product = products[row.slug];
    const plan = (product.layerPlan ?? product.videoLayerPlan).models.find(item => item.slug === row.slug);
    const ru = product.specifications.find(item => item.group === 'Physical' && ['크기(RU)', '랙 유닛'].includes(item.name));
    const power = product.specifications.find(item => item.group === 'Power' && ['전원', '전원 입력'].includes(item.name));
    assert.equal(row.fields[4].value, ru.value, row.slug);
    assert.equal(row.fields[5].value, [power.value, power.condition].filter(Boolean).join(' · '), row.slug);
    if (product.layerPlan) {
      assert.match(row.fields[0].value, new RegExp(`^${plan.inputs4k}개`), row.slug);
      assert.match(row.fields[1].value, new RegExp(`${plan.outputConnectors4k}개 커넥터 · ${plan.programOutputs4k}개`), row.slug);
      assert.match(row.fields[2].value, new RegExp(`^${plan.screens2x2}개`), row.slug);
      assert.match(row.fields[3].value, new RegExp(`${plan.mixingLayers4kPerScreen}개/화면 · 장비 전체 ${plan.mixingLayers4k}개`), row.slug);
    } else {
      assert.equal(row.fields[0].value, product.specifications.find(item => item.group === 'Input' && item.name === '구성').value, row.slug);
      assert.match(row.fields[2].value, new RegExp(`^${plan.maxPgm4kScreens}개`), row.slug);
      assert.match(row.fields[3].value, new RegExp(`${plan.mixing4kPerScreenAtMaxScreens}개/화면 · 장비 전체 ${plan.totalMixing4k}개 · 한 화면 집중 ${plan.maxMixing4kPerScreenOneScreen}개`), row.slug);
    }
  }
});

test('a changed comparison cell is detected without replacing the current product JSON', () => {
  const model = buildHubModel(entries, products);
  model.rows[0].fields[0].value = '잘못된 값';
  assert.throws(() => assertHubParity(model, entries, products), /불일치/);
});

test('unknown new Analog Way products require an explicit series decision', () => {
  assert.throws(() => buildHubModel([...entries, {...entries[0], slug: 'future-model'}], products), /분류되지 않은/);
});

test('document collection keeps only published brochures and shared user manuals', () => {
  const model = buildHubModel(entries, products);
  assert.ok(model.documents.length > 0);
  assert.equal(new Set(model.documents.map(item => item.url ?? item.file)).size, model.documents.length);
  assert.ok(model.documents.every(item => ['Brochure', 'User Manual'].includes(item.type) && (item.url || item.file)));
});
