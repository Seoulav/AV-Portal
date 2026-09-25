import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { group1Images, cardImages } from './group1-images.mjs';
import { allowedHostsFor, isAllowedHost } from './manufacturer-hosts.mjs';
import { computeSnapshot, hashText, readSnapshot } from './update-snapshot.mjs';
import { derivedCatalogFields, stripDerivedCatalogFields } from '../prototype/group1/group1-data.mjs';

const site = new URL('./site/', import.meta.url);
const files = (await readdir(site)).sort();
assert.deepEqual(files, ['app.js', 'catalog.html', 'catalog.json', 'detail', 'favicon.svg', 'index.html', 'llms.txt', 'styles.css', 'system-version.css', 'system-version.js', 'version.json']);
const detail = new URL('detail/', site);
assert.deepEqual((await readdir(detail)).sort(), ['app.js', 'data', 'images', 'index.html', 'product-detail-model.mjs', 'styles.css'].sort());
const productImageFiles = Object.values(group1Images).flat().map(image => image.file).sort();
assert.deepEqual((await readdir(new URL('images/', detail))).sort(), [...productImageFiles, 'ptz-pictogram.svg'].sort());
const pictogram = await readFile(new URL('images/ptz-pictogram.svg', detail), 'utf8');
assert.equal(pictogram.replaceAll('\r\n', '\n'), (await readFile(new URL('../prototype/brc-am7/ptz-pictogram.svg', import.meta.url), 'utf8')).replaceAll('\r\n', '\n'));
assert.match(pictogram, /SPDX-License-Identifier: CC0-1\.0/);
assert.ok(!/<script|<image|(?:href|src)="|url\(https?:/i.test(pictogram), 'Illustration must not embed external content');

// 고정값은 코드가 아니라 beta/public-snapshot.json에 둔다. 제품을 추가할 때 이 파일을 다시 만든다.
const snapshot = await readSnapshot();
assert.deepEqual(await computeSnapshot(), snapshot, 'public-snapshot.json이 현재 공개 산출물과 다릅니다. node beta/update-snapshot.mjs로 갱신하세요.');

const raw = await readFile(new URL('catalog.json', site), 'utf8');
const homeHtml = await readFile(new URL('index.html', site), 'utf8');
const detailHtml = await readFile(new URL('index.html', detail), 'utf8');
const version = JSON.parse(await readFile(new URL('version.json', site), 'utf8'));
assert.doesNotMatch(homeHtml, /data-system-version|SYSTEM v\d|build local|system-version\.(?:css|js)/);
assert.doesNotMatch(detailHtml, /data-system-version|SYSTEM v\d|build local|system-version\.(?:css|js)/);
assert.match(version.version, /^\d+\.\d+\.\d+$/);
assert.ok(String(version.build).length > 0);
assert.ok(String(version.revision).length > 0);
assert.equal(hashText(raw), snapshot.catalog.sha256);

const catalog = JSON.parse(raw);
assert.equal(catalog.length, snapshot.catalog.count);
// 기준 25개는 파생 필드를 뺀 형태로 처음 공개 시점과 같아야 한다.
assert.equal(hashText(JSON.stringify(catalog.slice(0, snapshot.catalog.baselineCount).map(stripDerivedCatalogFields))), snapshot.catalog.baselineSha256);
const required = ['brand', 'categories', 'kind', 'official_links', 'product'];
const identities = new Set();
const catalogSlugs = [];
for (const item of catalog) {
  const keys = Object.keys(item).sort();
  assert.deepEqual(keys.filter(key => !derivedCatalogFields.includes(key)), required);
  assert.ok(keys.every(key => required.includes(key) || derivedCatalogFields.includes(key)), '카탈로그에 허용되지 않은 필드');
  assert.equal(item.kind, 'equipment');
  assert.ok(typeof item.brand === 'string' && item.brand.trim());
  assert.ok(typeof item.product === 'string' && item.product.trim());
  assert.ok(Array.isArray(item.categories) && item.categories.length);
  assert.ok(item.categories.every(value => typeof value === 'string' && value.trim()));
  assert.ok(Array.isArray(item.official_links));
  if (item.official_links.length === 0) assert.equal(item.product, 'PT-MZ17K');
  for (const link of item.official_links) {
    const url = new URL(link);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.username, '');
    assert.equal(url.password, '');
    assert.ok(!/\.pdf$/i.test(url.pathname));
  }
  if (item.slug !== undefined) {
    assert.match(item.slug, /^[a-z0-9-]+$/, '상세 slug 형식');
    assert.ok(group1Images[item.slug], `${item.slug}: 검토된 이미지 매니페스트 없음`);
    assert.equal(item.card_image, cardImages[item.slug], `${item.slug}: 카드 이미지가 매니페스트와 다름`);
    assert.ok(group1Images[item.slug].some(image => image.file === item.card_image), `${item.slug}: 카드 이미지가 게시 이미지에 없음`);
    catalogSlugs.push(item.slug);
  } else assert.equal(item.card_image, undefined, '상세가 없는 항목에는 카드 이미지를 두지 않는다');
  const identity = `${item.brand}\0${item.product}`;
  assert.ok(!identities.has(identity), 'Duplicate public product');
  identities.add(identity);
}
// 상세 데이터·이미지 매니페스트·스냅샷·카탈로그의 제품 집합이 한 곳에서만 갈라지지 않도록 서로 대조한다.
const slugs = catalogSlugs.slice().sort();
assert.deepEqual(new Set(catalogSlugs).size, catalogSlugs.length, 'Duplicate detail slug');
assert.deepEqual((await readdir(new URL('data/', detail))).sort(), slugs.map(slug => `${slug}.json`).sort());
assert.deepEqual(Object.keys(group1Images).sort(), slugs);
assert.deepEqual(Object.keys(cardImages).sort(), slugs);
assert.deepEqual(Object.keys(snapshot.details).sort(), slugs);

