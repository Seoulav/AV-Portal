// New QHC/QMC models were registered after the historical inventory snapshots below.
// Keep those older byte-for-byte assertions scoped to the products they originally covered.
export const w029Slugs = new Set([
  'lh55qhcebgcxkr', 'lh65qhcebgcxkr',
  'lh55qmcebgcxkr', 'lh65qmcebgcxkr'
]);
export const isW029Name = name => w029Slugs.has(name.replace(/\.json$/, ''));
export const withoutW029Uploads = uploads => uploads.filter(entry => !w029Slugs.has(entry.slug));
