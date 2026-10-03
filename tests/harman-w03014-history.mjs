// Reconstruct the product bytes before W-20261003-014 for older, scoped audits.
// The current task adds only these three presentation fields to 32 products.
import {readFileSync} from 'node:fs';
import {beforeShureW04003,beforeShureW04003Raw} from './shure-w04003-history.mjs';
const evidence=JSON.parse(readFileSync(new URL('../Work/기록/W-20261003-014-evidence.json',import.meta.url),'utf8'));
const changed=new Set(Object.keys(evidence.products));
export const harmanW03014Slug=slug=>changed.has(slug);
export function beforeHarmanW03014(product,slug){
  const beforeShure=beforeShureW04003(product,slug);
  if(!changed.has(slug))return beforeShure;
  const copy=structuredClone(beforeShure);
  delete copy.lead;delete copy.subtitle;delete copy.keyFacts;
  return copy;
}
export function beforeHarmanW03014Raw(raw,slug){
  const beforeShure=beforeShureW04003Raw(raw,slug);
  return changed.has(slug)?JSON.stringify(beforeHarmanW03014(JSON.parse(beforeShure),slug),null,2)+'\n':beforeShure;
}
