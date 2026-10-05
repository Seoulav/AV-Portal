import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCatalogNames, applyDetailNames } from '../beta/name-cleanup.mjs';
import { filterCatalog, mapTopCategories } from '../beta/site/app.js';
import { readFile } from 'node:fs/promises';

test('renames approved catalog categories in place and leaves other fields untouched', () => {
  const input = {
    brand: 'Example', product: 'Example model', categories: ['오디오', 'Audio', 'Speaker', 'Power Protection', 'Processor Card'],
    official_links: ['https://example.test'], kind: 'equipment'
  };
  const before = structuredClone(input);
  const result = applyCatalogNames(input);
  assert.deepEqual(result.categories, ['오디오', 'Audio', 'Loudspeaker', 'Power Conditioner', 'Video Processor Card']);
  assert.deepEqual(result.categories.map((_, index) => index), before.categories.map((_, index) => index));
  assert.deepEqual({ ...result, categories: before.categories }, before);
});

test('renames approved detail categories without changing category order or unrelated fields', () => {
  const input = {
    model: 'Example', categories: ['오디오', 'Audio', '마이크로폰', '무선 시스템', '4K 카메라', 'PTZ/원격 카메라', 'Audio Processor (DSP)'],
    overview: 'unchanged', specifications: [], io: [], sources: [{ url: 'https://example.test' }]
  };
  const before = structuredClone(input);
  const result = applyDetailNames(input);
  assert.deepEqual(result.categories, ['오디오', 'Audio', 'Microphone', 'Wireless Microphone System', 'Camera', 'PTZ/원격 카메라', 'Audio Processor']);
  assert.deepEqual(result.categories.map((_, index) => index), before.categories.map((_, index) => index));
  assert.deepEqual({ ...result, categories: before.categories }, before);
});

test('renames only approved spec and I/O group labels while preserving all row values', () => {
  const input = {
    model: 'Example', categories: ['Audio'], overview: 'unchanged',
    specifications: [
      { group: 'Optics', name: 'Lens', value: '12x', unit: '', condition: 'optional', source: 'official', verification: 'VERIFIED' },
      { group: 'Compliance', name: 'Marks', value: 'CE', unit: '', condition: '', source: 'official', verification: 'FOUND' },
      { group: 'Regulatory', name: 'Region', value: 'US', unit: '', condition: '', source: 'manual', verification: 'REVIEW REQUIRED' },
      { group: 'Connections', name: 'Ports', value: '2', unit: 'x', condition: '', source: 'official', verification: 'VERIFIED' }
    ],
    io: [
      { group: 'Audio In', connector: 'XLR', signal: 'Analog', direction: 'IN', quantity: '2', protocol: '', availability: 'Fixed', condition: '', source: 'official', verification: 'VERIFIED' },
      { group: 'Audio Output', connector: 'XLR', signal: 'Analog', direction: 'OUT', quantity: '2', protocol: '', availability: 'Fixed', condition: '', source: 'official', verification: 'VERIFIED' },
      { group: 'Input', connector: 'HDMI', signal: 'Video', direction: 'IN', quantity: '1', protocol: '', availability: 'Fixed', condition: '', source: 'official', verification: 'VERIFIED' },
      { group: 'Audio(옵션)', connector: 'Mini jack', signal: 'Audio', direction: 'IN/OUT', quantity: '1', protocol: '', availability: 'Optional', condition: '', source: 'official', verification: 'FOUND' },
      { group: 'Network/Control', connector: 'RJ-45', signal: 'Ethernet', direction: 'I/O', quantity: '1', protocol: '', availability: 'Fixed', condition: '', source: 'official', verification: 'VERIFIED' }
    ]
  };
  const before = structuredClone(input);
  const result = applyDetailNames(input);
  assert.deepEqual(result.specifications.map(row => row.group), ['Optical', 'Certification', 'Certification', 'Connections']);
  assert.deepEqual(result.io.map(row => row.group), ['Audio', 'Audio', 'Input', 'Audio(옵션)', 'Network / Control']);
  assert.deepEqual(result.specifications.map(({ group, ...row }) => row), before.specifications.map(({ group, ...row }) => row));
  assert.deepEqual(result.io.map(({ group, ...row }) => row), before.io.map(({ group, ...row }) => row));
  assert.deepEqual({ ...result, specifications: before.specifications, io: before.io }, before);
});

test('refuses to infer I/O direction while consolidating explicit Audio In/Out groups', () => {
  assert.throws(() => applyDetailNames({ model: 'Bad fixture', io: [{ group: 'Audio In', direction: 'OUT' }] }), /direction must already be IN/);
  assert.throws(() => applyDetailNames({ model: 'Bad fixture', io: [{ group: 'Audio Output', direction: 'IN' }] }), /direction must already be OUT/);
});

test('normalizes the approved BSS EC-4BV Network/Control label only', async () => {
  const { readFile } = await import('node:fs/promises');
  const detail = JSON.parse(await readFile(new URL('../beta/site/detail/data/ec-4bv.json', import.meta.url), 'utf8'));
  const matching = detail.io.filter(row => row.group === 'Network / Control');
  assert.equal(matching.length, 1);
  assert.equal(detail.io.some(row => row.group === 'Network/Control'), false);
  assert.equal(matching[0].connector, 'RJ-45');
  assert.equal(matching[0].direction, 'IN');
  assert.equal(matching[0].quantity, '1');
});

test('renamed catalog categories preserve home top-category counts and filter membership', async () => {
  const catalog = JSON.parse(await readFile(new URL('../beta/site/catalog.json', import.meta.url), 'utf8'));
  assert.deepEqual(mapTopCategories(catalog).map(({ id, count }) => [id, count]), [
    ['audio', 116],
    ['video', 62],
    ['camera-conference', 30],
    ['display-projection', 41], // W-20261002-011 excluded LH98QEC; W-20261002-012 added MPF; W-023 added Business TV.
    ['network-control', 18],
    ['power-infrastructure', 4]
  ]);
  assert.equal(filterCatalog(catalog, { topCategory: 'power-infrastructure' }).length, 4);
  assert.equal(filterCatalog(catalog, { topCategory: 'video' }).length, 62);
  assert.ok(filterCatalog(catalog, { categories: ['Power Conditioner'] }).some(item => item.product === 'SX-1216-RTi'));
  assert.equal(filterCatalog(catalog, { categories: ['Video Processor Card'] }).length, 10);
});
