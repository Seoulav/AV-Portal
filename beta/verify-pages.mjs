import { enhancementErrors } from '../prototype/brc-am7/detail-enhancements.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { MAX_PDF_BYTES } from './mirror-docs.mjs';
import { group1Images, cardImages } from './group1-images.mjs';
import { group2Previews, previewCatalogFieldsFor } from './group2-images.mjs';
import { userManuals, userManualLinkFor, userReferences, userReferenceLinkFor, identity } from './user-manuals.mjs';
import { allowedHostsFor, isAllowedHost } from './manufacturer-hosts.mjs';
import { computeSnapshot, hashText, readSnapshot } from './update-snapshot.mjs';
import { derivedCatalogFields, linkScopes, optionalCatalogFields, previewImageScopes, stripDerivedCatalogFields } from '../prototype/group1/group1-data.mjs';
import { prepareProductDetail } from '../prototype/brc-am7/product-detail-model.mjs';
import { verifyRtcomSnapshot } from './sync-rtcom.mjs';
import { adaptRtcomDetail, RTCOM_EXCLUDED_MODELS } from './site/shared/rtcom-adapter.mjs';
import { distributorLinks, isHarmanManufacturer } from './distributor-links.mjs';
import { verifyPdfLock } from './pdf-lock.mjs';

