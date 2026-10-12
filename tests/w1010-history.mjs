// W-20261012-010 adds TR535. Historical inventory assertions must continue to
// measure only the products that existed at their original checkpoints.
export const w1010Slugs = new Set(['tr535']);
export const isW1010Name = value => w1010Slugs.has(String(value ?? '').replace(/\.json$/, ''));
export const beforeW1010Catalog = catalog => catalog.filter(item => !w1010Slugs.has(item.slug));
