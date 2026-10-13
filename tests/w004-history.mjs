export const w004Slugs = new Set(['emision-media-server', 'emision-pixelfit']);
export const isW004Name = name => w004Slugs.has(String(name).replace(/\.json$/, ''));
export const withoutW004Products = items => items.filter(item => !w004Slugs.has(item.slug));
export const withoutW004Catalog = items => withoutW004Products(items);
