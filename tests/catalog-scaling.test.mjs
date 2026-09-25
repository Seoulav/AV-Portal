import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { group1Images, cardImages } from '../beta/group1-images.mjs';
import { manufacturerHosts } from '../beta/manufacturer-hosts.mjs';
import { computeSnapshot, readSnapshot } from '../beta/update-snapshot.mjs';
import { buildPreviewCatalog, stripDerivedCatalogFields } from '../prototype/group1/group1-data.mjs';

const site = new URL('../beta/site/', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('catalog.json', site), 'utf8'));
const withDetail = catalog.filter(item => item.slug);

test('상세 slug는 카탈로그가 단일 근거이고 데이터·이미지 매니페스트와 일치한다', async () => {
  const slugs = withDetail.map(item => item.slug).sort();
  assert.ok(slugs.length > 0);
  assert.deepEqual([...new Set(slugs)], slugs, '중복 slug');
  assert.deepEqual((await readdir(new URL('detail/data/', site))).sort(), slugs.map(slug => `${slug}.json`).sort());
  assert.deepEqual(Object.keys(group1Images).sort(), slugs);
  assert.deepEqual(Object.keys(cardImages).sort(), slugs);
  for (const item of withDetail) {
    assert.equal(item.card_image, cardImages[item.slug]);
    assert.ok(group1Images[item.slug].some(image => image.file === item.card_image), `${item.slug}: 카드 이미지 없음`);
    assert.ok(manufacturerHosts[item.brand], `${item.brand}: 허용 호스트 미정의`);
  }
});

test('상세가 없는 항목은 카드 이미지를 갖지 않는다', () => {
  for (const item of catalog.filter(item => !item.slug)) assert.equal(item.card_image, undefined);
});

test('공개 고정값 스냅샷이 현재 산출물과 일치한다', async () => {
  assert.deepEqual(await computeSnapshot(), await readSnapshot());
});

test('제품 추가는 코드가 아닌 데이터 변경으로 끝난다', async () => {
  // 공개 경로의 코드에 제품 slug 목록이 다시 하드코딩되면 실패한다.
  const slugs = withDetail.map(item => item.slug);
  for (const file of ['app.js', 'index.html']) {
    const source = await readFile(new URL(file, site), 'utf8');
    const embedded = slugs.filter(slug => source.includes(slug));
    assert.deepEqual(embedded, [], `beta/site/${file}에 제품 slug가 하드코딩됨: ${embedded.join(', ')}`);
  }
  const gate = await readFile(new URL('../beta/verify-pages.mjs', import.meta.url), 'utf8');
  assert.ok(!slugs.some(slug => gate.includes(`'${slug}'`)), 'verify-pages.mjs에 제품 slug가 하드코딩됨');
});

test('기준 25개는 파생 필드를 뺀 형태로 buildPreviewCatalog를 통과해도 동일하다', () => {
  const baseline = catalog.slice(0, 25).map(stripDerivedCatalogFields);
  assert.deepEqual(buildPreviewCatalog(baseline, []), baseline);
});

test('buildPreviewCatalog는 기존 항목과 새 항목 모두에 slug를 붙인다', () => {
  const baseline = [{ brand: 'Yamaha', product: 'DM7', categories: ['오디오'], kind: 'equipment', official_links: [] }];
  const made = model => ({ manufacturer: model.brand, model: model.product, categories: ['오디오'], documents: [] });
  const result = buildPreviewCatalog(baseline, [made({ brand: 'Yamaha', product: 'DM7' }), made({ brand: 'AJA', product: 'Ki Pro GO2' })], {
    slugOf: product => (product.model === 'DM7' ? 'dm7' : 'ki-pro-go2'),
    cardImageOf: product => (product.model === 'DM7' ? 'dm7-perspective.webp' : null)
  });
  assert.equal(result.length, 2);
  assert.deepEqual(result[0], { brand: 'Yamaha', product: 'DM7', categories: ['오디오'], kind: 'equipment', official_links: [], slug: 'dm7', card_image: 'dm7-perspective.webp' });
  assert.equal(result[1].slug, 'ki-pro-go2');
  assert.equal(result[1].card_image, undefined);
});
