import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { group1Images } from './group1-images.mjs';

const site = new URL('./site/', import.meta.url);
const files = (await readdir(site)).sort();
assert.deepEqual(files, ['app.js', 'catalog.html', 'catalog.json', 'detail', 'detail-links.css', 'detail-links.js', 'favicon.svg', 'index.html', 'llms.txt', 'styles.css', 'system-version.css', 'system-version.js', 'version.json']);
const detail = new URL('detail/', site);
assert.deepEqual((await readdir(detail)).sort(), ['app.js', 'data', 'images', 'index.html', 'product-detail-model.mjs', 'styles.css'].sort());
const productImageFiles = Object.values(group1Images).flat().map(image => image.file).sort();
assert.deepEqual((await readdir(new URL('images/', detail))).sort(), [...productImageFiles, 'ptz-pictogram.svg'].sort());
const pictogram = await readFile(new URL('images/ptz-pictogram.svg', detail), 'utf8');
assert.equal(pictogram.replaceAll('\r\n', '\n'), (await readFile(new URL('../prototype/brc-am7/ptz-pictogram.svg', import.meta.url), 'utf8')).replaceAll('\r\n', '\n'));
assert.match(pictogram, /SPDX-License-Identifier: CC0-1\.0/);
assert.ok(!/<script|<image|(?:href|src)="|url\(https?:/i.test(pictogram), 'Illustration must not embed external content');
const slugs = ['brc-am7', 'dm7', 'ki-pro-go2', 'pt-mz17k', 'rally-bar'];
assert.deepEqual((await readdir(new URL('data/', detail))).sort(), slugs.map(slug => `${slug}.json`).sort());

const raw = await readFile(new URL('catalog.json', site), 'utf8');
const homeHtml = await readFile(new URL('index.html', site), 'utf8');
const detailHtml = await readFile(new URL('index.html', detail), 'utf8');
const version = JSON.parse(await readFile(new URL('version.json', site), 'utf8'));
assert.doesNotMatch(homeHtml, /data-system-version|SYSTEM v\d|build local|system-version\.(?:css|js)/);
assert.doesNotMatch(detailHtml, /data-system-version|SYSTEM v\d|build local|system-version\.(?:css|js)/);
assert.match(version.version, /^\d+\.\d+\.\d+$/);
assert.ok(String(version.build).length > 0);
assert.ok(String(version.revision).length > 0);
const hash = text => createHash('sha256').update(text.replaceAll('\r\n', '\n')).digest('hex').toUpperCase();
assert.equal(hash(raw), '50BA7AD7F1F0493DD5C92B5BDB7B5C42897B33950006796FE47AFEEB9974F30B');

const catalog = JSON.parse(raw);
assert.equal(catalog.length, 27);
assert.equal(hash(JSON.stringify(catalog.slice(0, 25))), '5A330BBEC27FA2CCA38B619984C4707C17F097BB67C11A17097772DBAD5AE212');
const allowed = ['brand', 'categories', 'kind', 'official_links', 'product'];
const identities = new Set();
for (const item of catalog) {
  assert.deepEqual(Object.keys(item).sort(), allowed);
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
  const identity = `${item.brand}\0${item.product}`;
  assert.ok(!identities.has(identity), 'Duplicate public product');
  identities.add(identity);
}
const expectedDetails = {
  'brc-am7': ['6A506D626F1C544818EDB0B7647E4F1547A63EC3098EE1EFDC6354558D3B410D', 8, 27, 14],
  dm7: ['23CF9158991028C11E9B554A3597928DB990490CC57DFE85FB8B5F9B9D70D1F9', 8, 16, 15],
  'ki-pro-go2': ['07E11BFAC9D4B0D66ADBB1FC713B4C45ECB2DFFC49C61F278728359BF9DAC488', 8, 16, 11],
  'pt-mz17k': ['B340C0BE082DDAF64D0D5B628D8F39BC580E1120EA4F6A8BFE3E3ABD7281D7EC', 7, 13, 4],
  'rally-bar': ['34DE780FE55639917F118C4B5E110D6083142BD5BBC69CA1E5FCB3DF7B2C06F1', 8, 16, 9]
};
const officialHosts = {
  'brc-am7': ['pro.sony', 'sony.net', 'sony.co.kr', 'sony.com'],
  dm7: ['yamaha.com'], 'ki-pro-go2': ['aja.com', 'd26ddnfpy9hzf8.cloudfront.net'],
  'pt-mz17k': ['panasonic.com'], 'rally-bar': ['logitech.com']
};
function verifyOfficialUrls(value, slug) {
  if (Array.isArray(value)) return value.forEach(item => verifyOfficialUrls(item, slug));
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if ((key === 'url' || key === 'sourceUrl') && entry) {
      const url = new URL(entry);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.username, '');
      assert.equal(url.password, '');
      assert.ok(officialHosts[slug].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)), `${slug}: non-manufacturer URL`);
      assert.ok(!/C:[\\/]|Users[\\/]|hkkim[\\/]|outputs[\\/]/i.test(url.href), `${slug}: private URL path`);
    } else verifyOfficialUrls(entry, slug);
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
  const [digest, featureCount, specCount, ioCount] = expectedDetails[slug];
  assert.equal(hash(content), digest, `${slug} public detail snapshot`);
  assert.ok(!privateMarkers.test(content), `${slug} private marker`);
  const product = JSON.parse(content);
  verifyOfficialUrls(product, slug);
  assert.deepEqual(product.images, group1Images[slug], `${slug}: reviewed official image manifest`);
  assert.equal(product.presentation.visualVariant, 'official-product-images');
  assert.match(product.presentation.galleryRights, /제조사 재사용 권리.*미확인/);
  assert.equal(product.features.length, featureCount);
  assert.equal(product.specifications.length, specCount);
  assert.equal(product.io.length, ioCount);
  assert.equal(product.documents.filter(document => ['User Manual', 'Independent Specification', 'Specification', 'Technical Document'].includes(document.type)).length, 4);
  for (const document of product.documents) if (document.status === 'MISSING') assert.equal(document.url, undefined);
  for (const image of product.imageStatuses) assert.ok(['MISSING', 'REVIEW REQUIRED', 'FOUND', 'VERIFIED'].includes(image.status));
}
console.log('Public Pages artifact: 27 equipment items, 5 details, 13 reviewed official WebP images, no PDF binaries.');
