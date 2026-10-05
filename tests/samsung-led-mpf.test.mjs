import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { prepareProductDetail, visibleDetailCards } from '../prototype/brc-am7/product-detail-model.mjs';
import { detailSearchEntry } from '../beta/site/shared/search-index.mjs';
import {beforeDisplayW04013} from './display-w04013-history.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const slugs = ['mp008f', 'mp012f', 'mp016f'];
const models = ['MP008F', 'MP012F', 'MP016F'];
const officialList = 'https://www.samsung.com/sec/business/led-signage/';
const expectedByModel = {
  MP008F: ['0.84 mm', '피크1,800 nit / 최대1,000 nit', '29,000 : 1', '334 (W/m²) / 122 (W/Cabinet)'],
  MP012F: ['1.26 mm', '피크1,800 nit / 최대1,000 nit', '41,000 : 1', '399 (W/m²) / 146 (W/Cabinet)'],
  MP016F: ['1.68 mm', '피크1,600 nit / 최대1,200 nit', '43,000 : 1', '440 (W/m²) / 161 (W/Cabinet)']
};
const differingNames = ['픽셀 피치', '밝기', '명암비', '전력 소비량 (최대)'];

test('three MPF cabinets use all 20 model-matched guide fields without images or invented connectors', () => {
  const catalog = read('beta/site/catalog.json');
  const products = slugs.map((slug, index) => {
    const card = catalog.find(item => item.slug === slug);
    const detail = beforeDisplayW04013(read(`beta/site/detail/data/${slug}.json`),slug);
    assert.equal(card.product, models[index]);
    assert.deepEqual(card.categories, ['사이니지', 'Display', 'LED Signage']);
    assert.deepEqual(card.official_links, [officialList]);
    assert.equal(card.link_scope, 'series', '카드가 목록 링크를 개별 제품 페이지로 표시하지 않음');
    assert.equal(card.card_image, undefined);
    assert.equal(detail.model, models[index]);
    assert.equal(detail.specifications.length, 20);
    assert.deepEqual(detail.specifications.map(row => row.name).filter(name => differingNames.includes(name)), differingNames);
    assert.deepEqual(differingNames.map(name => detail.specifications.find(row => row.name === name).value), expectedByModel[models[index]]);
    assert.ok(detail.specifications.every(row => row.source === 'S1' && row.verification === 'FOUND'));
    assert.deepEqual(detail.images, []);
    assert.deepEqual(detail.io, []);
    assert.ok(detail.imageStatuses.some(row => row.role === 'Main' && row.status === 'MISSING' && row.reason));
    assert.ok(detail.korean.includes('캐비닛') && detail.korean.includes('S-Box'));
    assert.ok(detail.overview.includes('S-Box'));
    assert.ok(detail.sources.some(source => source.code === 'S1' && source.name.includes('삼성전자') && source.scope.includes('17')));
    assert.ok(detail.sources.some(source => source.url === officialList && source.scope.includes('개별 모델 페이지 미확인')));
    assert.ok(detail.documents.every(document => !String(document.url ?? '').includes('.pptx')));
    const prepared = prepareProductDetail(detail);
    assert.ok(!visibleDetailCards(prepared).includes('gallery'));
    assert.ok(!visibleDetailCards(prepared).includes('io'));
    assert.equal(detailSearchEntry(card, detail).cardImage, undefined);
    return detail;
  });
  const sharedNames = products[0].specifications.map(row => row.name).filter(name => !differingNames.includes(name));
  assert.equal(sharedNames.length, 16);
  for (const name of sharedNames) {
    const values = products.map(detail => detail.specifications.find(row => row.name === name).value);
    assert.ok(values.every(value => value === values[0]), `${name}: shared guide value differs`);
  }
  assert.ok(!existsSync(new URL('beta/site/detail/images/mp008f-main.webp', root)));
});

test('guide remains a private evidence source, while the public catalog gains exactly three LED entries', () => {
  const catalog = read('beta/site/catalog.json');
  assert.equal(catalog.length, 257);
  assert.deepEqual(catalog.filter(item => item.categories.includes('LED Signage')).map(item => item.slug).sort(), [...slugs, 'ie015a-e', 'ie020a-e', 'if015r-m'].sort());
  assert.equal(catalog.filter(item => item.brand === 'Samsung').length, 25);
  const index = read('beta/site/search-index.json');
  for (const slug of slugs) assert.ok(index.items.some(item => item.slug === slug));
  assert.ok(!existsSync(new URL('beta/site/docs/mpf-series-guide.pptx', root)));
});
