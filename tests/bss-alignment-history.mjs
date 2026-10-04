// Earlier BSS batch tests compare immutable snapshots from before the
// user-approved rear-map alignment correction. Reconstruct only x1/x2.
const original = {
  'blu-100': [[3610, 3950], [3180, 3530], [2750, 3110], [2320, 2690], [1910, 2280]],
  'blu-101': [[3610, 3950], [3180, 3530], [2750, 3110], [2320, 2690], [1910, 2280]],
  'blu-160': [[3300, 3870], [2470, 3100], [3300, 3870], [2470, 3100]],
  'blu-50v2': [[1746, 1794], [1680, 1728], [1614, 1662], [1548, 1596],
    [1443, 1491], [1358, 1406], [1273, 1321], [1188, 1236]],
};

export function beforeBssAlignment(product, slug) {
  const positions = original[slug];
  if (!positions || !product.portMap) return product;
  const earlier = structuredClone(product);
  positions.forEach(([x1, x2], index) => {
    earlier.portMap.items[index].x1 = x1;
    earlier.portMap.items[index].x2 = x2;
  });
  return earlier;
}

export function beforeBssAlignmentRaw(raw, slug) {
  if (!original[slug]) return raw;
  return `${JSON.stringify(beforeBssAlignment(JSON.parse(raw), slug), null, 2)}\n`;
}
