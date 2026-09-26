import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { group1Images, cardImages } from './group1-images.mjs';
import { group2Previews, previewCatalogFieldsFor } from './group2-images.mjs';
import { userManuals, userManualLinkFor, userReferences, userReferenceLinkFor } from './user-manuals.mjs';
import { allowedHostsFor, isAllowedHost } from './manufacturer-hosts.mjs';
import { computeSnapshot, hashText, readSnapshot } from './update-snapshot.mjs';
import { derivedCatalogFields, linkScopes, optionalCatalogFields, previewImageScopes, stripDerivedCatalogFields } from '../prototype/group1/group1-data.mjs';

const site = new URL('./site/', import.meta.url);
const files = (await readdir(site)).sort();
assert.deepEqual(files, ['app.js', 'catalog.html', 'catalog.json', 'detail', 'favicon.svg', 'index.html', 'llms.txt', 'manuals', 'styles.css', 'system-version.css', 'system-version.js', 'version.json']);
// 제조사·대리점 링크를 못 찾아 사용자가 직접 올린 매뉴얼·참고자료 PDF: 파일명 중복 없음, 실제 PDF, 목록과 폴더가 정확히 일치해야 한다.
// 참고자료(userReferences)는 여러 카탈로그 항목이 같은 파일을 공유할 수 있으므로(예: 여러 모델을 함께 다루는
// 브라켓 핸드북) 파일명 중복 검사에서 제외하고, 폴더 내용은 매뉴얼·참고자료 파일명 합집합과 비교한다.
{
  const manualFiles = userManuals.map(entry => entry.file);
  assert.equal(new Set(manualFiles).size, manualFiles.length, '사용자 업로드 매뉴얼 파일명 중복');
  const referenceFiles = userReferences.map(entry => entry.file);
  const manualsDir = new URL('manuals/', site);
  const onDisk = (await readdir(manualsDir)).filter(name => !name.startsWith('.'));
  const expectedFiles = [...new Set([...manualFiles, ...referenceFiles])];
  assert.deepEqual(onDisk.sort(), expectedFiles.sort(), '업로드 매뉴얼·참고자료 폴더와 목록이 다름');
  for (const entry of [...userManuals, ...userReferences]) {
    assert.match(entry.file, /^[a-z0-9-]+\.pdf$/, `${entry.product}: 업로드 파일명`);
    assert.ok(typeof entry.title === 'string' && entry.title.trim(), `${entry.product}: 업로드 자료 제목`);
  }
  for (const file of expectedFiles) {
    const bytes = await readFile(new URL(file, manualsDir));
    assert.ok(bytes.length > 1_000, `${file}: 업로드 파일이 비정상적으로 작음`);
    assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-', `${file}: PDF 형식 아님`);
  }
}
const detail = new URL('detail/', site);
assert.deepEqual((await readdir(detail)).sort(), ['app.js', 'data', 'images', 'index.html', 'product-detail-model.mjs', 'styles.css'].sort());
const productImageFiles = Object.values(group1Images).flat().map(image => image.file).sort();
const previewImageFiles = group2Previews.map(entry => entry.image.file);
assert.equal(new Set([...productImageFiles, ...previewImageFiles]).size, productImageFiles.length + previewImageFiles.length, '이미지 파일명 중복');
assert.deepEqual((await readdir(new URL('images/', detail))).sort(), [...productImageFiles, ...previewImageFiles, 'ptz-pictogram.svg'].sort());
// 상세가 없는 항목의 카드 대표 사진: 승인·권리 상태, 제조사 호스트, WebP 파일을 확인한다.
for (const entry of group2Previews) {
  const { image } = entry;
  assert.match(image.file, /^[a-z0-9-]+\.webp$/, `${entry.product}: 카드 사진 파일명`);
  assert.equal(image.officialSource, true);
  assert.ok(['FOUND', 'VERIFIED'].includes(image.verificationStatus));
  assert.match(image.publicationStatus, /사용자 게시 승인/);
  assert.match(image.publicationStatus, /공식 대리점 구매·계약 기반 사용/);
  assert.ok(typeof image.alt === 'string' && image.alt.trim(), `${entry.product}: 카드 사진 대체 텍스트`);
  if (entry.scope !== undefined) assert.ok(previewImageScopes.includes(entry.scope), `${entry.product}: 허용되지 않은 사진 범위`);
  const url = new URL(image.sourceUrl);
  assert.equal(url.protocol, 'https:');
  assert.ok(isAllowedHost(url.hostname, allowedHostsFor(entry.brand)), `${entry.product}: non-manufacturer image URL`);
  const bytes = await readFile(new URL(`images/${image.file}`, detail));
  assert.ok(bytes.length > 1_000, `${image.file}: usable image file`);
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', `${image.file}: WebP RIFF header`);
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP', `${image.file}: WebP signature`);
}
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
let previewCount = 0;
for (const item of catalog) {
  const keys = Object.keys(item).sort();
  assert.deepEqual(keys.filter(key => !derivedCatalogFields.includes(key) && !optionalCatalogFields.includes(key)), required);
  assert.ok(keys.every(key => required.includes(key) || derivedCatalogFields.includes(key) || optionalCatalogFields.includes(key)), '카탈로그에 허용되지 않은 필드');
  if (item.link_scope !== undefined) {
    assert.ok(linkScopes.includes(item.link_scope), `${item.product}: 허용되지 않은 link_scope`);
    assert.equal(item.official_links.length, 1, `${item.product}: 제품군 링크는 정확히 1개`);
  }
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
  if (item.manual_link !== undefined) {
    assert.ok(typeof item.manual_link === 'string' && item.manual_link.trim(), `${item.product}: 매뉴얼 링크`);
    const uploaded = userManualLinkFor(item);
    if (uploaded !== null) {
      assert.equal(item.manual_link, uploaded, `${item.product}: 매뉴얼 링크가 사용자 업로드 목록과 다름`);
    } else {
      const manualUrl = new URL(item.manual_link);
      assert.equal(manualUrl.protocol, 'https:');
      assert.equal(manualUrl.username, '');
      assert.equal(manualUrl.password, '');
      assert.ok(isAllowedHost(manualUrl.hostname, allowedHostsFor(item.brand)), `${item.product}: non-manufacturer manual URL`);
    }
  } else {
    assert.equal(userManualLinkFor(item), null, `${item.product}: 사용자 업로드 매뉴얼이 있는데 manual_link가 비어 있음`);
  }
  if (item.reference_link !== undefined) {
    assert.ok(typeof item.reference_link === 'string' && item.reference_link.trim(), `${item.product}: 참고자료 링크`);
    const uploaded = userReferenceLinkFor(item);
    assert.equal(item.reference_link, uploaded, `${item.product}: 참고자료 링크가 사용자 업로드 목록과 다름`);
  } else {
    assert.equal(userReferenceLinkFor(item), null, `${item.product}: 사용자 업로드 참고자료가 있는데 reference_link가 비어 있음`);
  }
  if (item.slug !== undefined) {
    assert.match(item.slug, /^[a-z0-9-]+$/, '상세 slug 형식');
    assert.ok(group1Images[item.slug], `${item.slug}: 검토된 이미지 매니페스트 없음`);
    assert.equal(item.card_image, cardImages[item.slug], `${item.slug}: 카드 이미지가 매니페스트와 다름`);
    assert.ok(group1Images[item.slug].some(image => image.file === item.card_image), `${item.slug}: 카드 이미지가 게시 이미지에 없음`);
    catalogSlugs.push(item.slug);
    for (const field of ['preview_image', 'preview_image_alt', 'preview_image_scope']) assert.equal(item[field], undefined, `${item.slug}: 상세가 있으면 상세 갤러리의 card_image를 쓴다`);
  } else {
    assert.equal(item.card_image, undefined, '상세가 없는 항목에는 상세 갤러리 카드 이미지(card_image)를 두지 않는다');
    // 카드 대표 사진은 group2-images.mjs에 승인 기록이 있는 것만 둔다.
    const preview = previewCatalogFieldsFor(item);
    const present = Object.fromEntries(['preview_image', 'preview_image_alt', 'preview_image_scope'].filter(field => item[field] !== undefined).map(field => [field, item[field]]));
    assert.deepEqual(present, preview ?? {}, `${item.product}: 카드 대표 사진이 group2-images.mjs와 다름`);
    if (preview) previewCount++;
  }
  const identity = `${item.brand}\0${item.product}`;
  assert.ok(!identities.has(identity), 'Duplicate public product');
  identities.add(identity);
}
// 상세 데이터·이미지 매니페스트·스냅샷·카탈로그의 제품 집합이 한 곳에서만 갈라지지 않도록 서로 대조한다.
assert.equal(previewCount, group2Previews.length, 'group2-images.mjs의 카드 대표 사진이 카탈로그에 모두 반영되지 않았다');
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
for (const filename of files.filter(name => name !== 'detail' && name !== 'manuals')) {
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
console.log(`Public Pages artifact: ${catalog.length} equipment items, ${slugs.length} details, ${productImageFiles.length} reviewed official WebP images, ${previewImageFiles.length} card preview images, ${userManuals.length + userReferences.length} user-uploaded PDF entries.`);
