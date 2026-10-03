// Reconstruct product content before W-20261004-003 for earlier scoped audits.
// Only Shure's three authored 01 presentation fields were added in this batch.
import {readFileSync} from 'node:fs';
const evidence=JSON.parse(readFileSync(new URL('../Work/기록/W-20261004-003-evidence.json',import.meta.url),'utf8'));
const changed=new Set(Object.keys(evidence.products));
export const shureW04003Slug=slug=>changed.has(slug);
export function beforeShureW04003(product,slug){
  if(!changed.has(slug))return product;
  const copy=structuredClone(product);
  delete copy.lead;delete copy.subtitle;delete copy.keyFacts;
  return copy;
}
export function beforeShureW04003Raw(raw,slug){
  return changed.has(slug)?JSON.stringify(beforeShureW04003(JSON.parse(raw),slug),null,2)+'\n':raw;
}
