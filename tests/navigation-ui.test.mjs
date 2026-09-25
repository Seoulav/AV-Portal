import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildSuggestions,
  filterCatalog,
  mapTopCategories,
  parseExploreState,
  publicDetailSearchTerms,
  stateForSuggestion,
  serializeExploreState
} from '../beta/site/app.js';

const items = [
  { brand: 'Yamaha', product: 'DM7', categories: ['오디오', 'Audio', 'Mixer'], kind: 'equipment', official_links: ['https://example.test/dm7'], searchTerms: ['Dante', '96 kHz'], slug: 'dm7' },
  { brand: 'Sony', product: 'BRC-AM7', categories: ['영상', 'Video', 'Camera'], kind: 'equipment', official_links: ['https://example.test/brc'], searchTerms: ['12G-SDI', 'PTZ'], slug: 'brc-am7' },
  { brand: 'NETGEAR', product: 'GSM4248PX', categories: ['제어', 'Network', 'Network Switch'], kind: 'equipment', official_links: [], searchTerms: [], slug: null }
];

test('top navigation categories preserve multi-membership and actual counts', () => {
  const groups = mapTopCategories(items);
  assert.equal(groups.find(group => group.id === 'audio').count, 1);
  assert.equal(groups.find(group => group.id === 'video').count, 1);
  assert.equal(groups.find(group => group.id === 'camera-conference').count, 1);
  assert.equal(groups.find(group => group.id === 'network-control').count, 1);
  assert.equal(groups.find(group => group.id === 'power-infrastructure').count, 0);
});

test('catalog exploration searches public feature and connector terms', () => {
  assert.deepEqual(filterCatalog(items, { query: 'dante' }).map(item => item.product), ['DM7']);
  assert.deepEqual(filterCatalog(items, { query: 'sdi' }).map(item => item.product), ['BRC-AM7']);
  assert.deepEqual(filterCatalog(items, { topCategory: 'camera-conference' }).map(item => item.product), ['BRC-AM7']);
  assert.deepEqual(filterCatalog(items, { brand: 'NETGEAR', resource: 'official' }), []);
});

test('search suggestions are grouped as products, manufacturers and categories', () => {
  const suggestions = buildSuggestions(items, 'ya');
  assert.equal(suggestions[0].type, '제품');
  assert.equal(suggestions[0].label, 'DM7');
  assert.ok(suggestions.some(item => item.type === '제조사' && item.label === 'Yamaha'));
});

test('detail search enrichment excludes unresolved specifications and connectors', () => {
  const terms = publicDetailSearchTerms({
    features: [{ text: 'Dante networking' }],
    specifications: [
      { name: 'Sample rate', value: '96 kHz', verification: 'VERIFIED' },
      { name: 'Wireless', value: 'Wi-Fi', verification: 'REVIEW REQUIRED' }
    ],
    io: [
      { connector: 'etherCON', protocol: 'Dante', verification: 'FOUND' },
      { connector: 'LAN', protocol: 'PJLink', verification: 'PARTIAL' }
    ]
  });
  assert.match(terms.join(' '), /Dante networking|96 kHz|etherCON/);
  assert.doesNotMatch(terms.join(' '), /Wi-Fi|PJLink/);
});

test('manufacturer and category suggestions start a new compatible exploration', () => {
  const current = { query: 'camera', topCategory: 'audio', brand: 'Yamaha', categories: ['Mixer'], resource: 'detail', sort: 'brand' };
  assert.deepEqual(stateForSuggestion(current, { type: '제조사', value: 'Sony' }), {
    query: '', topCategory: '', brand: 'Sony', categories: [], resource: '', sort: 'brand'
  });
  assert.deepEqual(stateForSuggestion(current, { type: '카테고리', value: 'Camera' }), {
    query: '', topCategory: '', brand: '', categories: ['Camera'], resource: '', sort: 'relevance'
  });
});

test('explore state round-trips through URL parameters', () => {
  const state = { query: 'DM7', topCategory: 'audio', brand: 'Yamaha', categories: ['Audio', 'Mixer'], resource: 'detail', sort: 'brand' };
  const params = serializeExploreState(state);
  assert.deepEqual(parseExploreState(params), state);
});

test('home and detail templates expose the approved navigation structure', async () => {
  const home = await readFile(new URL('../beta/site/index.html', import.meta.url), 'utf8');
  const detail = await readFile(new URL('../prototype/brc-am7/index.html', import.meta.url), 'utf8');
  const detailApp = await readFile(new URL('../prototype/brc-am7/app.js', import.meta.url), 'utf8');
  const detailStyles = await readFile(new URL('../prototype/brc-am7/styles.css', import.meta.url), 'utf8');
  assert.match(home, /id="global-search"/);
  assert.match(home, /id="header-search-form"[^>]+hidden/);
  assert.match(home, /id="top-categories"/);
  assert.match(home, /id="manufacturer-browser"/);
  assert.match(home, /id="results-workspace"[^>]+hidden/);
  for (const id of ['overview', 'features', 'specifications', 'io', 'related-products', 'documents', 'sources']) {
    assert.match(detail, new RegExp(`role="tab"[^>]+aria-controls="${id}"`));
    assert.match(detail, new RegExp(`id="${id}"[^>]+role="tabpanel"`));
  }
  assert.match(detail, /role="tablist"/);
  assert.match(detail, /id="detail-search-toggle"[^>]+aria-expanded="false"/);
  assert.match(detail, /id="quick-state-summary"/);
  assert.ok(detail.indexOf('id="product-name"') < detail.indexOf('id="featured-image"'));
  assert.ok(detail.indexOf('id="featured-image"') < detail.indexOf('id="english-description"'));
  assert.match(detail, /<th>포트 수<\/th><th>채널·신호<\/th><th>규격·조건<\/th>/);
  assert.match(detail, /id="connector-mobile-groups"/);
  assert.match(detailApp, /mobileHeading\.setAttribute\('aria-expanded', String\(mobileGroup\.open\)\)/);
  assert.match(detailApp, /mobileGroup\.addEventListener\('toggle'/);
  assert.match(detailApp, /function revealActiveTab/);
  assert.match(detailApp, /tabs\.scrollTo\(\{ left: targetLeft/);
  assert.doesNotMatch(detailApp, /tab\.scrollIntoView/);
  assert.doesNotMatch(detailApp, /\$\('\.gallery'\)\.remove\(\)/);
  assert.match(detail, /id="gallery-empty-summary"/);
  assert.match(detailApp, /확보 \$\{documentSummary\.secured\} · 검토 \$\{documentSummary\.review\} · 없음 \$\{documentSummary\.missing\}/);
  assert.match(detailStyles, /\.connector-mobile-group\[open\]>\.connector-group-heading::after\{content:'−'\}/);
  assert.match(detailStyles, /\.io-summary\{[^}]*flex-wrap:wrap/);
});

test('public pages include share metadata and an explicit favicon', async () => {
  for (const path of ['../beta/site/index.html', '../prototype/brc-am7/index.html']) {
    const html = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(html, /<meta name="description"/);
    for (const property of ['og:title', 'og:description', 'og:type', 'og:url', 'og:site_name']) assert.match(html, new RegExp(`property="${property}"`));
    assert.match(html, /rel="icon"[^>]+favicon\.svg/);
  }
});
