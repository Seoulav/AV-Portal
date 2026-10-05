// W-030 added three LED products after older full-inventory evidence was recorded.
// Historical byte snapshots exclude only these new files; current-catalog tests include them.
export const w030Slugs = new Set(['ie015a-e', 'ie020a-e', 'if015r-m']);
export const isW030Name = name => w030Slugs.has(name.replace(/\.json$/, ''));
