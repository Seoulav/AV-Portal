// Reconstruct the post-W-20261004-013, pre-W-20261004-015 BSS bytes for
// historical tests. Their evidence records remain the snapshots from that day.
const targets = new Set(['blu-100', 'blu-101', 'blu-160', 'blu-50v2', 'blu-dan']);

export function beforeBssW04015Raw(raw, slug) {
  if (!targets.has(slug)) return raw;
  const data = JSON.parse(raw);
  delete data.signalFlow;
  return `${JSON.stringify(data, null, 2)}\n`;
}
