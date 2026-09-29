import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildSearchIndex, expectedSearchIndex, searchIndexBytesMatch } from '../beta/build-search-index.mjs';
import { applySearchIndex, detailSearchEntry } from '../beta/site/shared/search-index.mjs';
import { buildSuggestions, filterCatalog } from '../beta/site/app.js';
import { adaptRtcomCatalog, adaptRtcomDetail, combinePublicCatalog, combinedCatalogSource } from '../beta/site/shared/rtcom-adapter.mjs';

const site = new URL('../beta/site/', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('catalog.json', site), 'utf8'));
const details = new Map();
for (const item of catalog.filter(item => item.slug)) details.set(item.slug, JSON.parse(await readFile(new URL(`detail/data/${item.slug}.json`, site), 'utf8')));
const terms = ['Sony', 'Shure', 'Yamaha', 'Samsung', 'Epson', 'NETGEAR', 'BRC-AM7', 'DM7', 'Ki Pro GO2', 'Rally Bar', 'Aquilon', 'HDMI', 'Dante', '4K', 'SDI', 'USB', '음향', '영상', '프로젝터', '네트워크'];

test('detail projection preserves confirmed terms, model aliases, card image and Korean summary', () => {
  const item = { slug: 'sample', card_image: 'sample-front.webp' };
  const detail = { model: 'Sample 4K', productName: 'Sample', series: 'S', korean: '설명', features: [{ text: 'HDMI' }], specifications: [{ name: 'Resolution', value: '4K', verification: 'FOUND' }, { name: 'Unconfirmed', value: '8K', verification: 'REVIEW REQUIRED' }], io: [], images: [{ file: 'sample-front.webp', alt: '전면' }] };
  assert.deepEqual(detailSearchEntry(item, detail), { slug: 'sample', aliases: ['Sample 4K', 'Sample', 'S'], searchTerms: ['HDMI', 'Resolution', '4K'], cardSummary: '설명', cardImage: { src: './detail/images/sample-front.webp', alt: '전면', note: '제조사 공식 이미지' } });
});

test('index build is deterministic and covers exactly catalog detail slugs', () => {
  const first = buildSearchIndex(catalog, details);
  const second = buildSearchIndex(catalog, details);
  assert.deepEqual(second, first);
  assert.equal(first.schema, 'avportal.search-index.v1');
  assert.equal(first.items.length, catalog.filter(item => item.kind === 'equipment' && item.slug).length);
  assert.equal(Object.hasOwn(first, 'generatedAt'), false);
  assert.deepEqual(first.items.map(item => item.slug), catalog.filter(item => item.slug).map(item => item.slug));
  const changed = new Map(details);
  const slug = first.items[0].slug;
  changed.set(slug, { ...changed.get(slug), korean: '수정된 설명' });
  assert.notEqual(buildSearchIndex(catalog, changed).sourceSha256, first.sourceSha256);
});

test('source hashes are identical for Git LF and Windows CRLF checkouts', () => {
  const catalogLf = JSON.stringify(catalog, null, 2) + '\n';
  const rawDetails = new Map([...details].map(([slug, detail]) => [slug, JSON.stringify(detail, null, 2) + '\n']));
  const lf = buildSearchIndex(catalog, details, catalogLf, rawDetails);
  const crlf = buildSearchIndex(catalog, details, catalogLf.replaceAll('\n', '\r\n'), new Map([...rawDetails].map(([slug, raw]) => [slug, raw.replaceAll('\n', '\r\n')])));
  assert.equal(crlf.catalogSha256, lf.catalogSha256);
  assert.equal(crlf.sourceSha256, lf.sourceSha256);
  assert.equal(searchIndexBytesMatch(JSON.stringify(lf) + '\r\n', JSON.stringify(lf) + '\n'), true);
  assert.equal(searchIndexBytesMatch(JSON.stringify(lf) + '\r\n', JSON.stringify(crlf) + 'changed\n'), false);
});

