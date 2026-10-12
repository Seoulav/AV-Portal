import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { prepareProductDetail, prepareOutputPowerTable } from '../prototype/brc-am7/product-detail-model.mjs';

const detailPath = new URL('../beta/site/detail/data/', import.meta.url);
const readDetail = async slug => prepareProductDetail(JSON.parse(await readFile(new URL(`${slug}.json`, detailPath), 'utf8')));

test('i-tech output table pivots loads without changing values, conditions or badges', async () => {
  const detail = await readDetail('i-tech-4x3500hd');
  const table = prepareOutputPowerTable(detail);
  assert.equal(table.groups.length, 2);
  assert.deepEqual(table.rows.map(row => row.name), ['2Ω', '2.7Ω', '4Ω', '8Ω', '4Ω 브리지', '8Ω 브리지', '70V', '100V']);
  assert.deepEqual(table.rows.find(row => row.name === '2Ω').cells.map(cell => cell?.value), ['2100', '3500']);
  assert.equal(table.rows.find(row => row.name === '70V').cells[1], null);
  const burst8 = table.rows.find(row => row.name === '8Ω').cells[1];
  assert.equal(burst8.value, '1900 / 2100');
  assert.match(burst8.condition, /공식 자료 간 불일치/);
  assert.equal(burst8.verification, 'VERIFIED');
  assert.equal(table.entries.size, 12);
});

test('CDi and DCi output groups retain every load, including Vrms rows outside the detector', async () => {
  for (const slug of ['cdi-2-1200', 'dci-4-300da']) {
    const detail = await readDetail(slug);
    const table = prepareOutputPowerTable(detail);
    assert.equal(table.groups.length, 2, slug);
    assert.deepEqual(table.rows.map(row => row.name), ['2Ω', '4Ω', '8Ω', '16Ω', '70Vrms', '100Vrms', '140Vrms', '200Vrms'], slug);
    assert.equal(table.entries.size, 11, slug);
    assert.equal(table.rows.find(row => row.name === '2Ω').cells[1], null, slug);
  }
});

test('all published output-load products pivot and non-output groups remain ordinary rows', async () => {
  const files = (await readdir(detailPath)).filter(file => file.endsWith('.json'));
  let count = 0;
  for (const file of files) {
    const detail = await readDetail(file.slice(0, -5));
    const table = prepareOutputPowerTable(detail);
    if (table.groups.length) {
      count++;
      assert.equal(detail.manufacturer, 'Crown', file);
      assert.equal(table.entries.size, table.groups.reduce((sum, group) => sum + group.entries.length, 0), file);
    } else assert.equal(table.entries.size, 0, file);
  }
  assert.equal(count, 23);
  const other = prepareProductDetail({ manufacturer: 'Fixture', model: 'Other', specifications: [
    { group: '기타', name: '4Ω', value: '측정값' },
    { group: '출력(연속)', name: '출력', value: '100', unit: 'W' }
  ] });
  assert.equal(prepareOutputPowerTable(other).entries.size, 0);
});

test('renderer keeps source records and renders a separately scrolling semantic table', async () => {
  const [app, css] = await Promise.all([
    readFile(new URL('../prototype/brc-am7/app.js', import.meta.url), 'utf8'),
    readFile(new URL('../prototype/brc-am7/styles.css', import.meta.url), 'utf8')
  ]);
  assert.match(app, /prepareOutputPowerTable\(data\)/);
  assert.match(app, /amp-output-table/);
  assert.match(app, /spec-source-record/);
  assert.match(css, /\.amp-output-table\s*\{[^}]*overflow-x:\s*auto/);
});
