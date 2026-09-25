import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';

const site = new URL('./site/', import.meta.url);
const files = (await readdir(site)).sort();
assert.deepEqual(files, ['app.js', 'catalog.json', 'detail', 'detail-links.css', 'detail-links.js', 'favicon.svg', 'index.html', 'styles.css']);
const detail = new URL('detail/', site);
assert.deepEqual((await readdir(detail)).sort(), ['app.js', 'data', 'images', 'index.html', 'product-detail-model.mjs', 'styles.css'].sort());
assert.deepEqual(await readdir(new URL('images/', detail)), ['ptz-pictogram.svg']);
const pictogram = await readFile(new URL('images/ptz-pictogram.svg', detail), 'utf8');
assert.equal(pictogram.replaceAll('\r\n', '\n'), (await readFile(new URL('../prototype/brc-am7/ptz-pictogram.svg', import.meta.url), 'utf8')).replaceAll('\r\n', '\n'));
assert.match(pictogram, /SPDX-License-Identifier: CC0-1\.0/);
assert.ok(!/<script|<image|(?:href|src)="|url\(https?:/i.test(pictogram), 'Illustration must not embed external content');
const slugs = ['brc-am7', 'dm7', 'ki-pro-go2', 'pt-mz17k', 'rally-bar'];
assert.deepEqual((await readdir(new URL('data/', detail))).sort(), slugs.map(slug => `${slug}.json`).sort());

const raw = await readFile(new URL('catalog.json', site), 'utf8');
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
  'brc-am7': ['A86C6AAF778A8CCE95221D03B47F03D10AF4721751C22341563D0D0DCD5F3820', 8, 27, 14],
  dm7: ['422986C310C69E574E7A33D296641B698C01C14180644CE49686277E829B2C3B', 8, 16, 15],
  'ki-pro-go2': ['66F40798DAE58F12E4923D7601B69E6779A5CBF92612B9BAC41D9978946175A3', 8, 16, 11],
  'pt-mz17k': ['BF2F9CD82D33006E301377E56396077AA7F6E9FDB95CE0BF4BCEAD24E0183D55', 7, 13, 4],
  'rally-bar': ['E218EB627AA196FE50407CDDD0DF3211E65EF094D1B1B6C6179C4F661EB29ED0', 8, 16, 9]
};
const officialHosts = {
  'brc-am7': ['pro.sony', 'sony.net', 'sony.co.kr', 'sony.com'],
  dm7: ['yamaha.com'], 'ki-pro-go2': ['aja.com'],
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
  if (slug === 'brc-am7') {
    assert.equal(product.images.length, 1);
    assert.equal(product.images[0].role, 'Illustration');
    assert.equal(product.images[0].file, 'ptz-pictogram.svg');
    assert.equal(product.images[0].sourceUrl, undefined);
    assert.equal(product.images[0].publicationStatus, 'CC0 1.0');
    assert.equal(product.presentation.visualVariant, 'brc-pictogram');
  } else {
    assert.deepEqual(product.images, [], `${slug}: manufacturer photos remain unpublished`);
    assert.notEqual(product.presentation.visualVariant, 'brc-pictogram');
  }
  assert.equal(product.features.length, featureCount);
  assert.equal(product.specifications.length, specCount);
  assert.equal(product.io.length, ioCount);
  assert.equal(product.documents.filter(document => ['User Manual', 'Independent Specification', 'Specification', 'Technical Document'].includes(document.type)).length, 4);
  for (const document of product.documents) if (document.status === 'MISSING') assert.equal(document.url, undefined);
  for (const image of product.imageStatuses) assert.ok(['MISSING', 'REVIEW REQUIRED', 'FOUND', 'VERIFIED'].includes(image.status));
}
console.log('Public Pages artifact: 27 equipment items, 5 public-safe details, one CC0 SVG, no manufacturer image/PDF binaries.');