// 상세 JSON에 허용되는 최상위 키. 새 키는 공개 경계를 다시 검토한 뒤에만 추가한다.
const detailRequiredKeys = ['categories', 'documents', 'english', 'features', 'imageStatuses', 'images', 'io', 'issues', 'korean', 'manufacturer', 'model', 'overview', 'packageStatus', 'presentation', 'productName', 'sources', 'specifications', 'verificationSummary'];
const detailOptionalKeys = ['itemType', 'series', 'seriesNote'];
const detailAllowedKeys = new Set([...detailRequiredKeys, ...detailOptionalKeys]);

const brandBySlug = new Map(catalog.filter(item => item.slug).map(item => [item.slug, item.brand]));
function verifyOfficialUrls(value, slug, hosts) {
  if (Array.isArray(value)) return value.forEach(item => verifyOfficialUrls(item, slug, hosts));
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if ((key === 'url' || key === 'sourceUrl') && entry) {
      const url = new URL(entry);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.username, '');
      assert.equal(url.password, '');
      assert.ok(isAllowedHost(url.hostname, hosts), `${slug}: non-manufacturer URL`);
      assert.ok(!/C:[\\/]|Users[\\/]|hkkim[\\/]|outputs[\\/]/i.test(url.href), `${slug}: private URL path`);
    } else verifyOfficialUrls(entry, slug, hosts);
  }
}
const privateMarkers = /C:[\\/]|Users[\\/]|hkkim[\\/]|(?:^|["\s])Work[\\/]|outputs[\\/]|원본 행|공급처|단가|내부 메모|private source|READY FOR CODEX|READY WITH REVIEW FLAGS/i;
for (const filename of files.filter(name => name !== 'detail')) {
  assert.ok(!privateMarkers.test(await readFile(new URL(filename, site), 'utf8')), `${filename} private marker`);
}
for (const filename of (await readdir(detail)).filter(name => name !== 'data' && name !== 'images')) {
  assert.ok(!privateMarkers.test(await readFile(new URL(filename, detail), 'utf8')), `detail/${filename} private marker`);
}
for (const slug of slugs) {
  const content = await readFile(new URL(`data/${slug}.json`, detail), 'utf8');
  const expected = snapshot.details[slug];
  assert.equal(hashText(content), expected.sha256, `${slug} public detail snapshot`);
  assert.ok(!privateMarkers.test(content), `${slug} private marker`);
  const product = JSON.parse(content);
  const keys = Object.keys(product);
  for (const key of keys) assert.ok(detailAllowedKeys.has(key), `${slug}: 허용되지 않은 상세 키 ${key}`);
  for (const key of detailRequiredKeys) assert.ok(keys.includes(key), `${slug}: 필수 상세 키 누락 ${key}`);
  verifyOfficialUrls(product, slug, allowedHostsFor(brandBySlug.get(slug)));
  assert.ok(Array.isArray(product.images) && product.images.length > 0, `${slug}: 게시 이미지가 비어 있음`);
  assert.deepEqual(product.images, group1Images[slug], `${slug}: reviewed official image manifest`);
  assert.equal(product.presentation.visualVariant, 'official-product-images');
  assert.match(product.presentation.galleryRights, /제조사 재사용 권리.*미확인/);
  assert.equal(product.features.length, expected.features);
  assert.equal(product.specifications.length, expected.specifications);
  assert.equal(product.io.length, expected.io);
  assert.ok(product.features.length > 0 && product.specifications.length > 0, `${slug}: 빈 상세`);
  assert.equal(product.documents.filter(document => ['User Manual', 'Independent Specification', 'Specification', 'Technical Document'].includes(document.type)).length, 4);
  for (const document of product.documents) if (document.status === 'MISSING') assert.equal(document.url, undefined);
  for (const image of product.imageStatuses) assert.ok(['MISSING', 'REVIEW REQUIRED', 'FOUND', 'VERIFIED'].includes(image.status));
}
console.log(`Public Pages artifact: ${catalog.length} equipment items, ${slugs.length} details, ${productImageFiles.length} reviewed official WebP images, no PDF binaries.`);
