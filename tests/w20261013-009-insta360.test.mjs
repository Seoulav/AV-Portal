import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { beforeW009Catalog, beforeW009DetailFiles, beforeW009Snapshot, beforeW009Uploads } from './w009-history.mjs';
import { test } from 'node:test';
import { allowedHostsFor, isAllowedHost } from '../beta/manufacturer-hosts.mjs';
import { group1Images, cardImages } from '../beta/group1-images.mjs';
import { uploadedDocumentsFor } from '../beta/site/detail/pdf-documents.mjs';
import { userReferenceLinkFor } from '../beta/user-manuals.mjs';

const site = new URL('../beta/site/', import.meta.url);
const slugs = ['insta360-connect', 'insta360-link-2', 'insta360-wave-business', 'insta360-wave'];
const readJson = async path => JSON.parse(await readFile(new URL(path, site), 'utf8'));

test('W-009 adds four Insta360 products with official product pages and verified product images', async () => {
  const catalog = await readJson('catalog.json');
  const items = slugs.map(slug => catalog.find(item => item.slug === slug));
  assert.ok(items.every(Boolean));
  assert.deepEqual(items.map(item => item.brand), Array(4).fill('Insta360'));
  assert.deepEqual(items.map(item => item.product), ['Insta360 Connect', 'Insta360 Link 2', 'Insta360 Wave for Business', 'Insta360 Wave']);
  for (const item of items) {
    assert.ok(item.categories.includes('Conferencing'));
    assert.ok(item.official_links.length > 0);
    assert.ok(item.official_links.every(url => new URL(url).hostname === 'insta360.com' || new URL(url).hostname.endsWith('insta360.com')));
    assert.equal(item.card_image, cardImages[item.slug]);
    assert.ok(group1Images[item.slug]?.some(image => image.file === item.card_image));
    const product = await readJson(`detail/data/${item.slug}.json`);
    assert.equal(product.manufacturer, 'Insta360');
    assert.ok(product.images.some(image => image.file === item.card_image && image.officialSource === true));
    for (const image of product.images) assert.ok(isAllowedHost(new URL(image.sourceUrl).hostname, allowedHostsFor('Insta360')));
  }
});

test('W-009 preserves the Wave for Business and standard Wave compatibility distinction', async () => {
  const business = await readJson('detail/data/insta360-wave-business.json');
  const standard = await readJson('detail/data/insta360-wave.json');
  const videoBar = await readJson('detail/data/insta360-connect.json');
  assert.ok(business.features.some(item => /Video Bar.*연동 지원/.test(item.text)));
  assert.ok(standard.features.some(item => /Video Bar.*연동 불가/.test(item.text)));
  assert.ok(videoBar.features.some(item => /Wave for Business만/.test(item.text) && /일반 Wave.*연동 불가/.test(item.text)));
  assert.ok(business.sources.some(source => source.code === 'U' && source.name.includes('2026-10-13')));
  assert.ok(standard.sources.some(source => source.code === 'U' && source.name.includes('2026-10-13')));
  assert.ok(videoBar.sources.some(source => source.code === 'U' && source.name.includes('2026-10-13')));
});

test('W-009 stores the conference collection brochure for viewing and downloading on every product', async () => {
  const catalog = await readJson('catalog.json');
  const manifest = await readJson('docs/manifest.json');
  const file = 'manuals/insta360-conference-line-collection-20260729.pdf';
  for (const slug of slugs) {
    const item = catalog.find(entry => entry.slug === slug);
    assert.ok(item.reference_link?.includes(`./${file}`));
    assert.equal(userReferenceLinkFor(item), `./${file}`);
    const entry = manifest.uploads.find(upload => upload.slug === slug && upload.file === file && upload.kind === 'reference');
    assert.ok(entry);
    const [doc] = uploadedDocumentsFor(slug, manifest);
    assert.equal(doc.action.kind, 'local');
    assert.equal(doc.action.file, `../${file}`);
  }
  const pdf = await readFile(new URL(file.replace(/^manuals\//, 'manuals/'), site));
  assert.equal(pdf.subarray(0, 5).toString('ascii'), '%PDF-');
  assert.ok(pdf.length > 1_000);
});



test('W-009 history reverse removes only the four new products and their brochure links', async () => {
  const catalog = await readJson('catalog.json');
  const detailFiles = await readdir(new URL('detail/data/', site));
  const manifest = await readJson('docs/manifest.json');
  const snapshot = await readJson('../public-snapshot.json');
  assert.equal(beforeW009Catalog(catalog).length, catalog.length - 4);
  assert.equal(beforeW009DetailFiles(detailFiles).length, detailFiles.length - 4);
  assert.equal(beforeW009Uploads(manifest.uploads).length, manifest.uploads.length - 4);
  assert.equal(beforeW009Snapshot(snapshot).catalog.count, snapshot.catalog.count - 4);
});