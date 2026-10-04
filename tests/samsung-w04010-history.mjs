// Historical tests compare earlier batches with their own immutable evidence.
// Remove only the approved W-20261004-010 Rear photograph and map before
// reconstructing those earlier product snapshots.
export const samsungW04010Slug = slug => slug === 'lh115qhfebgxkr';
export function beforeSamsungW04010(product, slug) {
  if (!samsungW04010Slug(slug)) return product;
  const earlier = structuredClone(product);
  earlier.images = earlier.images.filter(image => image.role !== 'Rear');
  const rear = earlier.imageStatuses.find(image => image.role === 'Rear');
  if (rear) {
    rear.status = 'MISSING';
    rear.sourceUrl = 'https://www.samsung.com/sec/business/smart-signage/standalone-lh115qhfebgxkr/LH115QHFEBGXKR/';
  }
  delete earlier.portMap;
  return earlier;
}
export function beforeSamsungW04010Raw(raw, slug) {
  if (!samsungW04010Slug(slug)) return raw;
  return `${JSON.stringify(beforeSamsungW04010(JSON.parse(raw), slug), null, 2)}\n`;
}
export function beforeSamsungW04010Path(path, product) {
  return beforeSamsungW04010(product, /(?:^|\/)lh115qhfebgxkr\.json$/.test(path) ? 'lh115qhfebgxkr' : '');
}
