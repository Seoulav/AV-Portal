// W-014 changes only Shure's derived lineup-sort metadata in the public catalog.
export function beforeW014Catalog(catalog) {
  return catalog.map(item => {
    if (item.brand !== 'Shure' || item.brandSort === undefined) return item;
    const { brandSort, ...previous } = item;
    return previous;
  });
}
