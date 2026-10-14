import assert from 'node:assert/strict';
export const carboniteUltraSlug = 'carbonite-ultra';
export const isW20261014_005DetailFile = value => (typeof value === 'string' ? value : value.name) === 'carbonite-ultra.json';
export const isW20261014_005Manual = value => (typeof value === 'string' ? value : value.name) === 'carbonite-ultra-user-manual-v9-2.pdf';
const remove = (items, predicate, label) => { const matches = items.filter(predicate); assert.equal(matches.length, 1, label + ': expected exactly one W-20261014-005 addition'); return items.filter(item => !predicate(item)); };
export const beforeW20261014_005Catalog = rows => remove(rows, item => item.slug === carboniteUltraSlug, 'W-20261014-005 catalog');
export const beforeW20261014_005DetailFiles = files => remove(files, isW20261014_005DetailFile, 'W-20261014-005 detail files');
export const beforeW20261014_005Uploads = rows => remove(rows, item => item.slug === carboniteUltraSlug && item.file === 'manuals/carbonite-ultra-user-manual-v9-2.pdf', 'W-20261014-005 uploads');