test('index enrichment matches old loader for 20 searches, suggestions, filters and no-detail items', () => {
  const legacy = structuredClone(catalog.filter(item => item.kind === 'equipment'));
  for (const item of legacy) {
    item.slug = item.slug ?? null;
    item.searchTerms = [];
    if (!item.slug && item.preview_image) item.cardImage = { src: `./detail/images/${item.preview_image}`, alt: item.preview_image_alt, note: item.preview_image_scope === 'series' ? '제조사 공식 이미지 · 계열 공용' : '제조사 공식 이미지' };
    if (!item.slug) continue;
    const detail = details.get(item.slug);
    item.aliases = [detail.model, detail.productName, detail.series].filter(Boolean);
    item.searchTerms = [
      ...(detail.features ?? []).map(value => value.text),
      ...(detail.specifications ?? []).filter(value => !value.verification || ['VERIFIED', 'FOUND', 'READY'].includes(value.verification)).flatMap(value => [value.name, value.value, value.group]),
      ...(detail.io ?? []).filter(value => !value.verification || ['VERIFIED', 'FOUND', 'READY'].includes(value.verification)).flatMap(value => [value.connector, value.signal, value.protocol, value.group])
    ].filter(Boolean);
    item.cardSummary = typeof detail.korean === 'string' ? detail.korean.trim() : '';
    const card = detail.images?.find(image => image.file === item.card_image);
    if (card) item.cardImage = { src: `./detail/images/${card.file}`, alt: card.alt, note: '제조사 공식 이미지' };
  }
  const indexed = structuredClone(catalog.filter(item => item.kind === 'equipment'));
  applySearchIndex(indexed, buildSearchIndex(catalog, details));
  assert.deepEqual(indexed, legacy);
  for (const query of terms) {
    assert.deepEqual(filterCatalog(indexed, { query }).map(item => item.product), filterCatalog(legacy, { query }).map(item => item.product), query);
    assert.deepEqual(buildSuggestions(indexed, query), buildSuggestions(legacy, query), `suggestions: ${query}`);
  }
  for (const state of [{ brand: 'Shure' }, { topCategory: 'audio' }, { resource: 'detail' }, { resource: 'official' }, { sort: 'product' }, { sort: 'brand' }]) assert.deepEqual(filterCatalog(indexed, state), filterCatalog(legacy, state));
  assert.ok(indexed.some(item => !item.slug));
});

test('missing or damaged index entries are rejected for fallback', () => {
  const base = buildSearchIndex(catalog, details);
  for (const damaged of [{ ...base, schema: 'wrong' }, { ...base, items: base.items.slice(1) }, { ...base, items: [{ ...base.items[0], searchTerms: 'wrong' }, ...base.items.slice(1)] }]) {
    assert.throws(() => applySearchIndex(structuredClone(catalog), damaged));
  }
});

test('published search index includes RTCOM while preserving every existing AV result', async () => {
  const rtcomRaw = await readFile(new URL('rtcom/raw/index.json', site), 'utf8');
  const rtcomIndex = JSON.parse(rtcomRaw);
  const rtcomCatalog = adaptRtcomCatalog(rtcomIndex);
  const combined = combinePublicCatalog(catalog, rtcomIndex);
  const combinedDetails = new Map(details);
  const combinedRaw = new Map();
  for (const item of rtcomCatalog) {
    const raw = await readFile(new URL(`rtcom/raw/products/${item.rtcomId}.json`, site), 'utf8');
    combinedRaw.set(item.slug, raw);
    combinedDetails.set(item.slug, adaptRtcomDetail(JSON.parse(raw)));
  }
  const built = buildSearchIndex(combined, combinedDetails, JSON.stringify(catalog), combinedRaw, combinedCatalogSource(JSON.stringify(catalog), rtcomRaw));
  assert.equal(built.items.length, catalog.filter(item => item.slug).length + rtcomCatalog.length);
  assert.match(built.catalogSetSha256, /^[a-f0-9]{64}$/);
  const indexed = structuredClone(combined);
  applySearchIndex(indexed, built, built.catalogSetSha256);
  const existingIndexed = structuredClone(catalog);
  const existingBuilt = buildSearchIndex(catalog, details);
  applySearchIndex(existingIndexed, existingBuilt, existingBuilt.catalogSetSha256);
  for (const query of terms) {
    const original = filterCatalog(existingIndexed, { query }).map(item => item.slug).filter(Boolean);
    const after = filterCatalog(indexed, { query }).filter(item => item.brand !== 'RTCOM').map(item => item.slug).filter(Boolean);
    assert.deepEqual(after, original, query);
  }
  const stored = JSON.parse(await expectedSearchIndex());
  assert.equal(stored.items.filter(item => item.slug.startsWith('rtcom-')).length, rtcomCatalog.length);
});
