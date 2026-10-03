// Reconstruct the product bytes before W-20261003-014 for older, scoped audits.
// The current task adds only these three presentation fields to 32 products.
import {readFileSync} from 'node:fs';
const evidence=JSON.parse(readFileSync(new URL('../Work/기록/W-20261003-014-evidence.json',import.meta.url),'utf8'));
const changed=new Set(Object.keys(evidence.products));
export const harmanW03014Slug=slug=>changed.has(slug);
export function beforeHarmanW03014(product,slug){
  if(!changed.has(slug))return product;
  const copy=structuredClone(product);
  delete copy.lead;delete copy.subtitle;delete copy.keyFacts;
  return copy;
}
export function beforeHarmanW03014Raw(raw,slug){
  return changed.has(slug)?JSON.stringify(beforeHarmanW03014(JSON.parse(raw),slug),null,2)+'\n':raw;
}
