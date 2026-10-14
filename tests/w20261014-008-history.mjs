import assert from 'node:assert/strict';

export const inogeniSlugs = new Set(['toggle-dock-2x1', 'u-bridge-3']);
export const isW20261014_008DetailFile = value => inogeniSlugs.has((typeof value === 'string' ? value : value.name).replace(/\.json$/, ''));

export function beforeW20261014_008Catalog(rows) {
  for (const slug of inogeniSlugs) assert.ok(rows.filter(row => row.slug === slug).length <= 1, `duplicate W-008 catalog row: ${slug}`);
  return rows.filter(row => !inogeniSlugs.has(row.slug));
}

export function beforeW20261014_008DetailFiles(files) {
  for (const slug of inogeniSlugs) assert.ok(files.filter(file => (typeof file === 'string' ? file : file.name) === `${slug}.json`).length <= 1, `duplicate W-008 detail file: ${slug}`);
  return files.filter(file => !isW20261014_008DetailFile(file));
}

export function beforeW20261014_008Snapshot(snapshot) {
  const details = { ...snapshot.details };
  let removed = 0;
  for (const slug of inogeniSlugs) if (Object.hasOwn(details, slug)) { delete details[slug]; removed++; }
  return { ...snapshot, catalog: { ...snapshot.catalog, count: snapshot.catalog.count - removed }, details };
}
