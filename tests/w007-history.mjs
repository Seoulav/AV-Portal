// W-007 adds two products. Historical hashes still cover every product that
// existed before W-007; the new records are checked by samsung-qmc-new-sizes.
export const w007Slugs = new Set(['lh50qmcebgcxkr', 'lh75qmcebgcxkr']);
export const isW007Name = value => w007Slugs.has(String(value).replace(/\.json$/, ''));

export function withoutW007Catalog(catalog) {
  for (const [size, slug] of [[50, 'lh50qmcebgcxkr'], [75, 'lh75qmcebgcxkr']]) {
    const item = catalog.find(row => row.slug === slug);
    if (!item || item.product !== slug.toUpperCase() || item.brand !== 'Samsung' ||
        item.brandSort?.group !== 'QMC' || item.brandSort.order !== 3 || item.brandSort.size !== size) {
      throw new Error(`${slug}: unexpected W-007 catalog change`);
    }
  }
  return catalog.filter(row => !isW007Name(row.slug));
}
