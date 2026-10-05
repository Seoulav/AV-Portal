import { isW029Name } from './w029-history.mjs';
import { isW030Name } from './w030-history.mjs';
import test from 'node:test';
import { beforeW024Raw } from './mpf-images-history.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from './w032-history-fs.mjs';
import { beforeSamsungW04017 } from './samsung-w04017-history.mjs';
import { beforeBssAlignmentRaw } from './bss-alignment-history.mjs';

const directory = new URL('../beta/site/detail/data/', import.meta.url);
const supported = [
  'lh32qmcebgcxkr', 'lh43qmcebgcxkr', 'lh85qmcebgcxkr', 'lh98qmcebgcxkr',
  'lh43qhcebgcxkr', 'lh75qhcebgcxkr', 'lh115qhfebgxkr',
];
const videoWalls = ['lh55vhcrbgbxkr', 'lh55vmcrbgbxkr'];
const targets = [...supported, ...videoWalls];
const memoTargets = ['lh32qmcebgcxkr', 'lh43qmcebgcxkr', 'lh85qmcebgcxkr', 'lh43qhcebgcxkr', 'lh75qhcebgcxkr'];
const excludedSamsung = ['hg43u800fnfxkr', 'hg50u800fnfxkr', 'hg65u800fnfxkr', 'lh55wmfwbgcxkr', 'lh75wmfwlgcxkr', 'mp008f', 'mp012f', 'mp016f'];
const oldMemo = ' / CMS 솔루션: 별도 구매 필요, VXT는 국내 추후 출시 예정';
const read = slug => JSON.parse(readFileSync(new URL(`${slug}.json`, directory), 'utf8'));

test('only the nine authorized Samsung products receive one consistent, source-backed VXT row', () => {
  for (const slug of targets) {
    const product = read(slug);
    const rows = product.specifications.filter(row => row.name === 'VXT Player 지원');
    assert.equal(rows.length, 1, slug);
    const row = rows[0];
    assert.deepEqual([row.name, row.group, row.unit], ['VXT Player 지원', 'Software', ''], slug);
    assert.equal(row.value, supported.includes(slug) ? '있음' : '없음', slug);
    assert.equal(row.verification, 'FOUND', slug);
    assert.equal(row.source, 'U1', slug);
    assert.match(row.condition, supported.includes(slug) ? /별도 구매/ : /별도 셋탑박스 필요/, slug);
    assert.equal(product.sources.filter(source => source.code === 'U1').length, 1, slug);
    assert.equal(new Set(product.sources.map(source => source.code)).size, product.sources.length, slug);
    const source = product.sources.find(item => item.code === 'U1');
    assert.match(source.name, /사용자 현장 확인.*2026-10-04/, slug);
    assert.match(source.scope, /매뉴얼.*242쪽.*VXT.*없음/, slug);
    for (const model of targets) assert.ok(source.scope.includes(model), `${slug}: missing ${model} scope`);
  }
  assert.equal(read('lh115qhfebgxkr').specifications.filter(row => /VXT Player/.test(row.name)).length, 1);
  for (const slug of memoTargets) {
    const product = read(slug);
    assert.ok(product.specifications.some(row => row.name === 'CMS 솔루션' && row.value === 'MagicINFO, VXT'), slug);
    assert.equal(product.sources.find(source => source.code === 'P').scope.includes(oldMemo), false, slug);
  }
  for (const slug of excludedSamsung) assert.equal(read(slug).specifications.some(row => row.name === 'VXT Player 지원'), false, slug);
});

test('the other 233 products, protected target fields and prior source/specification records remain unchanged', () => {
  const names = readdirSync(directory).filter(name => name.endsWith('.json') && name !== 'lh43behhlbfxkr.json' && !isW029Name(name) && !isW030Name(name)).sort();
  assert.equal(names.length, 242);
  const others = names.filter(name => !targets.includes(name.slice(0, -5)));
  assert.equal(others.length, 233);
  const otherHash = createHash('sha256');
  for (const name of others) otherHash.update(name).update('\0').update(beforeW024Raw(beforeBssAlignmentRaw(readFileSync(new URL(name, directory), 'utf8').replace(/\r\n/g, '\n'),name.slice(0,-5)),name.slice(0,-5)));
  assert.equal(otherHash.digest('hex'), '3e34c755b4f483841563008e9ee336c160ef8ca5a13d37bd118d26be77295b19');

  const coreHash = createHash('sha256');
  const priorEditableHash = createHash('sha256');
  for (const slug of targets) {
    const { specifications, sources, ...protectedFields } = beforeSamsungW04017(read(slug), slug);
    // LH32QMC also carried the obsolete launch claim in its public overview.
    if (slug === 'lh32qmcebgcxkr')
      protectedFields.overview = protectedFields.overview.replace('VXT를 지원한다', 'VXT(국내 추후 출시 예정)를 지원한다');
    coreHash.update(slug).update('\0').update(JSON.stringify(protectedFields)).update('\0');
    const priorSpecs = specifications.map(row => slug === 'lh115qhfebgxkr' && row.name === 'VXT Player 지원'
      ? { ...row, name: 'VXT Player Support', condition: '', source: 'S5' } : row)
      .filter(row => slug === 'lh115qhfebgxkr' || row.name !== 'VXT Player 지원');
    const priorSources = sources.filter(source => source.code !== 'U1').map(source =>
      memoTargets.includes(slug) && source.code === 'P' ? { ...source, scope: source.scope + oldMemo } : source);
    priorEditableHash.update(slug).update('\0').update(JSON.stringify(priorSpecs)).update('\0').update(JSON.stringify(priorSources)).update('\0');
  }
  assert.equal(coreHash.digest('hex'), 'f8d6955235bb4dc9f95bf2f05cab8c73ea37d24232d8812c18b04881233f2bc7');
  assert.equal(priorEditableHash.digest('hex'), 'f3bf9f552fd5a4f3eab2d07523cf42db573995663d18691814ed6175689936a0');
});

test('stale launch wording is absent from every published product JSON', () => {
  for (const name of readdirSync(directory).filter(name => name.endsWith('.json') && name !== 'lh43behhlbfxkr.json'))
    assert.equal(readFileSync(new URL(name, directory), 'utf8').includes('추후 출시 예정'), false, name);
});
