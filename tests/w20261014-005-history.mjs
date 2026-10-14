import assert from 'node:assert/strict';
export const carboniteUltraSlug = 'carbonite-ultra';
export const isW20261014_005DetailFile = value => (typeof value === 'string' ? value : value.name) === 'carbonite-ultra.json';
export const isW20261014_005Manual = value => (typeof value === 'string' ? value : value.name) === 'carbonite-ultra-user-manual-v9-2.pdf';
const remove = (items, predicate) => { assert.ok(items.filter(predicate).length <= 1, 'duplicate W-20261014-005 addition'); return items.filter(item => !predicate(item)); };
export const beforeW20261014_005Catalog = rows => remove(rows, item => item.slug === carboniteUltraSlug);
export const beforeW20261014_005DetailFiles = files => remove(files, isW20261014_005DetailFile);
export const beforeW20261014_005Uploads = rows => remove(rows, item => item.slug === carboniteUltraSlug && item.file === 'manuals/carbonite-ultra-user-manual-v9-2.pdf');
export const beforeW20261014_005Snapshot = snapshot => { assert.ok(snapshot.details && Object.hasOwn(snapshot.details, carboniteUltraSlug), 'W-005 snapshot detail exists'); assert.ok(snapshot.catalog.count > 0, 'W-005 snapshot catalog count exists'); const { [carboniteUltraSlug]: _removed, ...details } = snapshot.details; return { ...snapshot, catalog: { ...snapshot.catalog, count: snapshot.catalog.count - 1 }, details }; };
