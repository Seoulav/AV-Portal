// Restore the pre-W-20261003-013 Crown presentation fields for older audits.
import {readFileSync} from 'node:fs';

const evidence=JSON.parse(readFileSync(new URL('../Work/기록/W-20261003-013-evidence.json',import.meta.url),'utf8'));
const changed=new Set(Object.keys(evidence.products));
export const crownW03013Slug=slug=>changed.has(slug);
export function beforeCrownW03013(product,slug){
  if(!changed.has(slug))return product;
  const copy=structuredClone(product);
  delete copy.lead;delete copy.subtitle;delete copy.keyFacts;
  return copy;
}
