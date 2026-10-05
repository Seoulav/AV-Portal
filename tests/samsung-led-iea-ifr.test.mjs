import { beforeW032Raw } from './w032-history.mjs';
import test from 'node:test';
import { beforeW024Raw, beforeW024Catalog } from './mpf-images-history.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { filterCatalog } from '../beta/site/app.js';
import { prepareProductDetail, visibleDetailCards } from '../prototype/brc-am7/product-detail-model.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const models = [
  ['ie015a-e', 'IE015A-E', 'LH015IEAELS', '1.5 ㎜', '640 x 360 pixels', 'SMD 3-in-1 1212 (GOB)', '밝기(최대)', '600 nit', '4,000:1'],
  ['ie020a-e', 'IE020A-E', 'LH020IEAELS', '2.0 ㎜', '480 x 270 pixels', 'SMD 3-in-1 1515 (GOB)', '밝기(최대)', '600 nit', '4,000:1'],
  ['if015r-m', 'IF015R-M', 'LH015IFRILS', '1.5 ㎜', '640 x 360 pixels', 'MIP1010', '밝기(피크 / 최대)', '1,700 nit / 1,000 nit', '12,000:1']
];
const newSlugs = new Set(models.map(([slug]) => slug));

test('three exact workbook models retain their own facts and omit unsupported connector maps', () => {
  const catalog = read('beta/site/catalog.json');
  for (const [slug, model, code, pitch, resolution, diode, brightnessName, brightness, contrast] of models) {
    const card = catalog.find(item => item.slug === slug);
    const detail = read(`beta/site/detail/data/${slug}.json`);
    assert.equal(card.product, model);
    assert.deepEqual(card.categories, ['사이니지', 'Display', 'LED Signage']);
    assert.deepEqual(card.brandSort, { group: 'LED Signage', order: 8, size: Number(model.match(/\d+/)[0]) });
    assert.equal(detail.model, code);
    assert.equal(detail.productName, model);
    assert.ok(detail.keyFacts.length >= 2 && detail.keyFacts.length <= 4);
    assert.ok(detail.keyFacts.every(fact => Object.keys(fact).sort().join(',') === 'label,unit,value'));
    const spec = name => detail.specifications.find(row => row.name === name);
    assert.equal(spec('픽셀 피치').value, pitch);
    assert.equal(spec('캐비닛 해상도').value, resolution);
    assert.equal(spec('다이오드 유형').value, diode);
    assert.equal(spec(brightnessName).value, brightness);
    assert.equal(spec('명암비').value, contrast);
    assert.equal(spec('크기(캐비닛, 가로x높이x깊이)').value, '960 x 540 x 79.5 ㎜');
    assert.equal(spec('VXT Player Support').value, 'Yes');
    assert.equal(spec('전원 이중화')?.value, slug === 'if015r-m' ? 'Yes (Dual Power)' : undefined);
    if (slug === 'if015r-m') {
      // W-20261005-004: the user confirmed CS4F support, so the two rows are no
      // longer open. The workbook still only promises it, so they cite the
      // separate confirmation alongside the workbook rather than instead of it.
      for (const name of ['컨트롤러', '연결 방식']) {
        assert.equal(spec(name).verification, 'FOUND');
        assert.equal(spec(name).condition, '');
        assert.equal(spec(name).source, 'S1, S2');
      }
      assert.equal(spec('컨트롤러').value, 'CS4B / CS4F');
      assert.equal(spec('연결 방식').value, 'Optical (CS4B) / Copper (CS4F)');
      const confirmation = detail.sources.find(source => source.code === 'S2');
      assert.match(confirmation.scope, /2026-10-05/);
      assert.match(confirmation.scope, /제조사 원문 아님/);
      assert.equal(detail.specifications.filter(row => row.verification === 'REVIEW REQUIRED').length, 0);
    }
    assert.ok(detail.specifications.every(row => ['S1', 'S1, S2'].includes(row.source) && ['FOUND', 'REVIEW REQUIRED'].includes(row.verification)));
    assert.ok(detail.sources.some(source => source.code === 'S1' && source.scope.includes('SHA-256') && source.scope.includes(slug === 'if015r-m' ? 'IFR!N' : slug === 'ie015a-e' ? 'IEA!J' : 'IEA!K')));
    assert.deepEqual(detail.images, []);
    assert.deepEqual(detail.io, []);
    assert.equal(detail.portMap, undefined);
    assert.ok(!visibleDetailCards(prepareProductDetail(detail)).includes('gallery'));
  }
});

test('LED cabinet addition changes only the three new products and keeps the private workbook offline', () => {
  const files = readdirSync(new URL('beta/site/detail/data/', root)).filter(file => file.endsWith('.json') && !newSlugs.has(file.slice(0, -5))).sort();
  assert.equal(files.length, 247);
  const digests = files.map(file => [file, sha(beforeW024Raw(beforeW032Raw(readFileSync(new URL(`beta/site/detail/data/${file}`, root), 'utf8').replace(/\r\n/g, '\n'), file.slice(0, -5)), file.slice(0, -5)))]);
  assert.equal(sha(JSON.stringify(digests)), '02769b62612aacaee971e39f4a7783469415c2a8a4aa8280830b4e4e4f499083');
  const catalog = read('beta/site/catalog.json');
  assert.equal(catalog.length, 257);
  assert.equal(catalog.filter(item => item.brand === 'Samsung').length, 25);
  assert.deepEqual(filterCatalog(catalog, { brand: 'Samsung', series: 'led-signage', sort: 'brand' }).map(item => item.slug),
    ['mp008f', 'mp012f', 'ie015a-e', 'if015r-m', 'mp016f', 'ie020a-e']);
  const previous = catalog.filter(item => !newSlugs.has(item.slug)).map(beforeW024Catalog);
  assert.equal(sha(JSON.stringify(previous)), '8af626c34c459c90001f5dae1698ea1bbbb5899ed1a132932c84c89c747a02c0');
  const repositoryFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: fileURLToPath(root), encoding: 'utf8'
  }).split(/\r?\n/);
  assert.deepEqual(repositoryFiles.filter(name => /\.xlsx?$/i.test(name)), [], 'private workbook must not be tracked or staged');
  for (const [slug] of models) assert.equal(existsSync(new URL(`beta/site/detail/images/${slug}-main.webp`, root)), false);
});
