// Earlier batch tests compare their own immutable product snapshots. Undo only
// the six W-20261004-017 Diagram images and maps before reconstructing them.
const slugs = new Set([
  'lh32qmcebgcxkr', 'lh43qmcebgcxkr', 'lh85qmcebgcxkr',
  'lh98qmcebgcxkr', 'lh43qhcebgcxkr', 'lh75qhcebgcxkr',
]);

export function beforeSamsungW04017(product, slug) {
  if (!slugs.has(slug) || product.portMap?.image !== 'Diagram') return product;
  const earlier = structuredClone(product);
  earlier.images = earlier.images.filter(image => image.role !== 'Diagram');
  earlier.imageStatuses = earlier.imageStatuses.filter(image => image.role !== 'Diagram');
  delete earlier.portMap;
  return earlier;
}

export function beforeSamsungW04017Raw(raw, slug) {
  if (!slugs.has(slug)) return raw;
  const product = JSON.parse(raw);
  if (product.portMap?.image !== 'Diagram') return raw;
  return `${JSON.stringify(beforeSamsungW04017(product, slug), null, 2)}\n`;
}
