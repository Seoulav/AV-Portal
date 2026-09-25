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

test('link_scope는 series 값만, 공식 링크 1개와 함께 쓴다', async () => {
  const { linkScopes } = await import('../prototype/group1/group1-data.mjs');
  const withScope = catalog.filter(item => 'link_scope' in item);
  assert.ok(withScope.length > 0);
  for (const item of withScope) {
    assert.ok(linkScopes.includes(item.link_scope), `${item.product}: ${item.link_scope}`);
    assert.equal(item.official_links.length, 1);
  }
});

test('공개 목록의 제품군 링크 표시는 결정표의 link_scope와 일치한다', async () => {
  const decisions = JSON.parse(await readFile(new URL('../docs/research/equipment-listing-decisions-2026-09-25.json', import.meta.url), 'utf8'));
  const norm = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const scopeOf = new Map(decisions.entries.filter(entry => entry.manufacturer).map(entry => [`${norm(entry.manufacturer)}\0${norm(entry.model)}`, entry.link_scope]));
  // 기준 27개는 결정표 이전에 개별 검토된 항목이라 대상이 아니다.
  for (const item of catalog.slice(27)) {
    const scope = scopeOf.get(`${norm(item.brand)}\0${norm(item.product)}`);
    assert.ok(scope, `${item.brand} ${item.product}: 결정표에 없음`);
    assert.equal(item.link_scope ?? 'model', scope, `${item.brand} ${item.product}`);
  }
});

test('모든 공개 목록 항목의 카테고리는 3단이다', () => {
  // 상세 페이지의 categories는 한국어 설명형 표시값이라 이 규칙의 대상이 아니다.
  for (const item of catalog) assert.equal(item.categories.length, 3, `${item.brand} ${item.product}`);
});

test('홈 카테고리 카드 여섯 개가 모두 비어 있지 않다', async () => {
  const { mapTopCategories } = await import('../beta/site/app.js');
  for (const group of mapTopCategories(catalog)) assert.ok(group.count > 0, `${group.label} 카드가 비어 있음`);
});

test('Group 1 재생성은 기준 25개 뒤에 등재한 항목과 link_scope를 지우지 않는다', () => {
  const existing = catalog.map(stripDerivedCatalogFields);
  const product = item => ({ manufacturer: item.brand, model: item.product, categories: item.categories, documents: [] });
  const result = buildPreviewCatalog(existing, withDetail.map(product), { slugOf: made => withDetail.find(item => item.product === made.model).slug });
  assert.equal(result.length, catalog.length);
  assert.deepEqual(result.map(item => item.link_scope ?? null), catalog.map(item => item.link_scope ?? null));
  assert.deepEqual(result.map(item => item.slug ?? null), catalog.map(item => item.slug ?? null));
});

test('Group 1 빌더는 공개 목록 전체를 기준으로 삼는다', async () => {
  const source = await readFile(new URL('../beta/build-group1-pages.mjs', import.meta.url), 'utf8');
  assert.match(source, /buildPreviewCatalog\(existingCatalog,/);
  assert.doesNotMatch(source, /assert\.equal\(catalog\.length, 27\)/);
});
