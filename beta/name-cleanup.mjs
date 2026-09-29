import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const site = new URL('./site/', import.meta.url);
const detailDir = new URL('detail/data/', site);

export const catalogCategoryNames = Object.freeze({
  Speaker: 'Loudspeaker',
  'Power Protection': 'Power Conditioner',
  'Processor Card': 'Video Processor Card'
});

export const detailCategoryNames = Object.freeze({
  Speaker: 'Loudspeaker',
  마이크로폰: 'Microphone',
  안테나: 'Antenna',
  '카메라 컨트롤러': 'Camera Controller',
  액세서리: 'Accessory',
  'Audio Processor (DSP)': 'Audio Processor',
  '무선 시스템': 'Wireless Microphone System',
  '4K 카메라': 'Camera'
});

export const specificationGroupNames = Object.freeze({
  기구: 'Mechanical',
  냉각: 'Cooling',
  네트워킹: 'Network',
  '물리 사양': 'Physical',
  보안: 'Security',
  오디오: 'Audio',
  인증: 'Certification',
  일반: 'General',
  입력: 'Input',
  입출력: 'I/O',
  전원: 'Power',
  출력: 'Output',
  호환성: 'Compatibility',
  환경: 'Environment',
  Accessories: 'Accessory',
  Compliance: 'Certification',
  Environmental: 'Environment',
  Inputs: 'Input',
  Interfaces: 'Interface',
  Networking: 'Network',
  Optics: 'Optical',
  Outputs: 'Output',
  Regulatory: 'Certification'
});

export const ioGroupNames = Object.freeze({
  'Audio In': 'Audio',
  'Audio Input': 'Audio',
  'Audio Out': 'Audio',
  'Audio Output': 'Audio',
  'Network/Control': 'Network / Control'
});

function renameArrayValues(values, mapping) {
  return values.map(value => mapping[value] ?? value);
}

export function applyCatalogNames(product) {
  if (Array.isArray(product.categories)) product.categories = renameArrayValues(product.categories, catalogCategoryNames);
  return product;
}

export function applyDetailNames(product) {
  if (Array.isArray(product.categories)) product.categories = renameArrayValues(product.categories, detailCategoryNames);
  for (const row of product.specifications ?? []) {
    if (typeof row.group === 'string') row.group = specificationGroupNames[row.group] ?? row.group;
  }
  for (const row of product.io ?? []) {
    if (typeof row.group !== 'string') continue;
    if (row.group === 'Audio In' || row.group === 'Audio Input') assert.equal(row.direction, 'IN', `${product.model}: ${row.group} direction must already be IN`);
    if (row.group === 'Audio Out' || row.group === 'Audio Output') assert.equal(row.direction, 'OUT', `${product.model}: ${row.group} direction must already be OUT`);
    row.group = ioGroupNames[row.group] ?? row.group;
  }
  return product;
}

function serializeLike(raw, value) {
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const trailingNewline = /(?:\r?\n)$/.test(raw);
  let serialized = JSON.stringify(value, null, 2).replaceAll('\n', eol);
  if (trailingNewline) serialized += eol;
  return serialized;
}

async function readJson(url) {
  const raw = await readFile(url, 'utf8');
  return { raw, value: JSON.parse(raw) };
}

