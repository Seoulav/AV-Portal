import assert from 'node:assert/strict';

export const w20261014_007Slug = 'hdf-ccf';
export function beforeW20261014_007Catalog(items) {
  const matches = items.filter(item => item.slug === w20261014_007Slug);
  assert.equal(matches.length, 1, 'W-007 catalog addition must exist exactly once');
  return items.filter(item => item.slug !== w20261014_007Slug);
}
export function isW20261014_007DetailFile(value) {
  const name = typeof value === 'string' ? value : value.name;
  return name === 'hdf-ccf.json';
}
export function beforeW20261014_007Uploads(rows) {
  const matches = rows.filter(item => item.slug === w20261014_007Slug && item.file === 'manuals/hdf-ccf-user-manual-v1-1.pdf');
  assert.equal(matches.length, 1, 'W-007 upload addition must exist exactly once');
  return rows.filter(item => !(item.slug === w20261014_007Slug && item.file === 'manuals/hdf-ccf-user-manual-v1-1.pdf'));
}
export function beforeW20261014_007Snapshot(input) {
  const snapshot = structuredClone(input);
  assert.ok(Object.hasOwn(snapshot.details, w20261014_007Slug), 'W-007 snapshot detail must exist');
  assert.equal(snapshot.catalog.count > 0, true, 'W-007 catalog count must exist');
  delete snapshot.details[w20261014_007Slug];
  snapshot.catalog.count -= 1;
  return snapshot;
}
