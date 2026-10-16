import { beforeW008Catalog, beforeW008Manifest, isW008DetailFile } from './w20261016-008-history.mjs';
import { beforeW20261014_005Catalog } from './w20261014-005-history.mjs';
import { beforeW009Catalog } from './w009-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readBeforeW018File as readFile} from './w20261016-018-history.mjs';
import { withoutW011Catalog } from './w011-history.mjs';
import { withoutW004Catalog } from './w004-history.mjs';

const root = new URL('../', import.meta.url);
const slugs = ['ultriscape', 'ultrimix-mxr', 'ultrisync-18', 'ultrimix-dante'];
const models = ['ULTRISCAPE', 'ULTRIMIX-MXR', 'ULTRISYNC-18', 'ULTRIMIX-DANTE'];
const loadDetail = slug => readFile(new URL(`beta/site/detail/data/${slug}.json`, root), 'utf8').then(JSON.parse);
const spec = (product, name) => product.specifications.find(row => row.name === name);

test('four existing Ross license rows gain detail slugs without growing the catalog', async () => {
  const catalog =beforeW20261014_005Catalog(withoutW004Catalog(withoutW011Catalog(beforeW009Catalog(beforeW008Catalog(JSON.parse(await readFile(new URL('beta/site/catalog.json', root), 'utf8')))))));
  assert.equal(catalog.length, 273);
  for (const [index, slug] of slugs.entries()) {
    const rows = catalog.filter(item => item.slug === slug);
    assert.equal(rows.length, 1, `${slug}: expected one catalog row`);
    assert.equal(rows[0].brand, 'Ross Video');
    assert.equal(rows[0].product, models[index]);
    assert.deepEqual(rows[0].categories, ['영상', 'Video', 'License']);
    assert.equal(rows[0].kind, 'equipment');
    assert.equal('card_image' in rows[0], false);
  }
});

test('Ross license details remain software-only records', async () => {
  const { group1Images } = await import('../beta/group1-images.mjs');
  for (const [index, slug] of slugs.entries()) {
    const product = await loadDetail(slug);
    assert.equal(product.manufacturer, 'Ross Video');
    assert.equal(product.model, models[index]);
    assert.equal(product.itemType, 'PRODUCT');
    assert.deepEqual(product.images, []);
    assert.deepEqual(product.io, []);
    assert.deepEqual(group1Images[slug], []);
    assert.equal('portMap' in product, false);
    assert.equal('signalFlow' in product, false);
    assert.equal(product.presentation.visualVariant, 'missing-product-images');
    assert.ok(product.imageStatuses.some(row => row.role === 'Main' && row.status === 'MISSING'));
    assert.ok(product.features.length > 0);
    assert.ok(product.specifications.length > 0);
  }
});

test('FR2 limits and official Ross license composition are preserved exactly', async () => {
  const [ultriscape, mxr, ultrisync, dante] = await Promise.all(slugs.map(loadDetail));

  assert.equal(spec(ultriscape, 'FR2 최대 멀티뷰어 헤드 수 (HDX/MODX)').value, '12');
  assert.equal(spec(ultriscape, 'FR2 최대 멀티뷰어 헤드 수 (IPX)').value, '6');
  assert.equal(spec(mxr, '최대 믹서 크기').value, '128×64');
  assert.equal(spec(mxr, '라이선스 블록').value, '32×16');
  assert.equal(spec(ultrisync, 'FR2 최대 3G 입력 프레임 동기화 수').value, '72');
  const sku = spec(ultrisync, 'ULTRISYNC-18 SKU 구성');
  assert.equal(sku.value, '구성 확인 필요');
  assert.equal(sku.verification, 'REVIEW REQUIRED');
  assert.equal(spec(dante, '단일 네트워크 채널 수').value, '64');
  assert.equal(spec(dante, '이중화 네트워크 채널 수').value, '32');
  assert.equal(spec(dante, 'FR2 최대 라이선스 수').value, '3');
});

test('four Ross licenses expose the Korean distributor license page', async () => {
  const { distributorLinks, distributorLinkFor, distributorRuleFor } = await import('../beta/distributor-links.mjs');
  const links = distributorLinks.filter(item => slugs.includes(item.slug));
  assert.deepEqual(links.map(item => item.slug), slugs);
  for (const [index, link] of links.entries()) {
    assert.equal(link.model, models[index]);
    assert.equal(link.distributor, '한국에빅스');
    assert.equal(link.url, 'http://avics.co.kr/ross/ultrix-liecense');
    assert.equal(link.checkedAt, '2026-10-12');
    assert.match(link.url, distributorRuleFor('Ross Video').urlPattern);
    assert.equal(distributorLinkFor(link.slug, 'Ross Video'), link);
  }
});
