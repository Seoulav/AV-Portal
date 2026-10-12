import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { enhancementErrors, prepareEnhancements } from '../prototype/brc-am7/detail-enhancements.mjs';

const root = new URL('../', import.meta.url);
const detailUrl = new URL('beta/site/detail/data/tr535.json', root);

test('TR535 is registered once from exact-model Korean official sources', async () => {
  const [catalog, product] = await Promise.all([
    readFile(new URL('beta/site/catalog.json', root), 'utf8').then(JSON.parse),
    readFile(detailUrl, 'utf8').then(JSON.parse)
  ]);
  const entries = catalog.filter(item => item.slug === 'tr535');
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0], {
    brand: 'AVer', product: 'TR535', categories: ['영상', 'Video', 'Camera'], kind: 'equipment',
    official_links: ['https://kr.presentation.aver.com/model/tr535'],
    slug: 'tr535', card_image: 'tr535-front.webp'
  });
  assert.equal(product.manufacturer, 'AVer');
  assert.equal(product.model, 'TR535');
  assert.equal(product.itemType, 'PRODUCT');
  assert.ok(product.sources.every(source => !/tr535n|averusa/i.test(`${source.name} ${source.url} ${source.scope}`)));
  assert.ok(product.documents.every(document => !/tr535n|averusa/i.test(`${document.title} ${document.url ?? ''}`)));
  assert.match(product.documents.find(document => document.type === 'User Manual').note, /적용하지 않음/);
});

test('TR535 keeps the official zoom conflict instead of calculating a value', async () => {
  const product = JSON.parse(await readFile(detailUrl, 'utf8'));
  const zoom = product.specifications.find(row => row.name === '광학줌/디지털줌/전체줌');
  assert.deepEqual(zoom, {
    group: 'Camera', name: '광학줌/디지털줌/전체줌',
    value: '웹 30X / 12X / 360X · 브로슈어 30X / 1X / 30X', unit: '',
    condition: '한국 공식 제품 페이지와 같은 페이지의 TR535 브로슈어가 상충',
    source: 'P/B', verification: 'CONFLICTED'
  });
  assert.ok(product.issues.some(issue => issue.status === 'CONFLICTED' && /줌/.test(issue.title)));
  assert.equal(product.packageStatus, 'CONFLICTED');
});

test('TR535 publishes only Korean-page-supported connectors and camera flow', async () => {
  const product = JSON.parse(await readFile(detailUrl, 'utf8'));
  assert.equal(product.io.length, 4);
  assert.deepEqual(product.io.map(row => row.connector), [
    '3G-SDI, HDMI ×2, IP, USB', 'USB 3.2 Gen 1', 'RS-232, RS-422, IP, USB', 'RJ-45'
  ]);
  assert.equal(product.io[3].protocol, 'PoE++');
  assert.deepEqual(enhancementErrors(product), []);
  assert.ok(prepareEnhancements(product).signalFlow);
  assert.match(JSON.stringify(product.signalFlow), /HDMI ×2/);
  assert.doesNotMatch(JSON.stringify(product.signalFlow), /TR335|TR535N/);
});

test('TR535 official front and rear images drive an eleven-marker rear Port Map', async () => {
  const product = JSON.parse(await readFile(detailUrl, 'utf8'));
  assert.deepEqual(product.images.map(image => image.role), ['Front', 'Rear']);
  assert.deepEqual(product.images.map(image => image.resolution), ['545×425', '545×425']);
  assert.equal(product.portMap.image, 'Rear');
  assert.deepEqual(product.portMap.measuredImage, { file: 'tr535-rear.webp', width: 545, height: 425 });
  assert.equal(product.portMap.items.length, 11);
  assert.deepEqual(product.portMap.items.map(item => item.n), [1,2,3,4,5,6,7,8,9,10,11]);
  assert.deepEqual(product.portMap.items.map(item => item.label), [
    'Kensington', 'RS-232', 'RS-422', 'MIC IN', 'LINE IN',
    'HDMI 1', '3G-SDI', 'HDMI 2', 'USB 3.0', 'PoE++', 'DC 12V'
  ]);
  for (const file of ['tr535-front.webp', 'tr535-rear.webp']) {
    const bytes = await readFile(new URL(`beta/site/detail/images/${file}`, root));
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP');
  }
});
