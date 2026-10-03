// Reconstruct pre-W-20261003-010 JBL spec rows for older fixed-time audits.
// The current JBL test separately checks the approved append-only changes.
import {readFileSync} from 'node:fs';

const evidence=JSON.parse(readFileSync(new URL('../Work/기록/W-20261003-010-evidence.json',import.meta.url),'utf8'));
export const jblW03010Slug=slug=>Boolean(evidence.products[slug]?.beforeSpecifications);
export function beforeJblW03010(product,slug){
  const prior=evidence.products[slug];
  if(!prior?.beforeSpecifications) return product;
  const copy=structuredClone(product);
  copy.specifications=prior.beforeSpecifications;
  copy.sources=prior.beforeSources;
  return copy;
}
