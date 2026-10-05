import {beforeW026Raw, beforeW026Product} from './w026-history.mjs';
import { isW006Name, beforeW006Raw, withoutW006Catalog } from './w006-history.mjs';
import {beforeW005Raw} from './w005-history.mjs';
import { beforeW032Raw } from './w032-history.mjs';
import test from 'node:test';
import { beforeW024Raw, beforeW024Catalog } from './mpf-images-history.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { filterCatalog } from '../beta/site/app.js';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const models = [
  ['lh55qhcebgcxkr', 'QHC', 55, '700', '187', '16.9', '1237.9 x 708.8 x 28.5'],
  ['lh65qhcebgcxkr', 'QHC', 65, '700', '203.5', '22.7', '1456.8 x 831.9 x 28.5'],
  ['lh55qmcebgcxkr', 'QMC', 55, '500', '154', '15.7', '1237.9 x 708.8 x 28.5'],
  ['lh65qmcebgcxkr', 'QMC', 65, '500', '187', '21.5', '1456.8 x 831.9 x 28.5']
];
const newSlugs = new Set(models.map(([slug]) => slug));

test('the four exact Korean models have their own specifications and the corrected common diagram', () => {
  const reference = read('beta/site/detail/data/lh43qmcebgcxkr.json');
  const diagramSha = sha(readFileSync(new URL('beta/site/detail/images/lh43qmcebgcxkr-diagram.webp', root)));
  for (const [slug, series, size, brightness, watts, weight, dimensions] of models) {
    const product = read(`beta/site/detail/data/${slug}.json`);
    assert.equal(product.model.toLowerCase(), slug);
    assert.match(product.sources.find(source => source.code === 'P').url, new RegExp(`/sec/business/smart-signage/${series.toLowerCase()}-series/${product.model}/`));
    const spec = name => product.specifications.find(row => row.name === name);
    assert.equal(spec('화면 크기').value, String(size) + (size === 55 ? ' (138.7)' : ' (163.9)'));
    assert.equal(spec('밝기(Typ)').value, brightness);
    assert.equal(spec('소비전력(On 모드)').value, watts);
    assert.equal(spec('중량').value, weight);
    assert.equal(spec('크기(가로x높이x깊이)').value, dimensions);
    assert.ok(product.keyFacts.length >= 2 && product.keyFacts.length <= 4);
    assert.deepEqual(product.portMap.items, reference.portMap.items);
    assert.equal(product.portMap.measuredImage.file, `${slug}-diagram.webp`);
    assert.equal(sha(readFileSync(new URL(`beta/site/detail/images/${slug}-diagram.webp`, root))), diagramSha);
    assert.equal(product.images.find(image => image.role === 'Main').resolution, '1920x1280');
    assert.equal(product.images.find(image => image.role === 'Diagram').resolution, '290x1420');
  }
});

test('Samsung brand order expands within the existing QHC and QMC groups', () => {
  const catalog = read('beta/site/catalog.json');
  assert.equal(catalog.length, 265);
  const samsung = filterCatalog(catalog, { brand: 'Samsung', sort: 'brand' });
  assert.equal(samsung.length, 33);
  assert.deepEqual(samsung.filter(item => item.brandSort.group === 'QHC').map(item => item.slug),
    ['lh43qhcebgcxkr', 'lh55qhcebgcxkr', 'lh65qhcebgcxkr', 'lh75qhcebgcxkr']);
  assert.deepEqual(samsung.filter(item => item.brandSort.group === 'QMC').map(item => item.slug),
    ['lh32qmcebgcxkr', 'lh43qmcebgcxkr', 'lh55qmcebgcxkr', 'lh65qmcebgcxkr', 'lh85qmcebgcxkr', 'lh98qmcebgcxkr']);
});

test('all 243 pre-existing product JSON files and catalog entries remain unchanged', () => {
  const dir = new URL('beta/site/detail/data/', root);
  const w030 = new Set(['ie015a-e', 'ie020a-e', 'if015r-m']);
  const files = readdirSync(dir).filter(file => file.endsWith('.json') && !newSlugs.has(file.slice(0, -5)) && !w030.has(file.slice(0, -5)) && !isW006Name(file)).sort();
  assert.equal(files.length, 243);
  const digests = files.map(file => {
    const slug = file.slice(0, -5);
    const raw = beforeW006Raw(readFileSync(new URL(file, dir), 'utf8').replace(/\r\n/g, '\n'), slug);
    return [file, sha(beforeW005Raw(beforeW024Raw(beforeW032Raw(beforeW026Raw(raw, slug), slug), slug), slug))];
  });
  assert.equal(sha(JSON.stringify(digests)), '4cae051f2642c39623fe16c9334d54528b16d249abefe98d55ef2070715d678a');
  const previous = withoutW006Catalog(read('beta/site/catalog.json')).filter(item => !newSlugs.has(item.slug) && !w030.has(item.slug)).map(beforeW024Catalog);
  assert.equal(sha(JSON.stringify(previous)), '0245d3e4eb24affc18c5606fc95afc2394175393eae83d0ea452bdf2e9e9602f');
});
