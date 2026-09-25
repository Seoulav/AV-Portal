import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cardImages } from '../beta/group1-images.mjs';
import { group2Previews, previewCatalogFieldsFor } from '../beta/group2-images.mjs';
import { previewCardImage } from '../beta/site/app.js';
import { buildPreviewCatalog, stripDerivedCatalogFields } from '../prototype/group1/group1-data.mjs';

const site = new URL('../beta/site/', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('catalog.json', site), 'utf8'));
const withDetail = catalog.filter(item => item.slug);
const previewFields = ['preview_image', 'preview_image_alt', 'preview_image_scope'];

test('카드 대표 사진은 상세가 없는 항목에만 있고 group2-images.mjs와 일치한다', () => {
  const previewed = catalog.filter(item => item.preview_image);
  assert.equal(previewed.length, group2Previews.length);
  for (const item of previewed) {
    assert.equal(item.slug, undefined);
    assert.equal(item.card_image, undefined);
    assert.deepEqual(Object.fromEntries(previewFields.filter(field => item[field] !== undefined).map(field => [field, item[field]])), previewCatalogFieldsFor(item));
  }
  for (const item of withDetail) for (const field of previewFields) assert.equal(item[field], undefined);
});

test('형제 모델에는 카드 대표 사진을 붙이지 않는다', () => {
  for (const [brand, product] of [['Powersoft', 'Mezzo 322 A'], ['Roland', 'V-02HD'], ['NETGEAR', 'GSM4248P']]) {
    const item = catalog.find(entry => entry.brand === brand && entry.product === product);
    assert.ok(item, `${product}: 카탈로그에 있어야 비교가 의미 있다`);
    assert.equal(previewCatalogFieldsFor(item), null);
    assert.equal(item.preview_image, undefined);
  }
});

test('Group 1 재생성은 카드 대표 사진을 지우지 않고 공개 목록을 그대로 만든다', () => {
  const existing = catalog.map(stripDerivedCatalogFields);
  const product = item => ({ manufacturer: item.brand, model: item.product, categories: item.categories, documents: [] });
  const slugOf = made => withDetail.find(item => item.product === made.model).slug;
  const result = buildPreviewCatalog(existing, withDetail.map(product), {
    slugOf,
    cardImageOf: made => cardImages[slugOf(made)] ?? null,
    previewOf: previewCatalogFieldsFor
  });
  assert.deepEqual(result, catalog);
});

test('카드 대표 사진은 기준 25개 해시에 영향을 주지 않는다', () => {
  const baseline = catalog.slice(0, 25);
  assert.ok(baseline.some(item => item.preview_image), '기준 25개 안의 항목에 사진이 붙어 있어야 이 검사가 의미 있다');
  for (const item of baseline.map(stripDerivedCatalogFields)) for (const field of previewFields) assert.equal(item[field], undefined);
});

test('Library 카드는 상세가 없을 때만 대표 사진을 쓰고 계열 공용 사진을 표시한다', () => {
  assert.equal(previewCardImage({ brand: 'A', product: 'B' }), null);
  assert.equal(previewCardImage({ slug: 'dm7', preview_image: 'x.webp', preview_image_alt: 'x' }), null);
  assert.deepEqual(previewCardImage({ preview_image: 'x.webp', preview_image_alt: '대체 텍스트' }), { src: './detail/images/x.webp', alt: '대체 텍스트', note: '제조사 공식 이미지' });
  assert.equal(previewCardImage({ preview_image: 'x.webp', preview_image_alt: 'x', preview_image_scope: 'series' }).note, '제조사 공식 이미지 · 계열 공용');
});

test('Group 1 빌더는 카드 대표 사진을 다시 붙인다', async () => {
  const source = await readFile(new URL('../beta/build-group1-pages.mjs', import.meta.url), 'utf8');
  assert.match(source, /previewOf: previewCatalogFieldsFor/);
});