export async function applyNameCleanup({ write = false } = {}) {
  const catalogFile = new URL('catalog.json', site);
  const catalogOriginal = await readJson(catalogFile);
  const catalogUpdated = structuredClone(catalogOriginal.value);
  catalogUpdated.forEach(applyCatalogNames);

  const detailFiles = (await readdir(detailDir)).filter(name => name.endsWith('.json')).sort();
  const details = [];
  for (const name of detailFiles) {
    const url = new URL(name, detailDir);
    const original = await readJson(url);
    const updated = structuredClone(original.value);
    applyDetailNames(updated);
    details.push({ name, url, ...original, updated });
  }

  // Constructing expected results from immutable parsed originals limits edits to the named fields.
  const expectedCatalog = structuredClone(catalogOriginal.value);
  expectedCatalog.forEach(applyCatalogNames);
  assert.deepStrictEqual(catalogUpdated, expectedCatalog, 'catalog transformation changed unexpected fields');
  for (const detail of details) {
    const expected = structuredClone(detail.value);
    applyDetailNames(expected);
    assert.deepStrictEqual(detail.updated, expected, `${detail.name}: transformation changed unexpected fields or array order`);
  }

  let changedCatalogEntries = 0;
  for (let index = 0; index < catalogOriginal.value.length; index++) {
    const before = catalogOriginal.value[index].categories ?? [];
    const after = catalogUpdated[index].categories ?? [];
    assert.equal(after.length, before.length, `catalog item ${index}: category order/length changed`);
    if (JSON.stringify(before) !== JSON.stringify(after)) changedCatalogEntries++;
  }
  let changedDetailProducts = 0;
  let changedCategoryRows = 0;
  let changedSpecificationRows = 0;
  let changedIoRows = 0;
  for (const detail of details) {
    let changed = false;
    const original = detail.value;
    const updated = detail.updated;
    const beforeCategories = original.categories ?? [];
    const afterCategories = updated.categories ?? [];
    assert.equal(afterCategories.length, beforeCategories.length, `${detail.name}: category order/length changed`);
    for (let i = 0; i < beforeCategories.length; i++) if (beforeCategories[i] !== afterCategories[i]) { changedCategoryRows++; changed = true; }
    assert.equal(updated.specifications?.length ?? 0, original.specifications?.length ?? 0, `${detail.name}: specification rows changed`);
    for (let i = 0; i < (original.specifications ?? []).length; i++) {
      const beforeRow = original.specifications[i];
      const afterRow = updated.specifications[i];
      const { group: _beforeGroup, ...beforeValues } = beforeRow;
      const { group: _afterGroup, ...afterValues } = afterRow;
      assert.deepStrictEqual(afterValues, beforeValues, `${detail.name} specifications[${i}]: non-name field changed`);
      if (beforeRow.group !== afterRow.group) { changedSpecificationRows++; changed = true; }
    }
    assert.equal(updated.io?.length ?? 0, original.io?.length ?? 0, `${detail.name}: I/O rows changed`);
    for (let i = 0; i < (original.io ?? []).length; i++) {
      const beforeRow = original.io[i];
      const afterRow = updated.io[i];
      const { group: _beforeGroup, ...beforeValues } = beforeRow;
      const { group: _afterGroup, ...afterValues } = afterRow;
      assert.deepStrictEqual(afterValues, beforeValues, `${detail.name} io[${i}]: non-name field changed (direction included)`);
      if (beforeRow.group !== afterRow.group) { changedIoRows++; changed = true; }
    }
    if (changed) changedDetailProducts++;
  }

  const mappedFrom = (items, mapping) => Object.keys(mapping).filter(name => items.includes(name));
  const report = {
    catalogProducts: catalogOriginal.value.length,
    detailProducts: details.length,
    changedCatalogProducts: changedCatalogEntries,
    changedDetailProducts,
    changedDetailCategoryValues: changedCategoryRows,
    changedSpecificationGroupRows: changedSpecificationRows,
    changedIoGroupRows: changedIoRows,
    catalogKinds: distinct(catalogOriginal.value.flatMap(item => item.categories ?? []), catalogCategoryNames),
    detailCategoryKinds: distinct(details.flatMap(item => item.value.categories ?? []), detailCategoryNames),
    specificationGroupKinds: distinct(details.flatMap(item => (item.value.specifications ?? []).map(row => row.group)), specificationGroupNames),
    ioGroupKinds: distinct(details.flatMap(item => (item.value.io ?? []).map(row => row.group)), ioGroupNames),
    verification: 'All non-name fields, row counts, and array positions preserved in memory.'
  };

  if (write) {
    await writeFile(catalogFile, serializeLike(catalogOriginal.raw, catalogUpdated), 'utf8');
    for (const detail of details) {
      const original = JSON.stringify(detail.value);
      const updated = JSON.stringify(detail.updated);
      if (original !== updated) await writeFile(detail.url, serializeLike(detail.raw, detail.updated), 'utf8');
    }
  }
  return report;
}

function distinct(names, mapping) {
  return {
    before: new Set(names).size,
    after: new Set(names.map(name => mapping[name] ?? name)).size
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--apply') === args.has('--check')) throw new Error('사용법: node beta/name-cleanup.mjs --apply 또는 --check');
  const report = await applyNameCleanup({ write: args.has('--apply') });
  if (args.has('--check')) {
    const remaining = await applyNameCleanup();
    if (remaining.changedCatalogProducts || remaining.changedDetailCategoryValues || remaining.changedSpecificationGroupRows || remaining.changedIoGroupRows) {
      throw new Error('승인된 이름 변경이 아직 적용되지 않았습니다. node beta/name-cleanup.mjs --apply를 실행하세요.');
    }
  }
  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main().catch(error => { console.error(error); process.exitCode = 1; });