const site = new URL('./site/', import.meta.url);
const uploadManifest = JSON.parse(await readFile(new URL('docs/manifest.json', site), 'utf8'));
const files = (await readdir(site)).sort();
assert.deepEqual(files, ['app.js', 'catalog.html', 'catalog.json', 'detail', 'docs', 'favicon.svg', 'fonts', 'index.html', 'llms.txt', 'manuals', 'rtcom', 'samples', 'search-index.json', 'shared', 'styles.css', 'system-version.css', 'system-version.js', 'vendor', 'version.json']);
assert.deepEqual(await readdir(new URL('samples/', site)), ['h5-layers']);
assert.deepEqual((await readdir(new URL('samples/h5-layers/', site))).sort(), ['app.js', 'index.html', 'model.mjs', 'styles.css']);
assert.deepEqual(await readdir(new URL('vendor/', site)), ['pdfjs']);
assert.deepEqual((await readdir(new URL('vendor/pdfjs/', site))).sort(), ['LICENSE', 'VERSION.txt', 'pdf.min.mjs', 'pdf.worker.min.mjs']);
assert.deepEqual((await readdir(new URL('fonts/', site))).sort(), ['OFL.txt', 'PretendardVariable.woff2']);
assert.deepEqual((await readdir(new URL('shared/', site))).sort(), ['brand-links.mjs', 'brand-series.mjs', 'distributor-links.mjs', 'pdf-viewer.css', 'pdf-viewer.mjs', 'pg.css', 'rtcom-adapter.mjs', 'search-index.mjs']);
const fontBytes = await readFile(new URL('fonts/PretendardVariable.woff2', site));
assert.equal(fontBytes.subarray(0, 4).toString('ascii'), 'wOF2');
assert.match(await readFile(new URL('fonts/OFL.txt', site), 'utf8'), /SIL OPEN FONT LICENSE Version 1\.1/);
const commonStyle = await readFile(new URL('shared/pg.css', site), 'utf8');
assert.match(commonStyle, /\.pg-page\s*\{/);
assert.doesNotMatch(commonStyle, /(?:^|\})\s*body\s*\{/);

// 제조사·대리점 링크를 못 찾아 사용자가 직접 올린 매뉴얼·참고자료 PDF: 실제 PDF, 목록과 폴더가 정확히 일치해야 한다.
// 한 파일을 여러 카탈로그 항목이 공유할 수 있으므로(예: 여러 모델을 함께 다루는 시리즈 매뉴얼·브라켓 핸드북)
// 파일명 자체의 중복은 허용하고, 대신 각 목록 안에서 같은 (brand, product)가 두 번 나오지 않는지만 확인한다.
{
  const manualFiles = userManuals.map(entry => entry.file);
  assert.equal(new Set(userManuals.map(entry => identity(entry.brand, entry.product))).size, userManuals.length, '사용자 업로드 매뉴얼에 같은 제품이 중복 등록됨');
  const referenceFiles = userReferences.map(entry => entry.file);
  assert.equal(new Set(userReferences.map(entry => identity(entry.brand, entry.product))).size, userReferences.length, '사용자 업로드 참고자료에 같은 제품이 중복 등록됨');
  const manualsDir = new URL('manuals/', site);
  const onDisk = (await readdir(manualsDir)).filter(name => !name.startsWith('.'));
  const expectedFiles = [...new Set([...manualFiles, ...referenceFiles, ...uploadManifest.uploads.map(entry => entry.file.replace(/^manuals\//, ''))])];
  assert.deepEqual(onDisk.sort(), expectedFiles.sort(), '업로드 매뉴얼·참고자료 폴더와 목록이 다름');
  const lockLabels = new Map();
  for (const entry of uploadManifest.uploads) {
    assert.ok(entry.locked === undefined || entry.locked === true, `${entry.file}: locked는 true 또는 생략만 허용`);
    const file = entry.file.replace(/^manuals\//, '');
    if (lockLabels.has(file)) assert.equal(lockLabels.get(file), entry.locked === true, `${file}: 제품별 locked 표시 불일치`);
    lockLabels.set(file, entry.locked === true);
  }
  for (const entry of [...userManuals, ...userReferences]) {
    assert.match(entry.file, /^[a-z0-9-]+\.pdf$/, `${entry.product}: 업로드 파일명`);
    assert.ok(typeof entry.title === 'string' && entry.title.trim(), `${entry.product}: 업로드 자료 제목`);
  }
  for (const file of expectedFiles) {
    const bytes = await readFile(new URL(file, manualsDir));
    assert.ok(bytes.length > 1_000, `${file}: 업로드 파일이 비정상적으로 작음`);
    assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-', `${file}: PDF 형식 아님`);
    await verifyPdfLock(file, lockLabels.get(file), bytes);
  }
}
const detail = new URL('detail/', site);
assert.deepEqual((await readdir(detail)).sort(), ['app.js', 'data', 'detail-enhancements.mjs', 'detail-enhancement-view.mjs', 'images', 'index.html', 'pdf-documents.mjs', 'product-detail-model.mjs', 'styles.css'].sort());
const productImageFiles = Object.values(group1Images).flat().map(image => image.file).sort();
const previewImageFiles = group2Previews.map(entry => entry.image.file);
assert.equal(new Set([...productImageFiles, ...previewImageFiles]).size, productImageFiles.length + previewImageFiles.length, '이미지 파일명 중복');
assert.deepEqual((await readdir(new URL('images/', detail))).sort(), [...productImageFiles, ...previewImageFiles, 'ptz-pictogram.svg'].sort());
// 상세가 없는 항목의 카드 대표 사진: 게시·출처 상태, 제조사 호스트, WebP 파일을 확인한다.
for (const entry of group2Previews) {
  const { image } = entry;
  assert.match(image.file, /^[a-z0-9-]+\.webp$/, `${entry.product}: 카드 사진 파일명`);
  assert.equal(image.officialSource, true);
  assert.ok(['FOUND', 'VERIFIED'].includes(image.verificationStatus));
  assert.match(image.publicationStatus, /사용자 게시 승인/);
  assert.match(image.publicationStatus, /공식 출처 기록/);
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
const catalogHtml = await readFile(new URL('catalog.html', site), 'utf8');
const detailHtml = await readFile(new URL('index.html', detail), 'utf8');
const version = JSON.parse(await readFile(new URL('version.json', site), 'utf8'));
for (const html of [homeHtml, catalogHtml, detailHtml]) {
  assert.match(html, /data-system-version/);
  assert.match(html, /system-version\.css/);
  assert.match(html, /system-version\.js/);
}
assert.match(version.version, /^\d+\.\d+\.\d+$/);
assert.ok(String(version.build).length > 0);
assert.ok(String(version.revision).length > 0);
assert.equal(hashText(raw), snapshot.catalog.sha256);

const catalog = JSON.parse(raw);
// RTCOM은 원본 바이트와 SHA를 보존한 마지막 정상본 전체를 먼저 검증한 뒤 표시용 어댑터로 읽는다.
{
  const rtcomRoot = new URL('rtcom/', site);
  const existingSlugs = catalog.map(item => item.slug).filter(Boolean);
  const verified = await verifyRtcomSnapshot(fileURLToPath(rtcomRoot), { existingSlugs });
  const rtcomRawIndex = await readFile(new URL('rtcom/raw/index.json', site));
  assert.equal(createHash('sha256').update(rtcomRawIndex).digest('hex'), verified.manifest.source.index.sha256, 'RTCOM 원본 index SHA 불일치');
  const forbidden = new Set(RTCOM_EXCLUDED_MODELS.map(value => value.toUpperCase()));
  assert.ok(verified.products.every(product => !forbidden.has(String(product.model).toUpperCase())), 'RTCOM 제외 모델이 공개 정상본에 포함됨');
  for (const item of verified.products) {
    const source = JSON.parse(await readFile(new URL(`rtcom/raw/products/${item.id}.json`, site), 'utf8'));
    const product = prepareProductDetail(adaptRtcomDetail(source));
    assert.equal(product.manufacturer, 'RTCOM');
    assert.equal(product.presentation.sourceId, item.id);
    assert.equal(product.presentation.imageBase, '../rtcom/images/');
    assert.equal(product.presentation.sourceProductLabel, '알티컴 제품정보에서 자세히 보기 ↗');
    assert.ok(product.officialPage?.url.endsWith(`#products/${item.id}`), `${item.id}: RTCOM 원문 링크 누락`);
  }
}
// 공개 PDF 대응표는 상세 JSON을 수정하지 않고 독립 파일로 게시한다. 파일 내용·해시·폴더를 전수 대조한다.
{
  const docsDir = new URL('docs/', site);
  const manifest = uploadManifest;
  assert.deepEqual(Object.keys(manifest).sort(), ['mirrors', 'uploads']);
  const listed = manifest.mirrors.map(entry => entry.file);
  assert.equal(new Set(listed).size, listed.length, '서로 다른 URL에 중복 PDF 파일명');
  assert.equal(new Set(manifest.mirrors.map(entry => entry.url)).size, manifest.mirrors.length, 'PDF 원본 URL 중복');
  assert.deepEqual((await readdir(docsDir)).sort(), [...listed, 'manifest.json'].sort(), 'PDF 대응표·폴더 불일치');
  const detailUrls = new Set();
  for (const file of (await readdir(new URL('detail/data/', site))).filter(name => name.endsWith('.json'))) {
    const item = JSON.parse(await readFile(new URL(`detail/data/${file}`, site), 'utf8'));
    for (const document of item.documents ?? []) if (document.url && ['FOUND', 'VERIFIED', 'READY'].includes(document.status)) detailUrls.add(document.url);
  }
  for (const entry of manifest.mirrors) {
    assert.ok(detailUrls.has(entry.url), `${entry.file}: 상세 문서 원본 URL 없음`);
    const source = new URL(entry.url);
    assert.equal(source.protocol, 'https:');
    assert.equal(source.hostname, entry.sourceHost);
    assert.match(entry.file, /^[a-z0-9-]+\.pdf$/);
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
    assert.ok(!Number.isNaN(Date.parse(entry.fetchedAt)), `${entry.file}: 수집일`);
    const bytes = await readFile(new URL(entry.file, docsDir));
    assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-', `${entry.file}: PDF 매직 불일치`);
    assert.ok(bytes.length > 0 && bytes.length <= MAX_PDF_BYTES, `${entry.file}: 용량 초과`);
    assert.equal(bytes.length, entry.bytes, `${entry.file}: 용량 기록 불일치`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, `${entry.file}: SHA 불일치`);
  }
  const uploaded = new Set();
  for (const item of catalog) {
    if (!item.slug) continue;
    for (const [kind, url] of [['manual', item.manual_link], ...((item.reference_link ?? []).map(link => ['reference', link]))]) {
      if (typeof url === 'string' && /^\.\/manuals\/[a-z0-9-]+\.pdf$/.test(url)) uploaded.add(`${item.slug}|manuals/${url.split('/').at(-1)}|${kind}`);
    }
  }
  const uploadKeys = manifest.uploads.map(entry => `${entry.slug}|${entry.file}|${entry.kind}`);
  assert.equal(new Set(uploadKeys).size, uploadKeys.length, '사용자 업로드 PDF 중복 등록');
  assert.deepEqual(new Set(uploadKeys.filter(key => uploaded.has(key))), uploaded, '기존 사용자 업로드 PDF 대응표 불일치');
  for (const entry of manifest.uploads) {
    assert.ok(catalog.some(item => item.slug === entry.slug), `${entry.slug}: 공개 상세 제품 없음`);
    assert.match(entry.file, /^manuals\/[a-z0-9-]+\.pdf$/, `${entry.slug}: 업로드 경로`);
    assert.ok(['manual', 'reference'].includes(entry.kind), `${entry.slug}: 업로드 종류`);
    assert.ok(typeof entry.title === 'string' && entry.title.trim(), `${entry.slug}: 업로드 제목`);
  }
}
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
  if (item.brandSort !== undefined) {
    assert.deepEqual(Object.keys(item.brandSort).sort(), ['group', 'order', 'size'], `${item.product}: 정렬 필드`);
    assert.ok(typeof item.brandSort.group === 'string' && item.brandSort.group.trim(), `${item.product}: 정렬 제품군`);
    assert.ok(Number.isInteger(item.brandSort.order) && item.brandSort.order > 0, `${item.product}: 정렬 순위`);
    assert.ok(Number.isFinite(item.brandSort.size) && item.brandSort.size > 0, `${item.product}: 정렬 크기`);
  }
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
    assert.ok(Array.isArray(item.reference_link) && item.reference_link.length > 0, `${item.product}: 참고자료 링크`);
    assert.equal(new Set(item.reference_link).size, item.reference_link.length, `${item.product}: 참고자료 링크 중복`);
    const uploaded = userReferenceLinkFor(item);
    if (uploaded !== null) {
      assert.deepEqual(item.reference_link, [uploaded], `${item.product}: 참고자료 링크가 사용자 업로드 목록과 다름`);
    } else {
      for (const link of item.reference_link) {
        assert.ok(typeof link === 'string' && link.trim(), `${item.product}: 참고자료 링크`);
        const refUrl = new URL(link);
        assert.equal(refUrl.protocol, 'https:');
        assert.equal(refUrl.username, '');
        assert.equal(refUrl.password, '');
        assert.ok(isAllowedHost(refUrl.hostname, allowedHostsFor(item.brand)), `${item.product}: non-manufacturer reference URL`);
      }
    }
  } else {
    assert.equal(userReferenceLinkFor(item), null, `${item.product}: 사용자 업로드 참고자료가 있는데 reference_link가 비어 있음`);
  }
  if (item.slug !== undefined) {
    assert.match(item.slug, /^[a-z0-9-]+$/, '상세 slug 형식');
    assert.ok(group1Images[item.slug], `${item.slug}: 검토된 이미지 매니페스트 없음`);
    assert.equal(item.card_image, cardImages[item.slug], `${item.slug}: 카드 이미지가 매니페스트와 다름`);
    if (group1Images[item.slug].length) assert.ok(group1Images[item.slug].some(image => image.file === item.card_image), `${item.slug}: 카드 이미지가 게시 이미지에 없음`);
    else assert.equal(item.card_image, undefined, `${item.slug}: 이미지가 없는 제품은 카드 이미지를 두지 않음`);
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
assert.deepEqual(Object.keys(cardImages).sort(), slugs.filter(slug => group1Images[slug].length));
assert.deepEqual(Object.keys(snapshot.details).sort(), slugs);

// 상세 JSON에 허용되는 최상위 키. 새 키는 공개 경계를 다시 검토한 뒤에만 추가한다.
const detailRequiredKeys = ['categories', 'documents', 'english', 'features', 'imageStatuses', 'images', 'io', 'issues', 'korean', 'manufacturer', 'model', 'overview', 'packageStatus', 'presentation', 'productName', 'sources', 'specifications', 'verificationSummary'];
const detailOptionalKeys = ['itemType', 'series', 'seriesNote', 'lead', 'subtitle', 'keyFacts', 'portMap', 'signalFlow', 'settings'];
const detailAllowedKeys = new Set([...detailRequiredKeys, ...detailOptionalKeys]);

const brandBySlug = new Map(catalog.filter(item => item.slug).map(item => [item.slug, item.brand]));
{
  const seenDistributorSlugs = new Set();
  for (const distributor of distributorLinks) {
    assert.ok(!seenDistributorSlugs.has(distributor.slug), `${distributor.slug}: 국내 총판 대응표 중복`);
    seenDistributorSlugs.add(distributor.slug);
    const manufacturer = brandBySlug.get(distributor.slug);
    assert.ok(manufacturer, `${distributor.slug}: 국내 총판 대응표의 제품이 없음`);
    assert.ok(isHarmanManufacturer(manufacturer), `${distributor.slug}: Harman 계열 제조사가 아님`);
    assert.match(distributor.url, /^https:\/\/techdata-ps\.com\/m21_view\.php\?idx=\d+$/, `${distributor.slug}: 테크데이타 주소 형식`);
    const product = JSON.parse(await readFile(new URL(`detail/data/${distributor.slug}.json`, site), 'utf8'));
    assert.equal(distributor.model, product.model, `${distributor.slug}: 국내 총판 대응표 모델 불일치`);
  }
}
function verifyOfficialUrls(value, slug, hosts) {
  if (Array.isArray(value)) return value.forEach(item => verifyOfficialUrls(item, slug, hosts));
  if (!value || typeof value !== 'object') return;
  // 이미지 항목(images[])에 한해 officialSource가 명시적으로 false이면, 그 항목의 sourceUrl은
  // 제조사 호스트 목록 검사를 건너뛴다(2026-09-27 운영자 지시: 제품 일치만 확인되면 출처 불명 사진도 게시).
  // 프로토콜·자격정보·비공개 경로 검사는 그대로 적용한다. url·sourceUrl 외 다른 필드나 documents/sources는 영향받지 않는다.
  const isUnverifiedImage = value.officialSource === false && typeof value.sourceUrl === 'string';
  for (const [key, entry] of Object.entries(value)) {
    if ((key === 'url' || key === 'sourceUrl') && entry) {
      const url = new URL(entry);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.username, '');
      assert.equal(url.password, '');
      if (!(key === 'sourceUrl' && isUnverifiedImage)) {
        assert.ok(isAllowedHost(url.hostname, hosts), `${slug}: non-manufacturer URL`);
      }
      assert.ok(!/C:[\\/]|Users[\\/]|hkkim[\\/]|outputs[\\/]/i.test(url.href), `${slug}: private URL path`);
    } else verifyOfficialUrls(entry, slug, hosts);
  }
}
const privateMarkers = /C:[\\/]|Users[\\/]|hkkim[\\/]|(?:^|["\s])Work[\\/]|outputs[\\/]|원본 행|공급처|단가|내부 메모|private source|READY FOR CODEX|READY WITH REVIEW FLAGS/i;
for (const filename of files.filter(name => !['detail', 'docs', 'manuals', 'fonts', 'rtcom', 'samples', 'shared', 'vendor'].includes(name))) {
  assert.ok(!privateMarkers.test(await readFile(new URL(filename, site), 'utf8')), `${filename} private marker`);
}
for (const filename of await readdir(new URL('samples/h5-layers/', site))) {
  assert.ok(!privateMarkers.test(await readFile(new URL(`samples/h5-layers/${filename}`, site), 'utf8')), `H5 sample ${filename} private marker`);
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
  assert.deepEqual(enhancementErrors(product), [], `${slug}: optional detail structure`);
  if (product.signalFlow) {
    const flow = product.signalFlow;
    const evidenceOwners = [...flow.inputs, ...flow.outputs, ...flow.processes, ...flow.connections, ...flow.auxiliary, ...flow.groups, ...(flow.band ? [flow.band] : [])];
    const pdfRefs = evidenceOwners.flatMap(item => item.evidence).filter(ref => ref.kind === 'pdf');
    for (const file of new Set(pdfRefs.map(ref => ref.file))) {
      const bytes = await readFile(new URL(file, site));
      assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-', `${slug}: Signal Flow evidence PDF ${file}`);
    }
  }
  const keys = Object.keys(product);
  for (const key of keys) assert.ok(detailAllowedKeys.has(key), `${slug}: 허용되지 않은 상세 키 ${key}`);
  for (const key of detailRequiredKeys) assert.ok(keys.includes(key), `${slug}: 필수 상세 키 누락 ${key}`);
  // 상세 화면은 개요·영문·한글 설명을 문자열로 다룬다(배열이면 개요 이후 렌더링이 멈춘다).
  for (const key of ['english', 'korean', 'overview']) assert.equal(typeof product[key], 'string', `${slug}: ${key}는 문자열이어야 합니다`);
  verifyOfficialUrls(product, slug, allowedHostsFor(brandBySlug.get(slug)));
  assert.ok(Array.isArray(product.images), `${slug}: images 배열 누락`);
  assert.deepEqual(product.images, group1Images[slug], `${slug}: reviewed official image manifest`);
  if (product.images.length) {
    assert.equal(product.presentation.visualVariant, 'official-product-images');
    assert.match(product.presentation.galleryRights, /출처와 모델 일치/);
  } else {
    assert.equal(product.presentation.visualVariant, 'missing-product-images');
    assert.ok(product.imageStatuses.some(image => image.role === 'Main' && image.status === 'MISSING' && image.reason), `${slug}: 이미지 미확보 사유 누락`);
  }
  assert.equal(product.features.length, expected.features);
  assert.equal(product.specifications.length, expected.specifications);
  assert.equal(product.io.length, expected.io);
  assert.ok(product.features.length > 0 && product.specifications.length > 0, `${slug}: 빈 상세`);
  assert.equal(product.documents.filter(document => ['User Manual', 'Independent Specification', 'Specification', 'Technical Document'].includes(document.type)).length, 4);
  for (const document of product.documents) if (document.status === 'MISSING') assert.equal(document.url, undefined);
  for (const image of product.imageStatuses) assert.ok(['MISSING', 'REVIEW REQUIRED', 'FOUND', 'VERIFIED'].includes(image.status));
}
console.log(`Public Pages artifact: ${catalog.length} equipment items, ${slugs.length} details, ${productImageFiles.length} reviewed official WebP images, ${previewImageFiles.length} card preview images, ${uploadManifest.uploads.length} user-uploaded PDF entries.`);
