import { beforeW032Raw } from './w032-history.mjs';
import { isW029Name, w029Slugs } from './w029-history.mjs';
import { beforeW024Raw, beforeW024Catalog } from './mpf-images-history.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { beforeMobileRs232Raw } from './mobile-rs232-history.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { prepareProductDetail, visibleDetailCards, prepareIoFallbackEntries, orderSpecificationRows } from '../prototype/brc-am7/product-detail-model.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const slug = 'lh43behhlbfxkr';

test('LH43BEHHLBFXKR is the only BEHX-H product and occupies the business-TV sort slot', () => {
  const catalog = read('beta/site/catalog.json');
  const card = catalog.find(item => item.slug === slug);
  assert.equal(catalog.length, 257);
  assert.deepEqual(catalog.filter(item => /^lh(?:43|50|55|65|75|85)behhlbfxkr$/.test(item.slug)).map(item => item.slug), [slug]);
  assert.equal(card.product, 'LH43BEHHLBFXKR');
  assert.deepEqual(card.categories, ['사이니지', 'Display', 'Business TV']);
  assert.deepEqual(card.brandSort, { group: 'Business TV', order: 6, size: 43 });
  assert.equal(card.card_image, `${slug}-main.webp`);
  const samsung = catalog.filter(item => item.brand === 'Samsung').sort((a, b) => a.brandSort.order - b.brandSort.order || a.brandSort.size - b.brandSort.size || a.product.localeCompare(b.product));
  const index = samsung.findIndex(item => item.slug === slug);
  assert.equal(samsung[index - 1].brandSort.group, 'Hotel TV');
  assert.equal(samsung[index + 1].brandSort.group, 'Whiteboard');
});

test('business TV uses only exact-model Korean evidence and keeps unsupported content empty', () => {
  const product = read(`beta/site/detail/data/${slug}.json`);
  assert.equal(product.model, 'LH43BEHHLBFXKR');
  assert.deepEqual(product.categories, ['사이니지', 'Display', 'Business TV']);
  assert.equal(product.sources.filter(source => source.code === 'P').length, 1);
  assert.match(product.sources[0].url, /samsung\.com\/sec\/business\/smart-signage\/behx-h-series\/LH43BEHHLBFXKR\//);
  assert.ok(product.specifications.length >= 12);
  assert.ok(product.specifications.every(row => row.source === 'P' && row.verification === 'VERIFIED'));
  const spec = name => product.specifications.find(row => row.name === name);
  assert.equal(spec('화면 크기').value, '107.9');
  assert.equal(spec('크기(제품, 가로x높이x깊이)').value, '957.8 x 558.8 x 76.3');
  assert.equal(spec('VXT Player Support').value, '있음');
  assert.equal(spec('디스플레이 면적'), undefined, 'official page and two PDFs do not state an area');
  assert.ok(!product.specifications.some(row => /베젤|전면 색상|스탠드 색상|면 보정/.test(row.name) || row.name === '종류'));
  assert.ok(product.keyFacts.length >= 2 && product.keyFacts.length <= 4);
  assert.ok(product.images.some(image => image.role === 'Main' && image.resolution === '1920x1280'));
  assert.equal(product.images[0].verificationStatus, 'FOUND', 'gallery image has no printed model name');
  assert.equal(product.imageStatuses.find(item => item.role === 'Main').status, 'FOUND');
  assert.equal(product.portMap, undefined);
  assert.equal(product.signalFlow, undefined);
  const prepared = prepareProductDetail(product);
  assert.ok(visibleDetailCards(prepared).includes('gallery'));
  assert.ok(!visibleDetailCards(prepared).includes('io'), 'section 03 remains absent without signal flow');
  assert.equal(prepareIoFallbackEntries(product.io).length, 6, 'connectors appear in the section 02 fallback');
  assert.deepEqual(orderSpecificationRows(prepared).slice(0, 2).map(row => row.spec.name), ['화면 크기', '크기(제품, 가로x높이x깊이)']);
});

test('the existing 242 detail files and 249 catalog objects remain byte/value-identical', () => {
  const dir = new URL('beta/site/detail/data/', root);
  const w030 = new Set(['ie015a-e', 'ie020a-e', 'if015r-m']);
  const files = readdirSync(dir).filter(file => file.endsWith('.json') && file !== `${slug}.json` && !isW029Name(file) && !w030.has(file.slice(0, -5))).sort();
  assert.equal(files.length, 242);
  // Git stores LF; normalize Windows checkouts before comparing the unchanged originals.
  const detailDigests = files.map(file => [file, sha(beforeW024Raw(beforeMobileRs232Raw(beforeW032Raw(readFileSync(new URL(file, dir), 'utf8').replace(/\r\n/g, '\n'), file.slice(0, -5)), file.slice(0, -5)), file.slice(0, -5)))]);
  assert.equal(sha(JSON.stringify(detailDigests)), '8dc33b1204a5fad8487a4e87d511eeca9862ca3ad6aa33fdffa211be69a49789');
  const originalCatalog = read('beta/site/catalog.json').filter(item => item.slug !== slug && !w029Slugs.has(item.slug) && !w030.has(item.slug)).map(beforeW024Catalog);
  assert.equal(sha(JSON.stringify(originalCatalog)), '3b8f31e02ec31ff94cd6b8192447a14549c2ed03188ea7d392ae51f9f262f6da');
});
