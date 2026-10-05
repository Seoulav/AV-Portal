// Reconstruct only W-20261004-020's approved coordinate and background edits.
// Older batch audits continue to compare their own immutable historical snapshots.
import { readFileSync } from 'node:fs';
import { beforeMobileRs232, beforeMobileRs232Raw } from './mobile-rs232-history.mjs';

const evidence = JSON.parse(readFileSync(new URL('../Work/기록/W-20261004-020-evidence.json', import.meta.url), 'utf8'));
const c = 'lh115qhfebgxkr';

export function beforeSamsungW04020(product, slug) {
  product = beforeMobileRs232(product, slug);
  const change = evidence.products[slug];
  if (!change || !product.portMap) return product;
  const earlier = structuredClone(product);
  for (const [index, marker] of change.markers.entries()) {
    earlier.portMap.items[index].y1 = marker.before[0];
    earlier.portMap.items[index].y2 = marker.before[1];
  }
  if (slug === c && earlier.portMap.image === 'Diagram') {
    earlier.images = earlier.images.filter(image => image.role !== 'Diagram');
    earlier.imageStatuses = earlier.imageStatuses.filter(image => image.role !== 'Diagram');
    earlier.portMap.image = 'Rear';
    earlier.portMap.measuredImage = {file: `${c}-rear.webp`, width:270, height:850};
  }
  return earlier;
}

export function beforeSamsungW04020Raw(raw, slug) {
  raw = beforeMobileRs232Raw(raw, slug);
  return evidence.products[slug]
    ? `${JSON.stringify(beforeSamsungW04020(JSON.parse(raw), slug), null, 2)}\n`
    : raw;
}
