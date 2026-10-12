// Historical inventory assertions must continue to measure only the products
// that existed at their original checkpoints. W-011's DS-8S was added later
// than TR535 and is excluded from those earlier inventories as well.
export const w1010Slugs = new Set(['tr535', 'ds-8s']);
export const isW1010Name = value => w1010Slugs.has(String(value ?? '').replace(/\.json$/, ''));
export const beforeW1010Catalog = catalog => catalog.filter(item => !w1010Slugs.has(item.slug));
