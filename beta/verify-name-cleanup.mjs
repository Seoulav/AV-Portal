import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { applyCatalogNames, applyDetailNames, catalogCategoryNames, detailCategoryNames, ioGroupNames, specificationGroupNames } from './name-cleanup.mjs';

const base = process.argv.find(arg => arg.startsWith('--base='))?.slice('--base='.length);
assert.match(base ?? '', /^[a-f0-9]{40}$/i, '사용법: node beta/verify-name-cleanup.mjs --base=<40자리-기준-SHA>');
const site = new URL('./site/', import.meta.url);
const detailDir = new URL('detail/data/', site);
const gitText = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).replaceAll('\r\n', '\n');
const oldFiles = gitText('ls-tree', '-r', '--name-only', base, '--', 'beta/site/catalog.json', 'beta/site/detail/data').trim().split('\n').filter(Boolean).sort();
const currentFiles = ['beta/site/catalog.json', ...(await readdir(detailDir)).filter(name => name.endsWith('.json')).map(name => `beta/site/detail/data/${name}`)].sort();
assert.deepStrictEqual(currentFiles, oldFiles, 'catalog/detail 파일 집합이 바뀌었습니다. 이름 정리 외 파일 추가·삭제는 허용되지 않습니다.');

function fromGit(file) { return JSON.parse(gitText('show', `${base}:${file}`)); }
function distinct(values) { return new Set(values).size; }
function renameCount(before, after) { return before.reduce((count, value, index) => count + Number(value !== after[index]), 0); }

const catalogPath = 'beta/site/catalog.json';
const beforeCatalog = fromGit(catalogPath);
const afterCatalog = JSON.parse(await readFile(new URL('catalog.json', site), 'utf8'));
const expectedCatalog = structuredClone(beforeCatalog);
expectedCatalog.forEach(applyCatalogNames);
assert.deepStrictEqual(afterCatalog, expectedCatalog, 'catalog.json에서 승인된 categories 이름 외 값 또는 배열 순서가 변경됐습니다.');
assert.equal(afterCatalog.length, beforeCatalog.length);
for (let index = 0; index < beforeCatalog.length; index++) {
  assert.equal(afterCatalog[index].categories?.length, beforeCatalog[index].categories?.length, `catalog item ${index} categories 길이 변경`);
}

const detailReports = [];
for (const file of oldFiles.filter(name => name.startsWith('beta/site/detail/data/'))) {
  const slug = file.slice('beta/site/detail/data/'.length, -'.json'.length);
  const before = fromGit(file);
  const after = JSON.parse(await readFile(new URL(`${slug}.json`, detailDir), 'utf8'));
  const expected = structuredClone(before);
  applyDetailNames(expected);
  assert.deepStrictEqual(after, expected, `${file}: 승인된 categories/specifications[].group/io[].group 외 값 또는 배열 순서가 변경됐습니다.`);
  assert.equal(after.categories?.length, before.categories?.length, `${file}: categories 길이 변경`);
  assert.equal(after.specifications?.length, before.specifications?.length, `${file}: specifications 행 수 변경`);
  assert.equal(after.io?.length, before.io?.length, `${file}: I/O 행 수 변경`);
  detailReports.push({ before, after });
}

const kinds = (items, select) => ({ before: distinct(items.flatMap(select)), after: distinct(items.flatMap(select)) });
const mappedKinds = (items, select, mapping) => ({
  before: distinct(items.flatMap(select)),
  after: distinct(items.flatMap(select).map(value => mapping[value] ?? value))
});
const beforeDetails = detailReports.map(item => item.before);
const afterDetails = detailReports.map(item => item.after);
const beforeCatalogNames = beforeCatalog.flatMap(item => item.categories ?? []);
const afterCatalogNames = afterCatalog.flatMap(item => item.categories ?? []);
const actualKinds = {
  catalogCategories: { before: distinct(beforeCatalogNames), after: distinct(beforeCatalogNames.map(value => catalogCategoryNames[value] ?? value)) },
  detailCategories: mappedKinds(beforeDetails, item => item.categories ?? [], detailCategoryNames),
  specifications: mappedKinds(beforeDetails, item => (item.specifications ?? []).map(row => row.group), specificationGroupNames),
  io: mappedKinds(beforeDetails, item => (item.io ?? []).map(row => row.group), ioGroupNames)
};
const finalKinds = {
  catalogCategories: distinct(afterCatalog.flatMap(item => item.categories ?? [])),
  detailCategories: distinct(afterDetails.flatMap(item => item.categories ?? [])),
  specifications: distinct(afterDetails.flatMap(item => (item.specifications ?? []).map(row => row.group))),
  io: distinct(afterDetails.flatMap(item => (item.io ?? []).map(row => row.group)))
};
assert.deepStrictEqual(Object.fromEntries(Object.entries(actualKinds).map(([key, value]) => [key, value.after])), Object.fromEntries(Object.entries(finalKinds).map(([key, value]) => [key, value])), '집계된 이름 종류 수가 적용 결과와 다릅니다.');

// The protected first 25 catalog products should remain byte-for-byte equivalent at the parsed field level.
assert.deepStrictEqual(afterCatalog.slice(0, 25), beforeCatalog.slice(0, 25), '기준 25개 catalog 영역이 달라졌습니다.');

const changedRows = {
  catalogCategoryValues: beforeCatalog.reduce((n, item, index) => n + renameCount(item.categories ?? [], afterCatalog[index].categories ?? []), 0),
  detailCategoryValues: detailReports.reduce((n, item) => n + renameCount(item.before.categories ?? [], item.after.categories ?? []), 0),
  specificationGroupRows: detailReports.reduce((n, item) => n + renameCount((item.before.specifications ?? []).map(row => row.group), (item.after.specifications ?? []).map(row => row.group)), 0),
  ioGroupRows: detailReports.reduce((n, item) => n + renameCount((item.before.io ?? []).map(row => row.group), (item.after.io ?? []).map(row => row.group)), 0)
};
console.log(JSON.stringify({ base, products: { catalog: beforeCatalog.length, details: beforeDetails.length }, kinds: { catalogCategories: { before: distinct(beforeCatalogNames), after: finalKinds.catalogCategories }, detailCategories: { before: distinct(beforeDetails.flatMap(item => item.categories ?? [])), after: finalKinds.detailCategories }, specifications: { before: distinct(beforeDetails.flatMap(item => (item.specifications ?? []).map(row => row.group))), after: finalKinds.specifications }, io: { before: distinct(beforeDetails.flatMap(item => (item.io ?? []).map(row => row.group))), after: finalKinds.io } }, changedRows, invariants: 'All fields outside approved name paths match the transformed baseline; row counts and array ordering match; protected catalog first 25 unchanged.' }, null, 2));
