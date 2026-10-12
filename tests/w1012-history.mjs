// W-20261012-012 adds four detail files while reusing four existing catalog rows.
// Historical assertions remove the new details and restore those rows exactly.
export const w1012Slugs = new Set([
  'ultriscape', 'ultrimix-mxr', 'ultrisync-18', 'ultrimix-dante'
]);

export const isW1012Name = value => w1012Slugs.has(String(value ?? '').replace(/\.json$/, ''));

const previousCategory = new Map([
  ['ultriscape', 'License'],
  ['ultrimix-mxr', 'Router Module'],
  ['ultrisync-18', 'Router Frame'],
  ['ultrimix-dante', 'Router Module']
]);

export const beforeW1012Catalog = catalog => catalog.map(item => {
  if (!isW1012Name(item.slug)) return item;
  const restored = structuredClone(item);
  restored.categories[2] = previousCategory.get(item.slug);
  delete restored.slug;
  return restored;
});
